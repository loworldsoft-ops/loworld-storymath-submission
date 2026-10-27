import type { LwMemberRole } from './member.model';

export interface AuthUserView {
  userId: string;
  email?: string;
  displayName?: string;
  role?: LwMemberRole | null;
}

/**
 * 여러 앱 공통: 멤버 디렉터리와 연동된 **표시용** 세션 뷰.
 * (타이틀바, 드로어, 캘린더 헤더 등 어디서든 재사용)
 */
export interface LwMemberAuthSessionView {
  userId: string;
  displayName: string;
  email?: string;
  /** 디렉터리 멤버(LwMember)와 매칭된 역할 — 없으면 역할 배지를 숨깁니다. */
  directoryRole?: LwMemberRole | null;
}

export interface LoginSubmitPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupSubmitPayload {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: boolean;
}

export type AuthShellMode = 'login' | 'signup';
