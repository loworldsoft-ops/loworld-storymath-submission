import { ChangeDetectionStrategy, Component, forwardRef, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { LwCheckboxSize, LwCheckboxVariant } from './checkbox.types';

@Component({
  selector: 'lw-checkbox',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LwCheckboxComponent),
      multi: true,
    },
  ],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-checkbox-host',
    '[class.lw-checkbox--checked]': 'checked()',
    '[class.lw-checkbox--disabled]': 'disabled()',
    '[class.lw-checkbox--indeterminate]': 'indeterminate()',
    '[class.lw-checkbox--focused]': 'isFocused()',
    '[class.lw-checkbox--sm]': 'size() === "sm"',
    '[class.lw-checkbox--md]': 'size() === "md"',
    '[class.lw-checkbox--lg]': 'size() === "lg"',
    '[class.lw-checkbox--variant-primary]': 'variant() === "primary"',
    '[class.lw-checkbox--variant-accent]': 'variant() === "accent"',
    '[class.lw-checkbox--variant-secondary]': 'variant() === "secondary"',
  },
})
export class LwCheckboxComponent implements ControlValueAccessor {
  /** 체크 여부 양방향 모델 */
  readonly checked = model<boolean>(false);

  /** 라벨 텍스트 */
  readonly label = input<string>('');

  /** 미확정(중간) 상태 */
  readonly indeterminate = input<boolean>(false);

  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);

  /** 크기 */
  readonly size = input<LwCheckboxSize>('md');

  /** 색상 변형 */
  readonly variant = input<LwCheckboxVariant>('primary');

  /** 접근성 라벨 */
  readonly ariaLabel = input<string>('');

  protected readonly isFocused = signal<boolean>(false);

  private onChange: (val: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.checked.set(Boolean(val));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Disabled state handled via input
  }

  protected toggleChecked(event: Event): void {
    if (this.disabled()) return;
    event.stopPropagation();
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
  }

  protected onNativeChange(event: Event): void {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    this.checked.set(isChecked);
    this.onChange(isChecked);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }
}
