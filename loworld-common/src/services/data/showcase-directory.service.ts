import { Injectable, signal } from '@angular/core';
import type { Attachment, Note, Folder, TrashItem, Settings, SortOrder } from '../models/document.model';
import type { NoteRepositoryPort } from '../ports/document-repository.token';

const DB_NAME = 'eznote-db';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: Settings = {
  theme: 'light', language: 'ko', offlineMode: false,
  uiScale: 100, autoSync: true, syncInterval: 10,
  notificationReminder: true, notificationSound: true, notificationVibration: false,
};

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'folder-work', name: '업무', createdAt: '2026-03-01' },
  { id: 'folder-life', name: '생활', createdAt: '2026-03-01' },
  { id: 'folder-idea', name: '아이디어', createdAt: '2026-03-01' },
  { id: 'folder-travel', name: '여행', createdAt: '2026-03-01' },
];

interface StoredSettingsRecord extends Settings {
  _key: string;
}

@Injectable()
export class ShowcaseDbService implements NoteRepositoryPort {
  // ── Public state (signals) ──
  readonly notes = signal<Note[]>([]);
  readonly trash = signal<TrashItem[]>([]);
  readonly folders = signal<Folder[]>([]);
  readonly settings = signal<Settings>(DEFAULT_SETTINGS);
  readonly loaded = signal(false);

  private db: IDBDatabase | null = null;

  // ── Init ──
  async init(): Promise<void> {
    this.db = await this.openDb();
    await this.loadAll();
    if (this.folders().length === 0) {
      const tx = this.db!.transaction('folders', 'readwrite');
      for (const f of DEFAULT_FOLDERS) tx.objectStore('folders').put(f);
      await this.txDone(tx);
      this.folders.set([...DEFAULT_FOLDERS]);
    }
    this.loaded.set(true);
  }

  // ── Note CRUD ──
  createDraft(folderId: string): Note {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      title: '새 노트',
      content: '',
      type: '일반',
      emoji: '',
      folderId,
      tags: [],
      isPinned: false,
      isPublic: false,
      attachments: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async saveNote(partial: Partial<Note>, draft?: Note): Promise<void> {
    if (!partial.id) return;
    const existing = this.notes().find(n => n.id === partial.id);
    if (existing) {
      const updated = { ...existing, ...partial, updatedAt: new Date().toISOString() };
      await this.put('notes', updated);
      this.notes.update(arr => arr.map(n => n.id === updated.id ? updated : n));
    } else if (draft) {
      const newNote = { ...draft, ...partial, updatedAt: new Date().toISOString() };
      await this.put('notes', newNote);
      this.notes.update(arr => [newNote, ...arr]);
    }
  }

  async deleteNote(id: string): Promise<void> {
    const note = this.notes().find(n => n.id === id);
    if (!note) return;
    const trashItem: TrashItem = { note, deletedAt: new Date().toISOString() };
    await this.delete('notes', id);
    await this.put('trash', trashItem);
    this.notes.update(arr => arr.filter(n => n.id !== id));
    this.trash.update(arr => [trashItem, ...arr]);
  }

  async togglePin(id: string): Promise<void> {
    const note = this.notes().find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
    await this.put('notes', updated);
    this.notes.update(arr => arr.map(n => n.id === id ? updated : n));
  }

  async moveNote(noteId: string, folderId: string): Promise<void> {
    await this.saveNote({ id: noteId, folderId });
  }

  async addAttachment(noteId: string, attachment: Attachment): Promise<void> {
    const note = this.notes().find(n => n.id === noteId);
    if (!note) return;
    const updated = {
      ...note,
      attachments: [...(note.attachments || []), attachment],
      updatedAt: new Date().toISOString(),
    };
    await this.put('notes', updated);
    this.notes.update(arr => arr.map(n => n.id === noteId ? updated : n));
  }

  async removeAttachment(noteId: string, attachmentId: string): Promise<void> {
    const note = this.notes().find(n => n.id === noteId);
    if (!note) return;
    const updated = {
      ...note,
      attachments: (note.attachments || []).filter(attachment => attachment.id !== attachmentId),
      updatedAt: new Date().toISOString(),
    };
    await this.put('notes', updated);
    this.notes.update(arr => arr.map(n => n.id === noteId ? updated : n));
  }

  // ── Folder CRUD ──
  async createFolder(name: string): Promise<Folder> {
    const folder: Folder = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
    await this.put('folders', folder);
    this.folders.update(f => [...f, folder]);
    return folder;
  }

  async renameFolder(id: string, name: string): Promise<void> {
    const existing = this.folders().find(f => f.id === id);
    if (!existing) return;
    const updated = { ...existing, name };
    await this.put('folders', updated);
    this.folders.update(arr => arr.map(f => f.id === id ? updated : f));
  }

  async deleteFolder(id: string): Promise<void> {
    await this.delete('folders', id);
    this.folders.update(arr => arr.filter(f => f.id !== id));
  }

  // ── Trash ──
  async restoreNote(noteId: string): Promise<void> {
    const item = this.trash().find(t => t.note.id === noteId);
    if (!item) return;
    await this.put('notes', item.note);
    await this.delete('trash', noteId);
    this.notes.update(arr => [item.note, ...arr]);
    this.trash.update(arr => arr.filter(t => t.note.id !== noteId));
  }

  async permanentDelete(noteId: string): Promise<void> {
    await this.delete('trash', noteId);
    this.trash.update(arr => arr.filter(t => t.note.id !== noteId));
  }

  async emptyTrash(): Promise<void> {
    const tx = this.db!.transaction('trash', 'readwrite');
    tx.objectStore('trash').clear();
    await this.txDone(tx);
    this.trash.set([]);
  }

  // ── Settings ──
  async updateSettings(partial: Partial<Settings>): Promise<void> {
    const updated = { ...this.settings(), ...partial };
    this.settings.set(updated);
    await this.put('settings', { _key: 'default', ...updated });
  }

  // ── Dev Tools ──
  /** DB를 완전히 지우고 기본 폴더/설정으로 재시드한다 (초기화). */
  async resetDb(): Promise<void> {
    await this.dropDatabase();
    this.db = await this.openDb();
    if (this.folders().length === 0) {
      const tx = this.db.transaction('folders', 'readwrite');
      for (const f of DEFAULT_FOLDERS) tx.objectStore('folders').put(f);
      await this.txDone(tx);
      this.folders.set([...DEFAULT_FOLDERS]);
    }
  }

  /** DB의 모든 데이터를 재시드 없이 완전히 삭제한다 (전체 삭제). */
  async wipeAll(): Promise<void> {
    await this.dropDatabase();
    this.db = await this.openDb();
  }

  private async dropDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
    this.notes.set([]);
    this.trash.set([]);
    this.folders.set([]);
    this.settings.set(DEFAULT_SETTINGS);
  }

  // ── Internal ──
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('trash')) db.createObjectStore('trash', { keyPath: 'note.id' });
        if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: '_key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadAll(): Promise<void> {
    this.notes.set(await this.getAll<Note>('notes'));
    this.trash.set(await this.getAll<TrashItem>('trash'));
    this.folders.set(await this.getAll<Folder>('folders'));
    const raw = await this.getByKey<StoredSettingsRecord>('settings', 'default');
    if (raw) {
      const { _key, ...rest } = raw;
      this.settings.set({ ...DEFAULT_SETTINGS, ...rest });
    }
  }

  private getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private getByKey<T>(storeName: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private put<T>(storeName: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private txDone(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
