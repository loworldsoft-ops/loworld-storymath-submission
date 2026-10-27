import { InjectionToken, type Signal } from '@angular/core';
import type { LwMember, UpdateLwMemberDto, LwMemberRole } from '../models/member.model';

export interface CreateDirectoryMemberDto {
  displayName: string;
  role: LwMemberRole;
  phone?: string;
  email?: string;
  loginId?: string;
  uid?: string;
}

/**
 * 🏛️ MemberDirectoryPort
 * 
 * SOLID 의존성 역전 원칙(DIP)을 준수하기 위한 회원 명부 도메인 포트 인터페이스.
 * UI 컴포넌트와 비즈니스 서비스는 구체 Firebase/API 구현체에 결합되지 않고
 * 오직 이 추상 포트 인터페이스에만 의존합니다.
 */
export interface MemberDirectoryPort {
  readonly members: Signal<LwMember[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly selectedId: Signal<string | null>;
  readonly actionError: Signal<string | null>;
  readonly currentUid: Signal<string | null>;
  readonly currentMember: Signal<LwMember | null>;
  readonly hasOwner: Signal<boolean>;
  readonly canBootstrapOwner: Signal<boolean>;
  readonly canMutate: Signal<boolean>;

  selectMember(id: string): void;
  updateMember(dto: UpdateLwMemberDto): Promise<void>;
  createMember(dto: CreateDirectoryMemberDto): Promise<string>;
}

export const LW_MEMBER_DIRECTORY_PORT = new InjectionToken<MemberDirectoryPort>('LW_MEMBER_DIRECTORY_PORT');
