import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';

const KEYBOARD_STEP = 16;

/**
 * 패널 폭을 끌어서 조절하는 세로 손잡이.
 *
 * 패널의 가장자리에 절대 위치로 놓인다(부모는 `position`이 static이 아니어야 한다).
 * 폭을 스스로 저장하지 않고 `valueChange`로 알리기만 한다. 키보드(←/→, Home), 더블클릭(기본값 복원)을 지원한다.
 */
@Component({
  selector: 'lw-resize-handle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lw-resize-handle.component.html',
  host: {
    role: 'separator',
    tabindex: '0',
    'aria-orientation': 'vertical',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[class.lw-resize-handle--start]': "edge() === 'start'",
    '[class.lw-resize-handle--end]': "edge() === 'end'",
    '[class.lw-resize-handle--dragging]': 'dragging()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
    '(keydown)': 'onKeydown($event)',
    '(dblclick)': 'reset.emit()',
  },
  styleUrl: './lw-resize-handle.component.scss',
})
export class LwResizeHandleComponent {
  /** 현재 폭(px) */
  readonly value = input.required<number>();
  readonly min = input(240);
  readonly max = input(640);
  /** 손잡이가 붙는 쪽. 패널의 오른쪽 가장자리면 `end`(오른쪽으로 끌면 넓어짐), 왼쪽 가장자리면 `start`. */
  readonly edge = input<'start' | 'end'>('end');
  readonly label = input('패널 폭 조절');

  readonly valueChange = output<number>();
  /** 더블클릭 또는 Home: 기본 폭으로 되돌리기 */
  readonly reset = output<void>();
  readonly draggingChange = output<boolean>();

  protected readonly dragging = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private origin: { readonly x: number; readonly value: number } | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.origin = { x: event.clientX, value: this.value() };
    this.host.setPointerCapture?.(event.pointerId);
    this.setDragging(true);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.origin) return;
    const delta = event.clientX - this.origin.x;
    this.emitClamped(this.origin.value + (this.edge() === 'end' ? delta : -delta));
  }

  protected onPointerEnd(event: PointerEvent): void {
    if (!this.origin) return;
    this.origin = null;
    this.host.releasePointerCapture?.(event.pointerId);
    this.setDragging(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const grow = this.edge() === 'end' ? 'ArrowRight' : 'ArrowLeft';
    const shrink = this.edge() === 'end' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === grow) this.emitClamped(this.value() + KEYBOARD_STEP);
    else if (event.key === shrink) this.emitClamped(this.value() - KEYBOARD_STEP);
    else if (event.key === 'Home') this.reset.emit();
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  private emitClamped(next: number): void {
    const clamped = Math.round(Math.min(this.max(), Math.max(this.min(), next)));
    if (clamped !== this.value()) this.valueChange.emit(clamped);
  }

  private setDragging(next: boolean): void {
    this.dragging.set(next);
    this.draggingChange.emit(next);
  }
}
