import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * 🗄️ ILwDatabasePort
 *
 * UI 계층이 구체 데이터베이스 SDK(Cloud Firestore, IndexedDB, REST API 등)에 
 * 직접 결합되는 것을 차단하고 의존 역전 원칙(DIP)을 준수하도록 하는 추상 데이터베이스 포트 계약입니다.
 */
export interface ILwDatabasePort {
  /**
   * 컬렉션 실시간 구독 (Live Subscription)
   */
  watchCollection<T = unknown>(collectionName: string, limitCount?: number): Observable<T[]>;

  /**
   * 문서 저장 또는 병합(Merge) 갱신
   */
  saveDocument<T extends object>(collectionName: string, documentId: string, data: T): Promise<void>;

  /**
   * 단일 문서 영구 삭제
   */
  deleteDocument(collectionName: string, documentId: string): Promise<void>;

  /**
   * 특정 컬렉션의 모든 문서 일괄 삭제 (와이프)
   */
  wipeCollection(collectionName: string): Promise<void>;
}

/**
 * 💉 전역 데이터베이스 추상 포트 주입 토큰
 */
export const LW_DATABASE_PORT = new InjectionToken<ILwDatabasePort>('LW_DATABASE_PORT');
