import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CalendarInfo, CalendarFilter } from '../../../../../services/models/schedule.model';
import { LwScheduleMiniRailComponent } from '../schedule-mini/schedule-mini.component';
import { LwListViewComponent } from '../../../../../ui/list/list-view/list-view.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwCheckboxComponent } from '../../../../../ui/form/checkbox/checkbox.component';
import { LwCardComponent } from '../../../../../ui/data-display/card/card.component';
import { LwScheduleActionRowComponent } from '../../../../collection/items/schedule-list-item/schedule-list-item.component';
import { LwSidebarProfileCardComponent } from '../../../../surface/panels/sidebar-profile-card/sidebar-profile-card.component';
import { LucideAngularModule, Calendar, BarChart3, Timer, Trash2, Settings, IconData } from 'lucide-angular';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: IconData;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-sidebar',
  standalone: true,
  imports: [
    LwScheduleMiniRailComponent,
    LwListViewComponent,
    LwScheduleActionRowComponent,
    LwSidebarProfileCardComponent,
    LwButtonComponent,
    LwCheckboxComponent,
    LwCardComponent,
    LucideAngularModule,
  ],
  templateUrl: './schedule-sidebar.component.html',
  styleUrl: './schedule-sidebar.component.scss',
})
export class LwScheduleSidebarComponent {
  protected readonly trackCalendar = (c: CalendarInfo) => c.id;

  selectedDate = input.required<Date>();
  calendars = input.required<CalendarInfo[]>();
  filter = input.required<CalendarFilter>();
  isOpen = input(true);
  isMobile = input(false);
  activeNav = input('calendar');
  navItems = input<SidebarNavItem[]>([
    { id: 'calendar', label: '캘린더', icon: Calendar },
    { id: 'statistics', label: '통계', icon: BarChart3 },
    { id: 'pomodoro', label: '뽀모도로', icon: Timer },
    { id: 'trash', label: '휴지통', icon: Trash2 },
  ]);
  loginLabel = input('로그인을 해주세요.');
  /** 모바일 더보기 프로필 카드 상단 — 닉네임 등 */
  profileHeadline = input('');
  profileImageUrl = input<string | null>(null);
  profileInitial = input('');
  appIconSrc = input('');
  points = input(0);
  showPoints = input(false);

  SettingsIcon = Settings;
  selectDate = output<Date>();
  navigate = output<string>();
  openSettings = output<void>();
  toggleCalendar = output<string>();
  addCalendar = output<void>();
  addSubscription = output<void>();
  renameCalendar = output<{ id: string; name: string }>();
  changeCalendarColor = output<{ id: string; color: string }>();
  deleteCalendar = output<string>();
  filterChange = output<Partial<CalendarFilter>>();
  close = output<void>();
  login = output<void>();

  myExpanded = signal(true);
  subExpanded = signal(true);

  filterItems = [
    { key: 'showEvents' as const, label: '\uC77C\uC815' },
    { key: 'showTasks' as const, label: '\uD560 \uC77C' },
    { key: 'showBirthdays' as const, label: '\uC0DD\uC77C' },
  ];

  myCalendars = computed(() => this.calendars().filter(c => !c.isSubscribed));
  subCalendars = computed(() => this.calendars().filter(c => c.isSubscribed));

  getFilterValue(key: string): boolean {
    return (this.filter() as unknown as Record<string, unknown>)[key] as boolean ?? true;
  }

  onFilterChange(key: string): void {
    const current = this.filter() as unknown as Record<string, unknown>;
    this.filterChange.emit({ [key]: !current[key] } as Partial<CalendarFilter>);
  }
}
