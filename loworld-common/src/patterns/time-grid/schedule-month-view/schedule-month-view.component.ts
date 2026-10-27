import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CalendarEvent, CalendarDay, EventType } from '../../../services/models/schedule.model';
import { LwCalendarColorPipe } from '../pipes/schedule-pipes';

@Component({
  imports: [CommonModule, LwButtonComponent, LwCalendarColorPipe],
  selector: 'lw-schedule-month-grid',
  standalone: true,
  templateUrl: './schedule-month-view.component.html',
  styleUrl: './schedule-month-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScheduleMonthGridComponent {
  readonly monthDays = input.required<CalendarDay[]>();
  readonly selectedDate = input.required<Date>();
  readonly isMobile = input(false);
  readonly calendarColors = input<Record<string, string>>({});

  readonly selectDate = output<Date>();
  readonly selectEvent = output<string>();
  readonly createEvent = output<{ date: Date; type: EventType }>();
  readonly toggleTask = output<string>();

  readonly dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
  readonly weekCount = computed(() => Math.ceil(this.monthDays().length / 7));

  readonly monthDaysWithSelection = computed(() => {
    const sel = this.selectedDate();
    const selY = sel.getFullYear();
    const selM = sel.getMonth();
    const selD = sel.getDate();
    return this.monthDays().map(day => ({
      ...day,
      isSelected:
        day.date.getFullYear() === selY &&
        day.date.getMonth() === selM &&
        day.date.getDate() === selD,
      dateIso: day.date.toISOString(),
      isSunday: day.date.getDay() === 0,
      isSaturday: day.date.getDay() === 6,
    }));
  });

  getColor(calendarId: string): string {
    return this.calendarColors()[calendarId] ?? '#888';
  }

  onEventClick(ev: CalendarEvent, e: Event): void {
    e.stopPropagation();
    this.selectEvent.emit(ev.id);
  }

  onQuickAdd(date: Date, type: EventType, e: Event): void {
    e.stopPropagation();
    this.createEvent.emit({ date, type });
  }

  onToggleTask(ev: CalendarEvent, e: Event): void {
    e.stopPropagation();
    this.toggleTask.emit(ev.id);
  }
}
