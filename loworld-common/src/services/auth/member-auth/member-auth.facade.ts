import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import type { AuthUserView, LoginSubmitPayload, SignupSubmitPayload } from '../../models/auth.model';
import { MemberAuthErrorMapper } from './member-auth-error.mapper';
import { loginIdFromEmail, toAuthUserView } from './member-auth.mapper';
import { MEMBER_AUTH_GATEWAY, MEMBER_AUTH_NAVIGATOR, MEMBER_PROFILE_AUTH_REPOSITORY } from './member-auth.tokens';
import type { MemberAuthProfile } from './member-auth.types';

function authLog(_message: string, _payload?: unknown): void {}

function normalizeEmailIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class MemberAuthFacade {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authGateway = inject(MEMBER_AUTH_GATEWAY);
  private readonly profileRepository = inject(MEMBER_PROFILE_AUTH_REPOSITORY);
  private readonly errorMapper = inject(MemberAuthErrorMapper);
  private readonly navigator = inject(MEMBER_AUTH_NAVIGATOR);

  private readonly _accountView = signal<AuthUserView | null>(null);
  private readonly _submitting = signal(false);
  private unsubscribeMemberProfile: (() => void) | null = null;

  readonly accountView = this._accountView.asReadonly();
  readonly submitting = this._submitting.asReadonly();

  constructor() {
    const unsubscribeAuth = this.authGateway.onAuthStateChanged(async user => {
      authLog('onAuthStateChanged', { uid: user?.uid ?? null, email: user?.email ?? null });
      if (!user) {
        this.stopMemberProfileSubscription();
        this._accountView.set(null);
        return;
      }

      try {
        authLog('loadMemberProfile:start', { uid: user.uid });
        const profile = await this.profileRepository.load(user.uid);
        authLog('loadMemberProfile:done', { uid: user.uid, exists: !!profile, role: profile?.role ?? null });
        this._accountView.set(toAuthUserView(user.uid, profile, user.email, user.displayName));
        this.subscribeMemberProfile(user.uid, user.email, user.displayName);
      } catch {
        this._accountView.set({
          userId: user.uid,
          email: user.email ?? undefined,
          displayName: user.displayName ?? user.email ?? 'Workspace user',
          role: 'VIEWER',
        });
        this.subscribeMemberProfile(user.uid, user.email, user.displayName);
      }
    });

    this.destroyRef.onDestroy(() => {
      unsubscribeAuth();
      this.stopMemberProfileSubscription();
    });
  }

  async loginInModal(payload: LoginSubmitPayload): Promise<void> {
    this._submitting.set(true);
    authLog('loginInModal:start', { email: payload.email.trim(), rememberMe: payload.rememberMe ?? false });

    try {
      const identifier = payload.email.trim();
      const resolvedEmail = identifier.includes('@')
        ? normalizeEmailIdentifier(identifier)
        : await this.profileRepository.findEmailByLoginId(identifier) ?? identifier;

      await this.authGateway.applyPersistence(payload.rememberMe);
      const credential = await this.authGateway.signIn(resolvedEmail, payload.password);
      const user = credential.user;
      const profile = await this.profileRepository.ensure(
        user.uid,
        user.email ?? normalizeEmailIdentifier(resolvedEmail),
        user.displayName ?? user.email ?? normalizeEmailIdentifier(resolvedEmail),
        { createIfMissing: true },
      );
      this._accountView.set(toAuthUserView(user.uid, profile, user.email, user.displayName));
      authLog('loginInModal:success', { uid: user.uid, email: user.email ?? resolvedEmail, role: profile.role });
    } catch (error: unknown) {
      this.errorMapper.map(error);
    } finally {
      this._submitting.set(false);
      authLog('loginInModal:end');
    }
  }

  async signupInModal(payload: SignupSubmitPayload): Promise<void> {
    if (!payload.acceptTerms) {
      authLog('signupInModal:blocked', { reason: 'acceptTerms=false', email: payload.email.trim() });
      return;
    }

    this._submitting.set(true);
    authLog('signupInModal:start', { email: payload.email.trim().toLowerCase(), displayName: payload.displayName.trim() });

    try {
      await this.authGateway.applyPersistence(true);
      const normalizedEmail = normalizeEmailIdentifier(payload.email);
      const credential = await this.authGateway.signUp(normalizedEmail, payload.password);
      if (payload.displayName.trim()) {
        await this.authGateway.updateDisplayName(credential.user, payload.displayName.trim());
      }

      const profile = await this.profileRepository.ensure(
        credential.user.uid,
        normalizedEmail,
        payload.displayName.trim() || normalizedEmail,
        { createIfMissing: true },
      );
      this._accountView.set(toAuthUserView(credential.user.uid, profile, normalizedEmail, payload.displayName.trim()));
      authLog('signupInModal:success', { uid: credential.user.uid, email: normalizedEmail, role: profile.role });
    } catch (error: unknown) {
      this.errorMapper.map(error);
    } finally {
      this._submitting.set(false);
      authLog('signupInModal:end');
    }
  }

  async logout(): Promise<void> {
    authLog('logout:start');
    this.stopMemberProfileSubscription();
    await this.authGateway.signOut();
    this._accountView.set(null);
    authLog('logout:success');
  }

  goToAppMain(): void {
    this.navigator.goToAppMain();
  }

  private stopMemberProfileSubscription(): void {
    if (!this.unsubscribeMemberProfile) {
      return;
    }

    this.unsubscribeMemberProfile();
    this.unsubscribeMemberProfile = null;
    authLog('memberProfile:unsubscribe');
  }

  private subscribeMemberProfile(uid: string, fallbackEmail?: string | null, fallbackName?: string | null): void {
    this.stopMemberProfileSubscription();
    authLog('memberProfile:subscribe', { uid });
    this.unsubscribeMemberProfile = this.profileRepository.subscribe(
      uid,
      (profile: MemberAuthProfile | null, exists: boolean) => {
        authLog('memberProfile:snapshot', { uid, exists, role: profile?.role ?? null });
        this._accountView.set(toAuthUserView(uid, profile, fallbackEmail, fallbackName));
      },
      error => {
        console.error('[MemberAuth] memberProfile:snapshot:error', { uid, error });
        this._accountView.set({
          userId: uid,
          email: fallbackEmail ?? undefined,
          displayName: fallbackName ?? fallbackEmail ?? 'Workspace user',
          role: 'VIEWER',
        });
      },
    );
  }
}