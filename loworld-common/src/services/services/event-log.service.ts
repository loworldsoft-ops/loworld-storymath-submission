import { Injectable, signal } from '@angular/core';
import { type EventLoggerPort, type LogEntry } from '../tokens/event-logger.token';

export type { LogEntry };

@Injectable({ providedIn: 'root' })
export class EventLogService implements EventLoggerPort {
  readonly entries = signal<LogEntry[]>([]);
  readonly open = signal(false);

  log(ev: string): void {
    const t = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    this.entries.update(l => [{ time: t, event: ev }, ...l].slice(0, 50));
  }

  clear(): void {
    this.entries.set([]);
  }
}
