import { CommonModule, DOCUMENT } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { LwCloseButtonComponent } from '../../navigation/close-button/close-button.component';
import { ChangeDetectionStrategy, Component, input, output, inject, computed, signal, effect, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { LW_VIEWPORT } from '../../../services/viewport/lw-viewport-context';
import { LwUIBehaviorDirective } from '../../../services/base/lw-ui-behavior.directive';
import { LwActionEvent } from '../../../services/models/action-event.model';
import { LwScreenRatioService } from '../../../services/base/lw-screen-ratio.service';
import { WINDOW } from '../../../services/tokens/window.token';
import { calculateContentNeededHeight, findRealContentContainer } from './bottom-sheet-content-measurer';

export type BottomSheetSnapState = 'fullscreen' | 'standard' | 'compact';

@Component({
  imports: [CommonModule, LwButtonComponent, LwCloseButtonComponent],
  selector: 'lw-bottom-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss',
  hostDirectives: [
    {
      directive: LwUIBehaviorDirective,
      inputs: ['disabled', 'visible'],
    },
  ],
})
export class LwBottomSheetComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly uiBehavior = inject(LwUIBehaviorDirective);
  private readonly ngZone = inject(NgZone);
  private readonly viewport = inject(LW_VIEWPORT);
  private readonly screenRatioService = inject(LwScreenRatioService, { optional: true });
  private readonly win = inject(WINDOW, { optional: true });

  readonly isMobileScreen = computed<boolean>(() => this.screenRatioService?.isMobile() ?? false);

  private getViewportHeight(): number {
    return this.screenRatioService?.containerHeight() ?? this.viewport.height();
  }

  @ViewChild('drawer') drawerRef?: ElementRef<HTMLElement>;
  @ViewChild('handleZone') handleZoneRef?: ElementRef<HTMLElement>;
  @ViewChild('headerZone') headerZoneRef?: ElementRef<HTMLElement>;
  @ViewChild('bodyZone') bodyZoneRef?: ElementRef<HTMLElement>;

  readonly disabled = this.uiBehavior.disabled;
  readonly visible = this.uiBehavior.visible;

  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly kicker = input<string>('');
  readonly showClose = input<boolean>(true);
  /** 헤더 좌측 뒤로가기 버튼 표시 여부 */
  readonly showBack = input<boolean>(false);
  /** 뒤로가기 버튼 라벨 (선택 사항) */
  readonly backLabel = input<string>('');
  readonly backdropBlur = input<boolean>(true);
  readonly closeOnOverlay = input<boolean>(true);
  readonly scrollable = input<boolean>(true);
  /** 모바일 뷰포트/시뮬레이터 엣지 투 엣지 (100% 폭 하단 밀착 도킹) */
  readonly fullWidth = input<boolean>(false);
  /** 하단 홈 인디케이터(Safe Area) 패딩 활성화 */
  readonly edgeToEdge = input<boolean>(false);
  /** 하단 제어 메뉴 바(lw-os-mobile-bottom-bar) 상단에 도킹 */
  readonly dockAboveBottomBar = input<boolean>(false);
  readonly customMaxWidth = input<number | string | null>(null);
  readonly customMaxHeight = input<number | string | null>(null);

  /**
   * 내용 높이에 기반한 동적 높이 및 자동 전체화면(fullscreen) 적용 여부
   * @default true
   */
  readonly contentDrivenHeight = input<boolean>(true);

  /**
   * 스크롤이 발생할 정도로 내용이 길 때 자동 전체화면으로 전환하는 화면 높이 비율 임계값 (0.1 ~ 1.0)
   * 기본값 0.85 (컨텐츠 필요 높이가 화면 높이의 85% 이상이거나 가용 공간 초과 시 전체화면으로 시작)
   * @default 0.85
   */
  readonly autoFullscreenThreshold = input<number>(0.85);

  /**
   * 시작 스냅 상태 지정 (null이면 contentDrivenHeight에 의해 'fullscreen' 또는 'standard/content'로 자동 결정)
   * @default null
   */
  readonly initialSnap = input<BottomSheetSnapState | null>(null);

  readonly close = output<void>();
  readonly back = output<void>();
  readonly actionEvent = output<LwActionEvent<any>>();

  /** 스냅 상태: fullscreen (100% 상단 밀착 직각), standard (65vh 32px 라운드), compact (36vh) */
  readonly snapState = signal<BottomSheetSnapState>('standard');

  /** 실시간 수직 드래그 높이 (px) */
  readonly currentHeightPx = signal<number | null>(null);

  /** 측정된 컨텐츠 실제 필요 높이 (px) */
  readonly measuredContentHeight = signal<number | null>(null);

  /** 사용자가 드래그 또는 핸들 클릭으로 스냅 상태를 수동 조작했는지 여부 */
  readonly hasUserAdjustedSnap = signal<boolean>(false);

  /** 드래그 인터랙션 상태 */
  readonly isDragging = signal<boolean>(false);
  readonly dragTranslateY = signal<number>(0);

  /** 슬라이드업 오프닝 애니메이션 진행 상태 (0.32s 슬라이드업 중 트랜지션 충돌 및 리플로우 차단) */
  readonly isOpening = signal<boolean>(false);

  private startClientY = 0;
  private currentClientY = 0;
  private startTime = 0;
  private initialHeight = 0;
  private hasMovedFar = false;
  private removeListeners: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private measureScheduled = false;
  private openingTimeout: any = null;
  private rafDragId: number | null = null;
  private pendingTranslateY = 0;

  constructor() {
    // 바텀시트 개폐 및 내용 높이 측정 연동
    effect(() => {
      if (this.open()) {
        if (this.initialSnap()) {
          this.snapState.set(this.initialSnap()!);
        }
        this.isOpening.set(true);
        if (this.openingTimeout) {
          clearTimeout(this.openingTimeout);
          this.openingTimeout = null;
        }
        this.openingTimeout = setTimeout(() => {
          this.isOpening.set(false);
          this.openingTimeout = null;
        }, 320);
        this.scheduleMeasurement();
      } else {
        this.resetState();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.openingTimeout) {
      clearTimeout(this.openingTimeout);
      this.openingTimeout = null;
    }
    this.cleanUpResizeObserver();
    this.cleanUpListeners();
  }

  protected readonly customMaxWidthStyle = computed(() => {
    // 모바일 환경에서만 fullWidth 시 100% 엣지투엣지 적용
    if (this.fullWidth() && this.isMobileScreen()) return '100%';
    const maxW = this.customMaxWidth();
    if (maxW !== null && maxW !== undefined) {
      return typeof maxW === 'number' ? `${maxW}px` : maxW;
    }
    // 데스크탑 기본: 좌우 마진이 확보된 최적 너비
    if (!this.isMobileScreen()) {
      return 'min(calc(100% - 64px), 1180px)';
    }
    return null;
  });

  /** 바텀시트 드로어 실시간 높이 스타일 */
  protected readonly drawerHeightStyle = computed(() => {
    switch (this.snapState()) {
      case 'fullscreen':
        // 데스크탑에서는 풀스크린 상태여도 상단 48px 여백을 남겨 바텀시트 정체성 유지
        return this.isMobileScreen() ? '100%' : 'min(90vh, 920px)';
      case 'compact':
        return '36vh';
      case 'standard':
      default: {
        // 내용 기반 높이 적용: 사용자가 수동 드래그하지 않았고 측정된 내용 높이가 충분할 때 반영
        if (this.contentDrivenHeight() && !this.hasUserAdjustedSnap()) {
          const measured = this.measuredContentHeight();
          if (measured !== null && measured >= 180) {
            const ceiling = this.isMobileScreen() ? 'min(94vh, 1000px)' : 'min(86vh, 880px)';
            return `min(${Math.round(measured)}px, ${ceiling})`;
          }
        }
        const standardFallback = this.isMobileScreen()
          ? 'var(--lw-bottom-sheet-standard-height, min(68vh, 760px))'
          : 'var(--lw-bottom-sheet-desktop-standard-height, min(80vh, 820px))';
        return standardFallback;
      }
    }
  });

  protected readonly drawerMaxHeightStyle = computed(() => {
    if (this.snapState() === 'fullscreen') {
      return this.isMobileScreen() ? '100%' : 'min(90vh, 920px)';
    }
    if (this.snapState() === 'compact') return '36vh';
    const maxH = this.customMaxHeight();
    if (maxH !== null && maxH !== undefined) {
      return typeof maxH === 'number' ? `${maxH}px` : maxH;
    }
    return this.isMobileScreen() ? 'min(94vh, 1000px)' : 'min(88vh, 880px)';
  });

  protected readonly drawerTransform = computed(() => {
    if (!this.isDragging() && this.dragTranslateY() !== 0) {
      return `translate3d(0, ${this.dragTranslateY()}px, 0)`;
    }
    return null;
  });

  /** 헤더 좌측 뒤로가기 버튼 클릭 핸들러 */
  protected onBackClick(): void {
    if (!this.disabled()) {
      this.back.emit();
      this.actionEvent.emit({
        actionId: 'BOTTOM_SHEET_NAVIGATE_BACK',
        payload: null,
        source: 'lw-bottom-sheet',
      });
    }
  }

  /** 백드롭 클릭 핸들러 */
  protected onBackdropClick(): void {
    if (this.closeOnOverlay() && !this.disabled()) {
      this.close.emit();
      this.actionEvent.emit({
        actionId: 'BOTTOM_SHEET_CLOSED_BY_BACKDROP',
        payload: null,
        source: 'lw-bottom-sheet',
      });
    }
  }

  /** 핸들 탭/클릭 토글 (단순 클릭 시 standard <-> fullscreen 토글) */
  protected onHandleClick(): void {
    if (this.hasMovedFar) return;
    this.hasUserAdjustedSnap.set(true);
    this.currentHeightPx.set(null);
    this.snapState.update((state) => (state === 'fullscreen' ? 'standard' : 'fullscreen'));
  }

  /** 터치 드래그 시작 */
  protected onHandleTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      this.startDrag(e.touches[0].clientY);
    }
  }

  /** 마우스 드래그 시작 */
  protected onHandleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // 좌클릭만 허용
    e.preventDefault();
    this.startDrag(e.clientY);
  }

  private startDrag(clientY: number): void {
    this.hasUserAdjustedSnap.set(true);
    this.startClientY = clientY;
    this.currentClientY = clientY;
    this.startTime = Date.now();
    this.hasMovedFar = false;

    // 드래그 시작 시점의 실제 렌더링된 높이 캡처
    const drawerEl = this.drawerRef?.nativeElement;
    const rect = drawerEl?.getBoundingClientRect();
    const renderedHeight = rect ? rect.height : 0;
    this.initialHeight = renderedHeight > 100
      ? renderedHeight
      : (this.snapState() === 'fullscreen' ? this.getViewportHeight() : Math.min(this.getViewportHeight() * 0.65, 580));

    this.pendingTranslateY = 0;
    this.currentHeightPx.set(this.initialHeight);
    this.dragTranslateY.set(0);
    this.isDragging.set(true);

    if (this.document) {
      this.document.body.style.userSelect = 'none';
      this.document.body.style.webkitUserSelect = 'none';
    }

    // 🚀 Zone.js 바깥에서 포인터 무브를 수신하여 매 픽셀마다 전역 Change Detection이 도는 것을 완벽 차단!
    this.ngZone.runOutsideAngular(() => {
      const onMove = (moveEvent: TouchEvent | MouseEvent) => {
        const currentY =
          'touches' in moveEvent
            ? moveEvent.touches[0]?.clientY ?? this.currentClientY
            : (moveEvent as MouseEvent).clientY;
        this.currentClientY = currentY;
        const deltaY = currentY - this.startClientY;

        if (Math.abs(deltaY) > 5) {
          this.hasMovedFar = true;
        }

        // 🚀 GPU 가속 Compositor 드래그 (레이아웃 리플로우 0회)
        let translateY = 0;
        if (deltaY > 0) {
          // 아래로 당길 때: 1:1로 아래로 이동
          translateY = deltaY;
        } else {
          // 위로 당길 때: 이미 풀스크린이면 부드러운 고무줄 저항(0.16), 아니면 위로 1:1 이동
          if (this.snapState() === 'fullscreen') {
            translateY = deltaY * 0.16;
          } else {
            translateY = deltaY;
          }
        }
        this.pendingTranslateY = translateY;

        // 🚀 requestAnimationFrame으로 브라우저 모니터 주사율에 동기화하여 direct DOM transform 갱신 (리플로우/깜빡임 차단)
        if (this.rafDragId === null) {
          this.rafDragId = requestAnimationFrame(() => {
            this.rafDragId = null;
            if (!this.isDragging() || !drawerEl) return;
            drawerEl.style.transform = `translate3d(0, ${Math.round(this.pendingTranslateY)}px, 0)`;
          });
        }
      };

      const onEnd = () => {
        if (this.rafDragId !== null) {
          cancelAnimationFrame(this.rafDragId);
          this.rafDragId = null;
        }
        this.ngZone.run(() => {
          this.endDrag();
        });
      };

      const touchMoveHandler = (e: TouchEvent) => onMove(e);
      const touchEndHandler = () => onEnd();
      const mouseMoveHandler = (e: MouseEvent) => onMove(e);
      const mouseUpHandler = () => onEnd();

      this.win?.addEventListener('touchmove', touchMoveHandler, { passive: true });
      this.win?.addEventListener('touchend', touchEndHandler);
      this.win?.addEventListener('touchcancel', touchEndHandler);
      this.win?.addEventListener('mousemove', mouseMoveHandler);
      this.win?.addEventListener('mouseup', mouseUpHandler);

      this.removeListeners = () => {
        this.win?.removeEventListener('touchmove', touchMoveHandler);
        this.win?.removeEventListener('touchend', touchEndHandler);
        this.win?.removeEventListener('touchcancel', touchEndHandler);
        this.win?.removeEventListener('mousemove', mouseMoveHandler);
        this.win?.removeEventListener('mouseup', mouseUpHandler);
      };
    });
  }

  private endDrag(): void {
    this.cleanUpListeners();

    const deltaY = this.currentClientY - this.startClientY;
    const duration = Math.max(Date.now() - this.startTime, 1);
    const velocityY = deltaY / duration; // 양수: 아래로 플릭, 음수: 위로 플릭
    const windowH = this.getViewportHeight();
    const currentSnap = this.snapState();

    // 인라인 드래그 스타일 리셋 (Angular Signal 및 클래스로 자연스럽게 인계)
    const drawerEl = this.drawerRef?.nativeElement;
    if (drawerEl) {
      drawerEl.style.transform = '';
    }

    this.isDragging.set(false);
    this.currentHeightPx.set(null);
    this.dragTranslateY.set(0);

    // 1. 하단으로 충분히 내렸거나 빠른 다운 플릭 제스처 시 -> 바텀시트 닫기(Dismiss)
    const shouldDismiss =
      deltaY > windowH * 0.45 ||
      (deltaY > 120 && velocityY > 0.55);

    if (shouldDismiss) {
      this.close.emit();
      this.actionEvent.emit({
        actionId: 'BOTTOM_SHEET_CLOSED_BY_DRAG_DOWN',
        payload: { deltaY, velocityY },
        source: 'lw-bottom-sheet',
      });
      this.resetState();
      return;
    }

    // 2. 풀스크린 상태에서의 제스처
    if (currentSnap === 'fullscreen') {
      if (deltaY > 120 || velocityY > 0.35) {
        this.snapState.set('standard');
      } else {
        this.snapState.set('fullscreen');
      }
      return;
    }

    // 3. standard/compact 상태에서 위로 올린 경우 -> fullscreen
    if (deltaY < -80 || velocityY < -0.35) {
      this.snapState.set('fullscreen');
      return;
    }

    // 4. standard 상태에서 아래로 내린 경우 -> compact
    if (currentSnap === 'standard') {
      if (deltaY > 100 || velocityY > 0.35) {
        this.snapState.set('compact');
      } else {
        this.snapState.set('standard');
      }
      return;
    }

    // 5. compact 상태에서 위로 올린 경우 -> standard
    if (currentSnap === 'compact') {
      if (deltaY < -60 || velocityY < -0.25) {
        this.snapState.set('standard');
      } else {
        this.snapState.set('compact');
      }
      return;
    }
  }

  private lastObservedScrollHeight = 0;
  private isApplyingHeight = false;
  private heightApplyTimeout: any = null;

  /**
   * 바텀시트 내부 컨텐츠의 실제 필요 높이를 심층 측정하고
   * 화면 높이를 초과하여 스크롤이 불가피하면 자동으로 fullscreen 스냅 적용
   */
  public measureAndApplyContentHeight(): void {
    const handleEl = this.handleZoneRef?.nativeElement;
    const headerEl = this.headerZoneRef?.nativeElement;
    const bodyEl = this.bodyZoneRef?.nativeElement;

    if (!bodyEl) return;

    const measurement = calculateContentNeededHeight(handleEl, headerEl, bodyEl);
    if (!measurement) return;

    const { totalNeededHeight, maxNestedScrollHeight } = measurement;
    const windowH = this.getViewportHeight();
    const thresholdHeight = Math.round(windowH * this.autoFullscreenThreshold());

    // 🛡️ [Anti-Shrink Drift Guard]
    // 이미 측정된 높이가 존재하는 상태에서 새 측정값이 이전 높이보다 작거나 약간 줄어든 경우 (오차 48px 이내),
    // 드로어 수축 애니메이션 및 패딩/보더 계산 오차로 인한 연속 하향 축소 루프("점점점 내려감")를 차단하고 기존 높이 유지.
    const prevHeight = this.measuredContentHeight();
    if (prevHeight !== null && totalNeededHeight < prevHeight && (prevHeight - totalNeededHeight) <= 48) {
      return;
    }

    this.isApplyingHeight = true;
    if (this.heightApplyTimeout) {
      clearTimeout(this.heightApplyTimeout);
    }
    this.heightApplyTimeout = setTimeout(() => {
      this.isApplyingHeight = false;
    }, 350);

    this.measuredContentHeight.set(totalNeededHeight);

    // 사용자가 직접 조작하지 않았고, 명시적 initialSnap이 없는 경우에만 자동 스냅 결정
    if (!this.hasUserAdjustedSnap() && this.initialSnap() === null && this.contentDrivenHeight()) {
      // 🚀 모바일 뷰포트에서만 컨텐츠 길이에 따른 자동 fullscreen 전환 허용
      // 데스크탑에서는 내용이 길더라도 바텀시트 본연의 형태(standard)를 유지하며 내부 스크롤 제공
      if (this.isMobileScreen()) {
        const isScrollInevitable =
          totalNeededHeight >= thresholdHeight ||
          maxNestedScrollHeight >= thresholdHeight;

        if (isScrollInevitable) {
          this.snapState.set('fullscreen');
        } else {
          this.snapState.set('standard');
        }
      } else {
        this.snapState.set('standard');
      }
    }
  }

  private scheduleMeasurement(): void {
    if (this.measureScheduled || !this.win) return;
    this.measureScheduled = true;
    setTimeout(() => {
      requestAnimationFrame(() => {
        this.measureScheduled = false;
        if (!this.open()) return;
        this.measureAndApplyContentHeight();
        this.setupResizeObserver();
      });
    }, 0);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.cleanUpResizeObserver();

    const bodyEl = this.bodyZoneRef?.nativeElement;
    if (!bodyEl) return;

    const targetEl = findRealContentContainer(bodyEl);
    if (!targetEl) return;

    this.lastObservedScrollHeight = targetEl.scrollHeight || 0;

    this.resizeObserver = new ResizeObserver(() => {
      // 드래그 중이거나 수동 조작 후, 또는 프로그래밍 방식으로 높이 적용 중인 경우 스킵
      if (this.isDragging() || this.isApplyingHeight) return;
      if (this.hasUserAdjustedSnap() || this.initialSnap() !== null) return;

      // 내용물의 scrollHeight가 실질적으로 변경되지 않았다면
      // (부모 드로어의 리사이즈로 인한 단순 이벤트) 무시하여 무한 하향 축소 루프 차단
      const currentScrollHeight = targetEl.scrollHeight || 0;
      if (Math.abs(currentScrollHeight - this.lastObservedScrollHeight) < 8) {
        return;
      }

      this.lastObservedScrollHeight = currentScrollHeight;
      this.measureAndApplyContentHeight();
    });

    this.resizeObserver.observe(targetEl);
  }

  private cleanUpResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.heightApplyTimeout) {
      clearTimeout(this.heightApplyTimeout);
      this.heightApplyTimeout = null;
    }
    this.isApplyingHeight = false;
  }

  private resetState(): void {
    if (this.openingTimeout) {
      clearTimeout(this.openingTimeout);
      this.openingTimeout = null;
    }
    this.isOpening.set(false);
    this.measureScheduled = false;
    this.snapState.set(this.initialSnap() ?? 'standard');
    this.currentHeightPx.set(null);
    this.isDragging.set(false);
    this.dragTranslateY.set(0);
    this.hasUserAdjustedSnap.set(false);
    this.measuredContentHeight.set(null);
    this.lastObservedScrollHeight = 0;
    this.cleanUpResizeObserver();
    this.cleanUpListeners();
  }

  private cleanUpListeners(): void {
    if (this.rafDragId !== null) {
      cancelAnimationFrame(this.rafDragId);
      this.rafDragId = null;
    }
    if (this.document) {
      this.document.body.style.userSelect = '';
      this.document.body.style.webkitUserSelect = '';
    }
    if (this.removeListeners) {
      this.removeListeners();
      this.removeListeners = null;
    }
  }
}
