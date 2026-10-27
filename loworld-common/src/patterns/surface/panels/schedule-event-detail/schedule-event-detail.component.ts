import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwTextareaComponent } from '../../../../ui/form/textarea/textarea.component';
import { LwSelectComponent } from '../../../../ui/form/select/select.component';
import { LwCheckboxComponent } from '../../../../ui/form/checkbox/checkbox.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, CalendarInfo, EventType, Recurrence } from '../../../../services/models/schedule.model';

export type DetailPanelMode = 'form' | 'detail' | 'list';

export interface EventFormData {
  title: string;
  date: string;
  type: EventType;
  calendarId: string;
  description: string;
  location: string;
  videoLink: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  isPublic: boolean;
  recurrenceType: 'none' | Recurrence['type'];
  recurrenceInterval: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-event-detail',
  standalone: true,
  imports: [FormsModule, LwButtonComponent, LwInputComponent, LwTextareaComponent, LwSelectComponent, LwCheckboxComponent, LwFormFieldComponent],
  templateUrl: './schedule-event-detail.component.html',
  styleUrl: './schedule-event-detail.component.scss',
})
export class LwScheduleEventDetailComponent {
  selectedDate = input.required<Date>();
  events = input.required<CalendarEvent[]>();
  calendars = input.required<CalendarInfo[]>();
  calendarColors = input<Record<string, string>>({});
  selectedEventId = input<string | null>(null);
  isCreating = input(false);
  draftType = input<EventType>('event');
use24Hour = input(true);

  close = output<void>();
  saveEvent = output<EventFormData>();
  updateEvent = output<{ id: string; data: EventFormData }>();
  deleteEvent = output<string>();
  selectEventId = output<string | null>();

  private editingId = signal<string | null>(null);

  formTitle = '';
  formDate = '';
  formType: EventType = 'event';
  formCalendarId = '';
  formDescription = '';
  formLocation = '';
  formVideoLink = '';
  formIsAllDay = false;
  formStartTime = '09:00';
  formEndTime = '10:00';
  formIsPublic = true;
  recurrenceType: 'none' | Recurrence['type'] = 'none';
  recurrenceInterval = 1;

  eventTypes: { value: EventType; label: string }[] = [
    { value: 'event', label: '\uC77C\uC815' },
    { value: 'task', label: '\uD560 \uC77C' },
    { value: 'birthday', label: '\uC0DD\uC77C' },
  ];

  recurrenceOptions: { value: 'none' | Recurrence['type']; label: string }[] = [
    { value: 'none', label: '\uBC18\uBCF5 \uC548 \uD568' },
    { value: 'daily', label: '\uB9E4\uC77C' },
    { value: 'weekly', label: '\uB9E4\uC8FC' },
    { value: 'monthly', label: '\uB9E4\uC6D4' },
    { value: 'yearly', label: '\uB9E4\uB144' },
  ];

  selectedEvent = computed(() => {
    const id = this.selectedEventId();
    return id ? this.events().find(e => e.id === id) ?? null : null;
  });

  editableCalendars = computed(() =>
    this.calendars().filter(c => !c.isReadOnly)
  );

  dayEvents = computed(() => {
    const d = this.selectedDate();
    return this.events()
      .filter(e => e.startDate.getFullYear() === d.getFullYear() && e.startDate.getMonth() === d.getMonth() && e.startDate.getDate() === d.getDate())
      .sort((a, b) => {
        if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
        return a.startDate.getTime() - b.startDate.getTime();
      });
  });

  currentMode = computed((): DetailPanelMode => {
    if (this.isCreating() || this.editingId()) return 'form';
    if (this.selectedEvent()) return 'detail';
    return 'list';
  });

  panelTitle = computed(() => {
    if (this.isCreating()) return `${this.typeLabel(this.formType)} \uCD94\uAC00`;
    if (this.editingId()) return `${this.typeLabel(this.formType)} \uC218\uC815`;
    return this.selectedEvent() ? '\uC77C\uC815 \uC0C1\uC138' : '\uC77C\uC815 \uBAA9\uB85D';
  });

  showBackButton = computed(() => this.currentMode() === 'detail' || !!this.editingId());

