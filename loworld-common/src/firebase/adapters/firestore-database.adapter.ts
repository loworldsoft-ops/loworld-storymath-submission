import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { collection, deleteDoc, doc, limit, onSnapshot, query, setDoc } from 'firebase/firestore';
import type { ILwDatabasePort } from '../../services/ports/database.port';
import { getShowcaseFirestore } from '../showcase-firebase.client';

/**
 * 🏛️ FirestoreDatabaseAdapter
 *
 * ILwDatabasePort를 Cloud Firestore SDK를 사용하여 구체 구현한 어댑터입니다.
 * UI 컴포넌트가 Firebase SDK에 직접 결합되지 않도록 모든 Firestore 연산을 캡슐화합니다.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreDatabaseAdapter implements ILwDatabasePort {
  private get db() {
    return getShowcaseFirestore();
  }

  watchCollection<T = unknown>(collectionName: string, limitCount = 100): Observable<T[]> {
    return new Observable<T[]>(subscriber => {
      try {
        const colRef = collection(this.db, collectionName);
        const q = query(colRef, limit(limitCount));
        const unsubscribe = onSnapshot(
          q,
          snapshot => {
            const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as T);
            subscriber.next(records);
          },
          error => {
            subscriber.error(error);
          },
        );

        return () => unsubscribe();
      } catch (err) {
        subscriber.error(err);
        return undefined;
      }
    });
  }

  async saveDocument<T extends object>(collectionName: string, documentId: string, data: T): Promise<void> {
    const docRef = doc(this.db, collectionName, documentId);
    await setDoc(docRef, data, { merge: true });
  }

  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    const docRef = doc(this.db, collectionName, documentId);
    await deleteDoc(docRef);
  }

  async wipeCollection(collectionName: string): Promise<void> {
    const colRef = collection(this.db, collectionName);
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(colRef);
    await Promise.all(snapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
  }
}
