import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwChipComponent } from '../../../../ui/data-display/chip/chip.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { Component, input, output, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { Note, BadgeColor } from '../../../../services/models/document.model';
import { NoteViewerPresenter } from '../services/document-viewer-presenter.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent, LwChipComponent, LwCardComponent],
  selector: 'lw-document-viewer',
  standalone: true,
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
})
export class LwDocumentViewerComponent {
  protected readonly presenter = inject(NoteViewerPresenter);

  readonly note = input.required<Note>();
  readonly folderName = input<string>('-');
  readonly back = output();
  readonly edit = output();
  readonly share = output();
  readonly move = output();
  readonly togglePin = output<string>();
  readonly deleteNote = output<string>();
  readonly importFile = output();
  readonly exportFile = output<{ noteId: string; format: string }>();

  readonly exportOpen = signal(false);

  isPlainText(content: string): boolean {
    return this.presenter.isPlainText(content);
  }

  badge(): BadgeColor {
    return this.presenter.getBadgeColor(this.note().type, 'light');
  }

  getSpeakerColor(idx: number): string {
    return this.presenter.getSpeakerColor(idx);
  }

  formatKoDate(iso: string): string {
    return this.presenter.formatKoDate(iso);
  }

  formatReminder(iso: string): string {
    return this.presenter.formatReminder(iso);
  }

  exportNote(fmt: string): void {
    this.exportFile.emit({ noteId: this.note().id, format: fmt });
  }

  printNote(): void {
    this.presenter.printNote(this.note());
  }
}

