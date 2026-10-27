import { InjectionToken, type WritableSignal } from '@angular/core';

export interface LogEntry {
  time: string;
  event: string;
}

export interface EventLoggerPort {
  readonly entries: WritableSignal<LogEntry[]>;
  readonly open: WritableSignal<boolean>;
  log(event: string): void;
  clear(): void;
}

export const EVENT_LOGGER = new InjectionToken<EventLoggerPort>('EVENT_LOGGER');