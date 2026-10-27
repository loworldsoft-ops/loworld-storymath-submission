import { Injectable } from '@angular/core';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { BookshelfBookItem } from '../../services/models/story-reader.model';
import { READER_BOOKSHELF_CATALOG } from '../../services/data/reader-bookshelf-catalog.data';
import type { ReaderCatalogPort } from '../../services/ports/reader-catalog.port';
import { getShowcaseFirestore } from '../showcase-firebase.client';

/**
 * 리더 앱 책장 카탈로그 저장소 (Cloud Firestore + 정적 프리셋 하이브리드)
 *
 * Firestore 컬렉션: `readerCatalog/{bookId}`
 * 오프라인/초기 폴백: `READER_BOOKSHELF_CATALOG`
 */
@Injectable({ providedIn: 'root' })
export class FirestoreReaderCatalogRepository implements ReaderCatalogPort {
  private cachedCatalog: readonly BookshelfBookItem[] | null = null;

  async loadCatalog(): Promise<readonly BookshelfBookItem[]> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }

    try {
      const db = getShowcaseFirestore();
      const colRef = collection(db, 'readerCatalog');
      const snap = await getDocs(colRef);

      if (!snap.empty) {
        const books: BookshelfBookItem[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data['title'] ?? '',
            subtitle: data['subtitle'] ?? '',
            genre: data['genre'] ?? '',
            summary: data['summary'] ?? '',
            episodeCount: Number(data['episodeCount'] ?? 0),
            isCompleted: Boolean(data['isCompleted']),
            isAvailable: Boolean(data['isAvailable']),
            badge: data['badge'] ?? undefined,
          };
        });

        // 정렬 순서 보정 (wuxia-1 우선 등)
        books.sort((a, b) => {
          if (a.id === 'wuxia-1') return -1;
          if (b.id === 'wuxia-1') return 1;
          return a.id.localeCompare(b.id);
        });

        this.cachedCatalog = books;
        return books;
      }

      // Firestore에 데이터가 없으면 기본 카탈로그를 Firestore에 시딩
      await this.seedDefaultCatalog();
    } catch (err) {
      console.warn('[FirestoreReaderCatalogRepository] Falling back to default bookshelf catalog:', err);
    }

    this.cachedCatalog = READER_BOOKSHELF_CATALOG;
    return READER_BOOKSHELF_CATALOG;
  }

  /**
   * Firestore에 기본 도서 카탈로그를 시딩합니다.
   */
  async seedDefaultCatalog(): Promise<void> {
    try {
      const db = getShowcaseFirestore();
      for (const book of READER_BOOKSHELF_CATALOG) {
        const docRef = doc(db, 'readerCatalog', book.id);
        await setDoc(
          docRef,
          {
            ...book,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('[FirestoreReaderCatalogRepository] Failed to seed default catalog to Firestore:', err);
    }
  }
}

/** 하위 호환성을 위한 별칭 */
export { FirestoreReaderCatalogRepository as ReaderCatalogRepository };
