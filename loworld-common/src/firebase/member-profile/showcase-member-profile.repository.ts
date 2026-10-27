import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { getShowcaseFirestore } from '../showcase-firebase.client';
import type { ShowcaseMemberProfileDoc } from '../showcase-member-profile.model';
import { loginIdFromEmail } from './showcase-member-profile.mapper';
import { readLoginIndex, writeLoginIndex } from './member-login-index';

@Injectable({ providedIn: 'root' })
export class ShowcaseMemberProfileRepository {
  private readonly firestore = getShowcaseFirestore();

  async findEmailByLoginId(loginId: string): Promise<string | null> {
    const trimmed = loginId.trim();
    if (!trimmed) {
      return null;
    }

    // 로그인 전이라 회원 목록은 읽을 수 없다. 색인에서 아이디 하나만 집어 읽는다.
    return readLoginIndex(this.firestore, trimmed);
  }

  async load(uid: string): Promise<ShowcaseMemberProfileDoc | null> {
    const snapshot = await getDoc(doc(this.firestore, 'members', uid));
    return snapshot.exists() ? snapshot.data() as ShowcaseMemberProfileDoc : null;
  }

  async ensure(
    uid: string,
    email: string,
    displayName: string,
    options: { createIfMissing: boolean },
  ): Promise<ShowcaseMemberProfileDoc> {
    const ref = doc(this.firestore, 'members', uid);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      if (!options.createIfMissing) {
        throw new Error('MEMBER_PROFILE_NOT_FOUND');
      }

      // Search for an existing document with the same email pre-provisioned by the admin
      const q = query(
        collection(this.firestore, 'members'),
        where('email', '==', email),
        limit(1)
      );
      const querySnap = await getDocs(q);
      
      let existingProfile: ShowcaseMemberProfileDoc | null = null;
      let existingDocId: string | null = null;
      
      if (!querySnap.empty) {
        existingProfile = querySnap.docs[0].data() as ShowcaseMemberProfileDoc;
        existingDocId = querySnap.docs[0].id;
      }

      if (existingProfile) {
        // Delete the old orphaned document created under a random ID
        if (existingDocId && existingDocId !== uid) {
          const oldRef = doc(this.firestore, 'members', existingDocId);
          await deleteDoc(oldRef);
        }

        const profile: ShowcaseMemberProfileDoc = {
          ...existingProfile,
          uid,
          email,
          displayName: (existingProfile.displayName && !existingProfile.displayName.includes('@'))
            ? existingProfile.displayName
            : (existingProfile.loginId || displayName),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };
        await setDoc(ref, profile);
        await writeLoginIndex(this.firestore, profile.loginId, email, uid);
        return profile;
      }

      const profile: ShowcaseMemberProfileDoc = {
        uid,
        email,
        displayName,
        loginId: loginIdFromEmail(email),
        role: 'VIEWER',
        status: 'active',
        appAccess: {
          overview: true,
          member: true,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(ref, profile);
      await writeLoginIndex(this.firestore, profile.loginId, email, uid);
      return profile;
    }

    const existing = snapshot.data() as ShowcaseMemberProfileDoc;
    const resolvedDisplayName = (existing.displayName && !existing.displayName.includes('@'))
      ? existing.displayName
      : (existing.loginId || displayName);
    await updateDoc(ref, {
      email,
      displayName: resolvedDisplayName,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    // 색인이 없던 회원은 로그인할 때 채워진다. 로그인을 기다리게 하지 않는다.
    void writeLoginIndex(this.firestore, existing.loginId, email, uid);

    return {
      ...existing,
      email,
      displayName: resolvedDisplayName,
    };
  }

  subscribe(
    uid: string,
    onNext: (profile: ShowcaseMemberProfileDoc | null, exists: boolean) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      doc(this.firestore, 'members', uid),
      snapshot => onNext(snapshot.exists() ? snapshot.data() as ShowcaseMemberProfileDoc : null, snapshot.exists()),
      onError,
    );
  }
}