import { Injectable, computed, inject, signal } from '@angular/core';
import { appKeyOf, registeredAppKeys } from '../../../platform/core/domain-registry/app-look';
import { LW_STORAGE_PORT } from '../../../../services/ports/storage.port';

export interface OverviewAppUsageEntry {
  appKey: string;
  launchCount: number;
  lastUsedAt: number;
}

export type OverviewAppUsageMap = Record<string, OverviewAppUsageEntry>;

export const OVERVIEW_APP_USAGE_STORAGE_KEY = 'lw_overview_app_usage_v1';

@Injectable({ providedIn: 'root' })
export class OverviewAppUsageStore {
  private readonly storage = inject(LW_STORAGE_PORT);

  /** 각 앱별 사용량 맵 시그널 */
  readonly usageMap = signal<OverviewAppUsageMap>(this.loadFromStorage());

  /** 사용량(실행 횟수 DESC -> 최근 사용 시각 DESC) 기준으로 정렬된 고유 앱 키 목록 */
  readonly sortedCanonicalAppKeys = computed<string[]>(() => {
    const map = this.usageMap();
    // 횟수와 시각이 같으면 앱이 등록된 차례를 따른다.
    const DEFAULT_APP_PRIORITY = registeredAppKeys();
    const allKeys = Array.from(new Set([...DEFAULT_APP_PRIORITY, ...Object.keys(map)]));

    return allKeys.sort((a, b) => {
      const countA = map[a]?.launchCount ?? 0;
      const countB = map[b]?.launchCount ?? 0;
      if (countA !== countB) {
        return countB - countA; // 횟수 내림차순
      }

      const timeA = map[a]?.lastUsedAt ?? 0;
      const timeB = map[b]?.lastUsedAt ?? 0;
      if (timeA !== timeB) {
        return timeB - timeA; // 최근 사용 내림차순
      }

      // 횟수와 시간 모두 동일할 경우 기본 우선순위 배열 기준 정렬
      const idxA = DEFAULT_APP_PRIORITY.indexOf(a);
      const idxB = DEFAULT_APP_PRIORITY.indexOf(b);
      const prioA = idxA !== -1 ? idxA : 999;
      const prioB = idxB !== -1 ? idxB : 999;
      return prioA - prioB;
    });
  });

  /** 탭, 앱 id, 폴더 id를 그 앱의 열쇠로 바꾼다. 앱의 탭이 여럿이어도(데스크탑, 모바일) 한 앱으로 센다. */
  normalizeCanonicalId(rawKeyOrTab: string): string {
    return appKeyOf(rawKeyOrTab);
  }

  /** 앱 실행 시 사용량 기록 (카운트 1 증가 및 시각 갱신) */
  recordLaunch(rawKeyOrTab: string): void {
    if (!rawKeyOrTab) return;
    const canonicalId = this.normalizeCanonicalId(rawKeyOrTab);
    const now = Date.now();

    this.usageMap.update(currentMap => {
      const existing = currentMap[canonicalId];
      const nextEntry: OverviewAppUsageEntry = {
        appKey: canonicalId,
        launchCount: (existing?.launchCount ?? 0) + 1,
        lastUsedAt: now,
      };

      const updated = {
        ...currentMap,
        [canonicalId]: nextEntry,
      };

      this.saveToStorage(updated);
      return updated;
    });
  }

  /** 특정 앱의 누적 실행 횟수 조회 */
  getLaunchCount(rawKeyOrTab: string): number {
    const canonicalId = this.normalizeCanonicalId(rawKeyOrTab);
    return this.usageMap()[canonicalId]?.launchCount ?? 0;
  }

  /** 특정 앱의 최근 사용 시각 조회 */
  getLastUsedAt(rawKeyOrTab: string): number | null {
    const canonicalId = this.normalizeCanonicalId(rawKeyOrTab);
    return this.usageMap()[canonicalId]?.lastUsedAt ?? null;
  }

  /** 사용량 전체 초기화 (디버그 또는 사용자 요청용) */
  resetUsage(): void {
    this.usageMap.set({});
    try {
      this.storage.removeItem(OVERVIEW_APP_USAGE_STORAGE_KEY);
    } catch (e) {
      console.warn('스토리지 초기화 실패:', e);
    }
  }

  private loadFromStorage(): OverviewAppUsageMap {
    try {
      const raw = this.storage.getItem(OVERVIEW_APP_USAGE_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as OverviewAppUsageMap;
      }
    } catch (e) {
      console.warn('앱 사용량 스토리지 읽기 실패:', e);
    }
    return {};
  }

  private saveToStorage(data: OverviewAppUsageMap): void {
    try {
      this.storage.setItem(OVERVIEW_APP_USAGE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('앱 사용량 스토리지 쓰기 실패:', e);
    }
  }
}
