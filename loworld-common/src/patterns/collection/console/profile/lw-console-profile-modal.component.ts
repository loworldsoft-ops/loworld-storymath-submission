import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LwAvatarComponent } from '../../../../ui/data-display/avatar/avatar.component';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwSlideSwitchComponent } from '../../../../ui/form/slide-switch/slide-switch.component';
import { LwTabsComponent, LwTabItem } from '../../../../ui/navigation/tabs/tabs.component';
import { CONSOLE_GROUP_ROLE_LABELS, ConsoleGroup, ConsoleUser } from '../console.models';

export type ConsoleThemeChoice = 'light' | 'dark' | 'system';
type ProfileTab = 'profile' | 'security' | 'prefs';

const MIN_PASSWORD_LENGTH = 8;

/** 사용자 설정 모달: 프로필, 보안, 환경 설정. */
@Component({
  selector: 'lw-console-profile-modal',
  standalone: true,
  imports: [
    LwAvatarComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwFormFieldComponent,
    LwInputComponent,
    LwModalComponent,
    LwSlideSwitchComponent,
    LwTabsComponent,
  ],
  templateUrl: './lw-console-profile-modal.component.html',
  styleUrl: './lw-console-profile-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwConsoleProfileModalComponent {
  readonly open = input<boolean>(false);
  readonly user = input.required<ConsoleUser>();
  readonly groups = input<readonly ConsoleGroup[]>([]);
  readonly theme = input<ConsoleThemeChoice>('system');
  readonly sidebarCollapsed = input<boolean>(false);

  readonly close = output<void>();
  readonly themeChange = output<ConsoleThemeChoice>();
  readonly toggleSidebar = output<void>();
  readonly changePassword = output<void>();

  readonly tabs: readonly LwTabItem[] = [
    { key: 'profile', label: 'Profile', icon: 'user' },
    { key: 'security', label: 'Security', icon: 'shield' },
    { key: 'prefs', label: 'Preferences', icon: 'settings' },
  ];
  readonly themeTabs: readonly LwTabItem[] = [
    { key: 'light', label: '라이트', icon: 'sun' },
    { key: 'dark', label: '다크', icon: 'moon' },
    { key: 'system', label: '시스템', icon: 'monitor' },
  ];
  readonly roleLabels = CONSOLE_GROUP_ROLE_LABELS;

  readonly tab = signal<ProfileTab>('profile');
  readonly currentPassword = signal<string>('');
  readonly nextPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');

  readonly passwordError = computed(() => {
    const next = this.nextPassword();
    if (!this.currentPassword() || !next) return '현재 비밀번호와 새 비밀번호를 입력해 주세요.';
    if (next.length < MIN_PASSWORD_LENGTH) return `새 비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return '영문과 숫자를 모두 포함해야 합니다.';
    if (next !== this.confirmPassword()) return '새 비밀번호 확인이 일치하지 않습니다.';
    return null;
  });

  setTab(key: string): void {
    this.tab.set(key as ProfileTab);
  }

  onTheme(key: string): void {
    this.themeChange.emit(key as ConsoleThemeChoice);
  }

  submitPassword(): void {
    if (this.passwordError()) return;
    // 비밀번호 값은 밖으로 내보내지 않는다. 실제 변경은 인증 서비스가 맡는다.
    this.changePassword.emit();
    this.currentPassword.set('');
    this.nextPassword.set('');
    this.confirmPassword.set('');
  }
}


