import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../../services/models/auth.model';
import { LwAvatarComponent } from '../../../../../ui/data-display/avatar/avatar.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwAccountRoleBadgeComponent } from '../../../../../ui/data-display/badge/member-role-badge.component';
import { STORY_MEMBER_CHARACTER_AVATAR_ICONS } from './member-avatar-icons';

/**
 * 👤 LwMemberSessionMenuComponent
 * 포탈 멤버 세션 정보(이름, 이메일, 역할 배지) 및 공통 액션(계정 정보/프로필, 로그아웃)을
 * 단일화하여 제공하는 공통 회원 세션 정보 패널/메뉴 컴포넌트.
 * - 데스크톱: LwSessionControl 플로팅 드롭다운 메뉴로 렌더링
 * - 모바일: LwBottomSheet 바텀시트 컨텐츠로 렌더링
 */
@Component({
  selector: 'lw-member-session-menu',
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwAccountRoleBadgeComponent, LwAvatarComponent],
  templateUrl: './member-session-menu.component.html',
  styleUrl: './member-session-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMemberSessionMenuComponent {
  /** 대상 회원 세션 뷰모델 */
  readonly session = input<LwMemberAuthSessionView | null>(null);

  /** 커스텀 아이콘 지정 시 우선 사용 */
  readonly iconName = input<string | null>(null);

  /** 기본 게스트 아이콘 */
  readonly guestIconName = input<string>('novel-party:party-wanderer');

  /** 계정 정보 / 프로필 클릭 액션 */
  readonly accountClick = output<void>();

  /** 로그아웃 클릭 액션 */
  readonly logoutClick = output<void>();

  /**
   * 사용자 세션 정보(이름, 이메일, 역할) 기반으로 결정론적 랜덤 소설 캐릭터 초상 아이콘 배정
   */
  readonly effectiveIconName = computed<string>(() => {
    const custom = this.iconName();
    if (custom) return custom;
    const s = this.session();
    if (!s) return this.guestIconName();
    const seed = `${s.userId || ''}_${s.displayName || ''}_${s.email || ''}_${s.directoryRole || ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % STORY_MEMBER_CHARACTER_AVATAR_ICONS.length;
    return STORY_MEMBER_CHARACTER_AVATAR_ICONS[index];
  });

  protected onAccountAction(event: MouseEvent): void {
    event.stopPropagation();
    this.accountClick.emit();
  }

  protected onLogoutAction(event: MouseEvent): void {
    event.stopPropagation();
    this.logoutClick.emit();
  }
}
