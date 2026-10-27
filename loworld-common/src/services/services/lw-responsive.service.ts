import { Injectable, computed, inject, signal } from '@angular/core';
import { LW_BREAKPOINT_COMPACT, LW_BREAKPOINT_DESKTOP, LW_BREAKPOINT_DESKTOP_WIDE, LW_BREAKPOINT_TABLET } from '../viewport/lw-breakpoints';
import { LW_VIEWPORT } from '../viewport/lw-viewport-context';

export { LW_BREAKPOINT_COMPACT, LW_BREAKPOINT_DESKTOP, LW_BREAKPOINT_DESKTOP_WIDE, LW_BREAKPOINT_MOBILE, LW_BREAKPOINT_TABLET } from '../viewport/lw-breakpoints';

export type LwBreakpointDevice = 'compact' | 'mobile' | 'tablet' | 'desktop' | 'desktop-wide';

/**
 * 현재 뷰포트(`LW_VIEWPORT`)의 폭을 표준 경계값으로 풀어 주는 서비스.
 *
 * 창을 직접 재지 않는다. 시뮬레이터처럼 뷰포트를 다시 제공하는 곳에서는
 * 이 서비스도 함께 제공해야 그 화면 기준의 답을 받는다.
 */
@Injectable({ providedIn: 'root' })
export class LwResponsiveService {
  private readonly viewport = inject(LW_VIEWPORT);
  private readonly override = signal<{ readonly width: number; readonly height: number } | null>(null);

  /** 현재 뷰포트 너비 (px) */
  readonly width = computed(() => this.override()?.width ?? this.viewport.width());
  /** 현재 뷰포트 높이 (px) */
  readonly height = computed(() => this.override()?.height ?? this.viewport.height());
  /** 주 입력 장치가 터치인가 */
  readonly isTouchDevice = this.viewport.coarsePointer;

  /** 모바일 (<= 768px) */
  readonly isMobile = computed(() => this.width() <= LW_BREAKPOINT_TABLET);
  /** 초소형 휴대폰·폴더블 커버 (<= 380px) */
  readonly isCompact = computed(() => this.width() <= LW_BREAKPOINT_COMPACT);
  /** 태블릿 (768px < width < 1024px) */
  readonly isTablet = computed(() => !this.isMobile() && !this.isDesktop());
  /** 데스크톱 (>= 1024px) */
  readonly isDesktop = computed(() => this.width() >= LW_BREAKPOINT_DESKTOP);

  readonly deviceTier = computed<LwBreakpointDevice>(() => {
    const w = this.width();
    if (w <= LW_BREAKPOINT_COMPACT) return 'compact';
    if (w <= LW_BREAKPOINT_TABLET) return 'mobile';
    if (w < LW_BREAKPOINT_DESKTOP) return 'tablet';
    return w < LW_BREAKPOINT_DESKTOP_WIDE ? 'desktop' : 'desktop-wide';
  });

  /** 테스트에서 치수를 고정한다. 한 번 부르면 뷰포트 값 대신 이 값을 쓴다. */
  updateDimensions(width: number, height: number): void {
    this.override.set({ width, height });
  }
}
