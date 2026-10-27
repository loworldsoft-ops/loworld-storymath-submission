
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwSelectableListComponent } from '../../../../ui/list/selectable-list/selectable-list.component';
import { Folder } from '../../../../services/models/document.model';
import { LwFolderListItemComponent } from '../../../collection/items/folder-list-item/folder-list-item.component';

/**
 * 문서를 대상 폴더로 이동시키는 모달 다이얼로그 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-move-dialog',
  standalone: true,
  imports: [LwModalComponent, LwSelectableListComponent, LwFolderListItemComponent],
  templateUrl: './document-move-dialog.component.html',
  styleUrl: './document-move-dialog.component.scss',
})
export class LwDocumentMoveDialogComponent {
  readonly noteId = input.required<string>();
  readonly folders = input.required<Folder[]>();
  readonly currentFolderId = input<string>('');
  readonly close = output();
  readonly folderSelected = output<{ noteId: string; folderId: string }>();

  protected readonly trackFolder = (f: Folder) => f.id;

  onFolderPick(folderId: string): void {
    this.folderSelected.emit({ noteId: this.noteId(), folderId });
    this.close.emit();
  }
}
