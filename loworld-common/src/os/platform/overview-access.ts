import type { AuthUserView } from '../../services/models/auth.model';
import type { LwMemberRole } from '../../services/models/member.model';
import type { OverviewGateStyle, OverviewLaunchItem, OverviewWindowTab } from '../../services/models/os.types';

const ROLE_ORDER: Record<LwMemberRole, number> = {
  VIEWER: 0,
  MANAGER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function getOverviewRole(account: AuthUserView | null): LwMemberRole | null {
  if (!account) {
    return null;
  }

  if (account.role === 'OWNER' || account.role === 'ADMIN' || account.role === 'MANAGER' || account.role === 'VIEWER') {
    return account.role;
  }

  const email = account.email?.trim().toLowerCase() ?? '';
  const displayName = account.displayName?.trim().toLowerCase() ?? '';
  const source = `${email} ${displayName}`;

  if (source.includes('owner')) {
    return 'OWNER';
  }
  if (source.includes('admin')) {
    return 'ADMIN';
  }
  if (source.includes('manager')) {
    return 'MANAGER';
  }
  if (source.includes('viewer')) {
    return 'VIEWER';
  }

  return 'VIEWER';
}

export function canAccessOverviewLaunchItem(item: OverviewLaunchItem, account: AuthUserView | null): boolean {
  if (item.audience === 'public') {
    return true;
  }

  if (!account) {
    return false;
  }

  if (item.audience === 'authenticated') {
    return true;
  }

  const role = getOverviewRole(account);
  if (!role) {
    return false;
  }

  const requiredRoles = item.requiredRoles;
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.some(requiredRole => ROLE_ORDER[role] >= ROLE_ORDER[requiredRole]);
}

export function filterOverviewLaunchItems(
  items: readonly OverviewLaunchItem[],
  account: AuthUserView | null,
): readonly OverviewLaunchItem[] {
  return items.filter(item => canAccessOverviewLaunchItem(item, account));
}

export function canAccessOverviewWindowTab(
  tab: OverviewWindowTab,
  items: readonly OverviewLaunchItem[],
  account: AuthUserView | null,
): boolean {
  const item = items.find(candidate => candidate.tab === tab);
  if (!item) {
    return true;
  }

  return canAccessOverviewLaunchItem(item, account);
}

export function getOverviewLaunchGateStyle(item: OverviewLaunchItem): OverviewGateStyle {
  return item.gateStyle ?? 'none';
}

export function isSoftLoginOverviewLaunchItem(item: OverviewLaunchItem): boolean {
  return getOverviewLaunchGateStyle(item) === 'soft-login';
}

export function getOverviewLaunchAccessHint(item: OverviewLaunchItem): string | null {
  if (item.audience === 'authenticated' || getOverviewLaunchGateStyle(item) === 'soft-login') {
    return '로그인 필요';
  }
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    return '관리자 권한 필요';
  }

  return null;
}

/** 포털 로그인(또는 권한)이 필요한 앱인지 여부 판별 */
export function isOverviewItemAuthRequired(item: OverviewLaunchItem | string): boolean {
  if (typeof item === 'string') {
    return false;
  }
  if (item.audience === 'authenticated' || item.audience === 'role-based') {
    return true;
  }
  if (item.gateStyle === 'soft-login' || item.gateStyle === 'hard-block') {
    return true;
  }
  return false;
}

/** 현재 계정 세션 상태에서 해당 항목이 비활성화(disabled) 상태여야 하는지 여부 판별 */
export function isOverviewItemDisabled(item: OverviewLaunchItem | string, account: AuthUserView | null): boolean {
  if (!isOverviewItemAuthRequired(item)) {
    return false;
  }
  if (!account) {
    return true;
  }
  if (typeof item !== 'string') {
    return !canAccessOverviewLaunchItem(item, account);
  }
  return false;
}