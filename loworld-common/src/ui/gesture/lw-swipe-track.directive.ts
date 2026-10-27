import { Directive, ElementRef, DestroyRef, NgZone, inject, input, model, output, signal, OnInit, OnDestroy } from '@angular/core';
import { type ILwSwipeStrategy } from '../../services/gesture/swipe-strategy.contract';
import { LwItemSwipeStrategy } from '../../services/gesture/strategies/item-swipe.strategy';
import { LwPageSwipeStrategy } from '../../services/gesture/strategies/page-swipe.strategy';
import { WINDOW } from '../../services/tokens/window.token';

/**
 * [LoworldUI Primitives] 범용 스와이프 트랙 지시자 (`LwSwipeTrackDirective`)
 *
 * SOLID 원칙 준수:
 * - SRP: 가로 스와이프 제스처(마우스 Grab&Drag, 모바일 터치, 스크롤 스냅, 인덱스 동기화)만 전담.
 * - OCP: `ILwSwipeStrategy` 전략 패턴을 통해 카드 단위('item')와 전폭 페이지 단위('page')를 무수정 교체 지원.
 * - LSP: 어떤 스와이프 모드에서도 `prev()`, `next()`, `goTo()`, `shouldSuppressClick()` 일관 동작.
 * - ISP: 불필요한 도트/버튼 의존성 없이 순수 제스처 트랙 인터페이스만 제공.
 * - DIP: 고수준 컴포넌트가 브라우저 DOM 이벤트에 직접 결합되지 않고 지시자 API에만 의존.
 */
