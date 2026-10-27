import { NgTemplateOutlet } from '@angular/common';
import { Component, signal, computed, inject, DestroyRef, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import type { LwAccountLoginDialogData } from '../../patterns/lib/overlay/dialogs/member-login-dialog/member-login-dialog.types';
import { LwDialogHostComponent } from '../../ui/overlay/dialog/lw-dialog-host.component';
import { LwSnackbarHostComponent } from '../../ui/overlay/snackbar/lw-snackbar-host.component';
import { LwCardComponent } from '../../ui/data-display/card/card.component';
import { ComponentMeta, OverviewExplorerFolder, OverviewExplorerFolderId, OverviewLaunchGroupDef, OverviewLaunchItem, OverviewWindow, OverviewWindowLaunchMode, OverviewWindowTab } from '../../services/models/os.types';
import { DomainRegistryService } from '../platform/core/domain-registry/domain-registry.service';
import { WindowTabRegistryService } from '../platform/core/domain-registry/window-tab-registry.service';
import { LW_OS_STANDALONE_TAB } from '../host/standalone.token';
import { WindowTabHostComponent } from '../platform/core/domain-registry/window-tab-host.component';
import type { WindowTabSettingsMode } from '../platform/core/domain-registry/window-tab-registry.types';
import { OverviewActionFacade, type OverviewActionContext } from '../shell/overview/facade/overview-action.facade';
import { OverviewRegistryService } from '../shell/overview/registry/overview-registry.service';
import { OverviewShellFacade } from '../shell/overview/facade/overview-shell.facade';
import { OverviewSessionFacade } from '../shell/overview/facade/overview-session.facade';
import { OverviewClockStore } from '../shell/overview/store/overview-clock.store';
import { OverviewRouteService } from '../shell/overview/route/overview-route.service';
import { OverviewRouteSyncService } from '../shell/overview/route/overview-route-sync.service';
import { OverviewThemeStore } from '../shell/overview/store/overview-theme.store';
import { OverviewUiStateStore } from '../shell/overview/store/overview-ui-state.store';
import { OverviewViewTypeStore } from '../shell/overview/store/overview-view-type.store';
import { OverviewWindowStore } from '../shell/overview/store/overview-window.store';
import { ShowcaseMenuActionFacade } from '../shell/navigation/showcase-menu-action.facade';
import { ShowcaseNavigationFacade } from '../shell/navigation/showcase-navigation.facade';
import { ShowcaseRouterBindingService } from '../shell/navigation/showcase-router-binding.service';
import { ShowcaseWindowManagerService } from '../shell/overview/facade/showcase-window-manager.service';
import { ShowcaseHotkeyService } from '../shell/overview/facade/showcase-hotkey.service';
import { ShowcaseDirectRouteFloatingCloseComponent } from '../shell/navigation/showcase-direct-route-floating-close.component';
import { isShowcaseDirectRouteFloatingCloseTab } from '../shell/navigation/showcase-direct-route-floating-close-tabs';
import { AppModalCoordinatorService } from '../shell/services/app-modal-coordinator.service';
import { PlatformAuthOrchestrator } from '../shell/orchestrators/platform-auth.orchestrator';
import { WindowManagerOrchestrator } from '../shell/orchestrators/window-manager.orchestrator';
import { GlobalNotificationOrchestrator } from '../shell/orchestrators/global-notification.orchestrator';
import { OverviewDesktopSurfaceComponent } from '../shell/overview/desktop/overview-desktop-surface.component';
import { OverviewDesktopWallpaperStageComponent } from '../shell/overview/desktop/overview-desktop-wallpaper-stage.component';
import { OverviewAccessGateComponent } from '../shell/overview/shared/overview-access-gate.component';
import { OverviewExplorerWindowComponent } from '../shell/overview/window-system/overview-explorer-window.component';
import { OverviewMobileShellComponent } from '../shell/overview/mobile/overview-mobile-shell.component';
import { OverviewMobileSceneComponent } from '../shell/overview/mobile/overview-mobile-scene.component';
import { OverviewStartPanelComponent } from '../shell/overview/desktop/overview-start-panel.component';
import { OverviewTaskbarComponent } from '../shell/overview/desktop/overview-taskbar.component';
import { OverviewWindowFrameComponent } from '../shell/overview/window-system/overview-window-frame.component';
import { OverviewIconComponent } from '../../ui/media/icon/overview-icon/overview-icon.component';
import { isSoftLoginOverviewLaunchItem, isOverviewItemDisabled } from '../platform/overview-access';
import { OverviewSettingsDialogHostComponent } from '../shell/overview/dialogs/overview-settings-dialog-host.component';
import { OverviewLoginDialogHostComponent } from '../shell/overview/dialogs/overview-login-dialog-host.component';
import { LwButtonComponent } from '../../ui/form/button/button.component';
import { WallpaperStore } from '../shell/overview/wallpaper/wallpaper.store';
import { OverviewWallpaperDialogComponent } from '../shell/overview/wallpaper/overview-wallpaper-dialog.component';
import { type DeviceMode } from '../shell/overview/device/device-mode.policy';
import { MobileViewportScopeDirective } from '../shell/overview/device/mobile-viewport-scope.directive';
// @defer로만 쓰는 컴포넌트는 배럴이 아니라 자기 파일에서 따로 가져와야 별도 청크로 나뉜다.
import { DeviceSimulatorComponent } from '../shell/overview/device/device-simulator.component';

import { DomainCatalogHostComponent } from '../../catalog/domain-catalog-host/domain-catalog-host.component';
import { OverviewOsLockScreenComponent } from '../shell/overview/lock-screen/overview-os-lock-screen.component';

/**
 * OS 셸 시스템의 최상위 진입점이자 윈도우 및 데스크탑 관리 루트 컴포넌트입니다.
 */
@Component({
  selector: 'lw-root',
  standalone: true,
  imports: [
    OverviewIconComponent,
    NgTemplateOutlet,
    WindowTabHostComponent,
    DomainCatalogHostComponent,
    RouterOutlet,
    RouterLink,
    LwButtonComponent,
    OverviewDesktopSurfaceComponent,
    OverviewDesktopWallpaperStageComponent,
    OverviewMobileShellComponent,
    MobileViewportScopeDirective,
    DeviceSimulatorComponent,
    OverviewMobileSceneComponent,
    OverviewStartPanelComponent,
    OverviewWindowFrameComponent,
    OverviewTaskbarComponent,
    LwSnackbarHostComponent,
    LwDialogHostComponent,
    ShowcaseDirectRouteFloatingCloseComponent,
    OverviewSettingsDialogHostComponent,
    OverviewLoginDialogHostComponent,
    LwCardComponent,
    OverviewWallpaperDialogComponent,
    OverviewOsLockScreenComponent,
    OverviewExplorerWindowComponent,
    OverviewAccessGateComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Angular 인프라 의존성
  private readonly router = inject(Router);
  protected readonly destroyRef = inject(DestroyRef);

  // 3대 도메인 오케스트레이터 (33 DI -> 3 DI 결합도 90% 축소)
  protected readonly platformAuth = inject(PlatformAuthOrchestrator);
  protected readonly windowOrchestrator = inject(WindowManagerOrchestrator);
  protected readonly notification = inject(GlobalNotificationOrchestrator);

  // Platform & Auth 도메인 위임
  private readonly overviewSession = this.platformAuth.session;
  protected readonly db = this.platformAuth.noteDb;
  protected readonly calDb = this.platformAuth.calDb;

  // Window & Desktop 도메인 위임
  protected readonly wallpaperStore = this.windowOrchestrator.wallpaperStore;
  private readonly domainRegistry = this.windowOrchestrator.domainRegistry;
  protected readonly windowTabRegistry = this.windowOrchestrator.windowTabRegistry;
  private readonly overviewAction = this.windowOrchestrator.overviewAction;
  private readonly overviewRegistry = this.windowOrchestrator.overviewRegistry;
  private readonly overviewClockStore = this.windowOrchestrator.clockStore;
  private readonly overviewShell = this.windowOrchestrator.shell;
  private readonly overviewRouteService = this.windowOrchestrator.routeService;
  private readonly overviewRouteSync = this.windowOrchestrator.routeSync;
  private readonly overviewThemeStore = this.windowOrchestrator.themeStore;
  private readonly overviewUiState = this.windowOrchestrator.uiState;
  private readonly overviewViewTypeStore = this.windowOrchestrator.viewTypeStore;
  private readonly overviewWindowStore = this.windowOrchestrator.windowStore;
  private readonly showcaseMenuAction = this.windowOrchestrator.menuAction;
  private readonly showcaseNavigation = this.windowOrchestrator.navigation;
  private readonly showcaseRouterBinding = this.windowOrchestrator.routerBinding;
  private readonly windowManager = this.windowOrchestrator.windowManager;
  protected readonly deviceModeService = this.windowOrchestrator.deviceModeService;
  private readonly hotkeyService = this.windowOrchestrator.hotkeyService;

  // Global UI & Feedback 도메인 위임
  private readonly ui = this.notification.ui;
  protected readonly log = this.notification.log;
  private readonly modalCoordinator = this.notification.modalCoordinator;

  private readonly standaloneTab = inject(LW_OS_STANDALONE_TAB);
  protected readonly activeTab = signal<string>('overview');
  protected readonly selectedMenu = signal<string>('overview');
  protected readonly navPanelOpen = signal(false);

  protected getWindowTabInputs(window: OverviewWindow): Record<string, unknown> {
    return this.windowTabRegistry.resolveInputs(window.tab, {
      window,
      themeMode: this.overviewThemeMode(),
      memberAuthSession: this.overviewMemberAuthSession(),
      loginLabel: this.overviewLoginLabel(),
      loginStateLabel: this.overviewLoginStateLabel(),
      isMobile: this.overviewIsMobile(),
      overviewViewType: this.overviewViewType(),
      allComponentsRouteSection: this.allComponentsRouteSection(),
      allComponentsRouteDetailId: this.allComponentsRouteDetailId(),
      overviewAllComponentsMobileSidebarOpen: this.overviewAllComponentsMobileSidebarOpen(),
      overviewExplorerFolders: this.overviewExplorerFolders(),
      overviewRunningTabs: this.overviewRunningTabs(),
      overviewActiveWindowTab: this.overviewActiveWindowTab(),
    });
  }

  protected getDirectTabInputs(tab: string): Record<string, unknown> {
    return this.windowTabRegistry.resolveInputs(tab, {
      window: { id: `direct-${tab}`, tab, title: tab } as unknown as OverviewWindow,
      themeMode: this.overviewThemeMode(),
      memberAuthSession: this.overviewMemberAuthSession(),
      loginLabel: this.overviewLoginLabel(),
      loginStateLabel: this.overviewLoginStateLabel(),
      isMobile: this.overviewIsMobile(),
      overviewViewType: this.overviewViewType(),
      allComponentsRouteSection: this.allComponentsRouteSection(),
      allComponentsRouteDetailId: this.allComponentsRouteDetailId(),
      overviewAllComponentsMobileSidebarOpen: this.overviewAllComponentsMobileSidebarOpen(),
      overviewExplorerFolders: this.overviewExplorerFolders(),
      overviewRunningTabs: this.overviewRunningTabs(),
      overviewActiveWindowTab: this.overviewActiveWindowTab(),
    });
  }

  protected navigateToDirectTab(target: string): void {
    if (!target) return;
    const path = target.startsWith('/') ? target : `/${target}`;
    void this.router.navigateByUrl(path);
  }

  protected readonly overviewViewType = this.overviewViewTypeStore.viewType;
  protected readonly overviewThemeMode = this.overviewThemeStore.themeMode;
  protected readonly overviewPlayTheme = this.overviewThemeStore.playTheme;
  protected readonly overviewSkin = this.overviewThemeStore.skin;

  /** Windows 서버/데스크톱 메타포: 시작 메뉴·바 아이콘·바탕화면 타일 */
  protected readonly overviewStartOpen = this.overviewUiState.startOpen;
  protected readonly overviewMobileSelectedGroup = this.overviewUiState.mobileSelectedGroup;
  protected readonly overviewMobileSheetFolderId = this.overviewUiState.mobileSheetFolderId;
  protected readonly overviewMobileDockAction = this.overviewUiState.mobileDockAction;

  protected readonly overviewAllComponentsMobileSidebarOpen = this.overviewUiState.allComponentsMobileSidebarOpen;
  protected readonly allComponentsRouteSection = signal<string | undefined>(undefined);
  protected readonly allComponentsRouteDetailId = signal<string | undefined>(undefined);
  protected readonly pendingLaunchItem = signal<OverviewLaunchItem | null>(null);
  protected readonly pendingLaunchTab = signal<string | null>(null);
  protected readonly overviewWindows = this.overviewWindowStore.windows;


  protected readonly overviewLaunchGroupDefs: readonly OverviewLaunchGroupDef[] = this.overviewShell.launchGroupDefs;

  protected readonly overviewLaunchItems = this.overviewShell.launchItems;
  protected readonly overviewSessionControlTabs = computed<ReadonlySet<OverviewWindowTab>>(() => new Set(
    this.overviewLaunchItems()
      .filter(item => !!item.tab && isSoftLoginOverviewLaunchItem(item))
      .map(item => item.tab as OverviewWindowTab),
  ));

  protected readonly overviewWindowsByZIndex = this.overviewWindowStore.windowsByZIndex;
  protected readonly overviewRunningTabs = this.overviewWindowStore.runningTabs;
  protected readonly overviewWorkspaceCount = this.overviewShell.workspaceCount;
  protected readonly overviewFolderCount = this.overviewShell.folderCount;
  protected readonly overviewOpenWindowCount = this.overviewWindowStore.openWindowCount;
  protected readonly overviewAccount = this.overviewSession.account;
  protected readonly overviewRole = this.overviewSession.role;
  protected readonly canAccessLoworldDb = computed(() => this.overviewRole() === 'OWNER' || this.overviewRole() === 'ADMIN');
  protected readonly overviewMemberAuthSession = this.overviewSession.memberAuthSession;
  /** 필수 로그인 여부 확인: 세션 존재 여부에 따라 OS 잠금 화면 vs OS 실제 화면 진입 결정 */
  protected readonly overviewIsAuthenticated = this.overviewSession.isAuthenticated;
  protected readonly overviewLoginSubmitting = this.overviewSession.loginSubmitting;
  protected readonly overviewLoginLabel = this.overviewSession.loginLabel;
  protected readonly overviewLoginStateLabel = this.overviewSession.loginStateLabel;
  protected readonly isOverviewSettingsOpen = this.modalCoordinator.isOverviewSettingsOpen;
  protected readonly isOverviewMobileLoginOpen = this.modalCoordinator.isOverviewMobileLoginOpen;
  protected readonly overviewMobileLoginData = this.modalCoordinator.overviewMobileLoginData;
  protected readonly isLoginDialogOpen = this.modalCoordinator.isLoginDialogOpen;
  protected readonly loginDialogData = this.modalCoordinator.loginDialogData;
  protected readonly activeAppSettingsMode = computed<WindowTabSettingsMode | 'overview'>(() => {
    const tab = this.overviewActiveWindowTab();
    return (tab && this.windowTabRegistry.settingsModeOf(tab)) || 'overview';
  });
  protected readonly activeAppBrandName = computed<string>(() => {
    const tab = this.overviewActiveWindowTab();
    if (!tab) return 'Loworld Overview';
    const win = this.overviewResolvedMobileWindow();
    return win?.title ? `${win.title} 설정` : '앱 설정';
  });
  protected readonly overviewWindowLaunchMode = this.overviewWindowStore.launchMode;
  protected readonly overviewStartSections = this.overviewShell.startSections;
  protected readonly overviewNavSections = this.overviewShell.navSections;
  protected readonly overviewTaskbarPins = this.overviewShell.taskbarPins;
  protected readonly overviewMinimizedTabs = this.overviewWindowStore.minimizedTabs;
  protected readonly overviewActiveWindowTab = this.overviewWindowStore.activeWindowTab;
  protected readonly overviewHasActiveApp = this.overviewWindowStore.hasActiveApp;
  protected readonly overviewHasMaximizedWindow = this.overviewWindowStore.hasMaximizedWindow;
  protected readonly overviewExplorerActiveFolderId = this.overviewWindowStore.explorerActiveFolderId;
  /** 실제로 적용되는 모드. 화면·입력 장치로 정한 기본값에 사용자 선택을 얹은 값이다(DeviceModeService). */
  protected readonly overviewEffectiveDeviceMode = this.deviceModeService.mode;
  protected readonly overviewIsMobile = this.deviceModeService.isMobile;
  /** 모바일 화면을 기종 프레임 안에 그리는 중인가(데스크톱 환경의 스마트폰 모드) */
  protected readonly overviewSimulated = this.deviceModeService.simulated;
  protected readonly overviewStatusLabel = computed(() =>
    this.overviewOpenWindowCount() > 0 ? `${this.overviewOpenWindowCount()}개 앱 실행 중` : 'Workspace idle'
  );

  /** 시뮬레이터 프레임을 끈 상태 */
  protected readonly isMobileSimulatorFrameless = this.deviceModeService.isFrameless;

  protected setOverviewDeviceMode(mode: DeviceMode): void {
    this.deviceModeService.setMode(mode);
  }

  /**
   * 모드가 바뀌면 활성 창을 그 모드의 짝 탭으로 바꾼다(짝은 창 등록부가 안다).
   * 데스크톱용과 모바일용이 다른 컴포넌트인 앱에 한해 창이 새로 열린다.
   */
  private syncActiveWindowToMode(mode: DeviceMode): void {
    const current = this.overviewActiveWindowTab();
    if (!current) return;
    const target = (mode === 'mobile' ? this.windowTabRegistry.mobileTabOf(current) : this.windowTabRegistry.desktopTabOf(current)) as OverviewWindowTab;
    if (target === current) return;
    this.overviewWindowStore.close(current);
    this.overviewAction.openWindow(target, this.getOverviewActionContext());
  }

  protected readonly overviewExplorerFolders = this.overviewShell.explorerFolders;
  protected readonly overviewMobileSheetFolder = computed<OverviewExplorerFolder | null>(() => {
    const folderId = this.overviewMobileSheetFolderId();
    return folderId ? this.overviewShell.getExplorerFolder(folderId) : null;
  });
  protected readonly overviewMobileActiveWindow = this.overviewWindowStore.activeWindow;

  /** 스마트폰 화면 내부에서 렌더링될 때 데스크톱 탭을 모바일 버전으로 100% 보장하는 반응형 활성 창 */
  protected readonly overviewResolvedMobileWindow = computed(() => {
    const active = this.overviewMobileActiveWindow();
    if (!active) return null;
    const mobileTab = this.windowTabRegistry.mobileTabOf(active.tab) as OverviewWindowTab;
    if (mobileTab && mobileTab !== active.tab) {
      const meta = this.overviewRegistry.getWindowMeta(mobileTab);
      return {
        ...active,
        tab: mobileTab,
        title: meta?.title ?? active.title.replace(/\s*데스크톱\s*/g, '').trim(),
        icon: meta?.icon ?? 'mobile',
      };
    }
    return active;
  });
  protected readonly overviewMobileDockVisible = computed(() => {
    if (!this.overviewIsMobile()) {
      return true;
    }

    const activeWindow = this.overviewMobileActiveWindow();
    if (!activeWindow) {
      return true;
    }

    const meta = this.overviewRegistry.getWindowMeta(activeWindow.tab);
    return meta.mobileChrome === 'dock-visible';
  });

  protected readonly showcaseSelectedComponent = computed(() => {
    return this.domainRegistry.getCatalog('showcase').find(c => c.id === this.selectedMenu()) ?? null;
  });

  protected readonly isSidebarVisible = computed(() => {
    if (!this.overviewIsAuthenticated()) return false;
    const tab = this.activeTab();
    if (tab === 'showcase-components') return !!this.showcaseSelectedComponent();
    return false;
  });

  /** Overview 창 프레임 없이 직접 URL로 연 풀스크린 데모 — 우하단 닫기 플로팅 */
  /** 집의 주소. OS 화면이면 `/overview`, 단독 실행이면 그 앱의 첫 탭(휴대폰에서는 모바일 짝)이다. */
  private homeUrl(): string {
    const tab = this.standaloneTab;
    if (!tab) return '/overview';
    return '/' + (this.deviceModeService.isMobile() ? this.windowTabRegistry.mobileTabOf(tab) : tab);
  }

  protected readonly showDirectRouteFloatingClose = computed(() => {
    // 단독 실행에는 돌아갈 OS 화면이 없다.
    if (this.standaloneTab) return false;
    if (!this.overviewIsAuthenticated()) return false;
    if (this.activeTab() === 'overview' || this.activeTab() === 'login') {
      return false;
    }
    return isShowcaseDirectRouteFloatingCloseTab(this.activeTab(), (tab) => this.windowTabRegistry.has(tab));
  });

  protected showOverviewWindowSessionControl(tab: OverviewWindowTab): boolean {
    return this.overviewSessionControlTabs().has(tab);
  }

  /** OCP: 7대 도메인 컴포넌트 도감 카탈로그 메타데이터 및 핸들러 동적 해석기 */
  protected resolveCatalogMeta(tab: string): {
    domain: ComponentMeta['domain'];
    catalog: readonly ComponentMeta[];
    selected: () => ComponentMeta | null;
    onSelect: (id: string) => void;
    onReset: () => void;
  } | null {
    switch (tab) {
      case 'showcase-components':
        return {
          domain: 'showcase',
          catalog: this.domainRegistry.getCatalog('showcase'),
          selected: this.showcaseSelectedComponent,
          onSelect: (c) => this.selectShowcaseMenu(c),
          onReset: () => this.resetMenu('showcase-components'),
        };
      default:
        return null;
    }
  }

  private get selectionCatalogs(): Record<string, readonly ComponentMeta[]> {
    const result: Record<string, readonly ComponentMeta[]> = {};
    for (const d of this.domainRegistry.getDomains()) {
      result[d.id] = d.catalog ?? [];
    }
    return result;
  }

  constructor() {
    this.db.init();
    this.calDb.init();

    // 모드가 바뀔 때(처음 포함) 활성 창을 그 모드에 맞춘다.
    effect(() => {
      const mode = this.deviceModeService.mode();
      untracked(() => this.syncActiveWindowToMode(mode));
    });

    this.overviewClockStore.start(this.destroyRef);
    this.hotkeyService.init({
      onSearch: () => this.openOverviewWindow('all-components'),
      onCloseActive: () => this.windowManager.closeActiveWindow(this.selectedMenu),
      onToggleDesktop: () => this.windowManager.minimizeAll(),
    }, this.destroyRef);

    // 멤버 관리/등록 화면에는 실제로 멤버 디비(Firestore members)에 등록된 회원만 노출해야 하므로,
    // 포털 회원이 비어 있어도 데모용 가짜 후보를 더 이상 자동으로 시드하지 않는다.
    // (seedPortalCandidates 자동 호출 비활성화)

    effect(() => {
      if (this.canAccessLoworldDb()) {
        return;
      }

      const tab = this.activeTab();
      const item = this.domainRegistry.getLaunchItems().find((i) => i.tab === tab);
      if (item && (item.gateStyle === 'hard-block' || item.requiredRoles?.some((r) => r === 'OWNER' || r === 'ADMIN'))) {
        void this.router.navigateByUrl(this.homeUrl());
      }
    });

    // 포털 로그인 모달 완료 시 대기 중이던 앱(pending launch) 자동 실행
    effect(() => {
      const session = this.overviewMemberAuthSession();
      if (!session) return;

      const pendingItem = this.pendingLaunchItem();
      if (pendingItem) {
        this.pendingLaunchItem.set(null);
        this.launchFromOverview(pendingItem);
        return;
      }

      const pendingTab = this.pendingLaunchTab();
      if (pendingTab) {
        this.pendingLaunchTab.set(null);
        this.openOverviewWindow(pendingTab);
        return;
      }

      // /login 경로에서 인증 완료 시 returnUrl 또는 /overview로 이동
      if (this.activeTab() === 'login') {
        const queryParams = this.router.parseUrl(this.router.url).queryParams;
        const returnUrl = (queryParams['returnUrl'] as string | undefined) || this.homeUrl();
        void this.router.navigateByUrl(returnUrl);
      }
    });

    const navigationBinding = this.showcaseRouterBinding.bind(this.selectionCatalogs, command => {
      if (command.kind === 'overview-home') {
        this.activeTab.set('overview');
        this.selectedMenu.set('overview');
        this.overviewWindowStore.closeAll();
        return;
      }

      if (command.kind === 'overview-explorer-home') {
        this.activeTab.set('overview');
        this.openOverviewExplorer('home');
        return;
      }

      if (command.kind === 'overview-window') {
        this.activeTab.set('overview');
        if (command.tab === 'all-components') {
          this.allComponentsRouteSection.set(command.detailId);
          this.allComponentsRouteDetailId.set(command.subDetailId);
        }
        const fullPath = command.subDetailId
          ? `${command.tab}/${command.detailId}/${command.subDetailId}`
          : (command.detailId ? `${command.tab}/${command.detailId}` : command.tab);
        this.overviewAction.openWindow(
          fullPath,
          this.getOverviewActionContext(),
        );
        return;
      }

      if (command.kind === 'all-components') {
        this.allComponentsRouteSection.set(command.section);
        this.allComponentsRouteDetailId.set(command.detailId);
        const fullPath = command.detailId
          ? `all-components/${command.section}/${command.detailId}`
          : (command.section ? `all-components/${command.section}` : 'all-components');
        this.openOverviewWindow(fullPath);
        return;
      }

      this.activeTab.set(command.activeTab);
      this.selectedMenu.set(command.selectedMenu);
    });
    this.destroyRef.onDestroy(() => navigationBinding.unsubscribe());
  }

  protected selectTab(tab: string): void {
    this.closeOverviewStart();
    if (this.activeTab() === 'overview' && this.overviewRouteService.parseWindowRequest(tab)) {
      this.openOverviewWindow(tab);
      return;
    }
    const segments = tab.split('/').filter(s => s.length > 0);
    void this.router.navigate(['/', ...segments]);
  }

  protected closeDirectRouteDemo(): void {
    this.closeOverviewStart();
    this.activeTab.set('overview');
    this.selectedMenu.set('overview');
    void this.router.navigate(['/overview']);
  }

  protected selectMenu(id: string): void {
    this.showcaseMenuAction.selectNoteComponent(this.selectedMenu, id);
  }

  protected selectShowcaseMenu(id: string): void {
    this.showcaseMenuAction.selectShowcaseComponent(this.selectedMenu, id);
  }

  protected resetMenu(tab: string): void {
    const targetTab = (tab === 'components' || tab === 'common-components') ? 'all-components' : tab;
    this.selectedMenu.set(targetTab);
    if (this.router.url.startsWith('/overview') || this.activeTab() === 'overview') {
      void this.router.navigate([`/overview/${targetTab}`]);
    } else {
      void this.router.navigate([`/${targetTab}`]);
    }
  }

  protected setOverviewViewType(type: 'grid' | 'list'): void {
    this.overviewViewTypeStore.setViewType(type);
  }

  protected toggleOverviewStart(): void {
    this.overviewUiState.toggleStart();
  }

  protected closeOverviewStart(): void {
    this.overviewUiState.closeStart();
  }

  protected toggleOverviewTheme(): void {
    this.overviewThemeStore.toggle();
  }

  protected toggleOverviewSettings(): void {
    this.modalCoordinator.toggleOverviewSettings();
  }

  protected closeOverviewSettings(): void {
    this.modalCoordinator.closeOverviewSettings();
  }

  /** 설정에서 배경화면 변경을 고르면 설정을 닫고 배경화면 선택 화면을 연다. */
  protected openOverviewWallpaperFromSettings(): void {
    this.closeOverviewSettings();
    this.wallpaperStore.openModal();
  }

  protected setOverviewWindowLaunchMode(mode: OverviewWindowLaunchMode): void {
    this.overviewWindowStore.setLaunchMode(mode);
  }

  protected selectOverviewMobileGroup(groupId: OverviewExplorerFolderId | 'all'): void {
    this.overviewUiState.selectMobileGroup(groupId);
  }

  protected openOverviewMobileGroup(folderId: OverviewExplorerFolderId): void {
    this.overviewUiState.openMobileGroup(folderId);
  }

  protected closeOverviewMobileGroup(): void {
    this.overviewUiState.closeMobileGroup();
  }

  protected openOverviewAllComponentsMobileSidebar(): void {
    this.overviewUiState.openAllComponentsMobileSidebar();
  }

  protected closeOverviewAllComponentsMobileSidebar(): void {
    this.overviewUiState.closeAllComponentsMobileSidebar();
  }

  protected openOverviewMobileSceneMenu(): void {
    if (this.overviewActiveWindowTab() === 'all-components') {
      this.overviewUiState.toggleAllComponentsMobileSidebar();
      return;
    }

    const currentGroup = this.overviewMobileSelectedGroup();
    this.overviewUiState.setMobileSheetFolder(currentGroup === 'all' ? 'overview-apps' : currentGroup);
  }

  protected focusOverviewMobileRunningTab(tab: OverviewWindowTab): void {
    this.overviewUiState.setDockAction('running');
    this.closeOverviewMobileGroup();
    this.focusOverviewWindow(tab);
  }

  protected handleOverviewMobileDockAction(action: 'home' | 'search' | 'running' | 'account'): void {
    this.closeOverviewMobileGroup();

    if (action === 'account') {
      this.overviewMemberAccountOpen();
      return;
    }

    this.overviewUiState.setDockAction(action);

    if (action === 'home') {
      const active = this.overviewActiveWindowTab();
      if (active) {
        this.minimizeOverviewWindow(active);
      }
      return;
    }

    if (action === 'search') {
      this.openOverviewWindow('all-components');
      return;
    }

    if (action === 'running') {
      const active = this.overviewActiveWindowTab();
      if (active) {
        this.focusOverviewWindow(active);
        return;
      }

      const latestVisibleWindow = [...this.overviewWindowsByZIndex()]
        .reverse()
        .find(window => window.state !== 'minimized');
      if (latestVisibleWindow) {
        this.focusOverviewWindow(latestVisibleWindow.tab);
      }
      return;
    }
  }

  protected isWindowAccessRestricted(tab: string): boolean {
    return isOverviewItemDisabled(tab, this.overviewMemberAuthSession());
  }

  protected openOverviewWindow(tab: string): void {
    if (isOverviewItemDisabled(tab, this.overviewMemberAuthSession())) {
      this.pendingLaunchTab.set(tab);
      this.overviewMemberLoginOpen();
      return;
    }
    if (tab === 'all-components') {
      this.allComponentsRouteSection.set(undefined);
      this.allComponentsRouteDetailId.set(undefined);
    }
    this.windowManager.openWindow(tab, this.overviewEffectiveDeviceMode(), this.getOverviewActionContext());
  }

  protected onAllComponentsRouteStateChange(state: any): void {
    this.allComponentsRouteSection.set(state?.section);
    this.allComponentsRouteDetailId.set(state?.detailId);
    this.overviewRouteSync.syncRoute('all-components', state?.section, 'replace', state?.detailId);
  }

  protected openOverviewExplorer(folderId: OverviewExplorerFolderId): void {
    this.windowManager.openExplorer(folderId, this.selectedMenu);
  }

  protected navigateOverviewExplorer(folderId: any): void {
    this.openOverviewExplorer(folderId);
  }

  protected focusOverviewWindow(tab: OverviewWindowTab): void {
    this.windowManager.focusWindow(tab, this.selectedMenu);
  }

  protected minimizeOverviewWindow(tab: OverviewWindowTab): void {
    this.windowManager.minimizeWindow(tab, this.selectedMenu);
  }

  protected toggleMaximizeOverviewWindow(tab: OverviewWindowTab): void {
    this.windowManager.toggleMaximizeWindow(tab);
  }

  protected closeOverviewWindow(tab: OverviewWindowTab): void {
    if (tab === 'all-components') {
      this.allComponentsRouteSection.set(undefined);
      this.allComponentsRouteDetailId.set(undefined);
    }
    this.windowManager.closeWindow(tab, this.selectedMenu);
  }

  protected toggleOverviewWindowFromTaskbar(tab: string): void {
    if (isOverviewItemDisabled(tab, this.overviewMemberAuthSession())) {
      this.pendingLaunchTab.set(tab);
      this.overviewMemberLoginOpen();
      return;
    }
    if (tab === 'all-components' && !this.overviewWindowStore.windows().some(w => w.tab === 'all-components')) {
      this.allComponentsRouteSection.set(undefined);
      this.allComponentsRouteDetailId.set(undefined);
    }
    this.windowManager.toggleWindowFromTaskbar(tab, this.overviewEffectiveDeviceMode(), this.getOverviewActionContext());
  }

  protected launchFromOverview(item: any): void {
    if (isOverviewItemDisabled(item, this.overviewMemberAuthSession())) {
      this.pendingLaunchItem.set(item);
      this.overviewMemberLoginOpen();
      return;
    }
    if (item.tab === 'all-components' || item.appId === 'workspace.all-components') {
      this.allComponentsRouteSection.set(undefined);
      this.allComponentsRouteDetailId.set(undefined);
    }
    this.windowManager.launch(item, this.overviewEffectiveDeviceMode(), this.getOverviewActionContext());
  }

  private getOverviewActionContext(): OverviewActionContext {
    return {
      selectedMenu: this.selectedMenu,
      selectionCatalogs: this.selectionCatalogs,
      selectTab: (tab: string) => this.selectTab(tab),
    };
  }

  protected overviewMemberLoginOpen(): void {
    this.modalCoordinator.openMemberLogin(this.overviewIsMobile(), this.overviewThemeMode());
  }

  protected overviewMemberAccountOpen(): void {
    this.modalCoordinator.openMemberAccount({
      isMobile: this.overviewIsMobile(),
      hasAccount: !!this.overviewAccount(),
      canAccessDb: this.canAccessLoworldDb(),
      themeMode: this.overviewThemeMode(),
    });
  }

  protected closeLoginDialog(): void {
    this.modalCoordinator.closeLoginDialog();
  }

  protected closeOverviewMobileLogin(): void {
    this.modalCoordinator.closeOverviewMobileLogin();
  }

  protected minimizeActiveOverviewWindow(): void {
    const tab = this.overviewActiveWindowTab();
    if (tab) this.minimizeOverviewWindow(tab);
  }

  protected toggleOverviewDeviceMode(): void {
    this.deviceModeService.toggleMode();
  }

  protected async overviewMemberLogout(): Promise<void> {
    await this.overviewSession.logout();
    this.modalCoordinator.logout();
    void this.router.navigate(['/login']);
  }

}
