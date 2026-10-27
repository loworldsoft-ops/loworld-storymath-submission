import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { ILwDatabasePort } from '../ports/database.port';
import type { MemberDirectoryPort, CreateDirectoryMemberDto } from '../ports/member-directory.port';
import type { LwMember, UpdateLwMemberDto } from '../models/member.model';
import type { ReaderCatalogPort } from '../ports/reader-catalog.port';
import type { BookshelfBookItem } from '../models/story-reader.model';
import type { ReaderSlotPort } from '../ports/reader-slot.port';
import type { ReaderSavedState } from '../models/reader-slot.model';

/** Firebase가 없는 오프라인 환경에서 데이터베이스 포트를 안전하게 대체하는 스텁입니다. */
@Injectable()
export class UnavailableDatabaseAdapter implements ILwDatabasePort {
  watchCollection<T = unknown>(): Observable<T[]> {
    return of([]);
  }
  async saveDocument(): Promise<void> {}
  async deleteDocument(): Promise<void> {}
  async wipeCollection(): Promise<void> {}
}

/** Firebase가 없는 오프라인 환경에서 회원 디렉터리 포트를 안전하게 대체하는 스텁입니다. */
@Injectable()
export class UnavailableMemberDirectoryService implements MemberDirectoryPort {
  readonly members = signal<LwMember[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly currentUid = signal<string | null>(null);
  readonly currentMember = signal<LwMember | null>(null);
  readonly hasOwner = signal<boolean>(true);
  readonly canBootstrapOwner = signal<boolean>(false);
  readonly canMutate = signal<boolean>(false);

  selectMember(): void {}
  async updateMember(_dto: UpdateLwMemberDto): Promise<void> {}
  async createMember(_dto: CreateDirectoryMemberDto): Promise<string> {
    return 'local-user';
  }
}

/** Firebase가 없는 오프라인 환경에서 리더 도서 카탈로그 포트를 안전하게 대체하는 스텁입니다. */
@Injectable()
export class UnavailableReaderCatalogRepository implements ReaderCatalogPort {
  async loadCatalog(): Promise<readonly BookshelfBookItem[]> {
    return [];
  }
}

/** Firebase가 없는 오프라인 환경에서 리더 슬롯 포트를 안전하게 대체하는 스텁입니다. */
@Injectable()
export class UnavailableReaderSlotRepository implements ReaderSlotPort {
  getCurrentUid(): string | null {
    return null;
  }
  load(_packId?: string): ReaderSavedState {
    return { version: 1, activeSlotId: null, entries: {} };
  }
  async loadWithCloudSync(packId?: string): Promise<ReaderSavedState> {
    return this.load(packId);
  }
  save(_state: ReaderSavedState, _packId?: string): void {}
}
