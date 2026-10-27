import { injectTheme } from '../../../services/theme/lw-theme.util';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, signal, computed, inject } from '@angular/core';
import type { ComponentMeta, OverviewThemeMode } from '../../../services/models/os.types';
import { NOTE_REPOSITORY } from '../../../services/ports/document-repository.token';
import type { Note, Folder, TrashItem, Settings } from '../../../services/models/document.model';
import { DEFAULT_SETTINGS } from '../../../services/models/document.model';
import { LwDocumentCardComponent } from '../../../patterns/collection/items/document-card/document-card.component';
import { LwDocumentTrashCardComponent } from '../../../patterns/collection/items/trash-card/trash-card.component';
import { LwDocumentGridCardComponent } from '../../../patterns/collection/items/mobile-document-card/mobile-document-card.component';
import { LwDocumentCategoryFilterComponent } from '../../../patterns/collection/items/mobile-category-filter/mobile-category-filter.component';
import { LwDocumentViewerComponent } from '../../../patterns/surface/readers/document-viewer/document-viewer.component';
import { LwDocumentEditorComponent } from '../../../patterns/surface/editors/document-editor/document-editor.component';
import { LwDocumentWorkspaceComponent } from '../../../patterns/surface/panels/main-content/main-content.component';
import { LwAppTitlebarComponent } from '../../../ui/navigation/app-titlebar/titlebar.component';
import { SAMPLE_FOLDERS, SAMPLE_NOTES, SAMPLE_TRASH, SAMPLE_NOTE_SETTINGS } from '../../../services/data/layout-sample-data';

const MOCK_NOTE: Note = {
  id: 'demo-note-1',
  title: '프로젝트 기획서',
  content: '## 3분기 목표\n\n- 신기능 개발\n- 버그 수정\n- 성능 최적화\n\n자세한 내용은 팀과 논의 후 작성 예정.',
  type: '일반',
  folderId: 'folder-work',
  tags: ['업무', '기획'],
  isPinned: false,
  isPublic: false,
  emoji: '📋',
  attachments: [],
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_FOLDERS: Folder[] = [
  { id: 'folder-work', name: '업무', createdAt: new Date().toISOString() },
  { id: 'folder-life', name: '생활', createdAt: new Date().toISOString() },
  { id: 'folder-idea', name: '아이디어', createdAt: new Date().toISOString() },
];

import { LwDocumentMoveDialogComponent } from '../../../patterns/surface/dialogs/document-move-dialog/document-move-dialog.component';
import { LwDocumentShareDialogComponent } from '../../../patterns/surface/dialogs/document-share-dialog/document-share-dialog.component';
import { LwDocumentPasswordDialogComponent } from '../../../patterns/surface/dialogs/document-password-dialog/document-password-dialog.component';
import { LwDocumentReminderDialogComponent, LwDrumComponent } from '../../../patterns/surface/dialogs/document-reminder-dialog/document-reminder-dialog.component';
import { LwDesktopDrawingPanelComponent } from '../../../patterns/surface/editors/document-editor/desktop-drawing-panel.component';
import { LwDesktopRecordingBarComponent } from '../../../patterns/surface/editors/document-editor/desktop-recording-bar.component';
import { LwDrawingPadComponent } from '../../../patterns/surface/editors/media/drawing-pad/drawing-pad.component';
import { LwAudioRecorderComponent } from '../../../patterns/surface/editors/media/audio-recorder/audio-recorder.component';
import { LwAppearanceSettingsComponent } from '../../../patterns/surface/panels/appearance-settings/appearance-settings.component';
import { LwFrameSettingsComponent } from '../../../patterns/surface/panels/frame-settings/frame-settings.component';
import { LwFolderListItemComponent } from '../../../patterns/collection/items/folder-list-item/folder-list-item.component';
import { LwAccountLoginDialogComponent } from '../../../patterns/lib/overlay/dialogs/member-login-dialog/lw-member-login-dialog.component';
import { LwAuthLoginFormComponent } from '../../../patterns/lib/form/auth-login-form/auth-login-form.component';
import { LwAuthSignupFormComponent } from '../../../patterns/lib/form/auth-signup-form/auth-signup-form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-demo',
  standalone: true,
  imports: [
    LwDocumentCardComponent,
    LwDocumentTrashCardComponent,
    LwDocumentViewerComponent,
    LwDocumentEditorComponent,
    LwDocumentWorkspaceComponent,
    LwAppTitlebarComponent,
    LwDocumentGridCardComponent,
    LwDocumentCategoryFilterComponent,
    LwButtonComponent,
    LwDocumentMoveDialogComponent,
    LwDocumentShareDialogComponent,
    LwDocumentPasswordDialogComponent,
    LwDocumentReminderDialogComponent,
    LwDrumComponent,
    LwDesktopDrawingPanelComponent,
    LwDesktopRecordingBarComponent,
    LwDrawingPadComponent,
    LwAudioRecorderComponent,
    LwAppearanceSettingsComponent,
    LwFrameSettingsComponent,
    LwFolderListItemComponent,
    LwAccountLoginDialogComponent,
    LwAuthLoginFormComponent,
    LwAuthSignupFormComponent,
  ],
  templateUrl: './document-demo.component.html',
  styleUrl: './document-demo.component.scss',
})
export class DocumentDemoComponent {
  readonly loginDialogOpen = signal(false);
  private readonly _themeContext = injectTheme();
  readonly isDark = this._themeContext.isDark;

