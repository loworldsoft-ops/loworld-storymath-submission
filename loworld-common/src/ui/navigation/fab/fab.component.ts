import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LwInteractiveElement } from '../../../services/base/lw-interactive-element';
import { LW_COLOR_MAP } from '../../../services/tokens/global.tokens';

export interface LwFabAction {
  key: string;
  label: string;
  icon: string;
  color?: string;
  bg?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fab.component.html',
  styleUrl: './fab.component.scss',
})
export class LwFabComponent extends LwInteractiveElement {
  readonly items = input<LwFabAction[]>([]);
  readonly action = output<string>();
  readonly open = signal(false);

  fabColor(): string {
    const colorKey = this.color();
    const preset = (colorKey && LW_COLOR_MAP[colorKey]) ? LW_COLOR_MAP[colorKey] : LW_COLOR_MAP.primary;
    return preset.bg;
  }

  selectItem(key: string): void {
    this.open.set(false);
    this.action.emit(key);
    this.dispatchAction(key);
  }
}
