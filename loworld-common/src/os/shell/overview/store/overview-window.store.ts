import { Injectable, computed, inject, signal } from '@angular/core';
import type { OverviewExplorerFolder, OverviewExplorerFolderId, OverviewWindow, OverviewWindowLaunchMode, OverviewWindowTab } from '../../../../services/models/os.types';
import { OverviewRegistryService } from '../registry/overview-registry.service';

@Injectable({ providedIn: 'root' })
export class OverviewWindowStore {
  private readonly overviewRegistry = inject(OverviewRegistryService);
  private readonly storageKey = 'lw_overview_launch_mode';
  private overviewWindowZCounter = 10;

  readonly launchMode = signal<OverviewWindowLaunchMode>('maximized');

  constructor() {
    // 창모드 전면 폐지: 항상 전체화면(maximized)으로 실행
    this.launchMode.set('maximized');
  }

  setLaunchMode(_mode: OverviewWindowLaunchMode): void {
    // 창모드 폐지로 인해 항상 maximized 유지
    this.launchMode.set('maximized');
  }

  readonly windows = signal<OverviewWindow[]>([]);
  readonly windowsByZIndex = computed(() =>
    [...this.windows()].sort((left, right) => left.zIndex - right.zIndex)
  );
  readonly runningTabs = computed(() => this.windows().map(window => window.tab));
  readonly openWindowCount = computed(() =>
    this.windows().filter(window => window.state !== 'minimized').length
  );
  readonly minimizedTabs = computed(() =>
    this.windows()
      .filter(window => window.state === 'minimized')
      .map(window => window.tab)
  );
  readonly activeWindowTab = computed<OverviewWindowTab | null>(() => {
    const visible = this.windows().filter(window => window.state !== 'minimized');
    if (visible.length === 0) {
      return null;
    }
    return [...visible].sort((left, right) => right.zIndex - left.zIndex)[0].tab;
  });
  readonly activeWindow = computed<OverviewWindow | null>(() => {
    const tab = this.activeWindowTab();
    return tab ? this.windows().find(window => window.tab === tab) ?? null : null;
  });
  readonly hasActiveApp = computed(() => this.windows().length > 0);
  readonly hasMaximizedWindow = computed(() => this.windows().length > 0);
  readonly explorerActiveFolderId = computed<OverviewExplorerFolderId | null>(() =>
    this.windows().find(window => window.tab === 'overview-explorer')?.explorerFolderId ?? null
  );

  restoreOrCreate(tab: OverviewWindowTab): void {
    const meta = this.overviewRegistry.getWindowMeta(tab);
    const nextZIndex = this.nextZIndex();

    this.windows.update(windows => {
      const existing = windows.find(window => window.tab === tab);
      if (existing) {
        return windows.map(window =>
          window.tab === tab
            ? {
                ...window,
                state: 'maximized',
                zIndex: nextZIndex,
              }
            : window,
        );
      }

      return [
        ...windows,
        {
          tab,
          title: meta.title,
          icon: meta.icon,
          size: meta.size,
          state: 'maximized',
          zIndex: nextZIndex,
          offset: 0,
        },
      ];
    });
  }

  openExplorer(folder: Pick<OverviewExplorerFolder, 'id' | 'title' | 'icon'>): void {
    const nextZIndex = this.nextZIndex();
    this.windows.update(windows => {
      const existing = windows.find(window => window.tab === 'overview-explorer');
      if (existing) {
        return windows.map(window =>
          window.tab === 'overview-explorer'
            ? {
                ...window,
                title: `File Explorer - ${folder.title}`,
                icon: folder.icon,
                size: 'wide',
                state: window.state === 'minimized' ? (window.lastState ?? this.launchMode()) : window.state,
                zIndex: nextZIndex,
                explorerFolderId: folder.id,
              }
            : window,
        );
      }

      return [
        ...windows,
        {
          tab: 'overview-explorer',
          title: `File Explorer - ${folder.title}`,
          icon: folder.icon,
          size: 'wide',
          state: 'maximized',
          zIndex: nextZIndex,
          offset: 0,
          explorerFolderId: folder.id,
        },
      ];
    });
  }

  focus(tab: OverviewWindowTab): void {
    const nextZIndex = this.nextZIndex();
    this.windows.update(windows =>
      windows.map(window =>
        window.tab === tab
          ? { ...window, zIndex: nextZIndex, state: 'maximized' }
          : window,
      ),
    );
  }

  minimize(tab: OverviewWindowTab): void {
    this.windows.update(windows =>
      windows.map(window =>
        window.tab === tab
          ? {
              ...window,
              state: 'minimized',
            }
          : window,
      ),
    );
  }

  toggleMaximize(tab: OverviewWindowTab): void {
    const nextZIndex = this.nextZIndex();
    this.windows.update(windows =>
      windows.map(window => {
        if (window.tab !== tab) {
          return window;
        }
        return {
          ...window,
          state: 'maximized',
          zIndex: nextZIndex,
        };
      }),
    );
  }

  close(tab: OverviewWindowTab): void {
    this.windows.update(windows => windows.filter(window => window.tab !== tab));
  }

  closeAll(): void {
    this.windows.set([]);
  }

  private nextZIndex(): number {
    this.overviewWindowZCounter += 1;
    return this.overviewWindowZCounter;
  }
}