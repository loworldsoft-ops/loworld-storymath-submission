import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';

/**
 * OS 잠금 화면 컴포넌트입니다. 시계, 디바이스 전환 및 잠금 해제 진입을 제공합니다.
 */
@Component({
  selector: 'lw-os-lock-screen',
  standalone: true,
  imports: [LwButtonComponent, LwIconComponent],
  templateUrl: './overview-os-lock-screen.component.html',
  styleUrl: './overview-os-lock-screen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewOsLockScreenComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** 모바일 화면 또는 모바일 뷰포트 여부 */
  readonly isMobile = input<boolean>(false);
  /** 현재 테마 모드 */
  readonly themeMode = input<'light' | 'dark'>('dark');

  /** 로그인 진행 중 여부 */
  readonly submitting = input<boolean>(false);

  /** 로그인 다이얼로그 열기 요청 */
  readonly loginRequested = output<void>();
  /** 디바이스 모드 전환 요청 */
  readonly deviceModeToggle = output<void>();
  /** 테마 전환 요청 */
  readonly themeToggle = output<void>();

  protected readonly currentTime = signal<string>('12:00');
  protected readonly currentDate = signal<string>('10월 2일 금요일');

  ngOnInit(): void {
    this.updateClock();
    if (typeof window !== 'undefined') {
      const timer = window.setInterval(() => this.updateClock(), 1000);
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
    }
  }

  private updateClock(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${hours}:${minutes}`);

    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const day = days[now.getDay()];
    this.currentDate.set(`${month}월 ${date}일 ${day}`);
  }
}
