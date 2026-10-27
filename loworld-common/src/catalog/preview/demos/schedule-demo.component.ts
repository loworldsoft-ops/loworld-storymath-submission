import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, signal, computed, inject } from '@angular/core';
import type { ComponentMeta, OverviewThemeMode } from '../../../services/models/os.types';
import { CALENDAR_REPOSITORY } from '../../../services/ports/schedule-repository.token';
import type { CalendarDay, CalendarView, CalendarSettings, CalendarEvent, SubscriptionProvider, EventType } from '../../../services/models/schedule.model';
import { LwScheduleMonthGridComponent } from '../../../patterns/time-grid/schedule-month-view/schedule-month-view.component';
import { LwScheduleWeekGridComponent } from '../../../patterns/time-grid/schedule-week-view/schedule-week-view.component';
import { LwScheduleDayGridComponent } from '../../../patterns/time-grid/schedule-day-view/schedule-day-view.component';
import { LwScheduleYearGridComponent } from '../../../patterns/time-grid/schedule-year-view/schedule-year-view.component';
import { LwScheduleAgendaComponent } from '../../../patterns/time-grid/schedule-agenda-view/schedule-agenda-view.component';
import { LwScheduleHeaderComponent } from '../../../patterns/time-grid/schedule-header/schedule-header.component';
import { LwScheduleSidebarComponent } from '../../../patterns/lib/chrome/rails/schedule-sidebar/schedule-sidebar.component';
import { LwScheduleSubscriptionDialogComponent } from '../../../patterns/lib/overlay/dialogs/schedule-subscription-modal/schedule-subscription-modal.component';
import { LwScheduleEventDetailComponent } from '../../../patterns/surface/panels/schedule-event-detail/schedule-event-detail.component';
import { LwScheduleSettingsComponent } from '../../../patterns/surface/panels/schedule-settings/schedule-settings.component';
import { LwScheduleTrashPanelComponent } from '../../../patterns/surface/panels/schedule-trash/schedule-trash.component';
import { LwSchedulePomodoroComponent } from '../../../patterns/surface/panels/schedule-pomodoro/schedule-pomodoro.component';
import { LwScheduleStatisticsComponent } from '../../../patterns/surface/panels/schedule-statistics/schedule-statistics.component';
import { SAMPLE_CALENDARS, SAMPLE_EVENTS, SAMPLE_FILTER, buildMonthDays, buildWeekDays } from '../../../services/data/layout-sample-data';
import { Calendar, BarChart3, Timer, Trash2 } from 'lucide-angular';
import type { SidebarNavItem } from '../../../patterns/lib/chrome/rails/schedule-sidebar/schedule-sidebar.component';

const calToday = new Date();

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const MOCK_PROVIDERS: SubscriptionProvider[] = [
  { key: 'google', label: 'Google Calendar', color: '#4285f4', sampleUrl: 'https://calendar.google.com/calendar/ical/...', guideSteps: ['Google Calendar 열기', '설정 > 캘린더 내보내기', 'ICS 링크 복사'] },
  { key: 'apple', label: 'Apple Calendar', color: '#000', sampleUrl: 'webcal://...', guideSteps: ['iCloud 열기', '캘린더 공유 활성화', '링크 복사'] },
];

const DEFAULT_CAL_SETTINGS: CalendarSettings = {
  language: 'ko',
  region: 'KR',
  timezone: 'Asia/Seoul',
  weekStartsOn: 0,
  defaultEventDuration: 60,
  theme: 'light',
  scale: 100,
  holidayCountries: ['KR'],
  enableOfflineMode: false,
  enableShortcuts: true,
  notificationSettings: {
    newEvent: true,
    eventChange: true,
    eventCancel: true,
    attendeeResponse: true,
    channels: { email: true, push: true },
  },
  calendarTheme: 'blue',
  showLunar: true,
  showSonEomneunNal: false,
  use24Hour: false,
};

