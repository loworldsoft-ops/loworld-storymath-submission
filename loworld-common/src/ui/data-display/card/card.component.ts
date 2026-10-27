import { ChangeDetectionStrategy, Component, input, inject, computed } from '@angular/core';
import { LwInteractiveElement } from '../../../services/base/lw-interactive-element';
import { LwCardVariant, LwCardLayout, LwCardElevation, LW_COLOR_MAP } from '../../../services/tokens/global.tokens';
import { LwStoryPlayThemeService } from '../../../services/services/story-play-theme.service';

@Component({
  selector: 'lw-card, [lw-card]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  host: {
    class: 'lw-game-play-bridge lw-game-play-themed',
    '[class.is-fill]': 'fill()',
    '[attr.data-fill]': 'fill() ? "" : null',
    '[style.--lw-card-color]': 'cardColor()',
    '[attr.data-lw-play-theme]': 'playThemeService.activeTheme()',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class LwCardComponent extends LwInteractiveElement<LwCardVariant> {
  protected readonly playThemeService = inject(LwStoryPlayThemeService);

  // LwCard 고유 Inputs
  override readonly variant = input<LwCardVariant>('outlined');
  readonly fill = input<boolean>(false);
  readonly layout = input<LwCardLayout>('stack');
  readonly noPadding = input<boolean>(false);
  readonly elevation = input<LwCardElevation>('sm');
  readonly actionId = input<string | undefined>(undefined);
  readonly actionPayload = input<any>(undefined);

  readonly cardColor = computed(() => {
    const c = this.color();
    if (c === 'info') return 'var(--lw-color-info)';
    if (c === 'primary') return 'var(--lw-accent)';
    const preset = c && LW_COLOR_MAP[c] ? LW_COLOR_MAP[c] : LW_COLOR_MAP.primary;
    return preset.bg;
  });

  // 마우스 호버 시 카드 컴포넌트 메타데이터 및 툴팁 자동 생성
  readonly resolvedTooltip = computed(() => {
    const custom = this.tooltip() || this.ariaLabel();
    const meta = `[LwCard] variant: ${this.variant()} | layout: ${this.layout()} | size: ${this.size()}${this.actionId() ? ' | action: ' + this.actionId() : ''}${this.interactive() ? ' (interactive)' : ''}${this.selected() ? ' (selected)' : ''}${this.disabled() ? ' (disabled)' : ''}`;
    return custom ? `${custom} \n${meta}` : meta;
  });

  protected onCardClick(event: MouseEvent | Event): void {
    if (this.disabled() || this.loading()) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    this.actionEvent.emit({
      actionId: this.actionId() || 'CARD_CLICK',
      payload: this.actionPayload(),
      source: 'lw-card',
    });
  }
}
