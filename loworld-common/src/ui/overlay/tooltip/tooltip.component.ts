import { ChangeDetectionStrategy, Component, computed, input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwColorElement } from '../../../services/base/lw-color-element';
import type { LwTooltipPlacement, LwTooltipVariant, LwTooltipSize } from '../../../services/tokens/tooltip.tokens';

@Component({
  selector: 'lw-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lw-tooltip]': 'true',
    '[class.lw-tooltip--visible]': 'visible()',
    '[attr.data-placement]': 'placement()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    'role': 'tooltip',
    '[attr.aria-hidden]': '!visible()',
  },
})
export class LwTooltipComponent extends LwColorElement<LwTooltipVariant> {
  readonly content = input<string | TemplateRef<any>>('');
  readonly title = input<string | undefined>(undefined);
  readonly placement = input<LwTooltipPlacement>('top');
  override readonly variant = input<LwTooltipVariant>('dark');
  readonly arrow = input<boolean>(true);
  override readonly visible = input<boolean>(true);

  readonly isTemplateContent = computed(() => this.content() instanceof TemplateRef);
  readonly stringContent = computed(() =>
    typeof this.content() === 'string' ? (this.content() as string) : ''
  );
}
