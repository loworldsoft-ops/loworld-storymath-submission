
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { BadgeColor, Note } from '../../../../services/models/document.model';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwChipComponent } from '../../../../ui/data-display/chip/chip.component';

function formatCardDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-grid-card',
  standalone: true,
  imports: [LwCardComponent, LwChipComponent],
  templateUrl: './mobile-document-card.component.html',
  styleUrl: './mobile-document-card.component.scss',
})
export class LwDocumentGridCardComponent {
  readonly note = input.required<Note>();
  readonly colors = input.required<BadgeColor>();
  readonly label = input('');
  readonly select = output<string>();

  hasAudio(): boolean {
    return (this.note().attachments || []).some(attachment => attachment.type === 'audio');
  }

  contentPreview(): string {
    return stripHtml(this.note().content);
  }

  formatDate(iso: string): string {
    return formatCardDate(iso);
  }
}