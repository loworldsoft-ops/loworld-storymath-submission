import { Injectable, signal } from '@angular/core';
import type { CalendarEvent, CalendarInfo, CalendarTrashItem, CalendarFilter, CalendarSettings, SubscriptionRequest } from '../models/schedule.model';
import { parseIcsEvents } from '../utils/ics-parser';
import type { CalendarRepositoryPort } from '../ports/schedule-repository.token';

const DB_NAME = 'ezcalendar-db';
const DB_VERSION = 1;

const DEFAULT_CALENDARS: CalendarInfo[] = [
  {
    id: 'calendar-personal',
    name: '내 일정',
    accountId: 'showcase',
    type: 'personal',
    color: '#10b981',
    isVisible: true,
    isSubscribed: false,
    isReadOnly: false,
    isPublic: false,
  },
  {
    id: 'calendar-work',
    name: '업무',
    accountId: 'showcase',
    type: 'work',
    color: '#3b82f6',
    isVisible: true,
    isSubscribed: false,
    isReadOnly: false,
    isPublic: false,
  },
  {
    id: 'calendar-holidays',
    name: '대한민국 공휴일',
    accountId: 'showcase',
    type: 'personal',
    color: '#e74c3c',
    isVisible: true,
    isSubscribed: true,
    isReadOnly: true,
    isPublic: true,
    subscriptionProvider: 'google',
    iCalUrl: 'assets/ics/korean-holidays.ics',
    syncInterval: 60,
    syncStatus: 'idle',
  },
  {
    id: 'calendar-naver',
    name: '네이버 캘린더',
    accountId: 'showcase',
    type: 'personal',
    color: '#03C75A',
    isVisible: true,
    isSubscribed: true,
    isReadOnly: true,
    isPublic: false,
    subscriptionProvider: 'naver',
    iCalUrl: 'assets/ics/naver-sample.ics',
    syncInterval: 60,
    syncStatus: 'idle',
  },
];

const createDefaultFilter = (calendarIds: string[]): CalendarFilter => ({
  showEvents: true,
  showTasks: true,
  showBirthdays: true,
  showHolidays: true,
  visibleCalendars: calendarIds,
});

const DEFAULT_FILTER: CalendarFilter = createDefaultFilter(DEFAULT_CALENDARS.map(calendar => calendar.id));

// ── Seed tasks (sample data for statistics) ──
function makeSeedTasks(): CalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // current month (0-indexed)
  const d = (day: number, h = 9, min = 0) => new Date(y, m, day, h, min);
  const mk = (
    num: number, calId: string, title: string, day: number,
    isCompleted: boolean, pomodoroMinutes?: number, durationH = 1,
  ): CalendarEvent => ({
    id: `seed-task-${y}-${String(num).padStart(3, '0')}`,
    calendarId: calId,
    type: 'task',
    title,
    startDate: d(day),
    endDate: d(day, 9 + durationH),
    isAllDay: false,
    isPublic: false,
    isCompleted,
    pomodoroMinutes,
    createdAt: now,
    updatedAt: now,
    ownerId: 'seed',
  });
  return [
    mk(1,  'calendar-work',     '디자인 시스템 문서 작성',       3,  true,  100),
    mk(2,  'calendar-work',     '컴포넌트 API 설계 검토',         5,  true,   75),
    mk(3,  'calendar-personal', '통계 페이지 UI 구현',            8,  true,  125),
    mk(4,  'calendar-work',     '단위 테스트 작성',               10, true,   50),
    mk(5,  'calendar-personal', '피그마 디자인 검토',             12, true,   50),
    mk(6,  'calendar-work',     '코드 리뷰 진행',                 14, true,   25),
    mk(7,  'calendar-work',     '버그 수정 - PR#42',              15, true,   75),
    mk(8,  'calendar-work',     '릴리즈 노트 작성',               17, true,   25),
    mk(9,  'calendar-personal', '사용자 인터뷰 준비',             18, false,  50),
    mk(10, 'calendar-work',     '성능 최적화 분석',               19, false, 100),
    mk(11, 'calendar-work',     '접근성 점검',                    20, false),
    mk(12, 'calendar-personal', '다크 모드 버그 수정',            20, false,  25),
    mk(13, 'calendar-work',     '주간 보고서 작성',               21, false),
  ];
}

const DEFAULT_SETTINGS: CalendarSettings = {
  language: 'ko', region: 'KR', timezone: 'Asia/Seoul', weekStartsOn: 0,
  defaultEventDuration: 60, theme: 'light', scale: 1, holidayCountries: ['KR'],
  enableOfflineMode: false, enableShortcuts: true,
  notificationSettings: { newEvent: true, eventChange: true, eventCancel: true, attendeeResponse: true, channels: { email: true, push: true } },
  calendarTheme: 'red', showLunar: false, showSonEomneunNal: false, use24Hour: true,
};

