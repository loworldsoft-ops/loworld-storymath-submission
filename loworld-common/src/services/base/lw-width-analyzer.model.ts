/** lw-height-analyzer와 대칭 — 가로 축 레이아웃 역할 */
export type LwWidthRole = 'container' | 'leading' | 'trailing' | 'content';

/** 측정 폭 기반 UI 밀도 구간 (좌측 sidebar·inspector 공통) */
export type LwWidthTier = 'compact' | 'narrow' | 'comfortable' | 'wide';

/** sidebar 서브패널 2열 분할 가능 여부 */
export type LwSidebarLayoutMode = 'stack' | 'split';

export const LW_WIDTH_TIER_THRESHOLDS = {
  narrow: 280,
  comfortable: 400,
  wide: 520,
  sidebarSplit: 620,
} as const;

export const LW_WIDTH_CSS_VAR = '--lw-calculated-width';
export const LW_SIDEBAR_CONTENT_WIDTH_VAR = '--lw-sidebar-content-width';

export function resolveLwWidthTier(width: number): LwWidthTier {
  if (width < LW_WIDTH_TIER_THRESHOLDS.narrow) {
    return 'compact';
  }
  if (width < LW_WIDTH_TIER_THRESHOLDS.comfortable) {
    return 'narrow';
  }
  if (width < LW_WIDTH_TIER_THRESHOLDS.wide) {
    return 'comfortable';
  }
  return 'wide';
}

export function resolveSidebarLayoutMode(width: number): LwSidebarLayoutMode {
  return width >= LW_WIDTH_TIER_THRESHOLDS.sidebarSplit ? 'split' : 'stack';
}
