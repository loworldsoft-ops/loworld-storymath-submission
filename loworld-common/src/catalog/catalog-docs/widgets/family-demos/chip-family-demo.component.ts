import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LwChipComponent } from '../../../../ui/data-display/chip/chip.component';
import { CHIP_PRESETS_CATALOG } from '../../../chip-system-catalog';
import { plain } from '../../data/catalog-html';

/** 칩 패밀리 견본: 프리셋마다 실제 칩을 그린다. */
@Component({
  selector: 'lw-chip-family-demo',
  standalone: true,
  imports: [LwChipComponent],
  templateUrl: './chip-family-demo.component.html',
  styleUrl: './chip-family-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipFamilyDemoComponent {
  protected readonly presets = CHIP_PRESETS_CATALOG.map((preset) => ({ id: preset.id, variant: preset.variant, label: plain(preset.nameKo), tip: plain(preset.bestPractice) }));
}
