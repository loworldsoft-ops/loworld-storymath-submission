import { Injectable, inject, type WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import type { OverviewExplorerFolderId, OverviewLaunchItem, OverviewWindowTab } from '../../../../services/models/os.types';
import { ShowcaseSelectionService, type ShowcaseSelectionCatalogs } from '../../navigation/showcase-selection.service';
import { OverviewRouteService } from '../route/overview-route.service';
import { OverviewRouteNavigationMode, OverviewRouteSyncService } from '../route/overview-route-sync.service';
import { OverviewThemeStore } from '../store/overview-theme.store';
import { OverviewUiStateStore } from '../store/overview-ui-state.store';
import { OverviewWindowStore } from '../store/overview-window.store';
import { OverviewShellFacade } from './overview-shell.facade';
import { OverviewRegistryService } from '../registry/overview-registry.service';
import { OverviewAppUsageStore } from '../store/overview-app-usage.store';
import { WindowTabRegistryService } from '../../../platform/core/domain-registry/window-tab-registry.service';


export type OverviewActionContext = {
  selectedMenu: WritableSignal<string>;
  selectionCatalogs: ShowcaseSelectionCatalogs;
  selectTab(tab: string): void;
};

@Injectable({ providedIn: 'root' })
export class OverviewActionFacade {
  private readonly overviewRouteService = inject(OverviewRouteService);
  private readonly overviewRouteSync = inject(OverviewRouteSyncService);
  private readonly overviewThemeStore = inject(OverviewThemeStore);
  private readonly overviewUiState = inject(OverviewUiStateStore);
  private readonly overviewWindowStore = inject(OverviewWindowStore);
  private readonly overviewShell = inject(OverviewShellFacade);
  private readonly showcaseSelection = inject(ShowcaseSelectionService);
  private readonly overviewRegistry = inject(OverviewRegistryService);
  private readonly overviewAppUsageStore = inject(OverviewAppUsageStore);
  private readonly router = inject(Router);
  private readonly windowTabs = inject(WindowTabRegistryService);

  openWindow(tab: string, context: OverviewActionContext): void {
    const request = this.overviewRouteService.parseWindowRequest(tab);
    if (!request) {
      context.selectTab(tab);
      return;
    }

    if (request.baseTab === 'overview-explorer') {
      this.openExplorer('home', context.selectedMenu);
      return;
    }

    // Check if the user is authorized to open this window tab
    const allLaunchItems = this.overviewRegistry.getLaunchItems();
    const targetItem = allLaunchItems.find(item => item.tab === request.baseTab);
    if (targetItem) {
      const allowed = this.overviewShell.launchItems().some(item => item.tab === request.baseTab);
      if (!allowed) {
        console.warn(`[OverviewActionFacade] Access denied to window tab: ${request.baseTab}`);
        this.overviewRouteSync.syncRoute(null, undefined, 'replace');
        return;
      }
    }

    this.syncOverviewSelection(request.baseTab, request.detailId, context);
    this.overviewAppUsageStore.recordLaunch(request.baseTab);
    this.overviewWindowStore.restoreOrCreate(request.baseTab);
    if ((request.baseTab === 'all-components' || this.windowTabs.hasDeepRoutes(request.baseTab)) && (request.detailId || request.subDetailId)) {
      this.overviewRouteSync.syncRoute(request.baseTab, request.detailId, 'push', request.subDetailId);
    } else {
      this.syncOverviewRoute(request.baseTab, context.selectedMenu, 'push');
    }
  }

  openExplorer(folderId: OverviewExplorerFolderId, selectedMenu: WritableSignal<string>): void {
    const folder = this.overviewShell.getExplorerFolder(folderId);
    if (!folder) {
      return;
    }

    this.overviewWindowStore.openExplorer(folder);
    this.syncOverviewRoute('overview-explorer', selectedMenu, 'push');
  }

  focusWindow(tab: OverviewWindowTab, selectedMenu: WritableSignal<string>): void {
    this.overviewWindowStore.focus(tab);
    const currentUrl = this.router.url;
    // 탭 아래의 깊은 주소에 있으면 그대로 둔다. 창을 다시 잡았다고 앱 안의 자리를 잃으면 안 된다.
    if (this.windowTabs.hasDeepRoutes(tab) && currentUrl.includes(`${tab}/`)) {
      return;
    }
    this.syncOverviewRoute(tab, selectedMenu, 'replace');
  }

  minimizeWindow(tab: OverviewWindowTab, selectedMenu: WritableSignal<string>): void {
    this.overviewWindowStore.minimize(tab);
    this.syncOverviewRouteToTopVisibleWindow(selectedMenu, 'replace');
  }

  toggleMaximizeWindow(tab: OverviewWindowTab): void {
    this.overviewWindowStore.toggleMaximize(tab);
  }

  closeWindow(tab: OverviewWindowTab, selectedMenu: WritableSignal<string>): void {
    this.overviewWindowStore.close(tab);
    this.syncOverviewRouteToTopVisibleWindow(selectedMenu, 'push');
  }

  toggleWindowFromTaskbar(tab: string, context: OverviewActionContext): void {
    const request = this.overviewRouteService.parseWindowRequest(tab);
    if (!request) {
      context.selectTab(tab);
      return;
    }

    const current = this.overviewWindowStore.windows().find(window => window.tab === request.baseTab);
    if (!current) {
      this.openWindow(tab, context);
      return;
    }

    if (current.state === 'minimized') {
      this.focusWindow(request.baseTab, context.selectedMenu);
      return;
    }

    if (this.overviewWindowStore.activeWindowTab() === request.baseTab) {
      this.minimizeWindow(request.baseTab, context.selectedMenu);
      return;
    }

    this.focusWindow(request.baseTab, context.selectedMenu);
  }

  launch(item: OverviewLaunchItem, context: OverviewActionContext): void {
    if (item.tab) {
      this.overviewAppUsageStore.recordLaunch(item.tab);
      this.openWindow(item.tab, context);
      this.overviewUiState.setDockAction('running');
    } else if (item.externalHref && typeof window !== 'undefined') {
      if (item.appId) {
        this.overviewAppUsageStore.recordLaunch(item.appId);
      }
      window.open(
        this.overviewThemeStore.buildThemeAwareExternalHref(item.externalHref),
        '_blank',
        'noopener,noreferrer',
      );
    }

    this.overviewUiState.closeMobileGroup();
    this.overviewUiState.closeStart();
  }

  private syncOverviewSelection(baseTab: OverviewWindowTab, detailId: string | undefined, context: OverviewActionContext): void {
    const nextSelection = this.showcaseSelection.resolveOverviewSelection(baseTab, detailId, context.selectionCatalogs);
    if (nextSelection) {
      context.selectedMenu.set(nextSelection);
    }
  }

  private syncOverviewRouteToTopVisibleWindow(selectedMenu: WritableSignal<string>, mode: OverviewRouteNavigationMode): void {
    this.syncOverviewRoute(this.overviewWindowStore.activeWindowTab(), selectedMenu, mode);
  }

  private syncOverviewRoute(
    tab: OverviewWindowTab | null,
    selectedMenu: WritableSignal<string>,
    mode: OverviewRouteNavigationMode,
  ): void {
    this.overviewRouteSync.syncRoute(tab, selectedMenu(), mode);
  }
}