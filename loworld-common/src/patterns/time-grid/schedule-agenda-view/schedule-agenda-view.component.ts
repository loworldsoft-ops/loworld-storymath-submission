import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CalendarEvent, CalendarDay } from '../../../services/models/schedule.model';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';

export interface AgendaEventVm extends CalendarEvent {
  color: string;
  formattedStartTime: string;
  formattedEndTime: string;
}

export interface AgendaDayVm {
  date: Date;
  dom: number;
  dowLabel: string;
  isToday: boolean;
  isSunday: boolean;
  events: AgendaEventVm[];
}

@Component({
  selector: 'lw-schedule-agenda',
  standalone: true,
  imports: [LwCardComponent],
  templateUrl: './schedule-agenda-view.component.html',
  styleUrl: './schedule-agenda-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScheduleAgendaComponent {
  monthDays = input.required<CalendarDay[]>();
  selectedDate = input.required<Date>();
  filteredEvents = input.required<CalendarEvent[]>();
  calendarColors = input<Record<string, string>>({});
  selectEvent = output<{ eventId: string; date: Date }>();

  private readonly DOW = ['일', '월', '화', '수', '목', '금', '토'];

  daysWithEvents = computed((): AgendaDayVm[] => {
    const sel = this.selectedDate();
    const events = this.filteredEvents();
    const colors = this.calendarColors();
    const now = new Date();

    const days = this.monthDays()
      .filter(d => d.isCurrentMonth || this.isSameDay(d.date, sel))
      .map(d => {
        const isToday =
          d.date.getFullYear() === now.getFullYear() &&
          d.date.getMonth() === now.getMonth() &&
          d.date.getDate() === now.getDate();

        const dayEvents: AgendaEventVm[] = events
          .filter(e => this.isSameDay(e.startDate, d.date))
          .sort((a, b) => {
            if (a.isAllDay && !b.isAllDay) return -1;
            if (!a.isAllDay && b.isAllDay) return 1;
            return a.startDate.getTime() - b.startDate.getTime();
          })
          .map(e => ({
            ...e,
            color: colors[e.calendarId] ?? '#888',
            formattedStartTime: this.formatTime(e.startDate),
            formattedEndTime: this.formatTime(e.endDate),
          }));

        return {
          date: d.date,
          dom: d.date.getDate(),
          dowLabel: this.DOW[d.date.getDay()],
          isToday,
          isSunday: d.date.getDay() === 0,
          events: dayEvents,
        };
      })
      .filter(d => d.events.length > 0);
    return days;
  });

  private formatTime(d: Date): string {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
