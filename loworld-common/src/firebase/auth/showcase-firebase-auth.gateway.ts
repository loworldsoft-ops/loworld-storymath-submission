import { Injectable } from '@angular/core';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { applyShowcaseAuthPersistence, getShowcaseFirebaseAuth } from '../showcase-firebase.client';

@Injectable({ providedIn: 'root' })
export class ShowcaseFirebaseAuthGateway {
  private readonly auth = getShowcaseFirebaseAuth();

  onAuthStateChanged(listener: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, listener);
  }

  async applyPersistence(rememberMe: boolean | undefined): Promise<void> {
    await applyShowcaseAuthPersistence(rememberMe);
  }

  async signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  async updateDisplayName(user: User, displayName: string): Promise<void> {
    await updateProfile(user, { displayName });
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}