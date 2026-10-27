import { Injectable, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LW_VIEWPORT } from '../viewport/lw-viewport-context';

export type LwScreenCategory = 'mobile-compact' | 'mobile-standard' | 'tablet' | 'desktop';

export interface LwCardDimensions {
  width: number;
  height: number;
  marginY: number;
  marginX: number;
  emptyMinHeight: number;
}

/**
 * 화면 및 컨테이너 해상도/비율을 분석하고, UI 컴포넌트(바텀시트, 카드 등)의 비례 스케일링을 총괄하는 싱글톤 서비스 (SRP, OCP).
 * 
 * - 현재 뷰포트(`LW_VIEWPORT`) 또는 등록된 컨테이너의 크기를 따른다. 창을 직접 재지 않는다.
 * - 화면 유형 분류 ('mobile-compact', 'mobile-standard', 'tablet', 'desktop')
 * - 전역 스케일 및 카드 전용 스케일 팩터 연산
 * - CSS 커스텀 프로퍼티(--lw-card-target-width, --lw-dock-clearance 등) 자동 동기화
 */
@Injectable({
  providedIn: 'root',
})
export class LwScreenRatioService implements OnDestroy {
  private readonly viewport = inject(LW_VIEWPORT);
  private readonly doc = inject(DOCUMENT, { optional: true });

  /** 측정 기준으로 등록된 컨테이너. 없으면 현재 뷰포트(`LW_VIEWPORT`)를 따른다. */
  private readonly container = signal<HTMLElement | null>(null);
  private readonly measured = signal<{ readonly width: number; readonly height: number } | null>(null);
  private resizeObserver?: ResizeObserver;

  // ── 1. 기본 측정 Signal ──
  readonly containerWidth = computed<number>(() => this.measured()?.width ?? this.viewport.width());
  readonly containerHeight = computed<number>(() => this.measured()?.height ?? this.viewport.height());

  // ── 2. 화면 분류 및 반응형 플래그 ──
  readonly aspectRatio = computed<number>(() => {
    const h = this.containerHeight();
    return h > 0 ? this.containerWidth() / h : 1;
  });

  readonly isPortrait = computed<boolean>(() => this.aspectRatio() < 1);

  readonly screenCategory = computed<LwScreenCategory>(() => {
    const w = this.containerWidth();
    const h = this.containerHeight();

    if (w <= 380 || (w <= 400 && h < 700)) {
      return 'mobile-compact';
    }
    if (w <= 640 || (w <= 680 && h < 950)) {
      return 'mobile-standard';
    }
    if (w <= 1024) {
      return 'tablet';
    }
    return 'desktop';
  });

  readonly isMobile = computed<boolean>(() => {
    const cat = this.screenCategory();
    return cat === 'mobile-compact' || cat === 'mobile-standard';
  });

  readonly isTablet = computed<boolean>(() => this.screenCategory() === 'tablet');
  readonly isDesktop = computed<boolean>(() => this.screenCategory() === 'desktop');

  // ── 3. 비례 스케일 팩터 (Scale Multipliers) ──
  readonly scaleRatio = computed<number>(() => {
    switch (this.screenCategory()) {
      case 'mobile-compact':
        return 0.68;
      case 'mobile-standard':
        return 0.78;
      case 'tablet':
        return 0.88;
      case 'desktop':
      default:
        return 1.0;
    }
  });

  /**
   * 대형 수집형 아케인 카드(영웅 슬롯 카드 등) 전용 반응형 스케일 팩터
   */
  readonly cardScaleRatio = computed<number>(() => {
    switch (this.screenCategory()) {
      case 'mobile-compact':
        return 0.65;
      case 'mobile-standard':
        return 0.74;
      case 'tablet':
        return 0.88;
      case 'desktop':
      default:
        return 1.0;
    }
  });

  /**
   * 대형 아케인 카드의 목표 치수 (픽셀)
   */
  readonly cardDimensions = computed<LwCardDimensions>(() => {
    switch (this.screenCategory()) {
      case 'mobile-compact':
        return {
          width: 195,
          height: 295,
          marginY: 10,
          marginX: 8,
          emptyMinHeight: 235,
        };
      case 'mobile-standard':
        return {
          width: 220,
          height: 335,
          marginY: 14,
          marginX: 10,
          emptyMinHeight: 265,
        };
      case 'tablet':
        return {
          width: 245,
          height: 405,
          marginY: 20,
          marginX: 14,
          emptyMinHeight: 330,
        };
      case 'desktop':
      default:
        return {
          width: 280,
          height: 460,
          marginY: 26,
          marginX: 18,
          emptyMinHeight: 380,
        };
    }
  });

  /**
   * 모바일 하단 독 바(Dock) 또는 제어 메뉴 바 높이 오프셋 (px)
   */
  readonly bottomDockInset = computed<number>(() => {
    return this.isMobile() ? 68 : 0;
  });

  constructor() {
    // 화면 분류가 바뀔 때만 다시 실행된다(읽는 값이 모두 분류에서 파생된다).
    effect(() => this.syncCssVariables());
  }

  /**
   * 특정 래퍼 컨테이너를 측정 대상으로 등록한다. 이후에는 뷰포트 대신 이 요소의 크기를 따른다.
   */
  registerContainer(element: HTMLElement): void {
    if (!element || this.container() === element) return;
    this.resizeObserver?.disconnect();
    this.container.set(element);
    this.measureContainer(element);

    const Observer = element.ownerDocument.defaultView?.ResizeObserver;
    if (Observer) {
      this.resizeObserver = new Observer(() => this.measureContainer(element));
      this.resizeObserver.observe(element);
    }
  }

  /**
   * 컨테이너 등록을 풀고 현재 뷰포트 기준으로 돌아간다.
   */
  unregisterContainer(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.container.set(null);
    this.measured.set(null);
  }

  /**
   * 현재 등록된 타겟 요소 또는 문서 루트(:root)에 CSS 커스텀 프로퍼티 동기화
   */
  syncCssVariables(targetEl?: HTMLElement): void {
    // 등록된 컨테이너 → 가상 화면(시뮬레이터) 요소 → 문서 루트 순으로 고른다.
    const target = targetEl ?? this.container() ?? (this.viewport.simulated() ? this.viewport.overlayHost() : null) ?? this.doc?.documentElement ?? null;

    if (!target || !target.style) return;

    const dims = this.cardDimensions();
    const scale = this.scaleRatio();
    const cardScale = this.cardScaleRatio();
    const dockInset = this.bottomDockInset();
    const isMob = this.isMobile();

    target.style.setProperty('--lw-screen-scale', scale.toFixed(2));
    target.style.setProperty('--lw-card-scale', cardScale.toFixed(2));
    target.style.setProperty('--lw-card-target-width', `${dims.width}px`);
    target.style.setProperty('--lw-card-target-height', `${dims.height}px`);
    target.style.setProperty('--lw-card-inner-margin-y', `${dims.marginY}px`);
    target.style.setProperty('--lw-card-inner-margin-x', `${dims.marginX}px`);
    target.style.setProperty('--lw-card-empty-min-height', `${dims.emptyMinHeight}px`);
    target.style.setProperty('--lw-dock-clearance', `${dockInset}px`);
    target.style.setProperty('--lw-is-mobile', isMob ? '1' : '0');
  }

  private measureContainer(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    // 아직 배치되지 않은 요소(크기 0)는 뷰포트 값을 그대로 쓴다.
    this.measured.set(rect.width > 0 && rect.height > 0 ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }
}
