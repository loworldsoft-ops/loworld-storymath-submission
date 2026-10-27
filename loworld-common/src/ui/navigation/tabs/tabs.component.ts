import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { LwIconComponent } from '../../media/icon/icon.component';

export interface LwTabItem<T extends string = string> {
  readonly key: T;
  readonly label: string;
  readonly icon?: string;
  readonly badge?: string | number;
  readonly disabled?: boolean;
}

export type LwTabsVariant = 'line' | 'segment' | 'pill';
export type LwTabsSize = 'sm' | 'md';

/**
 * 모노레포 공통 탭 프리미티브 (`lw-tabs`).
 * WAI-ARIA tablist 롤과 좌/우 화살표 키 이동을 지원합니다.
 */
@Component({
  selector: 'lw-tabs',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lw-tabs--line]': 'variant() === "line"',
    '[class.lw-tabs--segment]': 'variant() === "segment"',
    '[class.lw-tabs--pill]': 'variant() === "pill"',
    '[class.lw-tabs--sm]': 'size() === "sm"',
    '[class.lw-tabs--stretch]': 'stretch()',
  },
})
export class LwTabsComponent {
  readonly tabs = input.required<readonly LwTabItem[]>();
  readonly value = model<string>('');
  readonly variant = input<LwTabsVariant>('line');
  readonly size = input<LwTabsSize>('md');
  readonly stretch = input<boolean>(false);
  readonly ariaLabel = input<string>('탭');

  readonly tabChange = output<string>();

  select(tab: LwTabItem): void {
    if (tab.disabled || tab.key === this.value()) return;
    this.value.set(tab.key);
    this.tabChange.emit(tab.key);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const enabled = this.tabs().filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.key === this.value());
    if (idx < 0 || enabled.length < 2) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    this.select(enabled[(idx + step + enabled.length) % enabled.length]);
  }
}
