import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarEvent } from '../../../services/models/schedule.model';

@Component({
  imports: [CommonModule, LwButtonComponent, LwCardComponent],
  selector: 'lw-schedule-year-grid',
  standalone: true,
  templateUrl: './schedule-year-view.component.html',
  styleUrl: './schedule-year-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScheduleYearGridComponent {
  selectedDate = input.required<Date>();
  events = input.required<CalendarEvent[]>();
  isMobile = input(false);

  goToMonth = output<Date>();
  goToDay = output<Date>();

  dayHeaders = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];

  get months(): Date[] {
    const year = this.selectedDate().getFullYear();
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }

  getMonthDays(month: Date): Date[] {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startDay = first.getDay();
    const start = new Date(first);
    start.setDate(start.getDate() - startDay);

    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const endDay = last.getDay();
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - endDay));

    const days: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  isSameMonth(d: Date, m: Date): boolean {
    return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
  }

  isToday(d: Date): boolean {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  isCurrentMonth(m: Date): boolean {
    const now = new Date();
    return m.getMonth() === now.getMonth() && m.getFullYear() === now.getFullYear();
  }

  hasEvents(day: Date): boolean {
    return this.events().some(e =>
      e.startDate.getFullYear() === day.getFullYear()
      && e.startDate.getMonth() === day.getMonth()
      && e.startDate.getDate() === day.getDate()
    );
  }

  onDayClick(day: Date, month: Date): void {
    if (this.isSameMonth(day, month)) {
      this.goToDay.emit(day);
    }
  }
}
