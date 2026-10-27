import { InjectionToken, type Signal } from '@angular/core';
import type { AuthUserView, LoginSubmitPayload, SignupSubmitPayload } from '../models/auth.model';

/** 앱별 인증·네비게이션 — 멤버 로그인 다이얼로그는 이 브릿지만 의존합니다. */
export interface LwAccountLoginBridge {
  readonly submitting: Signal<boolean>;
  readonly accountView: Signal<AuthUserView | null>;
  loginInModal(payload: LoginSubmitPayload): Promise<void>;
  signupInModal(payload: SignupSubmitPayload): Promise<void>;
  logout(): Promise<void>;
  goToAppMain(): void;
}

export const LW_ACCOUNT_LOGIN_BRIDGE = new InjectionToken<LwAccountLoginBridge>('LW_ACCOUNT_LOGIN_BRIDGE');
