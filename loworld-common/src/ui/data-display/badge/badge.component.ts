import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwBadgeVariant, LwBadgeTone, LwBadgeSize, LW_COLOR_MAP } from '../../../services/tokens/global.tokens';
import type { LwColor } from '../../../services/tokens/global.tokens';

@Component({
  selector: 'lw-badge, [lw-badge], span[lw-badge]',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  host: {
    '[class.lw-badge]': 'true',
    '[class.lw-badge--pill]': 'pill()',
    '[attr.data-size]': 'effectiveSize()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-tone]': 'effectiveTone()',
  },
})
export class LwBadgeComponent {
  readonly label = input<string | undefined | null>('');
  readonly icon = input<string>('');
  readonly trailingIcon = input<string>('');
  readonly pill = input<boolean>(false);

  /** 규격 및 상태 인풋 (초경량 독립 선언) */
  readonly size = input<LwBadgeSize>('sm');
  readonly color = input<LwColor>('primary');
  readonly variant = input<LwBadgeVariant>('subtle');
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null>(null);
  readonly tooltip = input<string | null>(null);

  /** tone alias for color */
  readonly tone = input<LwBadgeTone | undefined>(undefined);

  /** Custom bg/text/border override — takes precedence over color preset. */
  readonly customBg = input('');
  readonly customText = input('');
  readonly customBorder = input('');

  readonly hasProjectedContent = input(false);

  readonly effectiveTone = computed<LwBadgeTone>(() => {
    return this.tone() || (this.color() as LwBadgeTone) || 'neutral';
  });

  readonly effectiveSize = computed<LwBadgeSize>(() => {
    return this.size() || 'sm';
  });

  readonly styles = computed(() => {
    const toneKey = this.effectiveTone() as LwColor;
    const preset = (toneKey && toneKey in LW_COLOR_MAP) ? LW_COLOR_MAP[toneKey] : LW_COLOR_MAP.neutral;
    return {
      bg: this.customBg() || preset?.bg || '',
      text: this.customText() || preset?.text || '',
      border: this.customBorder() || preset?.border || '',
      subtleBg: preset?.subtleBg || '',
    };
  });
}
