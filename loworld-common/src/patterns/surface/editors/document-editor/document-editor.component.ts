
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwSelectComponent } from '../../../../ui/form/select/select.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { ChangeDetectionStrategy, Component, ElementRef, DestroyRef, DOCUMENT, effect, inject, input, output, signal, computed, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { fromEvent } from 'rxjs';
import { Attachment, BadgeColor, Note } from '../../../../services/models/document.model';
import { Folder } from '../../../../services/models/document.model';
import { LwDocumentPasswordDialogComponent } from '../../dialogs/document-password-dialog/document-password-dialog.component';
import { LwDocumentReminderDialogComponent } from '../../dialogs/document-reminder-dialog/document-reminder-dialog.component';
import { LwDesktopRecordingBarComponent } from './desktop-recording-bar.component';
import { LwDesktopDrawingPanelComponent } from './desktop-drawing-panel.component';

const NOTE_TYPES = ['일반', '회의록', '전화', '할 일'] as const;

const BADGE_LIGHT: Record<string, BadgeColor> = {
  '일반': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  '회의록': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  '전화': { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
  '할 일': { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
};

const EMOJI_CATEGORIES = [
  { name: '자주 사용', emojis: ['😀', '😊', '🎉', '❤️', '👍', '🔥', '⭐', '💡', '📝', '✅', '📌', '🎯', '💪', '🙌', '👏', '🤔', '💬', '📎', '🗂️', '📁'] },
  { name: '표정', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🥳', '🥸', '😎', '🤓', '🧐'] },
  { name: '손/몸', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪'] },
  { name: '동물/자연', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅', '🦋', '🐛', '🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🍀'] },
  { name: '음식', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥑', '☕', '🍵', '🧃', '🍺', '🍕', '🍔', '🍟', '🌮', '🍣', '🍱', '🍰', '🎂', '🍩', '🍪'] },
  { name: '사물/기호', emojis: ['💡', '🔥', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🏆', '🥇', '🎯', '📝', '📌', '📎', '🔗', '📁', '🗂️', '📊', '📈', '📉', '💻', '⌨️', '🖥️', '📱', '⏰', '🔔', '🔑', '💰', '💎', '🛠️', '⚙️', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✅', '❌', '⭕', '❓', '❗', '💬', '💭', '🏷️', '🚀', '🎵', '🎶'] },
];

const STYLE_OPTIONS = [
  { label: '제목', tag: 'h1', size: '20px', weight: 700 },
  { label: '부제목', tag: 'h2', size: '16px', weight: 600 },
  { label: '소제목', tag: 'h3', size: '14px', weight: 600 },
  { label: '본문', tag: 'p', size: '13px', weight: 400 },
];

const FONT_SIZE_OPTIONS = [
  { label: '작게', size: '2' },
  { label: '보통', size: '3' },
  { label: '크게', size: '5' },
  { label: '아주 크게', size: '7' },
];

const TEXT_COLORS = ['#111827', '#374151', '#6b7280', '#fb3220', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
const HIGHLIGHT_COLORS = ['#fef3c7', '#fde68a', '#fed7aa', '#fecaca', '#fbcfe8', '#ddd6fe', '#bfdbfe', '#bbf7d0', '#a7f3d0', '#ffffff'];

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwInputComponent, LwSelectComponent, LwFormFieldComponent, LwDocumentPasswordDialogComponent, LwDocumentReminderDialogComponent, LwDesktopRecordingBarComponent, LwDesktopDrawingPanelComponent],
  selector: 'lw-document-editor',
  
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDocumentEditorComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly destroyRef = inject(DestroyRef);
  readonly sanitizer = inject(DomSanitizer);

  readonly note = input.required<Note>();
  readonly folders = input<Folder[]>([]);
  readonly cancel = output();
  readonly saveNote = output<Partial<Note>>();
  readonly addAttachment = output<{ noteId: string; attachment: Attachment }>();
  readonly removeAttachment = output<string>();
  readonly moveNote = output<{ noteId: string; folderId: string }>();

  readonly contentEditorRef = viewChild<ElementRef<HTMLDivElement>>('contentEditor');
  readonly emojiPickerRootRef = viewChild<ElementRef<HTMLElement>>('emojiPickerRoot');
  readonly styleMenuRootRef = viewChild<ElementRef<HTMLElement>>('styleMenuRoot');
  readonly textColorRootRef = viewChild<ElementRef<HTMLElement>>('textColorRoot');
  readonly highlightRootRef = viewChild<ElementRef<HTMLElement>>('highlightRoot');

  readonly title = signal('');
  readonly content = signal('');
  readonly type = signal<string>('일반');
  readonly tags = signal('');
  readonly emoji = signal<string | undefined>(undefined);
  readonly pinned = signal(false);
  readonly notePassword = signal('');
  readonly reminder = signal<string | undefined>(undefined);
  readonly folderId = signal('');
  readonly showPasswordModal = signal(false);
  readonly showReminderModal = signal(false);
  readonly showEmojiPicker = signal(false);
  readonly activeEmojiCategory = signal(0);
  readonly emojiSearch = signal('');
  readonly styleMenuOpen = signal(false);
  readonly textColorMenuOpen = signal(false);
  readonly highlightMenuOpen = signal(false);
  readonly showDrawing = signal(false);
  readonly isRecording = signal(false);
  readonly activeFormats = signal<Set<string>>(new Set());

  readonly noteTypes = NOTE_TYPES;
  readonly emojiCategories = EMOJI_CATEGORIES;
  readonly styleOptions = STYLE_OPTIONS;
  readonly fontSizeOptions = FONT_SIZE_OPTIONS;
  readonly textColors = TEXT_COLORS;
  readonly highlightColors = HIGHLIGHT_COLORS;

  readonly visibleEmojis = computed(() => {
    const keyword = this.emojiSearch().trim();
    const emojis = this.emojiCategories[this.activeEmojiCategory()].emojis;
    return keyword ? emojis.filter(e => e.includes(keyword)) : emojis;
  });

  readonly commandButtons = [
    { cmd: 'bold', activeKey: 'bold', title: '굵게', path: '<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>' },
    { cmd: 'italic', activeKey: 'italic', title: '기울임', path: '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>' },
    { cmd: 'underline', activeKey: 'underline', title: '밑줄', path: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>' },
    { cmd: 'strikeThrough', activeKey: 'strikethrough', title: '취소선', path: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/>' },
  ];

  readonly listButtons = [
    { cmd: 'insertUnorderedList', activeKey: 'ul', title: '불릿 목록', path: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>' },
    { cmd: 'insertOrderedList', activeKey: 'ol', title: '번호 목록', path: '<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>' },
    { cmd: 'insertChecklist', activeKey: '', title: '체크리스트', path: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/><path d="M7 7h.01"/>' },
  ];

  readonly layoutButtons = [
    { cmd: 'outdent', activeKey: '', title: '내어쓰기', path: '<path d="M8 6H21"/><path d="M8 12H21"/><path d="M8 18H21"/><path d="M3 12h2"/><path d="m5 9-3 3 3 3"/>' },
    { cmd: 'indent', activeKey: '', title: '들여쓰기', path: '<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="M3 12h4"/><path d="m7 9 3 3-3 3"/>' },
    { cmd: 'justifyLeft', activeKey: '', title: '왼쪽 정렬', path: '<path d="M3 6h18"/><path d="M3 12h12"/><path d="M3 18h18"/>' },
    { cmd: 'justifyCenter', activeKey: 'center', title: '가운데 정렬', path: '<path d="M3 6h18"/><path d="M6 12h12"/><path d="M3 18h18"/>' },
    { cmd: 'justifyRight', activeKey: 'right', title: '오른쪽 정렬', path: '<path d="M3 6h18"/><path d="M9 12h12"/><path d="M3 18h18"/>' },
    { cmd: 'insertHorizontalRule', activeKey: '', title: '구분선', path: '<path d="M4 12h16"/>' },
  ];

  constructor() {

    fromEvent<MouseEvent>(this.document, 'mousedown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onDocumentMouseDown(event));

    effect(() => {
      const n = this.note();
      this.title.set(n.title);
      this.content.set(n.content);
      this.type.set(n.type);
      this.tags.set(n.tags.join(', '));
      this.emoji.set(n.emoji || undefined);
      this.pinned.set(n.isPinned);
      this.notePassword.set(n.notePassword || '');
      this.reminder.set(n.reminder);
      this.folderId.set(n.folderId);

      queueMicrotask(() => {
        const editor = this.contentEditorRef()?.nativeElement;
        if (editor && editor.innerHTML !== n.content) {
          editor.innerHTML = n.content || '';
        }
        this.updateActiveFormats();
      });
    });

    effect((onCleanup) => {
      const editor = this.contentEditorRef()?.nativeElement;
      if (!editor) return;
      const handler = () => this.updateActiveFormats();
      editor.addEventListener('keyup', handler);
      editor.addEventListener('mouseup', handler);
      this.document.addEventListener('selectionchange', handler);
      onCleanup(() => {
        editor.removeEventListener('keyup', handler);
        editor.removeEventListener('mouseup', handler);
        this.document.removeEventListener('selectionchange', handler);
      });
    });
  }

  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!this.containsTarget(this.emojiPickerRootRef(), target)) this.showEmojiPicker.set(false);
    if (!this.containsTarget(this.styleMenuRootRef(), target)) this.styleMenuOpen.set(false);
    if (!this.containsTarget(this.textColorRootRef(), target)) this.textColorMenuOpen.set(false);
    if (!this.containsTarget(this.highlightRootRef(), target)) this.highlightMenuOpen.set(false);
  }

  getBadge(type: string): BadgeColor {
    return BADGE_LIGHT[type] || BADGE_LIGHT['일반'];
  }

  getToolbarIcon(path: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      '<span class="icon-memo" aria-hidden="true"></span>'
    );
  }

  isActive(key: string): boolean {
    return !!key && this.activeFormats().has(key);
  }

  closeEmojiPicker(): void { this.showEmojiPicker.set(false); this.emojiSearch.set(''); }
  selectEmoji(emoji: string): void { this.emoji.set(emoji); this.closeEmojiPicker(); }
  clearEmoji(event: MouseEvent): void { event.stopPropagation(); this.emoji.set(undefined); this.closeEmojiPicker(); }

  toggleStyleMenu(e: MouseEvent): void { e.preventDefault(); this.styleMenuOpen.set(!this.styleMenuOpen()); this.textColorMenuOpen.set(false); this.highlightMenuOpen.set(false); }
  toggleTextColorMenu(e: MouseEvent): void { e.preventDefault(); this.textColorMenuOpen.set(!this.textColorMenuOpen()); this.styleMenuOpen.set(false); this.highlightMenuOpen.set(false); }
  toggleHighlightMenu(e: MouseEvent): void { e.preventDefault(); this.highlightMenuOpen.set(!this.highlightMenuOpen()); this.styleMenuOpen.set(false); this.textColorMenuOpen.set(false); }

  applyStyleOption(e: MouseEvent, tag: string): void { e.preventDefault(); this.execEditorCommand('formatBlock', tag); this.styleMenuOpen.set(false); }
  applyFontSize(e: MouseEvent, size: string): void { e.preventDefault(); this.execEditorCommand('fontSize', size); this.styleMenuOpen.set(false); }
  applyTextColor(e: MouseEvent, color: string): void { e.preventDefault(); this.execEditorCommand('foreColor', color); this.textColorMenuOpen.set(false); }
  applyHighlightColor(e: MouseEvent, color: string): void { e.preventDefault(); this.execEditorCommand('hiliteColor', color); this.highlightMenuOpen.set(false); }

  handleToolbarCommand(e: MouseEvent, cmd: string): void {
    e.preventDefault();
    if (cmd === 'insertChecklist') { this.insertChecklist(); return; }
    this.execEditorCommand(cmd);
  }

  onContentInput(): void {
    const editor = this.contentEditorRef()?.nativeElement;
    if (!editor) return;
    const html = editor.innerHTML;
    this.content.set(html === '<br>' || html === '<div><br></div>' ? '' : html);
  }

  onEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') { event.preventDefault(); this.execEditorCommand(event.shiftKey ? 'outdent' : 'indent'); }
  }

  onEditorPaste(event: ClipboardEvent): void {
    const ce = event as ClipboardEvent & { shiftKey?: boolean };
    if (ce.shiftKey) {
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') || '';
      this.document.execCommand('insertText', false, text);
      this.onContentInput();
    }
  }

  toggleDrawing(e: MouseEvent): void { e.preventDefault(); this.showDrawing.set(!this.showDrawing()); }
  toggleRecording(e: MouseEvent): void { e.preventDefault(); this.isRecording.set(!this.isRecording()); }

  onRecorded(attachment: Attachment): void {
    this.addAttachment.emit({ noteId: this.note().id, attachment });
    this.isRecording.set(false);
  }

  onDrawingInserted(drawingRecord: any): void {
    const attachment: Attachment = {
      ...drawingRecord,
      type: 'image'
    };
    this.addAttachment.emit({ noteId: this.note().id, attachment });
    this.showDrawing.set(false);
    
    // Insert into editor
    this.document.execCommand('insertHTML', false, `<img src="${drawingRecord.dataUrl}" alt="Drawing" style="max-width: 100%; border-radius: 8px; margin: 8px 0; display: block;" />`);
  }

  attachFile(e: MouseEvent): void {
    e.preventDefault();
    const inp = this.document.createElement('input');
    inp.type = 'file'; inp.accept = '*/*';
    inp.onchange = () => {
      const file = inp.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Attachment = {
          id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 9),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          dataUrl: String(reader.result || ''),
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        this.addAttachment.emit({ noteId: this.note().id, attachment });
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  }

  formatReminder(iso: string): string {
    return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  save(): void {
    this.saveNote.emit({
      id: this.note().id,
      title: this.title().trim(),
      content: this.content(),
      type: this.type() as Note['type'],
      emoji: this.emoji() || '',
      isPinned: this.pinned(),
      tags: this.tags().split(',').map(t => t.trim()).filter(Boolean),
      notePassword: this.notePassword() || undefined,
      reminder: this.reminder() || undefined,
      reminderDismissed: false,
      folderId: this.folderId(),
    });
  }

  private execEditorCommand(command: string, value?: string): void {
    const editor = this.contentEditorRef()?.nativeElement;
    editor?.focus();
    this.document.execCommand(command, false, value);
    this.onContentInput();
    this.updateActiveFormats();
  }

  private insertChecklist(): void {
    this.execEditorCommand('insertHTML', '<div class="ez-checklist"><span contenteditable="false" class="ez-check-box" onclick="this.textContent=this.textContent===\'☐\'?\'☑\':\'☐\'">☐</span>&nbsp;</div>');
  }

  private updateActiveFormats(): void {
    const active = new Set<string>();
    try {
      if (this.document.queryCommandState('bold')) active.add('bold');
      if (this.document.queryCommandState('italic')) active.add('italic');
      if (this.document.queryCommandState('underline')) active.add('underline');
      if (this.document.queryCommandState('strikeThrough')) active.add('strikethrough');
      if (this.document.queryCommandState('insertUnorderedList')) active.add('ul');
      if (this.document.queryCommandState('insertOrderedList')) active.add('ol');
      if (this.document.queryCommandValue('justifyCenter') === 'true') active.add('center');
      if (this.document.queryCommandValue('justifyRight') === 'true') active.add('right');
    } catch { /* ignore */ }
    this.activeFormats.set(active);
  }

  private containsTarget(ref: ElementRef<HTMLElement> | undefined, target: Node | null): boolean {
    return !!ref?.nativeElement && !!target && ref.nativeElement.contains(target);
  }
}
