import { CommonModule } from '@angular/common';
import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CalendarSettings, CalendarInfo } from '../../../../services/models/schedule.model';

type SettingsTab = 'general' | 'shortcuts' | 'sync' | 'about';

interface CalendarThemeOption { key: string; color: string; }

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: 'general', label: '\uC77C\uBC18' },
  { key: 'shortcuts', label: '\uB2E8\uCD95\uD0A4' },
  { key: 'sync', label: '\uB3D9\uAE30\uD654' },
  { key: 'about', label: '\uC815\uBCF4' },
];

const LANGUAGE_OPTIONS: { value: CalendarSettings['language']; label: string }[] = [
  { value: 'system', label: '*\uC708\uB3C4\uC6B0 \uC124\uC815 \uC0AC\uC6A9' },
  { value: 'ko', label: '\uD55C\uAD6D\uC5B4' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '\u65E5\u672C\u8A9E' },
  { value: 'zh', label: '\u4E2D\u6587' },
];

const THEME_OPTIONS: { value: CalendarSettings['theme']; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

const TIMEZONE_OPTIONS = [
  { city: '\uC11C\uC6B8', timezone: 'Asia/Seoul', regionCode: 'KR', utcLabel: 'UTC+9', label: '\uB300\uD55C\uBBFC\uAD6D \uD45C\uC900\uC2DC' },
  { city: '\uB3C4\uCFC4', timezone: 'Asia/Tokyo', regionCode: 'JP', utcLabel: 'UTC+9', label: '\uC77C\uBCF8 \uD45C\uC900\uC2DC' },
  { city: '\uB274\uC695', timezone: 'America/New_York', regionCode: 'US', utcLabel: 'UTC-4', label: '\uBBF8\uAD6D \uB3D9\uBD80 \uD45C\uC900\uC2DC' },
  { city: '\uB7F0\uB358', timezone: 'Europe/London', regionCode: 'GB', utcLabel: 'UTC+1', label: '\uC601\uAD6D \uD45C\uC900\uC2DC' },
];

const CALENDAR_THEMES: CalendarThemeOption[] = [
  { key: 'red', color: '#e74c3c' },
  { key: 'blue', color: '#3498db' },
  { key: 'green', color: '#2ecc71' },
  { key: 'purple', color: '#9b59b6' },
  { key: 'orange', color: '#e67e22' },
  { key: 'pink', color: '#e91e63' },
];

import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwSelectComponent } from '../../../../ui/form/select/select.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-settings',
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwCardComponent, LwSelectComponent],
  templateUrl: './schedule-settings.component.html',
  styleUrl: './schedule-settings.component.scss',
})
export class LwScheduleSettingsComponent {
  isOpen = input(false);
  settings = input.required<CalendarSettings>();
  calendars = input<CalendarInfo[]>([]);

  cancel = output<void>();
  saveSettings = output<Partial<CalendarSettings>>();
  syncCalendar = output<string>();
  removeSubscription = output<string>();

  subscribedCalendars = computed(() => this.calendars().filter(c => c.isSubscribed));

  appTitle = input('ezCalendar');
  appIconSrc = input('');
  version = input('1.0.0');
activeTab = signal<SettingsTab>('general');

  tabs = SETTINGS_TABS;
  languageOptions = LANGUAGE_OPTIONS;
  themeOptions = THEME_OPTIONS;
  timezoneOptions = TIMEZONE_OPTIONS;
  calendarThemes = CALENDAR_THEMES;
  generalToggles = [
    { key: 'showLunar' as const, label: '\uC74C\uB825 \uD45C\uC2DC', description: '\uB2EC\uB825\uC5D0 \uC74C\uB825 \uB0A0\uC9DC\uB97C \uC791\uAC8C \uD45C\uC2DC\uD569\uB2C8\uB2E4.' },
    { key: 'showSonEomneunNal' as const, label: '\uC190 \uC5C6\uB294 \uB0A0 \uD45C\uC2DC', description: '\uC774\uC0AC\uC640 \uD589\uC0AC\uC5D0 \uC88B\uC740 \uB0A0\uC744 \uAC15\uC870\uD569\uB2C8\uB2E4.' },
    { key: 'use24Hour' as const, label: '24\uC2DC\uAC04 \uD615\uC2DD', description: '\uC2DC\uAC04\uC744 00:00~23:59 \uD615\uC2DD\uC73C\uB85C \uD45C\uC2DC\uD569\uB2C8\uB2E4.' },
  ];

