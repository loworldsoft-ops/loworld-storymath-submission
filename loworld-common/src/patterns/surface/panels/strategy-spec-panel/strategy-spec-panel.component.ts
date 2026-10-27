
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { safeTimeout } from '../../../../services/utils/lifecycle-timer.util';
import type { PlanFunctionalSpec, PlanItemStatus, PlanSpecPriority, PlanSpecStatus, PlanWbsNode } from '../../../../services/models/strategy.model';
import type { LwColor } from '../../../../services/tokens/global.tokens';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';

@Component({
  selector: 'lw-strategy-spec-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LwCardComponent, LwBadgeComponent, LwEmptyStateComponent, LwButtonComponent],
  templateUrl: './strategy-spec-panel.component.html',
  styleUrl: './strategy-spec-panel.component.scss',
})
export class LwStrategySpecPanelComponent {
  protected readonly destroyRef = inject(DestroyRef);
  readonly node = input<PlanWbsNode | null>(null);
  readonly linkedPillarLabels = input<readonly { pillarLabel: string; itemTitle: string }[]>([]);
  /** 기능정의서 탭에서 WBS로 이동 링크 표시 */
  readonly showWbsLink = input(false);

  readonly openInWbs = output<void>();

  protected readonly copyHint = signal<string | null>(null);

  protected onOpenInWbs(): void {
    this.openInWbs.emit();
  }

  protected onCopyDocRef(docRef: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(docRef).then(() => {
        this.copyHint.set('복사됨');
        safeTimeout(this.destroyRef, () => this.copyHint.set(null), 2000);
      });
    }
  }

  protected specStatusLabel(status: PlanSpecStatus): string {
    switch (status) {
      case 'draft':
        return '초안';
      case 'review':
        return '검토';
      case 'approved':
        return '승인';
    }
  }

  protected specStatusColor(status: PlanSpecStatus): LwColor {
    switch (status) {
      case 'draft':
        return 'neutral';
      case 'review':
        return 'warning';
      case 'approved':
        return 'success';
    }
  }

  protected priorityLabel(priority: PlanSpecPriority): string {
    switch (priority) {
      case 'must':
        return 'Must';
      case 'should':
        return 'Should';
      case 'could':
        return 'Could';
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

  protected hasRefList(spec: PlanFunctionalSpec): boolean {
    return (
      (spec.uiRefs?.length ?? 0) > 0 ||
      (spec.apiRefs?.length ?? 0) > 0 ||
      (spec.dataRefs?.length ?? 0) > 0 ||
      !!spec.docRef
    );
  }
}