  readonly comp = input.required<ComponentMeta>();
  readonly themeMode = input<OverviewThemeMode>('light');

  private readonly db = inject(NOTE_REPOSITORY);

  // ── 서비스 데이터 ──
  readonly notes   = computed(() => this.db.notes());
  readonly folders = computed(() => this.db.folders().length ? this.db.folders() : MOCK_FOLDERS);
  readonly trash   = computed(() => this.db.trash());

  readonly firstNote = computed((): Note => this.notes()[0] ?? MOCK_NOTE);
  readonly firstTrash = computed((): TrashItem | null => this.trash()[0] ?? {
    note: { ...MOCK_NOTE, id: 'demo-trash-1', title: '지워진 회의록' },
    deletedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  });

  readonly folderCounts = computed(() => {
    const m: Record<string, number> = {};
    for (const f of this.folders()) m[f.id] = this.notes().filter(n => n.folderId === f.id).length;
    return m;
  });

  // ── Shell 샘플 데이터 ──
  readonly sampleFolders  = SAMPLE_FOLDERS;
  readonly sampleNotes    = SAMPLE_NOTES;
  readonly sampleTrash    = SAMPLE_TRASH;
  readonly sampleSettings = computed<Settings>(() => ({
    ...SAMPLE_NOTE_SETTINGS,
    theme: this.themeMode(),
  }));
  readonly demoSettings = computed<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    theme: this.themeMode(),
  }));
  readonly shellSelectedFolderId = signal<string | null>(null);
  readonly shellSelectedNoteId   = signal<string | null>(null);
  readonly shellSearchQuery      = signal('');
  readonly shellSortOrder        = signal<'newest' | 'oldest' | 'title'>('newest');
  readonly shellIsEditing        = signal(false);
  readonly shellSelectedNote = computed(() =>
    SAMPLE_NOTES.find(n => n.id === this.shellSelectedNoteId()) ?? null
  );
  readonly previewIsDark = computed(() => this.themeMode() === 'dark');

  // ── 모달 toggle ──
  readonly shareOpen     = signal(false);
  readonly moveOpen      = signal(false);
  readonly passwordOpen  = signal(false);
  readonly reminderOpen  = signal(false);
  readonly settingsOpen  = signal(false);
  readonly editorOpen    = signal(false);

  // ── 카드 선택 상태 ──
  readonly cardSelected  = signal(false);
  readonly roomCardSel   = signal(false);

  // ── 사이드바 상태 ──
  readonly sidebarCollapsed = signal(false);
  readonly selectedFolderId = signal<string | null>(null);
  readonly selectedNoteId   = signal<string | null>(null);

  // ── main-content 편집 상태 ──
  readonly isEditing = signal(false);

  protected noop(): void {}

  readonly searchQuery = signal('');
  readonly sortOrder   = signal<'newest' | 'oldest' | 'title'>('newest');
}

export const NoteDemoComponent = DocumentDemoComponent;
