import { ChangeDetectionStrategy, Component, forwardRef, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LwButtonComponent } from '../button/button.component';
import type { LwInputSize, LwInputType, LwInputVariant } from './input.types';

@Component({
  selector: 'lw-input',
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LwInputComponent),
      multi: true,
    },
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInputComponent implements ControlValueAccessor {
  /** 양방향 데이터 바인딩 시그널 (Angular 17+ Two-way model) */
  readonly value = model<string | number>('');

  readonly type = input<LwInputType>('text');
  readonly size = input<LwInputSize>('md');
  readonly variant = input<LwInputVariant>('default');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly prefixIcon = input<string | null>(null);
  readonly suffixIcon = input<string | null>(null);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly ariaLabel = input<string>('입력 필드');

  readonly focusChange = output<boolean>();
  readonly enterPressed = output<void>();

  protected readonly isFocused = signal<boolean>(false);

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    if (val !== undefined && val !== null) {
      this.value.set(val);
    } else {
      this.value.set('');
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Component handles disabled state
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const finalVal = this.type() === 'number' ? (val === '' ? '' : Number(val)) : val;
    this.value.set(finalVal);
    this.onChange(finalVal);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.focusChange.emit(true);
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.focusChange.emit(false);
  }

  protected clear(): void {
    this.value.set('');
    this.onChange('');
  }
}
