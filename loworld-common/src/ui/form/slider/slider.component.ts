import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { LwSliderSize, LwSliderTone } from './slider.types';

/**
 * 숫자 범위 값을 직관적으로 슬라이드하여 조절하는 폼 슬라이더 컴포넌트입니다.
 */
@Component({
  selector: 'lw-slider',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LwSliderComponent),
      multi: true,
    },
  ],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-slider-host',
    '[class.lw-slider--disabled]': 'disabled()',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
  },
})
export class LwSliderComponent implements ControlValueAccessor {
  /** 현재 값 (양방향 시그널 모델) */
  readonly value = model<number>(0);

  /** 규격 및 프로퍼티 */
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly disabled = input<boolean>(false);
  readonly size = input<LwSliderSize>('md');
  readonly tone = input<LwSliderTone>('primary');
  readonly ariaLabel = input<string>('값 조절 슬라이더');
  readonly showValueBadge = input<boolean>(false);

  /** 이벤트 아웃풋 */
  readonly sliderChange = output<number>();
  readonly sliderInput = output<number>();

  /** 게이지 백분율 (0 ~ 100%) */
  readonly fillPercentage = computed<number>(() => {
    const minVal = this.min();
    const maxVal = this.max();
    const curVal = this.value();
    if (maxVal <= minVal) return 0;
    const clamped = Math.min(Math.max(curVal, minVal), maxVal);
    return ((clamped - minVal) / (maxVal - minVal)) * 100;
  });

  private onChange: (val: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: number): void {
    if (typeof val === 'number' && !isNaN(val)) {
      this.value.set(val);
    }
  }

  registerOnChange(fn: (val: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // handled via disabled input
  }

  onNativeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const num = parseFloat(target.value);
    if (!isNaN(num)) {
      this.value.set(num);
      this.onChange(num);
      this.sliderInput.emit(num);
    }
  }

  onNativeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const num = parseFloat(target.value);
    if (!isNaN(num)) {
      this.value.set(num);
      this.onChange(num);
      this.onTouched();
      this.sliderChange.emit(num);
    }
  }
}