interface SerializedCalendarEvent extends Omit<CalendarEvent, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'> {
  startDate: string | Date;
  endDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface SerializedCalendarTrashItem {
  event: SerializedCalendarEvent;
  deletedAt: string | Date;
  expiresAt: string | Date;
}

interface StoredFilterRecord extends CalendarFilter {
  _key: string;
}

interface StoredSettingsRecord extends CalendarSettings {
  _key: string;
}

/** Date 필드를 ISO string으로 변환하여 IndexedDB에 저장 */
function serializeEvent(ev: CalendarEvent): SerializedCalendarEvent {
  return {
    ...ev,
    startDate: ev.startDate instanceof Date ? ev.startDate.toISOString() : ev.startDate,
    endDate: ev.endDate instanceof Date ? ev.endDate.toISOString() : ev.endDate,
    createdAt: ev.createdAt instanceof Date ? ev.createdAt.toISOString() : ev.createdAt,
    updatedAt: ev.updatedAt instanceof Date ? ev.updatedAt.toISOString() : ev.updatedAt,
  };
}

/** ISO string을 Date로 복원 */
function deserializeEvent(raw: SerializedCalendarEvent): CalendarEvent {
  return {
    ...raw,
    startDate: new Date(raw.startDate),
    endDate: new Date(raw.endDate),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

function serializeTrashItem(item: CalendarTrashItem): SerializedCalendarTrashItem {
  return {
    event: serializeEvent(item.event),
    deletedAt: item.deletedAt instanceof Date ? item.deletedAt.toISOString() : item.deletedAt,
    expiresAt: item.expiresAt instanceof Date ? item.expiresAt.toISOString() : item.expiresAt,
  };
}

function deserializeTrashItem(raw: SerializedCalendarTrashItem): CalendarTrashItem {
  return {
    event: deserializeEvent(raw.event),
    deletedAt: new Date(raw.deletedAt),
    expiresAt: new Date(raw.expiresAt),
  };
}

@Injectable()
export class CalendarDbService implements CalendarRepositoryPort {
  // ── Public state (signals) ──
  readonly events = signal<CalendarEvent[]>([]);
  readonly calendars = signal<CalendarInfo[]>([]);
  readonly trash = signal<CalendarTrashItem[]>([]);
  readonly filter = signal<CalendarFilter>(DEFAULT_FILTER);
  readonly settings = signal<CalendarSettings>(DEFAULT_SETTINGS);
  readonly loaded = signal(false);

  private db: IDBDatabase | null = null;

  // ── Init ──
  async init(): Promise<void> {
    this.db = await this.openDb();
    await this.ensureBaseState();
    await this.loadAll();
    await this.syncSubscribedCalendarsOnInit();
    this.loaded.set(true);
  }

  // ── Event CRUD ──
  async createEvent(data: CalendarEvent): Promise<CalendarEvent> {
    const ev: CalendarEvent = { ...data };
    await this.put('events', serializeEvent(ev));
    this.events.update(arr => [...arr, ev]);
    return ev;
  }

  async saveEvent(id: string, partial: Partial<CalendarEvent>): Promise<void> {
    const existing = this.events().find(e => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...partial, updatedAt: new Date() };
    await this.put('events', serializeEvent(updated));
    this.events.update(arr => arr.map(e => e.id === id ? updated : e));
  }

  async deleteEvent(id: string): Promise<void> {
    const ev = this.events().find(e => e.id === id);
    if (!ev) return;
    const trashItem: CalendarTrashItem = {
      event: ev,
      deletedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    };
    await this.delete('events', id);
    await this.put('trash', serializeTrashItem(trashItem));
    this.events.update(arr => arr.filter(e => e.id !== id));
    this.trash.update(arr => [...arr, trashItem]);
  }

  async toggleTask(id: string): Promise<void> {
    const ev = this.events().find(e => e.id === id);
    if (!ev) return;
    const updated = { ...ev, isCompleted: !ev.isCompleted, updatedAt: new Date() };
    await this.put('events', serializeEvent(updated));
    this.events.update(arr => arr.map(e => e.id === id ? updated : e));
  }

  // ── Calendar CRUD ──
  async createCalendar(data: Omit<CalendarInfo, 'id'>): Promise<CalendarInfo> {
    const cal: CalendarInfo = { ...data, id: crypto.randomUUID() };
    await this.put('calendars', cal);
    this.calendars.update(arr => [...arr, cal]);
    return cal;
  }

  async saveCalendar(id: string, partial: Partial<CalendarInfo>): Promise<void> {
    const existing = this.calendars().find(c => c.id === id);
    if (!existing) return;
    const updated = { ...existing, ...partial };
    await this.put('calendars', updated);
    this.calendars.update(arr => arr.map(c => c.id === id ? updated : c));
  }

  async deleteCalendar(id: string): Promise<void> {
    await this.delete('calendars', id);
    this.calendars.update(arr => arr.filter(c => c.id !== id));
  }

  // ── Trash ──
  async restoreEvent(eventId: string): Promise<void> {
    const item = this.trash().find(t => t.event.id === eventId);
    if (!item) return;
    await this.put('events', serializeEvent(item.event));
    await this.delete('trash', eventId);
    this.events.update(arr => [...arr, item.event]);
    this.trash.update(arr => arr.filter(t => t.event.id !== eventId));
  }

  async permanentDelete(eventId: string): Promise<void> {
    await this.delete('trash', eventId);
    this.trash.update(arr => arr.filter(t => t.event.id !== eventId));
  }

  async emptyTrash(): Promise<void> {
    const tx = this.db!.transaction('trash', 'readwrite');
    tx.objectStore('trash').clear();
    await this.txDone(tx);
    this.trash.set([]);
  }

  // ── Filter ──
  async updateFilter(filter: CalendarFilter): Promise<void> {
    this.filter.set(filter);
    await this.put('filters', { _key: 'default', ...filter });
  }

  // ── Settings ──
  async updateSettings(settings: CalendarSettings): Promise<void> {
    this.settings.set(settings);
    await this.put('settings', { _key: 'default', ...settings });
  }

  // ── Dev Tools ──
  /** DB를 완전히 지우고 기본 캘린더/설정/샘플 데이터로 재시드한다 (초기화). */
  async resetDb(): Promise<void> {
    await this.dropDatabase();
    this.db = await this.openDb();
    await this.ensureBaseState();
    await this.loadAll();
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
    this.events.set([]);
    this.calendars.set([]);
    this.trash.set([]);
    this.filter.set(DEFAULT_FILTER);
    this.settings.set(DEFAULT_SETTINGS);
  }

  // ── Internal ──
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('events')) db.createObjectStore('events', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('calendars')) db.createObjectStore('calendars', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('trash')) db.createObjectStore('trash', { keyPath: 'event.id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: '_key' });
        if (!db.objectStoreNames.contains('filters')) db.createObjectStore('filters', { keyPath: '_key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async loadAll(): Promise<void> {
    const rawEvents = await this.getAll<SerializedCalendarEvent>('events');
    this.events.set(rawEvents.map(deserializeEvent));

    this.calendars.set(await this.getAll<CalendarInfo>('calendars'));

    const rawTrash = await this.getAll<SerializedCalendarTrashItem>('trash');
    this.trash.set(rawTrash.map(deserializeTrashItem));

    const rawFilter = await this.getByKey<StoredFilterRecord>('filters', 'default');
    if (rawFilter) {
      const { _key, ...rest } = rawFilter;
      this.filter.set({ ...DEFAULT_FILTER, ...rest });
    }

    const rawSettings = await this.getByKey<StoredSettingsRecord>('settings', 'default');
    if (rawSettings) {
      const { _key, ...rest } = rawSettings;
      this.settings.set({ ...DEFAULT_SETTINGS, ...rest });
    }
  }

  private async ensureBaseState(): Promise<void> {
    const calendars = await this.getAll<CalendarInfo>('calendars');
    const calendarIds = (calendars.length > 0 ? calendars : DEFAULT_CALENDARS).map(calendar => calendar.id);
    const rawFilter = await this.getByKey<StoredFilterRecord>('filters', 'default');
    const rawSettings = await this.getByKey<StoredSettingsRecord>('settings', 'default');

    const tx = this.db!.transaction(['calendars', 'filters', 'settings'], 'readwrite');

    if (calendars.length === 0) {
      for (const calendar of DEFAULT_CALENDARS) {
        tx.objectStore('calendars').put(calendar);
      }
    } else {
      for (const calendar of DEFAULT_CALENDARS.filter(item => item.isSubscribed)) {
        const existing = calendars.find(item => item.id === calendar.id);
        if (!existing) {
          tx.objectStore('calendars').put(calendar);
          continue;
        }

        const needsBackfill = existing.iCalUrl !== calendar.iCalUrl
          || existing.subscriptionProvider !== calendar.subscriptionProvider
          || existing.syncInterval !== calendar.syncInterval;

        if (needsBackfill) {
          tx.objectStore('calendars').put({
            ...existing,
            isSubscribed: true,
            isReadOnly: true,
            subscriptionProvider: calendar.subscriptionProvider,
            iCalUrl: calendar.iCalUrl,
            syncInterval: calendar.syncInterval,
          });
        }
      }
    }

    if (!rawFilter) {
      tx.objectStore('filters').put({ _key: 'default', ...createDefaultFilter(calendarIds) });
    }

    if (!rawSettings) {
      tx.objectStore('settings').put({ _key: 'default', ...DEFAULT_SETTINGS });
    }

    await this.txDone(tx);

    // Seed sample tasks (only once – keyed by first seed task ID)
    const firstSeed = makeSeedTasks()[0];
    const existing = await this.getByKey<SerializedCalendarEvent>('events', firstSeed.id);
    if (!existing) {
      const taskTx = this.db!.transaction('events', 'readwrite');
      for (const t of makeSeedTasks()) taskTx.objectStore('events').put(serializeEvent(t));
      await this.txDone(taskTx);
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

  /** 구독 캘린더 추가 */
  async subscribeCalendar(req: SubscriptionRequest): Promise<void> {
    const cal: CalendarInfo = {
      id: crypto.randomUUID(),
      name: req.name,
      accountId: 'subscribed',
      type: 'personal',
      color: req.color,
      isVisible: true,
      isSubscribed: true,
      isReadOnly: true,
      isPublic: false,
      subscriptionProvider: req.provider,
      iCalUrl: req.url,
      syncInterval: 60,
      syncStatus: 'idle',
    };
    await this.put('calendars', cal);
    this.calendars.update(arr => [...arr, cal]);
    await this.syncCalendar(cal.id);
  }

  /** 구독 캘린더 동기화 */
  async syncCalendar(id: string): Promise<void> {
    const cal = this.calendars().find(c => c.id === id);
    if (!cal || !cal.iCalUrl) return;

    const syncing = { ...cal, syncStatus: 'syncing' as const, syncErrorMessage: undefined };
    await this.put('calendars', syncing);
    this.calendars.update(arr => arr.map(item => item.id === id ? syncing : item));

    try {
      const response = await fetch(cal.iCalUrl);
      if (!response.ok) {
        throw new Error(`iCal fetch failed: ${response.status}`);
      }

      const icsText = await response.text();
      const importedEvents = parseIcsEvents(icsText, cal);
      const updated = {
        ...syncing,
        lastSyncedAt: new Date(),
        syncStatus: 'synced' as const,
        syncErrorMessage: undefined,
      };
      const existingEvents = this.events().filter(event => event.calendarId === id);

      const tx = this.db!.transaction(['events', 'calendars'], 'readwrite');
      for (const event of existingEvents) {
        tx.objectStore('events').delete(event.id);
      }
      for (const event of importedEvents) {
        tx.objectStore('events').put(serializeEvent(event));
      }
      tx.objectStore('calendars').put(updated);
      await this.txDone(tx);

      this.events.update(arr => [
        ...arr.filter(event => event.calendarId !== id),
        ...importedEvents,
      ]);
      this.calendars.update(arr => arr.map(item => item.id === id ? updated : item));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = { ...syncing, syncStatus: 'error' as const, syncErrorMessage: message };
      await this.put('calendars', failed);
      this.calendars.update(arr => arr.map(item => item.id === id ? failed : item));
      throw error;
    }
  }

  /** 구독 캘린더 해제 (삭제) */
  async removeSubscription(id: string): Promise<void> {
    const existingEvents = this.events().filter(event => event.calendarId === id);
    const tx = this.db!.transaction(['calendars', 'events'], 'readwrite');
    tx.objectStore('calendars').delete(id);
    for (const event of existingEvents) {
      tx.objectStore('events').delete(event.id);
    }
    await this.txDone(tx);
    this.calendars.update(arr => arr.filter(c => c.id !== id));
    this.events.update(arr => arr.filter(event => event.calendarId !== id));
  }

  private async syncSubscribedCalendarsOnInit(): Promise<void> {
    const subscriptions = this.calendars().filter(calendar => calendar.isSubscribed);
    const existingEventCounts = new Map<string, number>();

    for (const event of this.events()) {
      existingEventCounts.set(event.calendarId, (existingEventCounts.get(event.calendarId) ?? 0) + 1);
    }

    const targets = subscriptions.filter(calendar => (existingEventCounts.get(calendar.id) ?? 0) === 0 && !!calendar.iCalUrl);
    await Promise.allSettled(targets.map(calendar => this.syncCalendar(calendar.id)));
  }
}
