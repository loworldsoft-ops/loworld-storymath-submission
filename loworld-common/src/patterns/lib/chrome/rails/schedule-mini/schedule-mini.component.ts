import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';

/**
 * 날짜 탐색 및 선택을 위한 미니 월간 달력 레일 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-schedule-mini-rail',
  standalone: true,
  templateUrl: './schedule-mini.component.html',
  styleUrl: './schedule-mini.component.scss',
})
export class LwScheduleMiniRailComponent {
  selectedDate = input.required<Date>();
selectDate = output<Date>();

  dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  private displayYear = signal(new Date().getFullYear());
  private displayMonthSig = signal(new Date().getMonth());

  displayMonth = computed(() => this.displayMonthSig());

  monthLabel = computed(() => `${this.displayMonthSig() + 1}\uC6D4 ${this.displayYear()}`);

  miniDays = computed((): Date[] => {
    const first = new Date(this.displayYear(), this.displayMonthSig(), 1);
    const startDay = first.getDay();
    const start = new Date(first);
    start.setDate(start.getDate() - startDay);

    const last = new Date(this.displayYear(), this.displayMonthSig() + 1, 0);
    const endDay = last.getDay();
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - endDay));

    const days: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  });

  prevMonth(): void {
    if (this.displayMonthSig() === 0) {
      this.displayYear.update(y => y - 1);
      this.displayMonthSig.set(11);
    } else {
      this.displayMonthSig.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.displayMonthSig() === 11) {
      this.displayYear.update(y => y + 1);
      this.displayMonthSig.set(0);
    } else {
      this.displayMonthSig.update(m => m + 1);
    }
  }

  onDayClick(day: Date): void {
    this.selectDate.emit(day);
  }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  isToday(d: Date): boolean {
    const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }
}
