import type { LwMemberRole } from '../services/models/member.model';

export interface ShowcaseMemberProfileDoc {
  uid: string;
  email: string;
  displayName: string;
  loginId?: string;
  phone?: string;
  role: LwMemberRole;
  status: 'active' | 'invited' | 'suspended' | 'deleted';
  appAccess?: {
    overview?: boolean;
    member?: boolean;
    study?: boolean;
    note?: boolean;
    calendar?: boolean;
    'novel'?: boolean;
    [appId: string]: boolean | undefined;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
  /** 데모 부트스트랩으로 자동 생성된 회원 여부 — 실제 등록 회원과 구분하기 위한 내부 플래그 */
  seed?: boolean;
}