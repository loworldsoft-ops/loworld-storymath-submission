import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** 기다리는 중임을 보인다. ring은 자리를 채워 가운데에 돌고, wave는 글 옆에 놓여 오르내린다. */
@Component({
  selector: 'lw-spinner',
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-label]': 'label()',
    '[attr.data-size]': 'size()',
    '[attr.data-kind]': 'kind()',
  },
})
export class LwSpinnerComponent {
  readonly label = input('불러오는 중');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly kind = input<'ring' | 'wave'>('ring');
}
