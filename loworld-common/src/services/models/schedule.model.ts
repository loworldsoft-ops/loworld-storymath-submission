export type CalendarView = 'month' | 'week' | 'day' | 'year' | 'agenda';

export interface ViewOption {
  value: CalendarView;
  label: string;
  labelFull: string;
}

export type EventType = 'event' | 'task' | 'birthday';
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'pending';

export interface Attendee {
  name: string;
  email: string;
  status: AttendeeStatus;
}

export interface Recurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  count?: number;
  endDate?: Date;
}

export interface Reminder {
  id: string;
  minutes: number;
  method: 'push' | 'email';
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  type: EventType;
  title: string;
  description?: string;
  location?: string;
  videoLink?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  isPublic: boolean;
  recurrence?: Recurrence;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  isCompleted?: boolean;
  taskCategory?: string;
  pomodoroMinutes?: number;
  attendees?: Attendee[];
  birthdayType?: 'lunar' | 'solar';
  isLeapMonth?: boolean;
  reminders?: Reminder[];
}

export interface CalendarInfo {
  id: string;
  name: string;
  accountId: string;
  type: 'personal' | 'work' | 'class';
  color: string;
  isVisible: boolean;
  isSubscribed: boolean;
  isReadOnly: boolean;
  isPublic: boolean;
  subscriptionProvider?: string;
  iCalUrl?: string;
  lastSyncedAt?: Date;
  syncInterval?: number;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  syncErrorMessage?: string;
}

export interface SubscriptionProvider {
  key: string;
  label: string;
  color: string;
  sampleUrl: string;
  guideSteps: string[];
}

export interface SubscriptionRequest {
  url: string;
  name: string;
  color: string;
  provider: string;
}

export interface CalendarTrashItem {
  event: CalendarEvent;
  deletedAt: Date;
  expiresAt: Date;
}

export interface CalendarFilter {
  showEvents: boolean;
  showTasks: boolean;
  showBirthdays: boolean;
  showHolidays: boolean;
  visibleCalendars: string[];
}

export interface NotificationSettings {
  newEvent: boolean;
  eventChange: boolean;
  eventCancel: boolean;
  attendeeResponse: boolean;
  channels: { email: boolean; push: boolean };
}

export interface CalendarSettings {
  language: 'ko' | 'en' | 'ja' | 'zh' | 'system';
  region: string;
  timezone: string;
  weekStartsOn: number;
  defaultEventDuration: number;
  theme: 'light' | 'dark';
  scale: number;
  holidayCountries: string[];
  enableOfflineMode: boolean;
  enableShortcuts: boolean;
  notificationSettings: NotificationSettings;
  calendarTheme: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  showLunar: boolean;
  showSonEomneunNal: boolean;
  use24Hour: boolean;
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface ThemeColors {
  accent: string;
  hover: string;
}
