import type { LwMemberRole } from '../../models/member.model';

export interface MemberAuthIdentity {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

export interface MemberAuthProfile {
  uid: string;
  email: string;
  displayName: string;
  loginId?: string;
  phone?: string;
  role?: LwMemberRole;
  status?: 'active' | 'invited' | 'suspended' | 'deleted';
}

export interface MemberAuthGateway {
  onAuthStateChanged(listener: (user: MemberAuthIdentity | null) => void): () => void;
  applyPersistence(rememberMe: boolean | undefined): Promise<void>;
  signIn(email: string, password: string): Promise<{ user: MemberAuthIdentity }>;
  signUp(email: string, password: string): Promise<{ user: MemberAuthIdentity }>;
  updateDisplayName(user: MemberAuthIdentity, displayName: string): Promise<void>;
  signOut(): Promise<void>;
}

export interface MemberProfileAuthRepository {
  findEmailByLoginId(loginId: string): Promise<string | null>;
  load(uid: string): Promise<MemberAuthProfile | null>;
  ensure(
    uid: string,
    email: string,
    displayName: string,
    options: { createIfMissing: boolean },
  ): Promise<MemberAuthProfile>;
  subscribe(
    uid: string,
    onNext: (profile: MemberAuthProfile | null, exists: boolean) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

export interface MemberAuthNavigator {
  goToAppMain(): void;
}