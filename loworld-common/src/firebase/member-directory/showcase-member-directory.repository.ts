import { Injectable } from '@angular/core';
import { writeLoginIndex } from '../member-profile/member-login-index';
import { collection, deleteField, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import type { LwMember, UpdateLwMemberDto } from '../../services/models/member.model';
import type { CreateDirectoryMemberDto } from '../../services/ports/member-directory.port';
import { getShowcaseFirestore } from '../showcase-firebase.client';
import type { ShowcaseMemberProfileDoc } from '../showcase-member-profile.model';

function asIsoString(value: unknown): string {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

/** 데모 시드로 생성된 회원(`seed: true`)과 실제 등록 회원을 구분하기 위해 확장된 타입 */
export type ShowcaseDirectoryMember = LwMember & { seed?: boolean };

function mapProfileToMember(profile: ShowcaseMemberProfileDoc): ShowcaseDirectoryMember {
  return {
    id: profile.uid,
    loginId: profile.loginId,
    displayName: profile.displayName,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    status: profile.status === 'active' ? 'active' : 'inactive',
    createdAt: asIsoString(profile.createdAt),
    updatedAt: asIsoString(profile.updatedAt),
    seed: profile.seed === true,
  };
}

@Injectable({ providedIn: 'root' })
export class ShowcaseMemberDirectoryRepository {
  private readonly firestore = getShowcaseFirestore();

  subscribeMembers(
    onNext: (members: ShowcaseDirectoryMember[]) => void,
    onError: (error: unknown) => void,
  ): () => void {
    const memberQuery = query(collection(this.firestore, 'members'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      memberQuery,
      snapshot => onNext(snapshot.docs.map(docSnapshot => mapProfileToMember(docSnapshot.data() as ShowcaseMemberProfileDoc))),
      onError,
    );
  }

  /** 모든 회원의 로그인 아이디 색인을 다시 쓴다. 관리자만 된다. */
  async syncLoginIndex(members: readonly ShowcaseDirectoryMember[]): Promise<void> {
    await Promise.all(members.map((member) => writeLoginIndex(this.firestore, member.loginId, member.email ?? undefined, member.id)));
  }

  async updateMember(dto: UpdateLwMemberDto): Promise<void> {
    const trimmedLoginId = dto.loginId?.trim();
    const trimmedEmail = dto.email?.trim();
    const trimmedPhone = dto.phone?.trim();

    await updateDoc(doc(this.firestore, 'members', dto.id), {
      loginId: trimmedLoginId ? trimmedLoginId : deleteField(),
      displayName: dto.displayName,
      email: trimmedEmail ? trimmedEmail : deleteField(),
      phone: trimmedPhone ? trimmedPhone : deleteField(),
      role: dto.role,
      status: dto.status === 'active' ? 'active' : 'suspended',
      updatedAt: serverTimestamp(),
    });
    await writeLoginIndex(this.firestore, trimmedLoginId, trimmedEmail, dto.id);
  }

  async createMember(dto: CreateDirectoryMemberDto): Promise<string> {
    const uid = dto.uid || doc(collection(this.firestore, 'members')).id;
    const ref = doc(this.firestore, 'members', uid);
    const profile: ShowcaseMemberProfileDoc = {
      uid,
      displayName: dto.displayName,
      email: dto.email || '',
      loginId: dto.loginId || dto.displayName.toLowerCase().replace(/\s+/g, ''),
      phone: dto.phone,
      role: dto.role,
      status: 'active',
      appAccess: {
        overview: true,
        member: true,
        study: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    await writeLoginIndex(this.firestore, profile.loginId, profile.email, uid);
    return uid;
  }
}