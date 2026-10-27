import { DestroyRef, Injectable, NgZone, inject, signal } from '@angular/core';
import { WINDOW } from '../../../../services/tokens/window.token';

@Injectable({ providedIn: 'root' })
export class OverviewClockStore {
  private readonly ngZone = inject(NgZone);
  private readonly win = inject(WINDOW);
  private readonly clockFormatter = new Intl.DateTimeFormat('ko-KR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  private started = false;

  readonly nowIso = signal(new Date().toISOString());
  readonly clockText = signal('');
  readonly dateText = signal('');

  start(destroyRef: DestroyRef): void {
    if (this.started || !this.win) {
      return;
    }

    const win = this.win;
    this.started = true;

    const tick = (): void => {
      const now = new Date();
      this.nowIso.set(now.toISOString());
      this.clockText.set(this.clockFormatter.format(now));
      this.dateText.set(this.dateFormatter.format(now));
    };

    tick();
    // Run setInterval outside Angular zone so it doesn't trigger full ApplicationRef.tick() every second
    this.ngZone.runOutsideAngular(() => {
      const clockId = win.setInterval(tick, 1_000);
      destroyRef.onDestroy(() => win.clearInterval(clockId));
    });
  }
}