import { InjectionToken, type Signal } from '@angular/core';
import type { Attachment, Folder, Note, Settings, TrashItem } from '../models/document.model';

export interface NoteRepositoryPort {
  readonly notes: Signal<Note[]>;
  readonly trash: Signal<TrashItem[]>;
  readonly folders: Signal<Folder[]>;
  readonly settings: Signal<Settings>;
  readonly loaded: Signal<boolean>;
  init(): Promise<void>;
  createDraft(folderId: string): Note;
  saveNote(partial: Partial<Note>, draft?: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  togglePin(id: string): Promise<void>;
  moveNote(noteId: string, folderId: string): Promise<void>;
  addAttachment(noteId: string, attachment: Attachment): Promise<void>;
  removeAttachment(noteId: string, attachmentId: string): Promise<void>;
  createFolder(name: string): Promise<Folder>;
  renameFolder(id: string, name: string): Promise<void>;
  deleteFolder(id: string): Promise<void>;
  restoreNote(noteId: string): Promise<void>;
  permanentDelete(noteId: string): Promise<void>;
  emptyTrash(): Promise<void>;
  updateSettings(partial: Partial<Settings>): Promise<void>;
  /** DB를 초기 시드 상태(기본 폴더 포함)로 되돌린다. */
  resetDb(): Promise<void>;
  /** DB의 모든 데이터를 재시드 없이 완전히 삭제한다. */
  wipeAll(): Promise<void>;
}

export const NOTE_REPOSITORY = new InjectionToken<NoteRepositoryPort>('NOTE_REPOSITORY');