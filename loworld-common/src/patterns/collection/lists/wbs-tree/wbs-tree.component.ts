
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { PlanItemStatus, PlanWbsNode, PlanWbsNodeKind } from '../../../../services/models/strategy.model';
import type { LwColor } from '../../../../services/tokens/global.tokens';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwSearchInputComponent } from '../../../../ui/form/search-input/search-input.component';
import { flattenWbsNodes } from '../../../../services/utils/strategy-wbs.utils';

@Component({
  selector: 'lw-wbs-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LwCardComponent, LwBadgeComponent, LwSearchInputComponent, LwButtonComponent],
  templateUrl: './wbs-tree.component.html',
  styleUrl: './wbs-tree.component.scss',
})
export class LwWbsTreeComponent {
  readonly nodes = input<readonly PlanWbsNode[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly showSearch = input(true);

  readonly nodeSelect = output<string>();
  readonly linkedProjectNavigate = output<string>();

  protected readonly filterQuery = signal('');
  protected readonly collapsedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly flatRows = computed(() =>
    flattenWbsNodes(this.nodes(), this.collapsedIds(), this.filterQuery()),
  );

  protected onFilterChange(value: string): void {
    this.filterQuery.set(value);
    if (value.trim()) {
      this.collapsedIds.set(new Set());
    }
  }

  protected onRowClick(node: PlanWbsNode): void {
    if (node.linkedProjectId) {
      this.linkedProjectNavigate.emit(node.linkedProjectId);
      return;
    }
    this.nodeSelect.emit(node.id);
  }

  protected onToggleExpand(nodeId: string, event: Event): void {
    event.stopPropagation();
    this.collapsedIds.update((set) => {
      const next = new Set(set);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  protected kindLabel(kind: PlanWbsNodeKind): string {
    switch (kind) {
      case 'phase':
        return 'Phase';
      case 'epic':
        return 'Epic';
      case 'feature':
        return 'Feature';
      case 'task':
        return 'Task';
      case 'deliverable':
        return '납품';
    }
  }

  protected kindColor(kind: PlanWbsNodeKind): LwColor {
    switch (kind) {
      case 'phase':
        return 'info';
      case 'epic':
        return 'primary';
      case 'feature':
        return 'success';
      case 'deliverable':
        return 'warning';
      case 'task':
        return 'neutral';
    }
  }

  protected statusLabel(status: PlanItemStatus): string {
    switch (status) {
      case 'todo':
        return '대기';
      case 'doing':
        return '진행';
      case 'done':
        return '완료';
      case 'risk':
        return '위험';
    }
  }

  protected statusColor(status: PlanItemStatus): LwColor {
    switch (status) {
      case 'todo':
        return 'neutral';
      case 'doing':
        return 'primary';
      case 'done':
        return 'success';
      case 'risk':
        return 'danger';
    }
  }
}
