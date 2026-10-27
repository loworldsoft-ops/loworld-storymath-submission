import { Injectable, inject, DestroyRef } from '@angular/core';
import { DomainRegistryService } from '../../platform/core/domain-registry/domain-registry.service';
import { WindowTabRegistryService } from '../../platform/core/domain-registry/window-tab-registry.service';
import { OverviewActionFacade } from '../overview/facade/overview-action.facade';
import { OverviewRegistryService } from '../overview/registry/overview-registry.service';
import { OverviewShellFacade } from '../overview/facade/overview-shell.facade';
import { ShowcaseWindowManagerService } from '../overview/facade/showcase-window-manager.service';
import { ShowcaseHotkeyService } from '../overview/facade/showcase-hotkey.service';
import { ShowcaseNavRouteFacade } from './showcase-nav-route.facade';
import { ShowcaseWorkspaceStateFacade } from './showcase-workspace-state.facade';

/**
 * WindowManagerOrchestrator
 * 쇼케이스 데스크톱/모바일 윈도우 시뮬레이터, 탭 레지스트리, 라우트 바인딩, 테마/UI 스토어를 총괄하는 오케스트레이터
 * (서브도메인 파사드 계층화를 통해 직접 DI 의존성을 20개 ➔ 8개로 대폭 축소)
 */
@Injectable({ providedIn: 'root' })
export class WindowManagerOrchestrator {
  // ── [Sub-domain Facades] ──
  readonly navRoute = inject(ShowcaseNavRouteFacade);
  readonly workspaceState = inject(ShowcaseWorkspaceStateFacade);

  // ── [Direct Core Coordinators & Registries] ──
  readonly windowTabRegistry = inject(WindowTabRegistryService);
  readonly domainRegistry = inject(DomainRegistryService);
  readonly overviewAction = inject(OverviewActionFacade);
  readonly overviewRegistry = inject(OverviewRegistryService);
  readonly shell = inject(OverviewShellFacade);
  readonly windowManager = inject(ShowcaseWindowManagerService);
  readonly hotkeyService = inject(ShowcaseHotkeyService);

  // ── [Nav & Route Domain Delegates] ──
  get routeService() { return this.navRoute.routeService; }
  get routeSync() { return this.navRoute.routeSync; }
  get menuAction() { return this.navRoute.menuAction; }
  get navigation() { return this.navRoute.navigation; }
  get routerBinding() { return this.navRoute.routerBinding; }

  // ── [Workspace State Domain Delegates] ──
  get clockStore() { return this.workspaceState.clockStore; }
  get themeStore() { return this.workspaceState.themeStore; }
  get uiState() { return this.workspaceState.uiState; }
  get viewTypeStore() { return this.workspaceState.viewTypeStore; }
  get windowStore() { return this.workspaceState.windowStore; }
  get wallpaperStore() { return this.workspaceState.wallpaperStore; }
  get deviceModeService() { return this.workspaceState.deviceModeService; }

  // Store Signals
  readonly viewType = this.workspaceState.viewTypeStore.viewType;
  readonly themeMode = this.workspaceState.themeStore.themeMode;
  readonly playTheme = this.workspaceState.themeStore.playTheme;
  readonly skin = this.workspaceState.themeStore.skin;

  readonly startOpen = this.workspaceState.uiState.startOpen;
  readonly mobileSelectedGroup = this.workspaceState.uiState.mobileSelectedGroup;
  readonly mobileSheetFolderId = this.workspaceState.uiState.mobileSheetFolderId;
  readonly mobileDockAction = this.workspaceState.uiState.mobileDockAction;
  readonly allComponentsMobileSidebarOpen = this.workspaceState.uiState.allComponentsMobileSidebarOpen;

  readonly windows = this.workspaceState.windowStore.windows;
  readonly activeWindow = this.workspaceState.windowStore.activeWindow;
  readonly runningTabs = this.workspaceState.windowStore.runningTabs;
  readonly windowsByZIndex = this.workspaceState.windowStore.windowsByZIndex;
  readonly openWindowCount = this.workspaceState.windowStore.openWindowCount;
  readonly launchMode = this.workspaceState.windowStore.launchMode;

  readonly launchGroupDefs = this.shell.launchGroupDefs;
  readonly launchItems = this.shell.launchItems;
  readonly workspaceCount = this.shell.workspaceCount;
  readonly folderCount = this.shell.folderCount;

  initHotkeys(callbacks: {
    onSearch: () => void;
    onCloseActive: () => void;
    onToggleDesktop: () => void;
  }, destroyRef: DestroyRef): void {
    this.hotkeyService.init(callbacks, destroyRef);
  }

  startClock(destroyRef: DestroyRef): void {
    this.workspaceState.clockStore.start(destroyRef);
  }
}