import { LwScheduleItemMenuComponent } from '../../../patterns/collection/items/schedule-item-menu/schedule-item-menu.component';
import { LwScheduleActionRowComponent } from '../../../patterns/collection/items/schedule-list-item/schedule-list-item.component';
import { LwScheduleMiniRailComponent } from '../../../patterns/lib/chrome/rails/schedule-mini/schedule-mini.component';
import { LwSidebarProfileCardComponent } from '../../../patterns/surface/panels/sidebar-profile-card/sidebar-profile-card.component';
import { LwSyncStateChipComponent } from '../../../patterns/collection/items/sync-state-chip/sync-state-chip.component';
import { LwListViewComponent } from '../../../ui/list/list-view/list-view.component';
import { LwMenuComponent } from '../../../ui/overlay/menu/menu.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-demo',
  standalone: true,
  imports: [
    LwScheduleMonthGridComponent,
    LwScheduleWeekGridComponent,
    LwScheduleDayGridComponent,
    LwScheduleYearGridComponent,
    LwScheduleAgendaComponent,
    LwScheduleSidebarComponent,
    LwScheduleHeaderComponent,
    LwScheduleEventDetailComponent,
    LwScheduleSettingsComponent,
    LwScheduleTrashPanelComponent,
    LwSchedulePomodoroComponent,
    LwScheduleStatisticsComponent,
    LwScheduleSubscriptionDialogComponent,
    LwButtonComponent,
    LwScheduleItemMenuComponent,
    LwScheduleActionRowComponent,
    LwScheduleMiniRailComponent,
    LwSidebarProfileCardComponent,
    LwSyncStateChipComponent,
    LwListViewComponent,
    LwMenuComponent,
  ],
  templateUrl: './schedule-demo.component.html',
  styleUrl: './schedule-demo.component.scss',
})
export class ScheduleDemoComponent {
  readonly comp = input.required<ComponentMeta>();
  readonly themeMode = input<OverviewThemeMode>('light');

  private readonly calDb = inject(CALENDAR_REPOSITORY);

  // ── 서비스 데이터 ──
  readonly calendars      = computed(() => this.calDb.calendars());
  readonly allEvents      = computed(() => this.calDb.events());
  readonly filter         = computed(() => this.calDb.filter());
  readonly calSettings    = computed(() => this.calDb.settings() as CalendarSettings ?? DEFAULT_CAL_SETTINGS);
  readonly trashItems     = computed(() => this.calDb.trash());

  readonly calendarColors = computed(() => {
    const m: Record<string, string> = {};
    for (const c of this.calendars()) m[c.id] = c.color;
    return m;
  });

  // ── 로컬 상태 ──
  readonly selectedDate     = signal(calToday);
  readonly currentView      = signal<CalendarView>('month');
  readonly headerTitle      = computed(() => {
    const d = this.selectedDate();
    const v = this.currentView();
    if (v === 'year') return `${d.getFullYear()}년`;
    if (v === 'day') return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
    return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
  });

  readonly searchQuery      = signal('');
  readonly selectedEventId  = signal<string | null>(null);
  readonly isCreating       = signal(false);
  readonly sidebarOpen      = signal(true);
  readonly settingsOpen     = signal(false);
  readonly subscriptionOpen = signal(false);
  readonly eventDetailOpen  = signal(false);

