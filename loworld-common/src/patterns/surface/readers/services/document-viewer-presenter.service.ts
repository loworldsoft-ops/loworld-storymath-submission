import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BadgeColor, Note, SPEAKER_COLORS } from '../../../../services/models/document.model';

export const NOTE_BADGE_LIGHT: Record<string, BadgeColor> = {
  '일반': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  '회의록': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  '전화': { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
  '할 일': { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
};

export const NOTE_BADGE_SOFT: Record<string, BadgeColor> = {
  '일반': { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.19)', text: '#3b82f6' },
  '회의록': { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.19)', text: '#8b5cf6' },
  '전화': { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.19)', text: '#ec4899' },
  '할 일': { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.19)', text: '#10b981' },
};

@Injectable({
  providedIn: 'root',
})
export class DocumentViewerPresenter {
  private readonly document = inject(DOCUMENT);

  isPlainText(content: string): boolean {
    return !/<[a-z][\s\S]*>/i.test(content);
  }

  getBadgeColor(type: string, variant: 'light' | 'soft' = 'light'): BadgeColor {
    const map = variant === 'soft' ? NOTE_BADGE_SOFT : NOTE_BADGE_LIGHT;
    return map[type] || map['일반'];
  }

  getSpeakerColor(idx: number): string {
    return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
  }

  formatKoDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ko-KR');
  }

  formatReminder(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  printNote(note: Note): void {
    const defaultView = this.document.defaultView;
    if (!defaultView) return;
    const w = defaultView.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${note.title || '노트 인쇄'}</title><style>body{font-family:Pretendard Variable,sans-serif;padding:40px;line-height:1.6}h1{font-size:20px;margin-bottom:16px}pre{white-space:pre-wrap;font-size:14px}</style></head><body><h1>${note.emoji ? note.emoji + ' ' : ''}${note.title || '제목 없음'}</h1><pre>${note.content}</pre></body></html>`);
    w.document.close();
    w.print();
  }
}

export const NoteViewerPresenter = DocumentViewerPresenter;
export type NoteViewerPresenter = DocumentViewerPresenter;
