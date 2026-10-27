import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { Component, input, output, signal, computed, effect, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Note, Folder, Attachment } from '../../../../services/models/document.model';
import { LwDocumentViewerComponent } from '../../readers/document-viewer/document-viewer.component';
import { LwDocumentEditorComponent } from '../../editors/document-editor/document-editor.component';
import { LwDocumentShareDialogComponent } from '../../dialogs/document-share-dialog/document-share-dialog.component';
import { LwDocumentMoveDialogComponent } from '../../dialogs/document-move-dialog/document-move-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-workspace',
  standalone: true,
  imports: [LwDocumentViewerComponent, LwDocumentEditorComponent, LwDocumentShareDialogComponent, LwDocumentMoveDialogComponent, LwButtonComponent, LwInputComponent, LwFormFieldComponent, LwEmptyStateComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss',
})
export class LwDocumentWorkspaceComponent {
  readonly note = input<Note | null>(null);
  readonly folders = input<Folder[]>([]);
  readonly isEditing = input(false);

  readonly selectNote = output<string | null>();
  readonly editingChange = output<boolean>();
  readonly createNote = output<void>();
  readonly deleteNote = output<string>();
  readonly togglePin = output<string>();
  readonly shareNote = output<{ noteId: string; isPublic: boolean; password?: string }>();
  readonly moveNote = output<{ noteId: string; folderId: string }>();
  readonly saveNote = output<Partial<Note>>();
  readonly addAttachment = output<{ noteId: string; attachment: Attachment }>();
  readonly removeAttachment = output<string>();
  readonly importFile = output<void>();
  readonly exportFile = output<{ noteId: string; format: string }>();

  readonly shareNoteId = signal<string | null>(null);
  readonly moveNoteId = signal<string | null>(null);
  readonly fabOpen = signal(false);
  readonly unlockedIds = signal<Set<string>>(new Set());
  readonly passwordInput = signal('');
  readonly showPassword = signal(false);
  readonly passwordWrong = signal(false);

  readonly passwordLocked = computed(() => {
    const n = this.note();
    return !!n?.notePassword && !this.unlockedIds().has(n.id);
  });

  readonly currentFolderName = computed(() =>
    this.folders().find(f => f.id === this.note()?.folderId)?.name || '-'
  );

  constructor() {

    effect(() => {
      this.note();
      this.passwordInput.set('');
      this.passwordWrong.set(false);
      this.showPassword.set(false);
    });
  }

  getShareUrl(noteId: string): string {
    return `https://eznote.app/share/${noteId}`;
  }

  unlockNote(): void {
    const n = this.note();
    if (!n) return;
    if (this.passwordInput() === n.notePassword) {
      this.unlockedIds.update(s => new Set(s).add(n.id));
      this.passwordInput.set('');
      this.passwordWrong.set(false);
    } else {
      this.passwordWrong.set(true);
    }
  }
}
