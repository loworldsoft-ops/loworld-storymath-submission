import { InjectionToken, type Signal } from '@angular/core';
import type { CalendarEvent, CalendarFilter, CalendarInfo, CalendarSettings, CalendarTrashItem, SubscriptionRequest } from '../models/schedule.model';

export interface CalendarRepositoryPort {
  readonly events: Signal<CalendarEvent[]>;
  readonly calendars: Signal<CalendarInfo[]>;
  readonly trash: Signal<CalendarTrashItem[]>;
  readonly filter: Signal<CalendarFilter>;
  readonly settings: Signal<CalendarSettings>;
  readonly loaded: Signal<boolean>;
  init(): Promise<void>;
  createEvent(data: CalendarEvent): Promise<CalendarEvent>;
  saveEvent(id: string, partial: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  toggleTask(id: string): Promise<void>;
  createCalendar(data: Omit<CalendarInfo, 'id'>): Promise<CalendarInfo>;
  saveCalendar(id: string, partial: Partial<CalendarInfo>): Promise<void>;
  deleteCalendar(id: string): Promise<void>;
  restoreEvent(eventId: string): Promise<void>;
  permanentDelete(eventId: string): Promise<void>;
  emptyTrash(): Promise<void>;
  updateFilter(filter: CalendarFilter): Promise<void>;
  updateSettings(settings: CalendarSettings): Promise<void>;
  /** DB를 초기 시드 상태(기본 캘린더/설정 포함)로 되돌린다. */
  resetDb(): Promise<void>;
  /** DB의 모든 데이터를 재시드 없이 완전히 삭제한다. */
  wipeAll(): Promise<void>;
  subscribeCalendar(req: SubscriptionRequest): Promise<void>;
  syncCalendar(id: string): Promise<void>;
  removeSubscription(id: string): Promise<void>;
}

export const CALENDAR_REPOSITORY = new InjectionToken<CalendarRepositoryPort>('CALENDAR_REPOSITORY');