import { CommonModule } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { CalendarEvent } from '../../../services/models/schedule.model';

const HOUR_HEIGHT = 56;
const COMPACT_DAY_VIEW_WIDTH_PX = 420;
const MIN_EVENT_HEIGHT_PX = 30;
const MIN_EVENT_LABEL_HEIGHT_PX = 40;

interface EventColumn {
  event: CalendarEvent;
  top: number;
  height: number;
  col: number;
  totalCols: number;
}

export type TimedEventDensity = 'micro' | 'compact' | 'comfortable';

import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';

@Component({
  imports: [CommonModule, LwButtonComponent, LwCardComponent],
  selector: 'lw-schedule-day-grid',
  standalone: true,
  templateUrl: './schedule-day-view.component.html',
  styleUrl: './schedule-day-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScheduleDayGridComponent {
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  selectedDate = input.required<Date>();
  filteredEvents = input.required<CalendarEvent[]>();
  calendarColors = input<Record<string, string>>({});
  isMobile = input(false);

  selectEvent = output<string>();
  prevDay = output<void>();
  nextDay = output<void>();

  hours = Array.from({ length: 24 }, (_, i) => i);

  protected readonly isCompactHost = signal(false);

  protected readonly useListLayout = computed(() => this.isMobile() || this.isCompactHost());

  effectiveHourHeight = computed(() => (this.isCompactHost() ? 48 : HOUR_HEIGHT));
  timeGutterWidth = computed(() => (this.isCompactHost() ? 48 : 56));

  dayName = computed(() =>
    ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][this.selectedDate().getDay()],
  );

  monthYear = computed(() => {
    const d = this.selectedDate();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  });

  allDayEvents = computed(() =>
    this.filteredEvents().filter(
      (event) => event.isAllDay && this.isSameDay(event.startDate, this.selectedDate()),
    ),
  );

  timedEventsForDay = computed(() =>
    this.filteredEvents()
      .filter((event) => !event.isAllDay && this.isSameDay(event.startDate, this.selectedDate()))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
  );

  timedColumns = computed((): EventColumn[] => {
    const timed = this.timedEventsForDay();
    const cols: EventColumn[] = timed.map((event) => ({
      event,
      top: this.getTop(event),
      height: this.getHeight(event),
      col: 0,
      totalCols: 1,
    }));

    if (!this.isCompactHost()) {
      for (let i = 0; i < cols.length; i++) {
        const overlapping = cols.filter(
          (other, index) =>
            index !== i
            && cols[i].top < other.top + other.height
            && cols[i].top + cols[i].height > other.top,
        );
        const group = [cols[i], ...overlapping];
        const count = group.length;
        group.forEach((entry, index) => {
          if (count > entry.totalCols) {
            entry.totalCols = count;
            entry.col = index;
          }
        });
      }
    }

    return cols;
  });

  hasDayEvents = computed(
    () => this.allDayEvents().length > 0 || this.timedEventsForDay().length > 0,
  );

  constructor() {
afterNextRender(() => {
      const el = this.hostRef.nativeElement;
      const syncCompact = (width: number) => {
        this.isCompactHost.set(width < COMPACT_DAY_VIEW_WIDTH_PX);
      };

      syncCompact(el.clientWidth);

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? el.clientWidth;
        syncCompact(width);
      });
      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  isTodaySelected(): boolean {
    const now = new Date();
    const selected = this.selectedDate();
    return (
      selected.getFullYear() === now.getFullYear()
      && selected.getMonth() === now.getMonth()
      && selected.getDate() === now.getDate()
    );
  }

  formatHour(hour: number): string {
    return hour === 0 ? '' : `${hour.toString().padStart(2, '0')}:00`;
  }

  formatEventTime(event: CalendarEvent): string {
    const fmt = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${fmt(event.startDate)} – ${fmt(event.endDate)}`;
  }

  formatEventStart(event: CalendarEvent): string {
    const date = event.startDate;
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  eventDensity(height: number): TimedEventDensity {
    if (height < MIN_EVENT_LABEL_HEIGHT_PX) {
      return 'micro';
    }
    if (height < 52) {
      return 'compact';
    }
    return 'comfortable';
  }

  showEventTime(height: number): boolean {
    return height >= MIN_EVENT_LABEL_HEIGHT_PX;
  }

  eventColumnLeft(column: EventColumn): string {
    return `${(column.col / column.totalCols) * 100}%`;
  }

  eventColumnWidth(column: EventColumn): string {
    const gap = column.totalCols > 1 ? 4 : 8;
    return `calc(${100 / column.totalCols}% - ${gap}px)`;
  }

  getColor(event: CalendarEvent): string {
    return this.calendarColors()[event.calendarId] ?? '#64748b';
  }

  getTop(event: CalendarEvent): number {
    const hourHeight = this.effectiveHourHeight();
    return (event.startDate.getHours() * 60 + event.startDate.getMinutes()) * (hourHeight / 60);
  }

  getHeight(event: CalendarEvent): number {
    const hourHeight = this.effectiveHourHeight();
    const durationHeight =
      ((event.endDate.getTime() - event.startDate.getTime()) / 60000) * (hourHeight / 60);
    return Math.max(durationHeight, MIN_EVENT_HEIGHT_PX);
  }

  currentTimeTop(): number {
    const now = new Date();
    const hourHeight = this.effectiveHourHeight();
    return (now.getHours() * 60 + now.getMinutes()) * (hourHeight / 60);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate()
    );
  }
}
