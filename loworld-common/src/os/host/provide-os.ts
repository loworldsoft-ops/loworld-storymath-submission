import { inject, makeEnvironmentProviders, provideBrowserGlobalErrorListeners, type ApplicationConfig, type EnvironmentProviders } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, type CanActivateFn, type Routes } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLwTheme } from '../../services/theme/provide-lw-theme';
import { LW_DATABASE_PORT } from '../../services/ports/database.port';
import { LW_MEMBER_DIRECTORY_PORT } from '../../services/ports/member-directory.port';
import { READER_CATALOG_PORT } from '../../services/ports/reader-catalog.port';
import { READER_SLOT_PORT } from '../../services/ports/reader-slot.port';
import { STORY_CONTENT_PORT, LW_CONTENT_BASE_URL } from '../../services/ports/story-content.port';
import { HttpStoryContentRepository } from '../../services/adapters/http-story-content.repository';
import { LW_MODAL_PRESENTATION } from '../../ui/overlay/modal/modal.tokens';
import { provideLwTooltip } from '../../ui/overlay/tooltip/tooltip.service';
import { FirestoreDatabaseAdapter } from '../../firebase/adapters/firestore-database.adapter';
import { FirestoreReaderCatalogRepository, FirestoreReaderSlotRepository } from '../../firebase/public';
import { ShowcaseMemberDirectoryService } from '../../firebase/showcase-member-directory.service';
import { configureLwFirebase, type LwFirebaseConfig } from '../../firebase/showcase-firebase.client';
import { provideShowcaseMemberLoginBridge } from '../platform/provide-showcase-member-login-bridge';
import { ShowcaseDbService } from '../../services/data/showcase-directory.service';
import { CalendarDbService } from '../../services/data/showcase-schedule.service';
import { NOTE_REPOSITORY } from '../../services/ports/document-repository.token';
import { CALENDAR_REPOSITORY } from '../../services/ports/schedule-repository.token';
import { EventLogService } from '../../services/services/event-log.service';
import { EVENT_LOGGER } from '../../services/tokens/event-logger.token';
import { LW_OS_DOMAINS } from '../platform/core/domain-registry/domain-registry.service';
import { registerAppLooks, type LwOsHomePage } from '../platform/core/domain-registry/app-look';
import { LW_OS_MOBILE_TAB_ALIASES, LW_OS_WINDOW_TABS, WindowTabRegistryService } from '../platform/core/domain-registry/window-tab-registry.service';
import type { DomainDefinition } from '../platform/core/domain-registry/domain-registry.types';
import type { WindowTabRegistration } from '../platform/core/domain-registry/window-tab-registry.types';
import { routes, tabRoutes } from '../root/app.routes';
import type { LwAppManifest, LwEnvironment } from './app-manifest';
import { LW_OS_STANDALONE_TAB, lwOsHomeTab } from './standalone.token';
import { LW_FRAME_APP_DEFAULTS } from '../../services/settings/lw-frame-settings';


export interface LwOsOptions {
  /** 띄울 앱들의 선언서. */
  readonly apps: readonly LwAppManifest[];
  /** 앱이 아닌, 띄우는 쪽이 직접 갖는 정의와 창(도감, 탐색기 등). */
  readonly domains?: readonly DomainDefinition[];
  /** OS에 보일 순서(정의의 id). 적지 않은 것은 뒤에 붙는다. */
  readonly domainOrder?: readonly string[];
  readonly windowTabs?: readonly WindowTabRegistration[];
  readonly mobileTabAliases?: Readonly<Record<string, string>>;
  /** 홈(바탕화면, 모바일 홈)의 쪽 구성. "자주 사용하는 앱" 쪽은 OS가 늘 맨 앞에 둔다. 적지 않으면 한 쪽에 다 놓는다. */
  readonly homePages?: readonly LwOsHomePage[];
  /** 단독 실행이면 그 앱의 첫 탭. */
  readonly standaloneTab?: string | null;
}

/**
 * 단독 실행에서는 그 앱의 탭만 열 수 있다. OS 화면이나 다른 앱의 주소로 오면 집으로 돌려보낸다.
 * 단독 실행의 등록부에는 그 앱의 탭만 있으므로 등록부에 있는지로 가린다.
 */
const standaloneTabGuard: CanActivateFn = (route) => {
  if (!inject(LW_OS_STANDALONE_TAB)) return true;
  const tab = route.url[0]?.path ?? '';
  return inject(WindowTabRegistryService).has(tab) ? true : inject(Router).createUrlTree(['/' + lwOsHomeTab()]);
};

