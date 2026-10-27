
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Note, BadgeColor } from '../../../../services/models/document.model';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwChipComponent } from '../../../../ui/data-display/chip/chip.component';

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return '오늘';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

const BADGE_LIGHT: Record<string, BadgeColor> = {
  '일반':  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.19)',  text: '#3b82f6' },
  '회의록': { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.19)',  text: '#8b5cf6' },
  '전화':  { bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.19)',  text: '#ec4899' },
  '할 일': { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.19)',  text: '#10b981' },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-card',
  standalone: true,
  imports: [LwCardComponent, LwChipComponent],
  templateUrl: './document-card.component.html',
  styleUrl: './document-card.component.scss',
})
export class LwDocumentCardComponent {
  readonly note = input.required<Note>();
  readonly selected = input(false);
  readonly select = output<string>();

  readonly publicBadge: BadgeColor = { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.19)', text: '#10b981' };

  badge(): BadgeColor {
    return BADGE_LIGHT[this.note().type] || BADGE_LIGHT['일반'];
  }

  contentPreview(): string { return stripHtml(this.note().content); }
  dateText(): string { return formatDate(this.note().createdAt); }
}
