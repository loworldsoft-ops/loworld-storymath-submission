import { Injectable, computed, inject, isDevMode, signal } from '@angular/core';
import { LW_ACCOUNT_LOGIN_BRIDGE } from '../../../../services/tokens/member-login-bridge.token';
import { type LwMemberAuthSessionView, type AuthUserView } from '../../../../services/models/auth.model';
import { type LwMemberRole } from '../../../../services/models/member.model';
import { getOverviewRole } from '../../../platform/overview-access';

const SHOWCASE_SESSION_STORAGE_KEY = 'loworld_showcase_session';

export interface FastTrackUserProfile {
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  name: string;
  email: string;
  avatarIcon: string;
  desc: string;
}

export const FAST_TRACK_PROFILES: readonly FastTrackUserProfile[] = [
  {
    role: 'OWNER',
    name: '김관리 (Owner)',
    email: 'owner@loworld.com',
    avatarIcon: '👑',
    desc: '최고 관리자 권한 · 전체 시스템 및 데이터베이스 제어',
  },
  {
    role: 'ADMIN',
    name: '이개발 (Admin)',
    email: 'developer@loworld.com',
    avatarIcon: '🛡️',
    desc: '개발 관리자 권한 · 컴포넌트 및 앱 관리',
  },
  {
    role: 'VIEWER',
    name: '박학생 (Member)',
    email: 'member@loworld.com',
    avatarIcon: '👤',
    desc: '일반 회원 권한 · 워크스페이스 및 학습 전용',
  },
];

@Injectable({ providedIn: 'root' })
export class OverviewSessionFacade {
  private readonly memberLoginBridge = inject(LW_ACCOUNT_LOGIN_BRIDGE);

  /**
   * 빠른 데모 및 로컬 인증 세션 영속화 신호.
   * 자격 증명 없이 만들어지는 세션이므로 개발 빌드에서만 인정한다. 배포 빌드의 로그인은 Firebase 인증뿐이다.
   */
  private readonly localFastTrackSession = signal<LwMemberAuthSessionView | null>(this.loadPersistedSession());

  private isAndroidApp(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.location.host === 'appassets.androidplatform.net' ||
      typeof (window as any).loworldNative !== 'undefined' ||
      typeof (window as any).androidBridge !== 'undefined'
    );
  }

  private loadPersistedSession(): LwMemberAuthSessionView | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      if (!isDevMode()) {
        // 배포본 및 안드로이드 환경에서는 임의 로컬 세션으로 잠금 화면을 통과하지 못하게 초기화
        localStorage.removeItem(SHOWCASE_SESSION_STORAGE_KEY);
        return null;
      }
      const raw = localStorage.getItem(SHOWCASE_SESSION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as LwMemberAuthSessionView;
      }
      return null;
    } catch {
      return null;
    }
  }

  readonly account = computed<AuthUserView | null>(() => {
    const bridgeAccount = this.memberLoginBridge.accountView();
    if (bridgeAccount) return bridgeAccount;

    const fastTrack = this.localFastTrackSession();
    if (fastTrack) {
      return {
        userId: fastTrack.userId,
        email: fastTrack.email,
        displayName: fastTrack.displayName,
        role: fastTrack.directoryRole ?? 'VIEWER',
      };
    }
    return null;
  });

  readonly role = computed<LwMemberRole | null>(() => {
    const bridgeAccount = this.memberLoginBridge.accountView();
    if (bridgeAccount) return getOverviewRole(bridgeAccount);
    const fastTrack = this.localFastTrackSession();
    if (fastTrack) return fastTrack.directoryRole ?? 'VIEWER';
    return null;
  });

  readonly memberAuthSession = computed((): LwMemberAuthSessionView | null => {
    const bridgeAccount = this.memberLoginBridge.accountView();
    if (bridgeAccount) {
      return {
        userId: bridgeAccount.userId,
        displayName: bridgeAccount.displayName ?? bridgeAccount.email ?? 'Workspace user',
        email: bridgeAccount.email,
        directoryRole: getOverviewRole(bridgeAccount),
      };
    }
    return this.localFastTrackSession();
  });

  /** 인증 완료 여부 (OS 화면 진입 게이트 제어 플래그) */
  readonly isAuthenticated = computed<boolean>(() => this.memberAuthSession() !== null);

  /** 로그인 요청 처리 중 여부 */
  readonly loginSubmitting = this.memberLoginBridge.submitting;

  readonly loginLabel = computed(() => {
    const session = this.memberAuthSession();
    if (!session) return '게스트';
    return session.displayName || session.email || 'Workspace user';
  });

  readonly loginStateLabel = computed(() =>
    this.isAuthenticated() ? `로그인됨 · ${this.role() ?? 'VIEWER'}` : '오프라인'
  );

  /** 빠른 데모 프로필 로그인 (개발 빌드 및 안드로이드 앱 지원) */
  fastTrackLogin(role: 'OWNER' | 'ADMIN' | 'VIEWER'): void {
    if (!isDevMode() && !this.isAndroidApp()) return;
    const profile = FAST_TRACK_PROFILES.find((p) => p.role === role) ?? FAST_TRACK_PROFILES[0];
    const session: LwMemberAuthSessionView = {
      userId: `usr_${role.toLowerCase()}_01`,
      displayName: profile.name,
      email: profile.email,
      directoryRole: profile.role,
    };
    this.localFastTrackSession.set(session);
    try {
      localStorage.setItem(SHOWCASE_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }

  /** 통합 로그아웃 (로컬 세션 및 Firebase 인증 동시 해제) */
  async logout(): Promise<void> {
    this.localFastTrackSession.set(null);
    try {
      localStorage.removeItem(SHOWCASE_SESSION_STORAGE_KEY);
    } catch {}
    await this.memberLoginBridge.logout();
  }
}