  language = signal<CalendarSettings['language']>('ko');
  theme = signal<CalendarSettings['theme']>('light');
  timezone = signal('Asia/Seoul');
  calendarTheme = signal<string>('red');
  showLunar = signal(false);
  showSonEomneunNal = signal(false);
  use24Hour = signal(true);

  syncStatusLabel(cal: CalendarInfo): string {
    if (cal.syncStatus === 'syncing') return '동기화 중';
    if (cal.syncStatus === 'synced') return '성공';
    if (cal.syncStatus === 'error') return '실패';
    return '대기';
  }

  syncStatusDescription(cal: CalendarInfo): string {
    if (cal.syncStatus === 'syncing') {
      return `마지막 동기화: ${cal.lastSyncedAt ? this.formatSyncDate(cal.lastSyncedAt) : '없음'} · ${cal.syncInterval ?? 60}분 간격`;
    }

    if (cal.lastSyncedAt) {
      return `마지막 동기화: ${this.formatSyncDate(cal.lastSyncedAt)} · ${cal.syncInterval ?? 60}분 간격`;
    }

    if (cal.syncStatus === 'error') {
      return `동기화 실패 · ${cal.syncInterval ?? 60}분 간격`;
    }

    return `아직 동기화되지 않음 · ${cal.syncInterval ?? 60}분 간격`;
  }

  private formatSyncDate(value: Date): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  hasGeneralChanges = computed(() => {
    const s = this.settings();
    return this.language() !== s.language || this.theme() !== s.theme
      || this.timezone() !== s.timezone || this.calendarTheme() !== s.calendarTheme
      || this.showLunar() !== s.showLunar || this.showSonEomneunNal() !== s.showSonEomneunNal
      || this.use24Hour() !== s.use24Hour;
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;
      const s = this.settings();
      this.language.set(s.language);
      this.theme.set(s.theme);
      this.timezone.set(s.timezone);
      this.calendarTheme.set(s.calendarTheme);
      this.showLunar.set(s.showLunar);
      this.showSonEomneunNal.set(s.showSonEomneunNal);
      this.use24Hour.set(s.use24Hour);
    });
  }

  toggleSignal(key: 'showLunar' | 'showSonEomneunNal' | 'use24Hour'): void {
    if (key === 'showLunar') this.showLunar.update(v => !v);
    if (key === 'showSonEomneunNal') this.showSonEomneunNal.update(v => !v);
    if (key === 'use24Hour') this.use24Hour.update(v => !v);
  }

  isToggleOn(key: 'showLunar' | 'showSonEomneunNal' | 'use24Hour'): boolean {
    if (key === 'showLunar') return this.showLunar();
    if (key === 'showSonEomneunNal') return this.showSonEomneunNal();
    return this.use24Hour();
  }

  resetGeneral(): void {
    this.language.set('ko'); this.theme.set('light'); this.timezone.set('Asia/Seoul');
    this.calendarTheme.set('red'); this.showLunar.set(false); this.showSonEomneunNal.set(false); this.use24Hour.set(true);
  }

  onSaveGeneral(): void {
    const tz = this.timezoneOptions.find(o => o.timezone === this.timezone()) ?? this.timezoneOptions[0];
    this.saveSettings.emit({
      language: this.language(), theme: this.theme(), timezone: tz.timezone,
      region: tz.regionCode, calendarTheme: this.calendarTheme() as CalendarSettings['calendarTheme'],
      showLunar: this.showLunar(), showSonEomneunNal: this.showSonEomneunNal(), use24Hour: this.use24Hour(),
    });
  }
}
