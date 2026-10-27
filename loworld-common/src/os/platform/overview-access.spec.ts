import { describe, expect, it } from 'vitest';
import type { AuthUserView } from '../../services/models/auth.model';
import type { OverviewLaunchItem } from '../../services/models/os.types';
import {
  canAccessOverviewLaunchItem,
  filterOverviewLaunchItems,
  getOverviewLaunchAccessHint,
  getOverviewLaunchGateStyle,
  getOverviewRole,
  isOverviewItemAuthRequired,
  isOverviewItemDisabled,
  isSoftLoginOverviewLaunchItem,
} from './overview-access';

describe('overview-access (멤버십 판정 및 접근 제어)', () => {
  describe('getOverviewRole', () => {
    it('로그인하지 않은 계정은 null을 반환한다', () => {
      expect(getOverviewRole(null)).toBeNull();
    });

    it('명시적인 role 속성이 있으면 그대로 반환한다', () => {
      const user: AuthUserView = { uid: 'u1', email: 'user@test.com', displayName: '홍길동', role: 'ADMIN' };
      expect(getOverviewRole(user)).toBe('ADMIN');
    });

    it('role 속성이 없어도 이메일 또는 이름에서 역할을 추론한다', () => {
      const ownerUser: AuthUserView = { uid: 'u2', email: 'owner@loworld.com', displayName: '소유자' };
      expect(getOverviewRole(ownerUser)).toBe('OWNER');

      const adminUser: AuthUserView = { uid: 'u3', email: 'test@loworld.com', displayName: 'Super Admin' };
      expect(getOverviewRole(adminUser)).toBe('ADMIN');

      const normalUser: AuthUserView = { uid: 'u4', email: 'user@gmail.com', displayName: '일반유저' };
      expect(getOverviewRole(normalUser)).toBe('VIEWER');
    });
  });

  describe('canAccessOverviewLaunchItem', () => {
    const publicItem: OverviewLaunchItem = {
      id: 'app-guide',
      title: '가이드',
      audience: 'public',
    };

    const authItem: OverviewLaunchItem = {
      id: 'app-note',
      title: '노트',
      audience: 'authenticated',
    };

    const adminItem: OverviewLaunchItem = {
      id: 'app-develop',
      title: '개발자 도구',
      audience: 'role-based',
      requiredRoles: ['ADMIN'],
    };

    it('public 항목은 로그인 여부와 무관하게 접근 가능하다', () => {
      expect(canAccessOverviewLaunchItem(publicItem, null)).toBe(true);
      expect(canAccessOverviewLaunchItem(publicItem, { uid: 'u1' } as AuthUserView)).toBe(true);
    });

    it('authenticated 항목은 로그인해야만 접근 가능하다', () => {
      expect(canAccessOverviewLaunchItem(authItem, null)).toBe(false);
      expect(canAccessOverviewLaunchItem(authItem, { uid: 'u1', role: 'VIEWER' } as AuthUserView)).toBe(true);
    });

    it('role-based 항목은 계층 순서(OWNER > ADMIN > MANAGER > VIEWER)에 따라 접근이 제어된다', () => {
      const viewer: AuthUserView = { uid: 'u-viewer', role: 'VIEWER' };
      const manager: AuthUserView = { uid: 'u-manager', role: 'MANAGER' };
      const admin: AuthUserView = { uid: 'u-admin', role: 'ADMIN' };
      const owner: AuthUserView = { uid: 'u-owner', role: 'OWNER' };

      // ADMIN 이상 요구
      expect(canAccessOverviewLaunchItem(adminItem, null)).toBe(false);
      expect(canAccessOverviewLaunchItem(adminItem, viewer)).toBe(false);
      expect(canAccessOverviewLaunchItem(adminItem, manager)).toBe(false);
      expect(canAccessOverviewLaunchItem(adminItem, admin)).toBe(true);
      expect(canAccessOverviewLaunchItem(adminItem, owner)).toBe(true);
    });
  });

  describe('filterOverviewLaunchItems', () => {
    it('사용자의 권한에 맞는 항목만 필터링하여 반환한다', () => {
      const items: OverviewLaunchItem[] = [
        { id: '1', title: '공개 앱', audience: 'public' },
        { id: '2', title: '인증 앱', audience: 'authenticated' },
        { id: '3', title: '관리자 앱', audience: 'role-based', requiredRoles: ['ADMIN'] },
      ];

      // 비로그인
      expect(filterOverviewLaunchItems(items, null).map((i) => i.id)).toEqual(['1']);

      // 일반 회원 (VIEWER)
      const viewer: AuthUserView = { uid: 'v', role: 'VIEWER' };
      expect(filterOverviewLaunchItems(items, viewer).map((i) => i.id)).toEqual(['1', '2']);

      // 관리자 (ADMIN)
      const admin: AuthUserView = { uid: 'a', role: 'ADMIN' };
      expect(filterOverviewLaunchItems(items, admin).map((i) => i.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('힌트 및 비활성화 판정 (isOverviewItemDisabled, getOverviewLaunchAccessHint)', () => {
    it('게이트 스타일에 따라 힌트를 제공한다', () => {
      const authItem: OverviewLaunchItem = { id: 'a', title: 'A', audience: 'authenticated' };
      const adminItem: OverviewLaunchItem = { id: 'b', title: 'B', audience: 'role-based', requiredRoles: ['ADMIN'] };
      const publicItem: OverviewLaunchItem = { id: 'c', title: 'C', audience: 'public' };

      expect(getOverviewLaunchAccessHint(authItem)).toBe('로그인 필요');
      expect(getOverviewLaunchAccessHint(adminItem)).toBe('관리자 권한 필요');
      expect(getOverviewLaunchAccessHint(publicItem)).toBeNull();
    });

    it('권한이 부족한 경우 항목이 비활성화(disabled)로 판정된다', () => {
      const adminItem: OverviewLaunchItem = { id: 'b', title: 'B', audience: 'role-based', requiredRoles: ['ADMIN'] };
      const viewer: AuthUserView = { uid: 'v', role: 'VIEWER' };

      expect(isOverviewItemDisabled(adminItem, null)).toBe(true);
      expect(isOverviewItemDisabled(adminItem, viewer)).toBe(true);
      expect(isOverviewItemDisabled(adminItem, { uid: 'a', role: 'ADMIN' })).toBe(false);
    });
  });
});
