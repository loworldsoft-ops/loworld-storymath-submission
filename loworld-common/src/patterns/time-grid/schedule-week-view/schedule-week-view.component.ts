import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CalendarEvent } from '../../../services/models/schedule.model';

const HOUR_HEIGHT = 60;
const MOBILE_HOUR_HEIGHT = 48;

@Component({
  selector: 'lw-schedule-week-grid',
  standalone: true,
  templateUrl: './schedule-week-view.component.html',
  styleUrl: './schedule-week-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScheduleWeekGridComponent {
  weekDays = input.required<Date[]>();
  selectedDate = input.required<Date>();
  filteredEvents = input.required<CalendarEvent[]>();
  calendarColors = input<Record<string, string>>({});
  isMobile = input(false);

  selectEvent = output<string>();

  hours = Array.from({ length: 24 }, (_, i) => i);
  hourHeight = HOUR_HEIGHT;

  effectiveHourHeight = computed(() => this.isMobile() ? MOBILE_HOUR_HEIGHT : HOUR_HEIGHT);

  displayDays = computed(() => {
    if (!this.isMobile()) return this.weekDays();
    // Mobile: show 3 days centered on selectedDate
    const sel = this.selectedDate();
    const yesterday = new Date(sel); yesterday.setDate(sel.getDate() - 1);
    const tomorrow = new Date(sel); tomorrow.setDate(sel.getDate() + 1);
    return [yesterday, new Date(sel), tomorrow];
  });

  showAllDayRow = computed(() =>
    this.displayDays().some(d => this.getAllDayEvents(d).length > 0)
  );

  formatDow(day: Date): string {
    return ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'][day.getDay()];
  }

  formatHour(h: number): string {
    return h === 0 ? '' : `${h.toString().padStart(2, '0')}:00`;
  }

  formatTime(ev: CalendarEvent): string {
    const fmt = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${fmt(ev.startDate)}\u2013${fmt(ev.endDate)}`;
  }

  isToday(d: Date): boolean {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  getAllDayEvents(day: Date): CalendarEvent[] {
    return this.filteredEvents().filter(e =>
      e.isAllDay && this.isSameDay(e.startDate, day)
    );
  }

  getTimedEvents(day: Date): CalendarEvent[] {
    return this.filteredEvents().filter(e =>
      !e.isAllDay && this.isSameDay(e.startDate, day)
    ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  getColor(ev: CalendarEvent): string {
    return this.calendarColors()[ev.calendarId] ?? '#888';
  }

  getTop(ev: CalendarEvent): number {
    const h = this.isMobile() ? MOBILE_HOUR_HEIGHT : HOUR_HEIGHT;
    return (ev.startDate.getHours() * 60 + ev.startDate.getMinutes()) * (h / 60);
  }

  getHeight(ev: CalendarEvent): number {
    const h = this.isMobile() ? MOBILE_HOUR_HEIGHT : HOUR_HEIGHT;
    const mins = (ev.endDate.getTime() - ev.startDate.getTime()) / 60000;
    return Math.max(mins * (h / 60), 20);
  }

  hasCurrentWeek(): boolean {
    const now = new Date();
    return this.displayDays().some(d => this.isSameDay(d, now));
  }

  currentTimeTop(): number {
    const now = new Date();
    const h = this.isMobile() ? MOBILE_HOUR_HEIGHT : HOUR_HEIGHT;
    return (now.getHours() * 60 + now.getMinutes()) * (h / 60);
  }
}