  // ── 필터링된 이벤트 ──
  readonly filteredEvents = computed(() => {
    const f = this.filter();
    const q = this.searchQuery().toLowerCase();
    return this.allEvents().filter(ev => {
      if (!f.visibleCalendars.includes(ev.calendarId)) return false;
      if (ev.type === 'event' && !f.showEvents) return false;
      if (ev.type === 'task'  && !f.showTasks)  return false;
      if (q && !ev.title.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  // ── 월 그리드 ──
  readonly monthDays = computed((): CalendarDay[] => {
    const sel = this.selectedDate();
    const year = sel.getFullYear();
    const month = sel.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const days: CalendarDay[] = [];
    const events = this.filteredEvents();
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const isCurrentMonth = date.getMonth() === month;
      const evts: CalendarEvent[] = events.filter(e =>
        e.startDate.getFullYear() === date.getFullYear() &&
        e.startDate.getMonth() === date.getMonth() &&
        e.startDate.getDate() === date.getDate()
      );
      days.push({ date, dayNumber: date.getDate(), isCurrentMonth, isToday: isSameDay(date, calToday), events: evts });
    }
    return days;
  });

  // ── 주간 날짜 배열 ──
  readonly weekDays = computed((): Date[] => {
    const sel = this.selectedDate();
    const dayOfWeek = sel.getDay();
    const start = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  });

  readonly MOCK_PROVIDERS = MOCK_PROVIDERS;
  readonly DEFAULT_CAL_SETTINGS = DEFAULT_CAL_SETTINGS;

  // ── Shell 샘플 데이터 ──
  readonly shellToday         = calToday;
  readonly shellCalendars      = SAMPLE_CALENDARS;
  readonly shellFilter         = SAMPLE_FILTER;
  readonly shellCalendarColors = Object.fromEntries(SAMPLE_CALENDARS.map(c => [c.id, c.color]));
  readonly shellNavItems: SidebarNavItem[] = [
    { id: 'calendar',   label: '쾘린더',   icon: Calendar },
    { id: 'statistics', label: '통계',     icon: BarChart3 },
    { id: 'pomodoro',   label: '뱀모도로', icon: Timer },
    { id: 'trash',      label: '휴지통',   icon: Trash2 },
  ];
  readonly shellSelectedDate  = signal(calToday);
  readonly shellCurrentView   = signal<CalendarView>('month');
  readonly shellSidebarOpen   = signal(true);
  readonly shellActiveNav     = signal('calendar');
  readonly shellFilteredEvents = computed(() =>
    SAMPLE_EVENTS.filter(ev => SAMPLE_FILTER.visibleCalendars.includes(ev.calendarId))
  );
  readonly shellMonthDays     = computed(() => buildMonthDays(this.shellSelectedDate(), this.shellFilteredEvents()));
  readonly shellWeekDays      = computed(() => buildWeekDays(this.shellSelectedDate()));
  readonly shellHeaderTitle   = computed(() => {
    const d = this.shellSelectedDate();
    const v = this.shellCurrentView();
    if (v === 'year') return `${d.getFullYear()}년`;
    if (v === 'day') {
      const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${dow})`;
    }
    return `${d.getFullYear()}년 ${d.getMonth()+1}월`;
  });
  readonly shellMobileHeaderTitle = computed(() => {
    const d = this.shellSelectedDate();
    const v = this.shellCurrentView();
    if (v === 'year') return `${d.getFullYear()}년`;
    if (v === 'day')  return `${d.getMonth()+1}월 ${d.getDate()}일`;
    return `${d.getMonth()+1}월`;
  });

  shellNavigatePrev(): void {
    const cur = this.shellSelectedDate();
    const v = this.shellCurrentView();
    if (v === 'month') this.shellSelectedDate.set(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
    else if (v === 'week') this.shellSelectedDate.set(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7));
    else if (v === 'day')  this.shellSelectedDate.set(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1));
    else if (v === 'year') this.shellSelectedDate.set(new Date(cur.getFullYear() - 1, cur.getMonth(), 1));
  }

  shellNavigateNext(): void {
    const cur = this.shellSelectedDate();
    const v = this.shellCurrentView();
    if (v === 'month') this.shellSelectedDate.set(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
    else if (v === 'week') this.shellSelectedDate.set(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7));
    else if (v === 'day')  this.shellSelectedDate.set(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1));
    else if (v === 'year') this.shellSelectedDate.set(new Date(cur.getFullYear() + 1, cur.getMonth(), 1));
  }

  protected noop(): void {}

  protected prevDay(): void {
    const d = this.selectedDate();
    this.selectedDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  }

  protected nextDay(): void {
    const d = this.selectedDate();
    this.selectedDate.set(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  }

  protected goToToday(): void {
    this.selectedDate.set(new Date());
  }
}

export const CalendarDemoComponent = ScheduleDemoComponent;
