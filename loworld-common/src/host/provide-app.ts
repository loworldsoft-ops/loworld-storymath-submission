import {
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
  type ApplicationConfig,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLwTheme } from '../services/theme/provide-lw-theme';
import { LW_DATABASE_PORT } from '../services/ports/database.port';
import { LW_MEMBER_DIRECTORY_PORT } from '../services/ports/member-directory.port';
import { READER_CATALOG_PORT } from '../services/ports/reader-catalog.port';
import { READER_SLOT_PORT } from '../services/ports/reader-slot.port';
import { STORY_CONTENT_PORT, LW_CONTENT_BASE_URL } from '../services/ports/story-content.port';
import { HttpStoryContentRepository } from '../services/adapters/http-story-content.repository';
import {
  UnavailableDatabaseAdapter,
  UnavailableMemberDirectoryService,
  UnavailableReaderCatalogRepository,
  UnavailableReaderSlotRepository,
} from '../services/adapters/unavailable-ports.adapter';
import { LW_MODAL_PRESENTATION } from '../ui/overlay/modal/modal.tokens';
import { provideLwTooltip } from '../ui/overlay/tooltip/tooltip.service';
import { FirestoreDatabaseAdapter } from '../firebase/adapters/firestore-database.adapter';
import {
  FirestoreReaderCatalogRepository,
  FirestoreReaderSlotRepository,
} from '../firebase/public';
import { ShowcaseMemberDirectoryService } from '../firebase/showcase-member-directory.service';
import { configureLwFirebase } from '../firebase/showcase-firebase.client';
import { provideShowcaseMemberLoginBridge } from './provide-member-login-bridge';
import { ShowcaseDbService } from '../services/data/showcase-directory.service';
import { CalendarDbService } from '../services/data/showcase-schedule.service';
import { NOTE_REPOSITORY } from '../services/ports/document-repository.token';
import { CALENDAR_REPOSITORY } from '../services/ports/schedule-repository.token';
import { EventLogService } from '../services/services/event-log.service';
import { EVENT_LOGGER } from '../services/tokens/event-logger.token';
import { LW_FRAME_APP_DEFAULTS } from '../services/settings/lw-frame-settings';
import { LW_APPEARANCE_APP_DEFAULTS } from '../services/theme/lw-appearance.model';
import type { LwAppManifest, LwEnvironment } from './app-manifest';
import { standaloneRoutes } from './standalone.routes';
import { StandaloneAppComponent } from './standalone-app.component';

/** 단독 실행 앱이 사용하는 공통 서비스를 주입합니다. OS 셸 의존성이 완전히 배제됩니다. */
export function provideLwApp(manifest: LwAppManifest, environment?: LwEnvironment): EnvironmentProviders {
  const isOffline = manifest.native?.offline === true || !environment?.firebase;
  const providers: (Provider | EnvironmentProviders)[] = [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(standaloneRoutes(manifest), withComponentInputBinding()),
    { provide: LW_FRAME_APP_DEFAULTS, useValue: manifest.frame ?? {} },
    { provide: LW_APPEARANCE_APP_DEFAULTS, useValue: manifest.appearance ?? {} },
    { provide: EVENT_LOGGER, useExisting: EventLogService },
    { provide: STORY_CONTENT_PORT, useClass: HttpStoryContentRepository },
    provideLwTheme(),
    provideLwTooltip(),
    { provide: LW_MODAL_PRESENTATION, useValue: 'sheet' },
  ];

  if (manifest.repositories?.includes('note') || manifest.id === 'note') {
    providers.push({ provide: NOTE_REPOSITORY, useClass: ShowcaseDbService });
  }

  if (manifest.repositories?.includes('calendar') || manifest.id === 'calendar') {
    providers.push({ provide: CALENDAR_REPOSITORY, useClass: CalendarDbService });
  }

  if (isOffline) {
    providers.push(
      { provide: LW_DATABASE_PORT, useClass: UnavailableDatabaseAdapter },
      { provide: LW_MEMBER_DIRECTORY_PORT, useClass: UnavailableMemberDirectoryService },
      { provide: READER_CATALOG_PORT, useClass: UnavailableReaderCatalogRepository },
      { provide: READER_SLOT_PORT, useClass: UnavailableReaderSlotRepository },
    );
  } else {
    providers.push(
      ...provideShowcaseMemberLoginBridge(),
      { provide: LW_DATABASE_PORT, useClass: FirestoreDatabaseAdapter },
      { provide: LW_MEMBER_DIRECTORY_PORT, useExisting: ShowcaseMemberDirectoryService },
      { provide: READER_CATALOG_PORT, useClass: FirestoreReaderCatalogRepository },
      { provide: READER_SLOT_PORT, useClass: FirestoreReaderSlotRepository },
    );
  }

  return makeEnvironmentProviders(providers);
}

/** 앱 하나를 단독으로 띄웁니다. OS 셸을 전혀 로드하지 않고 순수 앱 화면을 렌더링합니다. */
export function bootstrapLwApp(environment: LwEnvironment, manifest: LwAppManifest): Promise<unknown> {
  const isOffline = manifest.native?.offline === true || !environment.firebase;
  if (!isOffline && environment.firebase) {
    configureLwFirebase(environment.firebase);
  }
  const extraProviders = environment.contentBaseUrl
    ? [{ provide: LW_CONTENT_BASE_URL, useValue: environment.contentBaseUrl }]
    : [];
  const config: ApplicationConfig = { providers: [provideLwApp(manifest, environment), ...extraProviders] };
  return bootstrapApplication(StandaloneAppComponent, config).catch((err) => console.error(err));
}
