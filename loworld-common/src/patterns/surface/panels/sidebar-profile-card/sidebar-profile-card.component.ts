
import { LwAvatarComponent } from '../../../../ui/data-display/avatar/avatar.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { Component, computed, input, output, signal, ChangeDetectionStrategy } from '@angular/core';

/**
 * 사이드바에 배치되는 사용자 프로필 및 상태 요약 카드 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-sidebar-profile-card',
  standalone: true,
  imports: [LwAvatarComponent, LwCardComponent],
  templateUrl: './sidebar-profile-card.component.html',
  styleUrl: './sidebar-profile-card.component.scss',
})
export class LwSidebarProfileCardComponent {
  /** 로그인 시 카드 상단에 표시할 이름(닉네임 등). 비우면 `loginLabel` 사용. */
  profileHeadline = input('');
  loginLabel = input('로그인을 해주세요.');
  statusLabel = input('');
  points = input(0);
  showPoints = input(true);
  showArrow = input(false);
profileImageUrl = input<string | null>(null);
  profileInitial = input('');
  appIconSrc = input('');

  login = output<void>();

  readonly _imgError = signal(false);

  readonly mainLabel = computed(() => {
    const h = this.profileHeadline().trim();
    return h.length > 0 ? h : this.loginLabel();
  });
}
