
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';
import { Component, computed, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CalendarTrashItem } from '../../../../services/models/schedule.model';
import { LwUiFeedbackService } from '../../../../services/services/lw-ui-feedback.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent, LwEmptyStateComponent],
  selector: 'lw-schedule-trash-panel',
  standalone: true,
  templateUrl: './schedule-trash.component.html',
  styleUrl: './schedule-trash.component.scss',
})
export class LwScheduleTrashPanelComponent {
  private readonly ui = inject(LwUiFeedbackService);

  items = input.required<CalendarTrashItem[]>();
  calendarColors = input<Record<string, string>>({});
  restoreEvent = output<string>();
  permanentDelete = output<string>();
  emptyTrash = output<void>();

  expiringCount = computed(() => this.items().filter(i => this.isExpiring(i)).length);

  async onEmptyClick(): Promise<void> {
    const ok = await this.ui.confirm({
      title: '휴지통 비우기',
      message: '휴지통의 모든 일정을 영구 삭제할까요?',
      confirmLabel: '비우기',
      tone: 'danger',
    });
    if (ok) {
      this.emptyTrash.emit();
    }
  }

  async confirmPermanentDelete(eventId: string): Promise<void> {
    const item = this.items().find(i => i.event.id === eventId);
    const title = item?.event.title ?? '일정';
    const ok = await this.ui.confirm({
      title: '영구 삭제',
      message: `'${title}' 일정을 영구 삭제할까요?`,
      detail: '복구할 수 없습니다.',
      confirmLabel: '영구 삭제',
      tone: 'danger',
    });
    if (ok) {
      this.permanentDelete.emit(eventId);
    }
  }

  getColor(calendarId: string): string {
    return this.calendarColors()[calendarId] ?? '#888';
  }

  formatDate(d: Date): string {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  daysUntilExpiry(item: CalendarTrashItem): number {
    return Math.max(0, Math.ceil((item.expiresAt.getTime() - Date.now()) / 86400000));
  }

  isExpiring(item: CalendarTrashItem): boolean {
    return this.daysUntilExpiry(item) <= 7;
  }
}
