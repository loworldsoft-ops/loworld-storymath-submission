import { Injectable, inject } from '@angular/core';
import { LW_STORAGE_PORT } from '../../services/ports/storage.port';
import { type ReaderSlot } from '../../services/narrative/narrative.model';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getShowcaseFirebaseAuth, getShowcaseFirestore } from '../showcase-firebase.client';
import type { ReaderSlotPort } from '../../services/ports/reader-slot.port';
import type { ReaderSavedState, ReaderSavedEntry, ReaderSavedStage } from '../../services/models/reader-slot.model';

const STORAGE_KEY = 'lw-novel-reader-v1';

const EMPTY: ReaderSavedState = { version: 1, activeSlotId: null, entries: {} };

/**
 * 리더 앱 슬롯 저장소 (하이브리드 영속화: Cloud Firestore + LocalStorage 폴백)
 *
 * 1차: 메모리 / LocalStorage (즉시 동기 로드 및 오프라인 보장)
 * 2차: Cloud Firestore (원격 정본 `members/{uid}/reader-slots/{packId}`, 디바운스 자동 동기화)
 */
@Injectable({ providedIn: 'root' })
export class FirestoreReaderSlotRepository implements ReaderSlotPort {
  private readonly storage = inject(LW_STORAGE_PORT);
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingState: { packId: string; state: ReaderSavedState } | null = null;

  getCurrentUid(): string | null {
    try {
      return getShowcaseFirebaseAuth().currentUser?.uid ?? null;
    } catch {
      return null;
    }
  }

  /**
   * 로컬스토리지에서 즉시 동기로 슬롯을 읽어옵니다. (초기 렌더링용)
   */
  load(packId: string): ReaderSavedState {
    try {
      const parsed = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? 'null') as ReaderSavedState | null;
      if (!parsed || parsed.version !== 1 || typeof parsed.entries !== 'object') return EMPTY;
      const entries = Object.fromEntries(
        Object.entries(parsed.entries).filter(([, entry]) => entry?.slot?.packId === packId)
      );
      return {
        version: 1,
        activeSlotId: parsed.activeSlotId && entries[parsed.activeSlotId] ? parsed.activeSlotId : null,
        entries,
        clientUpdatedAt: parsed.clientUpdatedAt,
      };
    } catch {
      return EMPTY;
    }
  }

  /**
   * Cloud Firestore와 로컬스토리지 간의 양방향 동기화를 수행하고 최신 상태를 반환합니다.
   */
  async loadWithCloudSync(packId: string): Promise<ReaderSavedState> {
    const localState = this.load(packId);
    const uid = this.getCurrentUid();

    if (!uid) {
      return localState;
    }

    try {
      const db = getShowcaseFirestore();
      const docRef = doc(db, 'members', uid, 'reader-slots', packId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const cloudData = snap.data() as Partial<ReaderSavedState> & { updatedAt?: unknown };
        const cloudEntries = (cloudData.entries ?? {}) as Record<string, ReaderSavedEntry>;
        const cloudTime = cloudData.clientUpdatedAt ? new Date(cloudData.clientUpdatedAt).getTime() : 0;
        const localTime = localState.clientUpdatedAt ? new Date(localState.clientUpdatedAt).getTime() : 0;

        // 클라우드가 더 최신이거나 로컬이 비어있으면 클라우드 상태를 로컬에 반영
        if (cloudTime >= localTime || Object.keys(localState.entries).length === 0) {
          const merged: ReaderSavedState = {
            version: 1,
            activeSlotId: cloudData.activeSlotId && cloudEntries[cloudData.activeSlotId] ? cloudData.activeSlotId : null,
            entries: cloudEntries,
            clientUpdatedAt: cloudData.clientUpdatedAt ?? new Date().toISOString(),
          };
          this.saveToLocalStorage(merged);
          return merged;
        } else {
          // 로컬이 더 최신인 경우 클라우드로 백업 업로드
          await this.flushToCloud(uid, packId, localState);
          return localState;
        }
      } else if (Object.keys(localState.entries).length > 0) {
        // 클라우드에 아직 문서가 없는데 로컬에 데이터가 있으면 최초 시딩 업로드
        await this.flushToCloud(uid, packId, localState);
      }
    } catch (err) {
      console.warn('[FirestoreReaderSlotRepository] Cloud sync fallback to local storage:', err);
    }

    return localState;
  }

  /**
   * 슬롯 상태를 저장합니다.
   * 로컬에 즉시 저장 후, 600ms 디바운스로 Cloud Firestore에 비동기 플러시합니다.
   */
  save(state: ReaderSavedState, targetPackId?: string): void {
    const updatedState: ReaderSavedState = {
      ...state,
      clientUpdatedAt: new Date().toISOString(),
    };

    this.saveToLocalStorage(updatedState);

    // 슬롯 엔트리 중 대표 packId 추출
    const sampleEntry = Object.values(state.entries)[0];
    const packId = targetPackId ?? sampleEntry?.slot?.packId;
    if (!packId) return;

    this.pendingState = { packId, state: updatedState };
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      const pending = this.pendingState;
      if (pending) {
        const uid = this.getCurrentUid();
        if (uid) {
          void this.flushToCloud(uid, pending.packId, pending.state);
        }
      }
    }, 600);
  }

  /**
   * 즉시 Cloud Firestore로 플러시합니다.
   */
  async flushNow(packId: string, state: ReaderSavedState): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    const uid = this.getCurrentUid();
    if (!uid) return;
    await this.flushToCloud(uid, packId, state);
  }

  private saveToLocalStorage(state: ReaderSavedState): void {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as ReaderSavedState) : null;
      const mergedEntries = { ...(existing?.entries ?? {}), ...state.entries };
      const payload: ReaderSavedState = {
        version: 1,
        activeSlotId: state.activeSlotId,
        entries: mergedEntries,
        clientUpdatedAt: state.clientUpdatedAt ?? new Date().toISOString(),
      };
      this.storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('[FirestoreReaderSlotRepository] Failed to save to local storage:', err);
    }
  }

  private async flushToCloud(uid: string, packId: string, state: ReaderSavedState): Promise<void> {
    try {
      const db = getShowcaseFirestore();
      const docRef = doc(db, 'members', uid, 'reader-slots', packId);
      await setDoc(
        docRef,
        {
          ...state,
          packId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[FirestoreReaderSlotRepository] Failed to flush to cloud:', err);
    }
  }
}

/** 하위 호환성을 위한 별칭 */
export { FirestoreReaderSlotRepository as ReaderSlotRepository, type ReaderSavedStage, type ReaderSavedEntry, type ReaderSavedState };
