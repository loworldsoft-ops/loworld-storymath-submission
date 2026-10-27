import { Injectable, inject } from '@angular/core';
import type { LoginSubmitPayload, SignupSubmitPayload } from '../../models/auth.model';
import type { LwAccountLoginBridge } from '../../tokens/member-login-bridge.token';
import { MemberAuthFacade } from './member-auth.facade';

@Injectable({ providedIn: 'root' })
export class LoworldMemberLoginBridgeAdapter implements LwAccountLoginBridge {
  private readonly authFacade = inject(MemberAuthFacade);

  readonly submitting = this.authFacade.submitting;
  readonly accountView = this.authFacade.accountView;

  loginInModal(payload: LoginSubmitPayload): Promise<void> {
    return this.authFacade.loginInModal(payload);
  }

  signupInModal(payload: SignupSubmitPayload): Promise<void> {
    return this.authFacade.signupInModal(payload);
  }

  logout(): Promise<void> {
    return this.authFacade.logout();
  }

  goToAppMain(): void {
    this.authFacade.goToAppMain();
  }
}