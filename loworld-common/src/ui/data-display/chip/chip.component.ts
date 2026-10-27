import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LwColor, LwSize } from '../../../services/tokens/global.tokens';
import type { LwActionEvent } from '../../../services/models/action-event.model';

export type LwChipVariant = 'default' | 'filter' | 'choice' | 'input' | 'status';

export interface LwChipItem {
  key: string;
  label: string;
  color?: LwColor;
  variant?: LwChipVariant;
}

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
})
export class LwChipComponent {
  /** 규격 및 상태 인풋 (초경량 독립 선언) */
  readonly size = input<LwSize>('md');
  readonly color = input<LwColor>('primary');
  readonly variant = input<LwChipVariant>('default');
  readonly selected = input(false);
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly loading = input(false);
  readonly interactive = input(true);
  readonly ariaLabel = input<string | null>(null);
  readonly tooltip = input<string | null>(null);

  readonly label = input('');
  readonly removable = input(false);
  readonly hasProjectedContent = input(false);
  readonly colorDot = input<string | null>(null);
  readonly checked = input(false);
  readonly clickable = input(true);

  readonly select = output<void>();
  readonly remove = output<void>();
  readonly actionEvent = output<LwActionEvent<any, string>>();

  onChipClick(): void {
    if (this.disabled() || !this.clickable()) return;
    this.select.emit();
  }
}
