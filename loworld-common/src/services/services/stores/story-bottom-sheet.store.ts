import { Injectable, signal, computed } from '@angular/core';

export type StoryPlayBottomSheetTabId =
  | 'battle'
  | 'roster-setup'
  | 'quest'
  | 'map'
  | 'equipment'
  | 'stash'
  | 'shop'
  | 'mercenary'
  | 'cube'
  | 'skill-training'
  | 'journey'
  | 'd2-character'
  | 'd2-roster'
  | 'character-detail'
  | 'monster-detail'
  | 'monster'
  | 'codex-cards'
  | 'equipment-codex'
  | 'cube-guide'
  | 'item-detail'
  | 'personality'
  | 'personality-codex'
  | 'mind-interaction'
  | 'chapter-progress'
  | 'paragraph-manager'
  | 'codex-manager'
  | 'paragraph-story'
  | 'domain-content'
  | null;

/**
 * 바텀시트 개방 시 전달 가능한 통합 문맥(Context) 모델
 */
export interface StoryBottomSheetContext {
  tab: StoryPlayBottomSheetTabId;
  title?: string | null;
  kicker?: string | null;
  maxHeight?: number | string | null;
  maxWidth?: number | string | null;
  focusedQuestId?: string | null;
  characterSummary?: any | null;
  activeEquipTargetSlot?: any | null;
  payload?: any;
}

/**
 * Story Play 전용 바텀시트 개폐, 활성 탭 및 문맥(Context) 전담 Signal Store (SSOT, ISP, SRP).
 */
@Injectable({ providedIn: 'root' })
export class StoryBottomSheetStore {
  readonly activeBottomSheetTab = signal<StoryPlayBottomSheetTabId>(null);
  readonly context = signal<StoryBottomSheetContext | null>(null);

  readonly isBottomSheetOpen = computed(() => this.activeBottomSheetTab() !== null);
  readonly currentTab = this.activeBottomSheetTab.asReadonly();
  readonly currentContext = this.context.asReadonly();

  /**
   * 바텀시트 개방 (탭 및 선택적 컨텍스트)
   */
  open(tab: StoryPlayBottomSheetTabId, ctx?: Partial<StoryBottomSheetContext>): void {
    this.activeBottomSheetTab.set(tab);
    if (tab === null) {
      this.context.set(null);
    } else {
      this.context.set({
        tab,
        title: ctx?.title ?? null,
        kicker: ctx?.kicker ?? null,
        maxHeight: ctx?.maxHeight ?? null,
        maxWidth: ctx?.maxWidth ?? null,
        focusedQuestId: ctx?.focusedQuestId ?? null,
        characterSummary: ctx?.characterSummary ?? null,
        activeEquipTargetSlot: ctx?.activeEquipTargetSlot ?? null,
        payload: ctx?.payload ?? null,
      });
    }
  }

  /**
   * 바텀시트 닫기
   */
  close(): void {
    this.activeBottomSheetTab.set(null);
    this.context.set(null);
  }

  /**
   * 바텀시트 토글
   */
  toggle(tab: StoryPlayBottomSheetTabId, ctx?: Partial<StoryBottomSheetContext>): void {
    if (this.activeBottomSheetTab() === tab) {
      this.close();
    } else {
      this.open(tab, ctx);
    }
  }

  /**
   * 현재 열린 바텀시트의 컨텍스트 부분 갱신
   */
  updateContext(patch: Partial<StoryBottomSheetContext>): void {
    this.context.update((prev) => {
      if (!prev) return null;
      return { ...prev, ...patch };
    });
  }

  // ── 호환성 브릿지 메서드 (Legacy Compatibility) ──
  openBottomSheet(tab: StoryPlayBottomSheetTabId, ctx?: Partial<StoryBottomSheetContext>): void {
    this.open(tab, ctx);
  }

  closeBottomSheet(): void {
    this.close();
  }

  toggleBottomSheet(tab: StoryPlayBottomSheetTabId, ctx?: Partial<StoryBottomSheetContext>): void {
    this.toggle(tab, ctx);
  }
}

