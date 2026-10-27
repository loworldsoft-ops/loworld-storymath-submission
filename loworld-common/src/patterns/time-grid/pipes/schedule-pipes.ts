import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lwFormatTime',
  standalone: true,
  pure: true,
})
export class LwFormatTimePipe implements PipeTransform {
  transform(value: Date | string | number | null | undefined): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

@Pipe({
  name: 'lwCalendarColor',
  standalone: true,
  pure: true,
})
export class LwScheduleColorPipe implements PipeTransform {
  transform(
    calendarId: string | null | undefined,
    calendarColors: Record<string, string> | null | undefined,
    opacityHex?: string,
  ): string {
    if (!calendarId) return '#888888';
    const baseColor = (calendarColors && calendarColors[calendarId]) || '#888888';
    return opacityHex ? `${baseColor}${opacityHex}` : baseColor;
  }
}

export const LwCalendarColorPipe = LwScheduleColorPipe;
