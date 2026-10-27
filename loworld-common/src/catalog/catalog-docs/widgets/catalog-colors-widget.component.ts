import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import { LwChipComponent } from '../../../ui/data-display/chip/chip.component';
import { COLOR_TOKENS_CATALOG } from '../../color-tokens-catalog';

/** 색상 토큰 견본. 토큰마다 라이트/다크 값을 색 점으로 보여 준다. */
@Component({
  selector: 'lw-catalog-colors-widget',
  standalone: true,
  imports: [LwCardComponent, LwChipComponent],
  templateUrl: './catalog-colors-widget.component.html',
  styleUrl: './catalog-colors-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogColorsWidgetComponent {
  protected readonly tokens = COLOR_TOKENS_CATALOG;
}
