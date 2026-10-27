import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LwListDensity } from './list.types';

/**
 * 📄 LoworldUI Common List Item Component (`<lw-list-item>`)
 * High-density modular row item with slots for leading, content, meta, and actions.
 */
@Component({
  selector: 'lw-list-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-item.component.html',
  styleUrl: './list-item.component.scss',
})
export class LwListItemComponent {
  readonly clickable = input<boolean>(true);
  readonly active = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly density = input<LwListDensity>('compact');

  readonly itemClick = output<MouseEvent>();

  protected onItemClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.itemClick.emit(event);
  }

  protected onKeyEnter(event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.itemClick.emit(event as unknown as MouseEvent);
  }
}