@Directive({
  selector: '[lwSwipeTrack]',
  standalone: true,
  exportAs: 'lwSwipe',
})
export class LwSwipeTrackDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly win = inject(WINDOW, { optional: true });

  // ── 인풋 프로퍼티 ──
  /** 스와이프 모드 ('item': 카드/아이템 너비 단위, 'page': 전폭 100% 뷰어 단위) */
  readonly swipeMode = input<'item' | 'page'>('item');

  /** CSS Scroll Snap 모드 ('mandatory': 필수 스냅, 'proximity': 근접 스냅, 'none': 자유 가로 스크롤) */
  readonly scrollSnapMode = input<'mandatory' | 'proximity' | 'none'>('mandatory');

  /** 아이템 모드일 때 개별 자식 요소를 선택하는 CSS 셀렉터 */
  readonly itemSelector = input<string>(':scope > *');

  /** 데스크톱 마우스 Grab & Drag 활성화 여부 */
  readonly enableMouseDrag = input<boolean>(true);

  /** 모바일 터치 스와이프 제스처 활성화 여부 */
  readonly enableTouch = input<boolean>(true);

  /** 데스크톱 마우스 휠(세로 휠의 가로 변환) 활성화 여부 */
  readonly enableWheel = input<boolean>(true);

  /**
   * 페이지 모드에서 옆 페이지로 넘어간다고 볼 최소 이동 거리 (기본 20px).
   * 이만큼 빠르게 밀었거나 페이지 폭의 1/5 넘게 끌었으면 넘기고, 아니면 제자리로 돌아온다.
   */
  readonly thresholdPx = input<number>(20);

  // ── 모델 & 아웃풋 ──
  /** 현재 활성화된 아이템/페이지 인덱스 (양방향 바인딩 지원) */
  readonly activeIndex = model<number>(0);

  /** 현재 마우스/터치 드래그 중인지 여부 */
  readonly isDragging = output<boolean>();

  // ── 내부 상태 ──
  private strategy!: ILwSwipeStrategy;
  private dragStartX = 0;
  private dragStartY = 0;
  private scrollLeftStart = 0;
  private totalDragMoved = 0;
  private isHorizontalIntent = false;
  private _isDraggingState = signal<boolean>(false);
  private scrollDebounceTimer: any = null;
  private _suppressNextClick = false;
  private dragStartIndex = 0;
  private dragStartTime = 0;
  private resizeObserver: ResizeObserver | null = null;

  private get isPageMode(): boolean {
    return this.swipeMode() === 'page';
  }

  get isDraggingActive(): boolean {
    return this._isDraggingState();
  }

  get nativeElement(): HTMLElement {
    return this.el.nativeElement;
  }

  ngOnInit(): void {
    const track = this.el.nativeElement;
    this.strategy =
      this.swipeMode() === 'page'
        ? new LwPageSwipeStrategy()
        : new LwItemSwipeStrategy(this.itemSelector());

    this._applyDefaultTrackStyles(track);
    this.ngZone.runOutsideAngular(() => {
      this._bindEvents(track);
      // 페이지 모드는 폭이 바뀌면(화면 회전, 창 크기 조절) 지금 페이지의 왼쪽 끝에 다시 맞춘다.
      if (this.isPageMode && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this._alignToActivePage());
        this.resizeObserver.observe(track);
      }
    });

    // 컴포넌트 소멸 시 전역 리스너 자동 정리 (DestroyRef)
    this.destroyRef.onDestroy(() => {
      this._cleanup();
    });
  }

  ngOnDestroy(): void {
    this._cleanup();
  }

  // ── 공개 제어 API ──

  /** 특정 픽셀만큼 가로 스크롤 이동 */
  scrollBy(deltaX: number, smooth = true): void {
    this.el.nativeElement.scrollBy({ left: deltaX, behavior: smooth ? 'smooth' : 'auto' });
  }

  /** 다음 아이템/페이지로 스무스 이동 */
  next(event?: Event): void {
    event?.stopPropagation();
    const track = this.el.nativeElement;
    const res = this.strategy.calculateNext(track.scrollLeft, track, this.activeIndex());
    track.scrollTo({ left: res.targetScrollLeft, behavior: 'smooth' });
    this.activeIndex.set(res.newIndex);
  }

  /** 이전 아이템/페이지로 스무스 이동 */
  prev(event?: Event): void {
    event?.stopPropagation();
    const track = this.el.nativeElement;
    const res = this.strategy.calculatePrev(track.scrollLeft, track, this.activeIndex());
    track.scrollTo({ left: res.targetScrollLeft, behavior: 'smooth' });
    this.activeIndex.set(res.newIndex);
  }

  /** 특정 목표 인덱스로 스무스 이동 */
  goTo(index: number, event?: Event): void {
    event?.stopPropagation();
    const track = this.el.nativeElement;
    const targetLeft = this.strategy.calculateScrollToIndex(index, track);
    track.scrollTo({ left: targetLeft, behavior: 'smooth' });
    this.activeIndex.set(index);
  }

  /**
   * 드래그 조작 직후 자식 카드의 클릭 이벤트가 오발동되지 않도록 확인하는 가드
   * @returns 드래그로 6px 이상 이동했으면 true (클릭 취소 대상)
   */
  shouldSuppressClick(): boolean {
    const suppressed = this.totalDragMoved > 6;
    if (suppressed) {
      this.totalDragMoved = 0;
    }
    return suppressed;
  }

  // ── 내부 이벤트 및 제스처 엔진 ──

  private _resolveScrollSnapType(): string {
    // 페이지 모드는 손을 뗀 뒤 어느 페이지에 설지 직접 정한다(_settleToPage).
    if (this.isPageMode) return 'none';
    const mode = this.scrollSnapMode();
    if (mode === 'none') return 'none';
    if (mode === 'proximity') return 'x proximity';
    return 'x mandatory';
  }

  private _applyDefaultTrackStyles(track: HTMLElement): void {
    if (!track.style.position) {
      track.style.position = 'relative';
    }
    track.style.display = 'flex';
    track.style.flexDirection = 'row';
    track.style.flexWrap = 'nowrap';
    track.style.overflowX = 'auto';
    track.style.overflowY = 'hidden';
    track.style.scrollSnapType = this._resolveScrollSnapType();
    track.style.scrollBehavior = 'smooth';
    track.style.boxSizing = 'border-box';
    if (this.isPageMode) {
      // 가로 끌기는 지시자가 받고, 세로 스크롤은 브라우저에 맡긴다.
      track.style.touchAction = 'pan-y';
      track.style.overscrollBehaviorX = 'contain';
      track.style.scrollbarWidth = 'none';
    }
    track.style.cursor = 'grab';
    track.style.userSelect = 'none';
    (track.style as any).webkitUserSelect = 'none';
    (track.style as any).webkitUserDrag = 'none';
    (track.style as any).userDrag = 'none';
  }

  private _bindEvents(track: HTMLElement): void {
    // 1. 네이티브 Scroll 감지 -> activeIndex 동기화
    track.addEventListener('scroll', this._onTrackScroll, { passive: true });

    // 2. 마우스 다운 바인딩
    track.addEventListener('mousedown', this._onMouseDown);

    // 3. 모바일 터치 제스처 바인딩
    track.addEventListener('touchstart', this._onTouchStart, { passive: true });
    track.addEventListener('touchmove', this._onTouchMove, { passive: false });
    track.addEventListener('touchend', this._onTouchEnd, { passive: true });
    track.addEventListener('touchcancel', this._onTouchEnd, { passive: true });

    // 4. 캡처 단계 클릭 억제자 바인딩 (드래그 직후 자식 카드의 오발동 클릭 원천 차단)
    track.addEventListener('click', this._onCaptureClick, { capture: true });

    // 5. 마우스 휠 바인딩 (가로 스크롤 변환 지원)
    track.addEventListener('wheel', this._onWheel, { passive: false });

    // 6. 브라우저 기본 HTML5 Drag & Drop 원천 차단 (이미지 고스트 드래그 방지)
    track.addEventListener('dragstart', this._onDragStart);
  }

  _handleDragStart(e: DragEvent): void {
    e.preventDefault();
  }

  private readonly _onDragStart = (e: DragEvent): void => this._handleDragStart(e);

  _handleWheel(e: WheelEvent): void {
    if (!this.enableWheel()) return;
    const track = this.el.nativeElement;
    if (!track) return;

    // 페이지 모드에서는 세로 휠을 가로로 바꾸지 않는다. 페이지 안의 세로 스크롤이 먼저다.
    if (this.isPageMode) return;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 2) {
      track.scrollLeft += e.deltaY;
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }

  private readonly _onWheel = (e: WheelEvent): void => this._handleWheel(e);

  private _onCaptureClick = (e: MouseEvent): void => {
    if (this._suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this._suppressNextClick = false;
    }
  };

  private _onTrackScroll = (): void => {
    if (this._isDraggingState()) return;

    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
    }
    this.scrollDebounceTimer = setTimeout(() => {
      if (this.isPageMode) {
        // 트랙패드 등으로 페이지 사이에 멈췄으면 가까운 페이지에 세운다.
        const track = this.el.nativeElement;
        this._settleToPage(this.strategy.calculateIndexFromScroll(track.scrollLeft, track));
        return;
      }
      if (this.scrollSnapMode() !== 'none') {
        const track = this.el.nativeElement;
        const detectedIndex = this.strategy.calculateIndexFromScroll(track.scrollLeft, track);
        if (detectedIndex !== this.activeIndex()) {
          this.ngZone.run(() => {
            this.activeIndex.set(detectedIndex);
          });
        }
      }
    }, this.isPageMode ? 120 : 50);
  };

  private _onMouseDown = (e: MouseEvent): void => {
    if (!this.enableMouseDrag() || e.button !== 0) return;

    // 텍스트 입력 필드(input, textarea, select)만 드래그 시작 억제 (카드/버튼은 드래그 허용 후 클릭 억제)
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select')) {
      return;
    }

    const track = this.el.nativeElement;
    this._setDragging(true);
    this.dragStartX = e.pageX - track.offsetLeft;
    this.scrollLeftStart = track.scrollLeft;
    this.totalDragMoved = 0;
    this._markDragStart();

    if (this.win) {
      this.ngZone.runOutsideAngular(() => {
        this.win?.addEventListener('mousemove', this._onGlobalMouseMove);
        this.win?.addEventListener('mouseup', this._onGlobalMouseUp);
      });
    }
  };

  private _onGlobalMouseMove = (e: MouseEvent): void => {
    if (!this._isDraggingState()) return;
    const track = this.el.nativeElement;

    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    // 페이지 모드는 손가락(포인터)을 그대로 따라간다.
    const walk = (x - this.dragStartX) * (this.isPageMode ? 1 : 1.5);
    track.scrollLeft = this.scrollLeftStart - walk;
    this.totalDragMoved = Math.abs(walk);
  };

  private _onGlobalMouseUp = (): void => {
    if (this._isDraggingState()) {
      this._setDragging(false);
      if (this.win) {
        this.win.removeEventListener('mousemove', this._onGlobalMouseMove);
        this.win.removeEventListener('mouseup', this._onGlobalMouseUp);
      }

      // 드래그 거리 6px 초과 시 직후 발생하는 브라우저 click 이벤트 무효화
      if (this.totalDragMoved > 6) {
        this._suppressNextClick = true;
        setTimeout(() => {
          this._suppressNextClick = false;
        }, 80);
      }

      if (this.isPageMode) {
        this._settleAfterDrag();
        return;
      }

      // 드래그 종료 후 가장 가까운 스냅 지점으로 자동 갱신 (스냅 활성 모드일 때만)
      if (this.scrollSnapMode() !== 'none') {
        const track = this.el.nativeElement;
        const detectedIndex = this.strategy.calculateIndexFromScroll(track.scrollLeft, track);
        if (detectedIndex !== this.activeIndex()) {
          this.ngZone.run(() => {
            this.activeIndex.set(detectedIndex);
          });
        }
      }
    }
  };

  private _onTouchStart = (e: TouchEvent): void => {
    if (!this.enableTouch() || e.touches.length !== 1) return;

    const track = this.el.nativeElement;
    this._setDragging(true);
    this.dragStartX = e.touches[0].clientX;
    this.dragStartY = e.touches[0].clientY;
    this.scrollLeftStart = track.scrollLeft;
    this.totalDragMoved = 0;
    this.isHorizontalIntent = false;
    this._markDragStart();
  };

  private _onTouchMove = (e: TouchEvent): void => {
    if (!this._isDraggingState() || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - this.dragStartX;
    const deltaY = currentY - this.dragStartY;

    if (!this.isHorizontalIntent) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        this.isHorizontalIntent = true;
      }
    }

    if (this.isHorizontalIntent) {
      if (e.cancelable) {
        e.preventDefault();
      }
      this.totalDragMoved = Math.abs(deltaX);
      const track = this.el.nativeElement;
      track.scrollLeft = this.scrollLeftStart - deltaX;
    }
  };

  private _onTouchEnd = (): void => {
    if (this._isDraggingState()) {
      this._setDragging(false);

      if (this.totalDragMoved > 6) {
        this._suppressNextClick = true;
        setTimeout(() => {
          this._suppressNextClick = false;
        }, 80);
      }

      if (this.isPageMode) {
        this._settleAfterDrag();
        return;
      }

      if (this.scrollSnapMode() !== 'none') {
        const track = this.el.nativeElement;
        const detectedIndex = this.strategy.calculateIndexFromScroll(track.scrollLeft, track);
        if (detectedIndex !== this.activeIndex()) {
          this.ngZone.run(() => {
            this.activeIndex.set(detectedIndex);
          });
        }
      }
    }
  };

  private _markDragStart(): void {
    this.dragStartIndex = this.activeIndex();
    this.dragStartTime = Date.now();
  }

  /**
   * 페이지 모드에서 손을 뗐을 때: 끈 방향과 거리·빠르기를 보고 옆 페이지로 넘기거나 제자리로 돌린다.
   * 한 번에 한 페이지만 넘어간다.
   */
  private _settleAfterDrag(): void {
    const track = this.el.nativeElement;
    const moved = track.scrollLeft - this.scrollLeftStart;
    const distance = Math.abs(moved);
    const elapsed = Math.max(1, Date.now() - this.dragStartTime);
    const isFlick = distance >= this.thresholdPx() && distance / elapsed > 0.3;
    const isFarEnough = distance > track.clientWidth / 5;
    const step = isFlick || isFarEnough ? Math.sign(moved) : 0;
    this._settleToPage(this.dragStartIndex + step);
  }

  private _settleToPage(index: number): void {
    const track = this.el.nativeElement;
    const targetLeft = this.strategy.calculateScrollToIndex(index, track);
    const targetIndex = this.strategy.calculateIndexFromScroll(targetLeft, track);
    if (Math.abs(track.scrollLeft - targetLeft) > 1) {
      track.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
    if (targetIndex !== this.activeIndex()) {
      this.ngZone.run(() => this.activeIndex.set(targetIndex));
    }
  }

  private _alignToActivePage(): void {
    if (this._isDraggingState()) return;
    const track = this.el.nativeElement;
    const targetLeft = this.strategy.calculateScrollToIndex(this.activeIndex(), track);
    if (Math.abs(track.scrollLeft - targetLeft) > 1) {
      track.scrollTo({ left: targetLeft, behavior: 'instant' });
    }
  }

  private _setDragging(val: boolean): void {
    this.ngZone.run(() => {
      this._isDraggingState.set(val);
      this.isDragging.emit(val);
    });

    const track = this.el.nativeElement;
    if (val) {
      track.classList.add('is-dragging', 'lw-swipe-track--dragging');
      track.style.cursor = 'grabbing';
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
    } else {
      track.classList.remove('is-dragging', 'lw-swipe-track--dragging');
      track.style.cursor = 'grab';
      track.style.scrollSnapType = this._resolveScrollSnapType();
      track.style.scrollBehavior = 'smooth';
    }
  }

  private _cleanup(): void {
    const track = this.el.nativeElement;
    track.removeEventListener('scroll', this._onTrackScroll);
    track.removeEventListener('mousedown', this._onMouseDown);
    track.removeEventListener('touchstart', this._onTouchStart);
    track.removeEventListener('touchmove', this._onTouchMove);
    track.removeEventListener('touchend', this._onTouchEnd);
    track.removeEventListener('touchcancel', this._onTouchEnd);
    track.removeEventListener('click', this._onCaptureClick, { capture: true } as any);
    track.removeEventListener('wheel', this._onWheel);
    track.removeEventListener('dragstart', this._onDragStart);

    if (this.win) {
      this.win.removeEventListener('mousemove', this._onGlobalMouseMove);
      this.win.removeEventListener('mouseup', this._onGlobalMouseUp);
    }

    if (this.scrollDebounceTimer) {
      clearTimeout(this.scrollDebounceTimer);
      this.scrollDebounceTimer = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}
