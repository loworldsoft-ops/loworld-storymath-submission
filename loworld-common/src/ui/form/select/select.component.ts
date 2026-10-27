import { ChangeDetectionStrategy, Component, forwardRef, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { LwSelectOption, LwSelectSize, LwSelectVariant } from './select.types';

@Component({
  selector: 'lw-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LwSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-select-host',
    '[class.lw-select--disabled]': 'disabled()',
    '[class.lw-select--focused]': 'isFocused()',
    '[class.lw-select--sm]': 'size() === "sm"',
    '[class.lw-select--md]': 'size() === "md"',
    '[class.lw-select--lg]': 'size() === "lg"',
    '[class.lw-select--variant-default]': 'variant() === "default"',
    '[class.lw-select--variant-filled]': 'variant() === "filled"',
    '[class.lw-select--variant-outline]': 'variant() === "outline"',
  },
})
export class LwSelectComponent implements ControlValueAccessor {
  /** 양방향 선택 값 */
  readonly value = model<any>(null);

  /** 옵션 항목 리스트 (입력 데이터) */
  readonly options = input<LwSelectOption[]>([]);

  /** 플레이스홀더 */
  readonly placeholder = input<string>('선택하세요');

  /** 크기 */
  readonly size = input<LwSelectSize>('md');

  /** 디자인 변형 */
  readonly variant = input<LwSelectVariant>('default');

  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);

  /** 접근성 라벨 */
  readonly ariaLabel = input<string>('선택 상자');

  /** 값 변경 이벤트 */
  readonly selectChange = output<any>();

  protected readonly isFocused = signal<boolean>(false);

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value.set(val !== undefined ? val : null);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Disabled handled via input or reactive forms
  }

  protected onChangeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedIdx = target.selectedIndex;
    
    let selectedVal: any = target.value;
    const currentOptions = this.options();

    // If options array is provided, match actual option value object/primitive
    if (currentOptions.length > 0) {
      const opt = currentOptions[selectedIdx];
      if (opt) {
        selectedVal = opt.value;
      }
    }

    this.value.set(selectedVal);
    this.onChange(selectedVal);
    this.selectChange.emit(selectedVal);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }
}
