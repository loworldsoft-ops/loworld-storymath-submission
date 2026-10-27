/** 공통 멤버 관리 도메인 — 앱·서비스와 무관한 표시 모델 */

export type LwMemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER';

export type LwMemberStatus = 'active' | 'inactive';

export interface LwMember {
  id: string;
  loginId?: string;
  displayName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: LwMemberRole;
  status: LwMemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLwMemberDto {
  loginId?: string;
  displayName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: LwMemberRole;
}

export interface UpdateLwMemberDto {
  id: string;
  loginId?: string;
  displayName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: LwMemberRole;
  status: LwMemberStatus;
}

export const LW_MEMBER_ROLE_LABELS: Record<LwMemberRole, string> = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MANAGER: '매니저',
  VIEWER: '뷰어',
};

export const LW_MEMBER_ROLES: readonly LwMemberRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'] as const;
