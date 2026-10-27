import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';

type OverviewWindowSessionButtonVariant = 'titlebar' | 'floating';

/**
 * OS 윈도우 타이틀바의 사용자 인증 세션 표시 및 계정 버튼 컴포넌트입니다.
 */
@Component({
  standalone: true,
  imports: [LwButtonComponent, OverviewIconComponent],
  selector: 'lw-os-window-session-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
  templateUrl: './overview-window-session-button.component.html',
  styleUrl: './overview-window-session-button.component.scss',
})
export class OverviewWindowSessionButtonComponent {
  session = input<LwMemberAuthSessionView | null>(null);
  variant = input<OverviewWindowSessionButtonVariant>('titlebar');
  sessionPlacement = input<'auto' | 'top' | 'bottom'>('auto');

  loginRequested = output<void>();
  accountRequested = output<void>();

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly tooltipTitle = computed(() => this.isAuthenticated() ? '로그인된 사용자' : '로그인 필요');
  readonly tooltipLines = computed(() => {
    const session = this.session();
    if (!session) {
      return ['현재 게스트 상태입니다.', '로그인하면 Canvas 저장과 계정 기능을 사용할 수 있습니다.'];
    }

    return [
      session.displayName,
      ...(session.email ? [session.email] : []),
      `권한: ${session.directoryRole ?? 'VIEWER'}`,
      '클릭하면 계정 요약을 엽니다.',
    ];
  });
  readonly ariaLabel = computed(() => this.isAuthenticated() ? '로그인된 사용자 정보' : '로그인 안내');
  readonly titleText = computed(() => this.isAuthenticated() ? '계정 정보 보기' : '로그인');

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isAuthenticated()) {
      this.accountRequested.emit();
      return;
    }

    this.loginRequested.emit();
  }
}
