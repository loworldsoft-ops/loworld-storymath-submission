import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../../ui/media/icon/icon.component';
import { LwAvatarComponent } from '../../../../../ui/data-display/avatar/avatar.component';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../../services/models/auth.model';
import { LwMemberSessionMenuComponent } from './member-session-menu.component';
import { STORY_MEMBER_CHARACTER_AVATAR_ICONS } from './member-avatar-icons';


/**
 * 공통 멤버 세션 UI: 소설 캐릭터 초상 아이콘 아바타 + 팝오버 드롭다운 (정보, 역할 배지, 계정 정보, 로그아웃).
 */
@Component({
  selector: 'lw-session-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LwIconComponent,
    LwButtonComponent,
    LwAvatarComponent,
    LwMemberSessionMenuComponent,
  ],
  templateUrl: './member-session-control.component.html',
  styleUrl: './member-session-control.component.scss',
})
export class LwSessionControlComponent {
  private readonly elementRef = inject(ElementRef);

  readonly session          = input<LwMemberAuthSessionView | null>(null);
  readonly iconName         = input<string | null>(null);
  readonly guestIconName    = input<string>('novel-party:party-wanderer');
  readonly guestLoginLabel  = input<string>('멤버 로그인');
  readonly layout           = input<'inline' | 'panel'>('inline');
  readonly isMobile         = input<boolean>(false);

  readonly loginClick   = output<void>();
  readonly logoutClick  = output<void>();
  readonly accountClick = output<void>();
  readonly triggerClick = output<LwMemberAuthSessionView | null>();

  readonly isMenuOpen = signal(false);

  /**
   * 사용자 세션 정보(이름, 이메일, 역할) 기반으로 결정론적 랜덤 소설 캐릭터 초상 아이콘 배정
   */
  protected readonly effectiveIconName = computed(() => {
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

  protected toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.session()) {
      this.onGuestLoginClick();
      return;
    }
    if (this.isMobile()) {
      this.triggerClick.emit(this.session());
      return;
    }
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected onAccountAction(event?: MouseEvent): void {
    event?.stopPropagation();
    this.closeMenu();
    this.accountClick.emit();
  }

  protected onLogoutAction(event?: MouseEvent): void {
    event?.stopPropagation();
    this.closeMenu();
    this.logoutClick.emit();
  }

  protected onGuestLoginClick(): void {
    this.closeMenu();
    this.loginClick.emit();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.isMenuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isMenuOpen()) {
      this.closeMenu();
    }
  }
}
