import { ChangeDetectionStrategy, Component, forwardRef, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { LwTextareaResize, LwTextareaSize, LwTextareaVariant } from './textarea.types';

@Component({
  selector: 'lw-textarea',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LwTextareaComponent),
      multi: true,
    },
  ],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-textarea-host',
    '[class.lw-textarea--disabled]': 'disabled()',
    '[class.lw-textarea--focused]': 'isFocused()',
    '[class.lw-textarea--sm]': 'size() === "sm"',
    '[class.lw-textarea--md]': 'size() === "md"',
    '[class.lw-textarea--lg]': 'size() === "lg"',
    '[class.lw-textarea--variant-default]': 'variant() === "default"',
    '[class.lw-textarea--variant-filled]': 'variant() === "filled"',
    '[class.lw-textarea--variant-outline]': 'variant() === "outline"',
  },
})
export class LwTextareaComponent implements ControlValueAccessor {
  /** 양방향 텍스트 모델 */
  readonly value = model<string>('');

  /** 플레이스홀더 */
  readonly placeholder = input<string>('');

  /** 기본 행 수 */
  readonly rows = input<number>(3);

  /** 최대 글자 수 */
  readonly maxlength = input<number | null>(null);

  /** 글자 수 카운터 표시 여부 */
  readonly showCount = input<boolean>(false);

  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);

  /** 읽기 전용 여부 */
  readonly readonly = input<boolean>(false);

  /** 크기 */
  readonly size = input<LwTextareaSize>('md');

  /** 디자인 변형 */
  readonly variant = input<LwTextareaVariant>('default');

  /** 리사이즈 옵션: 'none' | 'vertical' | 'both' */
  readonly resize = input<LwTextareaResize>('vertical');

  /** 접근성 라벨 */
  readonly ariaLabel = input<string>('다중행 입력');

  /** 포커스 변경 이벤트 */
  readonly focusChange = output<boolean>();

  protected readonly isFocused = signal<boolean>(false);

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value.set(val !== undefined && val !== null ? String(val) : '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Disabled handled via input
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.focusChange.emit(false);
    this.onTouched();
  }
}
