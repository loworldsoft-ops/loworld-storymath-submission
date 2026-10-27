import { Directive, ElementRef, HostListener, OnDestroy, inject, input } from '@angular/core';
import { LwTooltipService } from './tooltip.service';
import type { LwTooltipPlacement, LwTooltipVariant, LwTooltipSize } from '../../../services/tokens/tooltip.tokens';

/** 길게 누르기로 판정하는 시간(ms) */
const LONG_PRESS_MS = 450;
/** 길게 눌러 연 툴팁을 손을 뗀 뒤에도 보여 주는 시간(ms) */
const LONG_PRESS_LINGER_MS = 1800;
/** 이만큼(px) 움직이면 스크롤로 보고 길게 누르기를 취소한다 */
const LONG_PRESS_MOVE_TOLERANCE = 10;

@Directive({
  selector: '[lwTooltip]',
  standalone: true,
})
export class LwTooltipDirective implements OnDestroy {
  readonly lwTooltip = input<string | null>(null);
  readonly lwTooltipTitle = input<string | null>(null);
  readonly lwTooltipPlacement = input<LwTooltipPlacement>('top');
  readonly lwTooltipVariant = input<LwTooltipVariant>('dark');
  readonly lwTooltipSize = input<LwTooltipSize>('md');
  readonly lwTooltipDelay = input<number>(150);
  readonly lwTooltipDisabled = input<boolean>(false);
  readonly lwTooltipArrow = input<boolean>(true);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly tooltipService = inject(LwTooltipService);

  private showTimeoutId: any = null;
  private longPressTimeoutId: any = null;
  private lingerTimeoutId: any = null;
  private touchOrigin: { x: number; y: number } | null = null;

  // 터치에는 호버가 없으므로 길게 누르면 툴팁을 연다. 스크롤을 막지 않도록 passive로 듣는다.
  private readonly onTouchStart = (event: TouchEvent): void => {
    if (this.lwTooltipDisabled() || !this.lwTooltip()) return;
    const touch = event.touches[0];
    if (!touch) return;
    this.clearTimeouts();
    this.touchOrigin = { x: touch.clientX, y: touch.clientY };
    this.longPressTimeoutId = setTimeout(() => {
      this.longPressTimeoutId = null;
      this.show();
    }, LONG_PRESS_MS);
  };

  private readonly onTouchMove = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch || !this.touchOrigin || this.longPressTimeoutId === null) return;
    const moved = Math.hypot(touch.clientX - this.touchOrigin.x, touch.clientY - this.touchOrigin.y);
    if (moved > LONG_PRESS_MOVE_TOLERANCE) this.clearLongPress();
  };

  private readonly onTouchEnd = (): void => {
    const opened = this.touchOrigin !== null && this.longPressTimeoutId === null;
    this.clearLongPress();
    if (!opened) return;
    this.lingerTimeoutId = setTimeout(() => {
      this.lingerTimeoutId = null;
      this.tooltipService.hide(this.elementRef.nativeElement);
    }, LONG_PRESS_LINGER_MS);
  };

  constructor() {
    const el = this.elementRef.nativeElement as HTMLElement;
    el.addEventListener('touchstart', this.onTouchStart, { passive: true });
    el.addEventListener('touchmove', this.onTouchMove, { passive: true });
    el.addEventListener('touchend', this.onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
  }

  @HostListener('mouseenter')
  @HostListener('focusin')
  onMouseEnter(): void {
    if (this.lwTooltipDisabled() || !this.lwTooltip()) {
      return;
    }
    this.clearTimeouts();
    const delay = this.lwTooltipDelay();
    if (delay <= 0) {
      this.show();
    } else {
      this.showTimeoutId = setTimeout(() => this.show(), delay);
    }
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onMouseLeave(): void {
    this.clearTimeouts();
    this.tooltipService.hide(this.elementRef.nativeElement);
  }

  private show(): void {
    const text = this.lwTooltip();
    if (!text || this.lwTooltipDisabled()) return;

    this.tooltipService.show({
      content: text,
      title: this.lwTooltipTitle() || undefined,
      targetEl: this.elementRef.nativeElement,
      placement: this.lwTooltipPlacement(),
      variant: this.lwTooltipVariant(),
      size: this.lwTooltipSize(),
      arrow: this.lwTooltipArrow(),
    });
  }

  private clearTimeouts(): void {
    if (this.showTimeoutId) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }
    if (this.lingerTimeoutId) {
      clearTimeout(this.lingerTimeoutId);
      this.lingerTimeoutId = null;
    }
    this.clearLongPress();
  }

  private clearLongPress(): void {
    if (this.longPressTimeoutId) {
      clearTimeout(this.longPressTimeoutId);
      this.longPressTimeoutId = null;
    }
    this.touchOrigin = null;
  }

  ngOnDestroy(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    el.removeEventListener('touchstart', this.onTouchStart);
    el.removeEventListener('touchmove', this.onTouchMove);
    el.removeEventListener('touchend', this.onTouchEnd);
    el.removeEventListener('touchcancel', this.onTouchEnd);
    this.clearTimeouts();
    this.tooltipService.hide(this.elementRef.nativeElement);
  }
}
