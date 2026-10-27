import { Injectable, inject, type WritableSignal } from '@angular/core';
import type { OverviewExplorerFolderId, OverviewLaunchItem, OverviewWindowTab } from '../../../../services/models/os.types';
import { OverviewActionFacade, type OverviewActionContext } from './overview-action.facade';
import { OverviewWindowStore } from '../store/overview-window.store';
import { WindowTabRegistryService } from '../../../platform/core/domain-registry/window-tab-registry.service';


@Injectable({ providedIn: 'root' })
export class ShowcaseWindowManagerService {
  private readonly overviewAction = inject(OverviewActionFacade);
  private readonly overviewWindowStore = inject(OverviewWindowStore);
  private readonly windowTabs = inject(WindowTabRegistryService);

  getMobileEquivalentTab(tab: string): string {
    return this.windowTabs.mobileTabOf(tab);
  }

  getDesktopEquivalentTab(tab: string): string {
    return this.windowTabs.desktopTabOf(tab);
  }

  openWindow(tab: string, deviceMode: 'desktop' | 'mobile', context: OverviewActionContext): void {
    const targetTab = deviceMode === 'mobile'
      ? this.getMobileEquivalentTab(tab)
      : tab;
    this.overviewAction.openWindow(targetTab, context);
  }

  openExplorer(folderId: OverviewExplorerFolderId, selectedMenu: WritableSignal<string>): void {
    this.overviewAction.openExplorer(folderId, selectedMenu);
  }

  focusWindow(tab: OverviewWindowTab, selectedMenu: WritableSignal<string>): void {
    this.overviewAction.focusWindow(tab, selectedMenu);
  }

  minimizeWindow(tab: OverviewWindowTab, selectedMenu: WritableSignal<string>): void {
    this.overviewAction.minimizeWindow(tab, selectedMenu);
    const counterpart = (this.getDesktopEquivalentTab(tab) !== tab
      ? this.getDesktopEquivalentTab(tab)
      : this.getMobileEquivalentTab(tab)) as OverviewWindowTab;
    if (counterpart && counterpart !== tab) {
      this.overviewAction.minimizeWindow(counterpart, selectedMenu);
    }
  }

  toggleMaximizeWindow(tab: OverviewWindowTab): void {
    this.overviewAction.toggleMaximizeWindow(tab);
  }

  closeWindow(tab: OverviewWindowTab, selectedMenu: WritableSignal<string>): void {
    this.overviewAction.closeWindow(tab, selectedMenu);
    const counterpart = (this.getDesktopEquivalentTab(tab) !== tab
      ? this.getDesktopEquivalentTab(tab)
      : this.getMobileEquivalentTab(tab)) as OverviewWindowTab;
    if (counterpart && counterpart !== tab) {
      this.overviewAction.closeWindow(counterpart, selectedMenu);
    }
  }

  toggleWindowFromTaskbar(tab: string, deviceMode: 'desktop' | 'mobile', context: OverviewActionContext): void {
    const targetTab = deviceMode === 'mobile'
      ? this.getMobileEquivalentTab(tab)
      : tab;
    this.overviewAction.toggleWindowFromTaskbar(targetTab, context);
  }

  launch(item: OverviewLaunchItem, deviceMode: 'desktop' | 'mobile', context: OverviewActionContext): void {
    if (deviceMode === 'mobile' && item.tab) {
      const mobileTab = this.getMobileEquivalentTab(item.tab);
      const mobileItem: OverviewLaunchItem = mobileTab !== item.tab
        ? { ...item, tab: mobileTab as OverviewWindowTab }
        : item;
      this.overviewAction.launch(mobileItem, context);
      return;
    }
    this.overviewAction.launch(item, context);
  }

  closeActiveWindow(selectedMenu: WritableSignal<string>): boolean {
    const activeTab = this.overviewWindowStore.activeWindowTab();
    if (activeTab) {
      this.closeWindow(activeTab, selectedMenu);
      return true;
    }
    return false;
  }

  minimizeAll(): void {
    const windows = this.overviewWindowStore.windows();
    windows.forEach(w => {
      if (w.state !== 'minimized') {
        this.overviewWindowStore.minimize(w.tab);
      }
    });
  }
}
