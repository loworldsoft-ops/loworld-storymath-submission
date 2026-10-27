import { ComponentMeta } from '../../services/models/os.types';

export const DOCUMENT_CATALOG: ComponentMeta[] = [

  {
    id: 'lw-document-workspace', name: 'Document Workspace', selector: 'lw-document-workspace',
    domain: 'note',
    category: 'view',
    description: '메인 콘텐츠 영역. 빈 상태, 에디터, 뷰어 표시.',
    usedIn: [{ app: 'eznote', role: '에디터/뷰어 영역', feature: '노트 편집 및 읽기', direct: false }],
    inputs: [
      { name: 'note', type: 'Note | null' }, { name: 'folders', type: 'Folder[]' },
      { name: 'isEditing', type: 'boolean' },
    ],
    outputs: [
      { name: 'editingChange', type: 'boolean' }, { name: 'createNote', type: 'void' },
      { name: 'deleteNote', type: 'string' }, { name: 'saveNote', type: 'Partial<Note>' },
    ],
  },
  {
    id: 'lw-document-viewer', name: 'Document Viewer', selector: 'lw-document-viewer',
    domain: 'note',
    category: 'view', description: '노트 뷰어. 편집, 공유, 내보내기 툴바.',
    usedIn: [{ app: 'eznote', role: '노트 읽기 뷰어', feature: '노트 읽기/공유', direct: false }],
    inputs: [{ name: 'note', type: 'Note' }, { name: 'folderName', type: 'string' }],
    outputs: [
      { name: 'back', type: 'void' }, { name: 'edit', type: 'void' },
      { name: 'share', type: 'void' }, { name: 'togglePin', type: 'string' },
      { name: 'deleteNote', type: 'string' },
    ],
  },
  {
    id: 'lw-document-editor', name: 'Document Editor', selector: 'lw-document-editor',
    domain: 'note',
    category: 'view', description: '리치 텍스트 에디터. 이모지, 서식, 첨부파일.',
    usedIn: [{ app: 'eznote', role: '노트 에디터', feature: '노트 편집', direct: false }],
    inputs: [{ name: 'note', type: 'Note' }, { name: 'folders', type: 'Folder[]' }],
    outputs: [{ name: 'cancel', type: 'void' }, { name: 'saveNote', type: 'Partial<Note>' }],
  },

  {
    id: 'lw-document-category-filter', name: 'Category Filter', selector: 'lw-document-category-filter',
    domain: 'note',
    category: 'view', description: '가로 스크롤 카테고리 필터.',
    usedIn: [{ app: 'eznote', role: '카테고리 필터', feature: '모바일 분류', direct: false }],
    inputs: [{ name: 'folders', type: 'Folder[]' }, { name: 'selectedFolderId', type: 'string | null' }],
    outputs: [{ name: 'selectFolder', type: 'string | null' }],
  },
  {
    id: 'lw-app-titlebar', name: 'App Titlebar', selector: 'lw-app-titlebar',
    domain: 'note',
    category: 'layout',
    description: '통합 타이틀바. 노트/캘린더 PC·모바일 공통. 햄버거 버튼, 브랜드 아이콘/이름, 포인트, 로그인 버튼(PC) / 프로필 버튼(모바일).',
    usedIn: [
      { app: 'eznote', role: 'PC·모바일 타이틀바', feature: '앱 타이틀/액션', direct: false },
      { app: 'ezcalendar', role: 'PC·모바일 타이틀바', feature: '앱 타이틀/액션', direct: false },
    ],
    inputs: [
      { name: 'appTitle', type: 'string' },
      { name: 'appIconSrc', type: 'string' },
      { name: 'pointIconSrc', type: 'string' },
      { name: 'points', type: 'number' },
      { name: 'showPoints', type: 'boolean' },
      { name: 'loginLabel', type: 'string' },
      { name: 'isMobile', type: 'boolean' },
      { name: 'profileImageUrl', type: 'string | null' },
      { name: 'profileInitial', type: 'string' },
    ],
    outputs: [
      { name: 'toggleSidebar', type: 'void' },
      { name: 'login', type: 'void' },
    ],
  },
];

export const NOTE_CATALOG = DOCUMENT_CATALOG;
