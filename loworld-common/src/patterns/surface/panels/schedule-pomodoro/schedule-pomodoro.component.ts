import { CommonModule } from '@angular/common';

import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { Component, input, output, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

type PomodoroMode = 'work' | 'break';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent, LwCardComponent],
  selector: 'lw-schedule-pomodoro',
  standalone: true,
  templateUrl: './schedule-pomodoro.component.html',
  styleUrl: './schedule-pomodoro.component.scss',
})
export class LwSchedulePomodoroComponent implements OnDestroy {
sessionComplete = output<{ mode: PomodoroMode; seconds: number }>();

  mode = signal<PomodoroMode>('work');
  running = signal(false);
  remaining = signal(WORK_SECONDS);
  todaySessions = signal(0);

  private timerId: ReturnType<typeof setInterval> | null = null;
  readonly circumference = 2 * Math.PI * 88;

  display = computed(() => {
    const s = this.remaining();
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  });

  dashOffset = computed(() => {
    const total = this.mode() === 'work' ? WORK_SECONDS : BREAK_SECONDS;
    return this.circumference * (1 - this.remaining() / total);
  });

  toggle(): void {
    if (this.running()) {
      this.pause();
    } else {
      this.start();
    }
  }

  setMode(m: PomodoroMode): void {
    this.pause();
    this.mode.set(m);
    this.remaining.set(m === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  }

  reset(): void {
    this.pause();
    this.remaining.set(this.mode() === 'work' ? WORK_SECONDS : BREAK_SECONDS);
  }

  skip(): void {
    this.pause();
    this.finishSession();
  }

  ngOnDestroy(): void {
    this.pause();
  }

  private start(): void {
    this.running.set(true);
    this.timerId = setInterval(() => {
      const r = this.remaining() - 1;
      if (r <= 0) {
        this.remaining.set(0);
        this.pause();
        this.finishSession();
      } else {
        this.remaining.set(r);
      }
    }, 1000);
  }

  private pause(): void {
    this.running.set(false);
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  private finishSession(): void {
    const total = this.mode() === 'work' ? WORK_SECONDS : BREAK_SECONDS;
    this.sessionComplete.emit({ mode: this.mode(), seconds: total - this.remaining() });
    if (this.mode() === 'work') {
      this.todaySessions.update(s => s + 1);
      this.setMode('break');
    } else {
      this.setMode('work');
    }
  }
}
