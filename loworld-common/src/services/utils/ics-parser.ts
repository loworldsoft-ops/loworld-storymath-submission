import type { CalendarEvent, CalendarInfo } from '../models/schedule.model';

// ── Internal types ──
type ParsedIcsField = { params: Record<string, string>; value: string };

export type ParsedIcsEvent = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
};

// ── Line unfolding ──
function unfoldIcsLines(icsText: string): string[] {
  const normalized = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

// ── Field parsing ──
function parseIcsField(line: string): { name: string; field: ParsedIcsField } {
  const separatorIndex = line.indexOf(':');
  const rawKey = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
  const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
  const [name, ...paramParts] = rawKey.split(';');
  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const [paramKey, paramValue] = part.split('=');
    if (paramKey && paramValue) {
      params[paramKey.toUpperCase()] = paramValue;
    }
  }
  return { name: name.toUpperCase(), field: { params, value } };
}

function decodeIcsText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseIcsDateValue(value: string, params: Record<string, string>, isEnd: boolean): { date: Date; isAllDay: boolean } {
  const isAllDay = params['VALUE'] === 'DATE' || /^\d{8}$/.test(value);
  if (isAllDay) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return {
      date: isEnd
        ? new Date(year, month, day, 0, 0, -1)
        : new Date(year, month, day, 0, 0, 0),
      isAllDay: true,
    };
  }
  const compact = value.replace(/Z$/, '');
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6)) - 1;
  const day = Number(compact.slice(6, 8));
  const hour = Number(compact.slice(9, 11));
  const minute = Number(compact.slice(11, 13));
  const second = Number(compact.slice(13, 15) || '0');
  if (value.endsWith('Z')) {
    return { date: new Date(Date.UTC(year, month, day, hour, minute, second)), isAllDay: false };
  }
  return { date: new Date(year, month, day, hour, minute, second), isAllDay: false };
}

function hashString(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
}

function toCalendarEvent(calendar: CalendarInfo, parsed: ParsedIcsEvent): CalendarEvent {
  const stamp = `${parsed.uid}|${parsed.startDate.toISOString()}|${parsed.endDate.toISOString()}`;
  const now = new Date();
  return {
    id: `sub-${calendar.id}-${hashString(stamp)}`,
    calendarId: calendar.id,
    type: 'event',
    title: parsed.title,
    description: parsed.description,
    location: parsed.location,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    isAllDay: parsed.isAllDay,
    isPublic: calendar.isPublic,
    createdAt: now,
    updatedAt: now,
    ownerId: 'subscription',
  };
}

// ── Public API ──
export function parseIcsEvents(icsText: string, calendar: CalendarInfo): CalendarEvent[] {
  const lines = unfoldIcsLines(icsText);
  const events: CalendarEvent[] = [];
  let currentFields: Record<string, ParsedIcsField[]> | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      currentFields = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (!currentFields) continue;
      const uid = currentFields['UID']?.[0]?.value || crypto.randomUUID();
      const summary = decodeIcsText(currentFields['SUMMARY']?.[0]?.value) || '제목 없음';
      const description = decodeIcsText(currentFields['DESCRIPTION']?.[0]?.value);
      const location = decodeIcsText(currentFields['LOCATION']?.[0]?.value);
      const dtStartField = currentFields['DTSTART']?.[0];
      const dtEndField = currentFields['DTEND']?.[0];
      if (!dtStartField) { currentFields = null; continue; }

      const start = parseIcsDateValue(dtStartField.value, dtStartField.params, false);
      const end = dtEndField
        ? parseIcsDateValue(dtEndField.value, dtEndField.params, true)
        : {
            date: start.isAllDay
              ? new Date(start.date.getFullYear(), start.date.getMonth(), start.date.getDate(), 23, 59, 59)
              : new Date(start.date.getTime() + 60 * 60 * 1000),
            isAllDay: start.isAllDay,
          };

      events.push(toCalendarEvent(calendar, {
        uid, title: summary, description, location,
        startDate: start.date, endDate: end.date, isAllDay: start.isAllDay,
      }));
      currentFields = null;
      continue;
    }

    if (!currentFields) continue;
    const parsed = parseIcsField(line);
    currentFields[parsed.name] ??= [];
    currentFields[parsed.name].push(parsed.field);
  }

  return events;
}
