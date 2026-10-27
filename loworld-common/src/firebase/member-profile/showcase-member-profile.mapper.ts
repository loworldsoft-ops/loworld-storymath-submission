import type { AuthUserView } from '../../services/models/auth.model';
import type { LwMemberRole } from '../../services/models/member.model';
import type { ShowcaseMemberProfileDoc } from '../showcase-member-profile.model';

export function loginIdFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim().toLowerCase();
  return local || email.trim().toLowerCase();
}

export function normalizeRole(value: unknown): LwMemberRole {
  return value === 'OWNER' || value === 'ADMIN' || value === 'MANAGER' || value === 'VIEWER'
    ? value
    : 'VIEWER';
}

export function toAuthUserView(
  uid: string,
  profile: ShowcaseMemberProfileDoc | null,
  fallbackEmail?: string | null,
  fallbackName?: string | null,
): AuthUserView {
  const role = normalizeRole(profile?.role);
  let displayName = profile?.displayName ?? fallbackName ?? fallbackEmail ?? 'Workspace user';
  if (displayName.includes('@') && profile?.loginId) {
    displayName = profile.loginId;
  }
  return {
    userId: uid,
    email: profile?.email ?? fallbackEmail ?? undefined,
    displayName,
    role,
  };
}