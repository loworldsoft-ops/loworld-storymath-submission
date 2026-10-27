import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CalendarView, CalendarEvent, CalendarDay, EventType } from '../../../services/models/schedule.model';
import { LwScheduleMonthGridComponent } from '../schedule-month-view/schedule-month-view.component';
import { LwScheduleWeekGridComponent } from '../schedule-week-view/schedule-week-view.component';
import { LwScheduleDayGridComponent } from '../schedule-day-view/schedule-day-view.component';
import { LwScheduleYearGridComponent } from '../schedule-year-view/schedule-year-view.component';
import { LwScheduleAgendaComponent } from '../schedule-agenda-view/schedule-agenda-view.component';

/**
 * 주간 및 월간 타임 그리드로 일정을 렌더링하는 캘린더 뷰 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-view',
  standalone: true,
  imports: [
    LwScheduleMonthGridComponent,
    LwScheduleWeekGridComponent,
    LwScheduleDayGridComponent,
    LwScheduleYearGridComponent,
    LwScheduleAgendaComponent,
  ],
  templateUrl: './schedule-view.component.html',
  styleUrl: './schedule-view.component.scss',
})
export class LwScheduleViewComponent {
  currentView = input.required<CalendarView>();
  selectedDate = input.required<Date>();
  monthDays = input.required<CalendarDay[]>();
  weekDays = input.required<Date[]>();
  filteredEvents = input.required<CalendarEvent[]>();
  calendarColors = input<Record<string, string>>({});
  isMobile = input(false);

  selectDate = output<Date>();
  selectEvent = output<string>();
  createEvent = output<{ date: Date; type: EventType }>();
  toggleTask = output<string>();
  prevDay = output<void>();
  nextDay = output<void>();
  goToMonth = output<Date>();
  goToDay = output<Date>();
  selectEventFromAgenda = output<{ eventId: string; date: Date }>();
}
