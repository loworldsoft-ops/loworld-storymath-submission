import { Injectable, computed, inject } from '@angular/core';
import { LW_STORAGE_PORT } from '../../../services/ports/storage.port';
import { LW_MEMBER_DIRECTORY_PORT } from '../../../services/ports/member-directory.port';
import { type LwMemberAuthSessionView } from '../../../services/models/auth.model';
import { NOTE_REPOSITORY } from '../../../services/ports/document-repository.token';
import { CALENDAR_REPOSITORY } from '../../../services/ports/schedule-repository.token';
import { OverviewSessionFacade } from '../overview/facade/overview-session.facade';

/**
 * PlatformAuthOrchestrator
 * 플랫폼 데이터 저장소, 회원 디렉토리, 인증 세션을 오케스트레이션하는 단일 접점
 */
@Injectable({ providedIn: 'root' })
export class PlatformAuthOrchestrator {
  readonly storage = inject(LW_STORAGE_PORT);
  readonly directoryService = inject(LW_MEMBER_DIRECTORY_PORT);
  readonly session = inject(OverviewSessionFacade);
  readonly noteDb = inject(NOTE_REPOSITORY);
  readonly calDb = inject(CALENDAR_REPOSITORY);

  readonly account = this.session.account;
  readonly role = this.session.role;
  readonly memberAuthSession = this.session.memberAuthSession;
  readonly loginLabel = this.session.loginLabel;
  readonly loginStateLabel = this.session.loginStateLabel;

  readonly canAccessLoworldDb = computed(() => {
    const r = this.role();
    return r === 'OWNER' || r === 'ADMIN';
  });

  initRepositories(): void {
    this.noteDb.init();
    this.calDb.init();
  }

  clearStorage(): void {
    this.storage.clear();
  }

  async resetNoteDb(): Promise<void> {
    await this.noteDb.resetDb();
  }

  async resetCalDb(): Promise<void> {
    await this.calDb.resetDb();
  }
}
