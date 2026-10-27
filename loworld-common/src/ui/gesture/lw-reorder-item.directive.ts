import { Directive, ElementRef, OnDestroy, inject, input, output } from '@angular/core';

export interface LwReorderEvent {
  readonly previousIndex: number;
  readonly currentIndex: number;
}

/** 마우스는 이만큼(px) 움직이면 끌기를 시작한다 */
const MOUSE_START_DISTANCE = 6;
/** 터치는 이 시간(ms) 동안 누르고 있으면 끌기를 시작한다. 그 전에 움직이면 스크롤로 본다. */
const TOUCH_HOLD_MS = 350;
const TOUCH_HOLD_TOLERANCE = 8;
/** 여기서 시작한 포인터는 끌기로 보지 않는다(안의 버튼·입력이 그대로 동작하도록). */
const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, lw-button, [contenteditable="true"], [data-lw-reorder-ignore]';

/**
 * 목록 항목의 순서 바꾸기. HTML `draggable`과 달리 포인터 이벤트로 동작해서 터치에서도 쓸 수 있다.
 *
 * 같은 `lwReorderGroup` 안의 다른 항목 위에 놓으면 `lwReorder`로 `{ previousIndex, currentIndex }`를 알린다.
 * 순서를 실제로 바꾸는 일은 받는 쪽이 한다.
 *
 * ```html
 * @for (item of items(); track item.id; let i = $index) {
 *   <li [lwReorderItem]="i" lwReorderGroup="steps" (lwReorder)="move($event)">…</li>
 * }
 * ```
 */
@Directive({
  selector: '[lwReorderItem]',
  standalone: true,
  host: {
    '[attr.data-lw-reorder-index]': 'lwReorderItem()',
    '[attr.data-lw-reorder-group]': 'lwReorderGroup()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'cancel()',
  },
})
export class LwReorderItemDirective implements OnDestroy {
  /** 이 항목의 현재 순서 */
  readonly lwReorderItem = input.required<number>();
  readonly lwReorderGroup = input('default');
  readonly lwReorderDisabled = input(false);

  readonly lwReorder = output<LwReorderEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private origin: { readonly x: number; readonly y: number; readonly pointerId: number } | null = null;
  private active = false;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private overEl: HTMLElement | null = null;
  private previousInlineStyle: { transform: string; pointerEvents: string; zIndex: string; transition: string } | null = null;

  // 끌기가 시작된 뒤에는 터치 스크롤을 막는다. passive가 아니어야 preventDefault가 듣는다.
  private readonly onTouchMove = (event: TouchEvent): void => {
    if (this.active && event.cancelable) event.preventDefault();
  };

  // 끌기를 끝낸 직후의 클릭은 항목 선택으로 넘어가지 않게 한다.
  private readonly swallowClick = (event: MouseEvent): void => {
    event.stopPropagation();
    event.preventDefault();
  };

  constructor() {
    this.host.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.lwReorderDisabled() || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) return;

    this.origin = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    if (event.pointerType !== 'mouse') {
      this.holdTimer = setTimeout(() => {
        this.holdTimer = null;
        this.start();
      }, TOUCH_HOLD_MS);
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.origin || event.pointerId !== this.origin.pointerId) return;
    const dx = event.clientX - this.origin.x;
    const dy = event.clientY - this.origin.y;

    if (!this.active) {
      const distance = Math.hypot(dx, dy);
      if (event.pointerType === 'mouse') {
        if (distance >= MOUSE_START_DISTANCE) this.start();
      } else if (distance > TOUCH_HOLD_TOLERANCE) {
        this.cancel();
      }
      if (!this.active) return;
    }

    this.host.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    this.setOver(this.itemAt(event.clientX, event.clientY));
    event.preventDefault();
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.origin || event.pointerId !== this.origin.pointerId) return;
    const wasActive = this.active;
    const dropTarget = wasActive ? this.itemAt(event.clientX, event.clientY) : null;
    this.cancel();
    if (!wasActive) return;

    this.host.addEventListener('click', this.swallowClick, { capture: true, once: true });
    setTimeout(() => this.host.removeEventListener('click', this.swallowClick, { capture: true }), 0);

    const currentIndex = Number(dropTarget?.dataset['lwReorderIndex']);
    const previousIndex = this.lwReorderItem();
    if (dropTarget && Number.isInteger(currentIndex) && currentIndex !== previousIndex) {
      this.lwReorder.emit({ previousIndex, currentIndex });
    }
  }

  /** 끌기를 끝내고 모양을 되돌린다. */
  protected cancel(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
    if (this.active && this.origin) this.host.releasePointerCapture?.(this.origin.pointerId);
    if (this.previousInlineStyle) {
      Object.assign(this.host.style, this.previousInlineStyle);
      this.previousInlineStyle = null;
    }
    this.host.classList.remove('lw-reorder-item--dragging');
    this.setOver(null);
    this.active = false;
    this.origin = null;
  }

  private start(): void {
    if (!this.origin || this.active) return;
    this.active = true;
    const { transform, pointerEvents, zIndex, transition } = this.host.style;
    this.previousInlineStyle = { transform, pointerEvents, zIndex, transition };
    this.host.setPointerCapture?.(this.origin.pointerId);
    this.host.classList.add('lw-reorder-item--dragging');
    // 끄는 항목이 포인터 아래의 놓을 자리를 가리지 않게 한다.
    this.host.style.pointerEvents = 'none';
    this.host.style.zIndex = '10';
    this.host.style.transition = 'none';
  }

  private itemAt(x: number, y: number): HTMLElement | null {
    const hit = this.host.ownerDocument.elementFromPoint(x, y) as HTMLElement | null;
    const item = hit?.closest<HTMLElement>('[data-lw-reorder-index]') ?? null;
    if (!item || item === this.host || item.dataset['lwReorderGroup'] !== this.lwReorderGroup()) return null;
    return item;
  }

  private setOver(next: HTMLElement | null): void {
    if (this.overEl === next) return;
    this.overEl?.classList.remove('lw-reorder-item--over');
    next?.classList.add('lw-reorder-item--over');
    this.overEl = next;
  }

  ngOnDestroy(): void {
    this.cancel();
    this.host.removeEventListener('touchmove', this.onTouchMove);
  }
}
