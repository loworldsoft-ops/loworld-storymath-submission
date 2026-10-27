// ===== Type constants =====
export type NoteType = '일반' | '회의록' | '전화' | '할 일';
export type SortOrder = 'newest' | 'oldest' | 'title';
export type ThemeMode = 'light' | 'dark';
export type Language = 'ko' | 'en' | 'ja' | 'zh-TW';
export type AttachmentType = 'image' | 'drawing' | 'file' | 'audio';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// ===== Core models =====
export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface STTSpeaker {
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface STTResult {
  status: 'done' | 'processing' | 'error';
  fullText: string;
  speakers: STTSpeaker[];
}

export interface AISummary {
  summary: string;
  decisions: string[];
  actionItems: string[];
  keywords?: string[];
}

export interface AttachmentMeta {
  duration?: number;
  width?: number;
  height?: number;
  sttResult?: STTResult;
  aiSummary?: AISummary;
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  meta?: AttachmentMeta;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  folderId: string;
  tags: string[];
  isPinned: boolean;
  isPublic: boolean;
  emoji: string;
  attachments: Attachment[];
  notePassword?: string;
  sharePassword?: string;
  shareUrl?: string;
  reminder?: string;
  reminderDismissed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrashItem {
  note: Note;
  deletedAt: string;
}

export interface Settings {
  theme: ThemeMode;
  language: Language;
  offlineMode: boolean;
  uiScale: number;
  autoSync: boolean;
  syncInterval: number;
  notificationReminder: boolean;
  notificationSound: boolean;
  notificationVibration: boolean;
  windowLaunchMode?: 'normal' | 'maximized';
}

export interface BadgeColor {
  bg: string;
  border: string;
  text: string;
}

// ===== Constants =====
export const PAGE_SIZE = 10;
export const DESKTOP_BREAKPOINT = 1024;
export const TRASH_AUTO_DELETE_DAYS = 30;

export const FOLDER_COLORS: Record<string, string> = {
  'folder-work': '#364153',
  'folder-life': '#fb3220',
  'folder-idea': '#10b981',
  'folder-travel': '#3b82f6',
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  language: 'ko',
  offlineMode: false,
  uiScale: 100,
  autoSync: true,
  syncInterval: 10,
  notificationReminder: true,
  notificationSound: true,
  notificationVibration: false,
  windowLaunchMode: 'maximized',
};

export const SPEAKER_COLORS = [
  '#fb3220', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
];
