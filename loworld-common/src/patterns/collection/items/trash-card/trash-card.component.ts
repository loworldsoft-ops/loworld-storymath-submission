
import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LwUiFeedbackService } from '../../../../services/services/lw-ui-feedback.service';
import { TrashItem, BadgeColor } from '../../../../services/models/document.model';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwChipComponent } from '../../../../ui/data-display/chip/chip.component';

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function daysRemaining(deletedAt: string): number {
  const d = new Date(deletedAt);
  d.setDate(d.getDate() + 30);
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

const BADGE_LIGHT: Record<string, BadgeColor> = {
  '일반':  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.19)',  text: '#3b82f6' },
  '회의록': { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.19)',  text: '#8b5cf6' },
  '전화':  { bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.19)',  text: '#ec4899' },
  '할 일': { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.19)',  text: '#10b981' },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-trash-card',
  standalone: true,
  imports: [LwCardComponent, LwButtonComponent, LwChipComponent],
  templateUrl: './trash-card.component.html',
  styleUrl: './trash-card.component.scss',
})
export class LwDocumentTrashCardComponent {
  private readonly ui = inject(LwUiFeedbackService);

  readonly item = input.required<TrashItem>();
  readonly restore = output<string>();
  readonly permanentDelete = output<string>();

  badge(): BadgeColor {
    return BADGE_LIGHT[this.item().note.type] || BADGE_LIGHT['일반'];
  }
  contentPreview(): string { return stripHtml(this.item().note.content); }
  daysLeft(): number { return daysRemaining(this.item().deletedAt); }

  async confirmPermanentDelete(): Promise<void> {
    const note = this.item().note;
    const ok = await this.ui.confirm({
      title: '영구 삭제',
      message: `'${note.title || '제목 없음'}' 노트를 영구 삭제할까요?`,
      detail: '복구할 수 없습니다.',
      confirmLabel: '영구 삭제',
      tone: 'danger',
    });
    if (ok) {
      this.permanentDelete.emit(note.id);
    }
  }
}
