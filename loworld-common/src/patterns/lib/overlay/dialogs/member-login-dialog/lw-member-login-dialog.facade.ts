import { Injectable, computed, inject, signal } from '@angular/core';
import { AUTH_ERROR_FORMATTER, type LwAuthStatusMessage } from '../../../../../services/tokens/auth-error-formatter.token';
import { LW_ACCOUNT_LOGIN_BRIDGE } from '../../../../../services/tokens/member-login-bridge.token';
import { type AuthShellMode, type AuthUserView, type LoginSubmitPayload, type SignupSubmitPayload } from '../../../../../services/models/auth.model';
import type { LwAccountLoginDialogData, LwAccountLoginDialogThemeMode } from './member-login-dialog.types';

@Injectable()
export class LwLoginModalFacade {
  private readonly bridge = inject(LW_ACCOUNT_LOGIN_BRIDGE);
  private readonly errorFormatter = inject(AUTH_ERROR_FORMATTER);

  readonly panel = signal<'auth' | 'summary'>('auth');
  readonly mode = signal<AuthShellMode>('login');
  /** 회원가입 탭 노출 여부 */
  readonly allowSignup = signal(true);
  readonly error = signal<string | null>(null);
  readonly mainActionLabel = signal<string | undefined>(undefined);
  readonly themeMode = signal<LwAccountLoginDialogThemeMode | undefined>(undefined);

  readonly account = this.bridge.accountView;
  readonly submitting = this.bridge.submitting;

  readonly hasAccount = computed(() => this.account() !== null);

  readonly title = computed(() => {
    if (this.panel() === 'summary') {
      return '내 계정';
    }
    return this.mode() === 'login' ? '멤버 로그인' : '멤버 회원가입';
  });

  readonly subtitle = computed(() => {
    if (this.panel() === 'summary') {
      return '현재 계정 정보와 다음 동작을 확인할 수 있습니다.';
    }
    return this.mode() === 'login'
      ? '학습 공간과 멤버 권한을 이어서 사용합니다.'
      : '새 계정을 만들고 현재 앱과 바로 연결합니다.';
  });

  readonly statusMessage = computed<LwAuthStatusMessage | null>(() => {
    if (this.submitting()) {
      return this.mode() === 'login'
        ? {
            tone: 'neutral',
            title: '로그인 중입니다',
            description: '계정 정보를 확인하고 있습니다.',
          }
        : {
            tone: 'neutral',
            title: '가입 정보를 저장하는 중입니다',
            description: '멤버 프로필과 인증 정보를 준비하고 있습니다.',
          };
    }

    const currentError = this.error();
    if (!currentError) {
      return null;
    }

    return this.errorFormatter.format(new Error(currentError), this.mode());
  });

  readonly avatarInitial = computed(() => {
    const acc = this.account();
    const source = (acc?.displayName?.trim() || acc?.email?.trim() || 'M').charAt(0);
    return source.toUpperCase();
  });

  initialize(data?: LwAccountLoginDialogData): void {
    if (!data) return;

    this.allowSignup.set(data.allowSignup ?? true);
    if (data.view === 'summary') {
      this.panel.set('summary');
    } else {
      this.panel.set('auth');
      if (data.initialMode === 'signup' && this.allowSignup()) {
        this.mode.set('signup');
      } else {
        this.mode.set('login');
      }
    }

    this.mainActionLabel.set(data.mainActionLabel);
    this.themeMode.set(data.themeMode);
    this.error.set(null);
  }

  switchMode(mode: AuthShellMode): void {
    this.mode.set(mode === 'signup' && !this.allowSignup() ? 'login' : mode);
    this.error.set(null);
  }

  switchPanel(panel: 'auth' | 'summary'): void {
    this.panel.set(panel);
    this.error.set(null);
  }

  async login(payload: LoginSubmitPayload): Promise<boolean> {
    this.error.set(null);
    try {
      await this.bridge.loginInModal(payload);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error ?? '');
      this.error.set(message);
      return false;
    }
  }

  async signup(payload: SignupSubmitPayload): Promise<boolean> {
    this.error.set(null);
    try {
      await this.bridge.signupInModal(payload);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error ?? '');
      this.error.set(message);
      return false;
    }
  }

  async logout(): Promise<void> {
    this.error.set(null);
    await this.bridge.logout();
    this.panel.set('auth');
  }

  goMain(): void {
    this.bridge.goToAppMain();
  }

  reset(): void {
    this.error.set(null);
  }
}