/** 처음 주소와 모르는 주소가 갈 곳을 집(OS 화면이나 단독 앱의 첫 탭)으로 바꾼 경로 목록. */
export function lwOsRoutes(windowTabs: readonly WindowTabRegistration[] = []): Routes {
  // 모르는 주소를 받는 `**`가 맨 뒤에 있어야 하므로 앱의 주소를 그 앞에 끼운다. 같은 주소는 OS의 것이 먼저다.
  const fallback = routes.filter((route) => route.path === '**');
  const all = [...routes.filter((route) => route.path !== '**'), ...tabRoutes(windowTabs), ...fallback];
  return all.map((route) => {
    if (route.redirectTo === 'overview' && (route.path === '' || route.path === '**')) return { ...route, redirectTo: () => '/' + lwOsHomeTab() };
    if (route.component && route.path !== 'login') return { ...route, canActivate: [...(route.canActivate ?? []), standaloneTabGuard] };
    return route;
  });
}

function orderDomains(domains: readonly DomainDefinition[], order: readonly string[] | undefined): readonly DomainDefinition[] {
  if (!order) return domains;
  const rank = (id: string) => { const i = order.indexOf(id); return i < 0 ? order.length : i; };
  return [...domains].sort((a, b) => rank(a.id) - rank(b.id));
}

/** OS 화면과 그 안의 앱이 쓰는 공통 서비스를 한 번에 넣는다. 쇼케이스와 단독 실행이 같은 것을 쓴다. */
export function provideLwOs(options: LwOsOptions): EnvironmentProviders {
  const standaloneTab = options.standaloneTab ?? null;
  const domains = orderDomains([...options.apps.map((app) => app.domain), ...(options.domains ?? [])], options.domainOrder);
  registerAppLooks(domains, options.homePages);
  // 앱이 정한 틀의 기본값을 그 앱의 탭마다 달아 둔다. 창을 띄우는 쪽이 탭만 보고 찾는다.
  const windowTabs = [...options.apps.flatMap((app) => app.windowTabs.map((tab) => (app.frame ? { ...tab, frame: app.frame } : tab))), ...(options.windowTabs ?? [])];
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(lwOsRoutes(windowTabs)),
    { provide: LW_OS_STANDALONE_TAB, useValue: standaloneTab },
    // 설정 화면이 보이는 기본값이다. 단독 실행이면 그 앱의 것이고, 쇼케이스는 공통의 것이다. 틀은 창마다 그 앱의 것을 따로 받는다.
    { provide: LW_FRAME_APP_DEFAULTS, useValue: standaloneTab ? (options.apps[0]?.frame ?? {}) : {} },
    { provide: LW_OS_DOMAINS, useValue: domains },
    { provide: LW_OS_WINDOW_TABS, useValue: windowTabs },
    { provide: LW_OS_MOBILE_TAB_ALIASES, useValue: options.mobileTabAliases ?? {} },
    provideShowcaseMemberLoginBridge(),
    { provide: NOTE_REPOSITORY, useClass: ShowcaseDbService },
    { provide: CALENDAR_REPOSITORY, useClass: CalendarDbService },
    { provide: EVENT_LOGGER, useExisting: EventLogService },
    { provide: LW_DATABASE_PORT, useClass: FirestoreDatabaseAdapter },
    { provide: LW_MEMBER_DIRECTORY_PORT, useExisting: ShowcaseMemberDirectoryService },
    { provide: READER_CATALOG_PORT, useClass: FirestoreReaderCatalogRepository },
    { provide: READER_SLOT_PORT, useClass: FirestoreReaderSlotRepository },
    { provide: STORY_CONTENT_PORT, useClass: HttpStoryContentRepository },
    provideLwTheme(),
    provideLwTooltip(),
    // 데스크톱 OS에서도 모달은 모두 바텀시트로 띄운다.
    { provide: LW_MODAL_PRESENTATION, useValue: 'sheet' },
  ]);
}

export type { LwEnvironment } from './app-manifest';

/** 쇼케이스를 띄운다. */
export function bootstrapLwOs(environment: LwEnvironment, options: LwOsOptions): Promise<unknown> {
  if (environment.firebase) {
    configureLwFirebase(environment.firebase);
  }
  const extraProviders = environment.contentBaseUrl
    ? [{ provide: LW_CONTENT_BASE_URL, useValue: environment.contentBaseUrl }]
    : [];
  const config: ApplicationConfig = { providers: [provideLwOs(options), ...extraProviders] };
  const target = '../root/app';
  return import(/* @vite-ignore */ `${target}`).then(({ App }) => bootstrapApplication(App, config)).catch((err) => console.error(err));
}

export { provideLwApp, bootstrapLwApp } from '../../host/provide-app';
