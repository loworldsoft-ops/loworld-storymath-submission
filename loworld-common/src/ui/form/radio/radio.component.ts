import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * 단일 선택을 위한 폼 컨트롤 라디오 단추 컴포넌트입니다.
 */
@Component({
  selector: 'lw-radio',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LwRadioComponent),
      multi: true,
    },
  ],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-radio-host',
    '[class.lw-radio--checked]': 'isChecked()',
    '[class.lw-radio--disabled]': 'disabled()',
    '(click)': 'onHostClick($event)',
  },
})
export class LwRadioComponent implements ControlValueAccessor {
  /** 라디오 고유 값 */
  readonly value = input<any>(null);

  /** 그룹 내 선택된 현재 값 (양방향 모델) */
  readonly groupValue = model<any>(null);

  /** 단독 checked 상태 (그룹 없을 때) */
  readonly checked = model<boolean>(false);

  readonly label = input<string>('');
  readonly name = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly tone = input<'primary' | 'secondary' | 'accent' | 'novel'>('primary');

  readonly radioChange = output<any>();

  readonly isChecked = computed<boolean>(() => {
    if (this.groupValue() !== null && this.groupValue() !== undefined) {
      return this.groupValue() === this.value();
    }
    return this.checked();
  });

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    if (this.value() !== null && this.value() !== undefined) {
      this.checked.set(val === this.value());
    } else {
      this.checked.set(!!val);
    }
  }

  registerOnChange(fn: (val: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {}

  onHostClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.selectRadio();
  }

  onNativeChange(event: Event): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.selectRadio();
  }

  private selectRadio(): void {
    const val = this.value();
    this.checked.set(true);
    if (val !== null && val !== undefined) {
      this.groupValue.set(val);
      this.onChange(val);
      this.radioChange.emit(val);
    } else {
      this.onChange(true);
      this.radioChange.emit(true);
    }
    this.onTouched();
  }
}
