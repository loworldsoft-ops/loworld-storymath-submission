import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LwFormFieldOrientation, LwFormFieldSize } from './form-field.types';

@Component({
  selector: 'lw-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-form-field-host',
    '[class.lw-form-field--horizontal]': 'orientation() === "horizontal"',
    '[class.lw-form-field--vertical]': 'orientation() === "vertical"',
    '[class.lw-form-field--has-error]': '!!error()',
    '[class.lw-form-field--disabled]': 'disabled()',
    '[class.lw-form-field--sm]': 'size() === "sm"',
    '[class.lw-form-field--md]': 'size() === "md"',
    '[class.lw-form-field--lg]': 'size() === "lg"',
  },
})
export class LwFormFieldComponent {
  /** 라벨 텍스트 */
  readonly label = input<string>('');

  /** 연계될 input/control ID */
  readonly forId = input<string>('');

  /** 필수 입력 여부 (*) */
  readonly required = input<boolean>(false);

  /** 에러 메시지 (존재 시 에러 상태 및 에러 텍스트 표시) */
  readonly error = input<string | null>(null);

  /** 도움말 힌트 텍스트 */
  readonly hint = input<string | null>(null);

  /** 레이아웃 방향: 'vertical' | 'horizontal' */
  readonly orientation = input<LwFormFieldOrientation>('vertical');

  /** 컴포넌트 크기: 'sm' | 'md' | 'lg' */
  readonly size = input<LwFormFieldSize>('md');

  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);
}