  canSave = computed(() => this.formTitle.trim().length > 0 && !!this.formDate && !!this.formCalendarId);

  constructor() {

    effect(() => {
      const d = this.selectedDate();
      if (this.isCreating()) {
        this.initForm(d, null, this.draftType());
      }
      const eid = this.editingId();
      if (eid) {
        const ev = this.events().find(e => e.id === eid);
        if (ev) this.initForm(ev.startDate, ev, ev.type);
      }
    });
  }

  back(): void {
    if (this.editingId()) { this.editingId.set(null); return; }
    this.selectEventId.emit(null);
  }

  onSelectEvent(ev: CalendarEvent): void {
    this.editingId.set(null);
    this.selectEventId.emit(ev.id);
  }

  startEdit(): void {
    const ev = this.selectedEvent();
    if (ev) this.editingId.set(ev.id);
  }

  cancelForm(): void {
    if (this.editingId()) { this.editingId.set(null); return; }
    this.close.emit();
  }

  saveForm(): void {
    const data = this.collectFormData();
    if (!data) return;
    if (this.editingId()) {
      this.updateEvent.emit({ id: this.editingId()!, data });
      this.editingId.set(null);
    } else {
      this.saveEvent.emit(data);
    }
  }

  formatSchedule(ev: CalendarEvent): string {
    if (ev.isAllDay) return '\uC885\uC77C';
    const fmt = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${fmt(ev.startDate)} \u2013 ${fmt(ev.endDate)}`;
  }

  recurrenceLabel(r: Recurrence): string {
    const labels: Record<string, string> = { daily: '\uB9E4\uC77C', weekly: '\uB9E4\uC8FC', monthly: '\uB9E4\uC6D4', yearly: '\uB9E4\uB144' };
    return r.interval > 1 ? `${r.interval}${this.intervalUnit(r.type)}\uB9C8\uB2E4` : labels[r.type];
  }

  getColor(ev: CalendarEvent): string {
    return this.calendarColors()[ev.calendarId] ?? '#888';
  }

  formatListDate(): string {
    const d = this.selectedDate();
    const dow = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'][d.getDay()];
    return `${d.getFullYear()}\uB144 ${d.getMonth() + 1}\uC6D4 ${d.getDate()}\uC77C (${dow})`;
  }

  private initForm(date: Date, ev: CalendarEvent | null, type: EventType): void {
    const cals = this.editableCalendars();
    this.formTitle = ev?.title ?? '';
    this.formDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    this.formType = ev?.type ?? type;
    this.formCalendarId = ev?.calendarId ?? cals[0]?.id ?? '';
    this.formDescription = ev?.description ?? '';
    this.formLocation = ev?.location ?? '';
    this.formVideoLink = ev?.videoLink ?? '';
    this.formIsAllDay = ev?.isAllDay ?? false;
    const fmtTime = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    this.formStartTime = ev ? fmtTime(ev.startDate) : '09:00';
    this.formEndTime = ev ? fmtTime(ev.endDate) : '10:00';
    this.formIsPublic = ev?.isPublic ?? true;
    this.recurrenceType = ev?.recurrence?.type ?? 'none';
    this.recurrenceInterval = ev?.recurrence?.interval ?? 1;
  }

  private collectFormData(): EventFormData | null {
    const title = this.formTitle.trim();
    if (!title || !this.formDate || !this.formCalendarId) return null;
    return {
      title, date: this.formDate, type: this.formType,
      calendarId: this.formCalendarId, description: this.formDescription.trim(),
      location: this.formLocation.trim(), videoLink: this.formVideoLink.trim(),
      isAllDay: this.formIsAllDay, startTime: this.formStartTime, endTime: this.formEndTime,
      isPublic: this.formIsPublic, recurrenceType: this.recurrenceType,
      recurrenceInterval: this.recurrenceInterval,
    };
  }

  private typeLabel(type: EventType): string {
    return type === 'task' ? '\uD560 \uC77C' : type === 'birthday' ? '\uC0DD\uC77C' : '\uC77C\uC815';
  }

  private intervalUnit(type: string): string {
    return type === 'daily' ? '\uC77C' : type === 'weekly' ? '\uC8FC' : type === 'monthly' ? '\uAC1C\uC6D4' : '\uB144';
  }
}
