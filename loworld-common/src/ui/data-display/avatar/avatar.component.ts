import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import type { LwSize } from '../../../services/tokens/global.tokens';
import { LwIconComponent } from '../../media/icon/icon.component';

@Component({
  selector: 'lw-avatar',
  standalone: true,
  imports: [LwIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  host: {
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
  },
})
export class LwAvatarComponent {
  /** 규격 및 상태 인풋 (초경량 독립 선언) */
  readonly size = input<LwSize>('md');
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null | undefined>(null);
  readonly tooltip = input<string | null | undefined>(null);

  readonly src = input<string | null | undefined>(null);
  readonly initial = input('');
  readonly alt = input<string | null | undefined>('프로필');

  /** Background for the initial circle. Defaults to a gradient. */
  readonly initialBg = input('linear-gradient(135deg, #60a5fa, #8b5cf6)');

  readonly icon = input<string | null>(null);
  readonly tone = input<'accent' | 'success' | 'danger' | 'muted'>('accent');
  readonly active = input(false);

  readonly _imgError = signal(false);
}
