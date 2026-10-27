import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberAuthErrorMapper {
  map(error: unknown): never {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
    const message = error instanceof Error ? error.message : String(error);

    console.error('[MemberAuth] error', { code, message, error });

    if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
      throw new Error('FIREBASE_AUTH_NOT_ENABLED');
    }
    if (code === 'auth/email-already-in-use') {
      throw new Error('DUPLICATE_MEMBER');
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email') {
      throw new Error('INVALID_CREDENTIALS');
    }
    if (code === 'permission-denied' || code === 'firestore/permission-denied') {
      throw new Error('FIRESTORE_PERMISSION_DENIED');
    }

    throw error instanceof Error ? error : new Error('FIREBASE_AUTH_FAILED');
  }
}