import { Injectable } from '@angular/core';
import type { LwMember, LwMemberRole } from '../../services/models/member.model';

export type MemberUpdateAuthorizationResult = {
  allowed: boolean;
  reason: 'allowed' | 'not-authenticated' | 'target-not-found' | 'permission-denied';
  message?: string;
  bootstrappingOwner: boolean;
};

@Injectable({ providedIn: 'root' })
export class MemberRolePolicy {
  authorizeUpdate(input: {
    actorUid: string | null;
    actor: LwMember | null;
    target: LwMember | null;
    nextRole: LwMemberRole;
    hasOwner: boolean;
  }): MemberUpdateAuthorizationResult {
    const { actorUid, actor, target, nextRole, hasOwner } = input;

    if (!actorUid) {
      return {
        allowed: false,
        reason: 'not-authenticated',
        message: '로그인된 멤버만 역할을 변경할 수 있습니다.',
        bootstrappingOwner: false,
      };
    }

    if (!target) {
      return {
        allowed: false,
        reason: 'target-not-found',
        message: '대상 멤버를 찾지 못했습니다.',
        bootstrappingOwner: false,
      };
    }

    const bootstrappingOwner = !hasOwner && target.id === actorUid && nextRole === 'OWNER';
    const isOwner = actor?.role === 'OWNER';
    const isAdmin = actor?.role === 'ADMIN';
    const isSelf = target.id === actorUid;
    const roleChanged = nextRole !== target.role;

    const allowed = bootstrappingOwner
      || isOwner
      || (isAdmin && target.role !== 'OWNER' && nextRole !== 'OWNER')
      || (isSelf && !roleChanged);

    if (allowed) {
      return {
        allowed: true,
        reason: 'allowed',
        bootstrappingOwner,
      };
    }

    return {
      allowed: false,
      reason: 'permission-denied',
      message: !hasOwner
        ? '첫 소유자는 본인 계정을 OWNER로 변경해서 생성해야 합니다.'
        : '현재 계정으로는 이 멤버의 역할을 변경할 수 없습니다.',
      bootstrappingOwner,
    };
  }
}