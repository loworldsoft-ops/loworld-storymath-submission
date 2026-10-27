import { Injectable, computed, inject } from '@angular/core';
import { LW_ACCOUNT_LOGIN_BRIDGE } from '../../../../services/tokens/member-login-bridge.token';
import type { OverviewExplorerFolder, OverviewExplorerFolderId, OverviewExplorerItem, OverviewIconId, OverviewLaunchGroupDef, OverviewLaunchItem, OverviewStartGroupSection, OverviewTaskbarPin } from '../../../../services/models/os.types';
import { filterOverviewLaunchItems, getOverviewLaunchAccessHint, getOverviewRole, canAccessOverviewLaunchItem } from '../../../platform/overview-access';
import { OverviewRegistryService } from '../registry/overview-registry.service';
import { OverviewThemeStore } from '../store/overview-theme.store';
import { OverviewWindowStore } from '../store/overview-window.store';
import { OverviewClockStore } from '../store/overview-clock.store';

@Injectable({ providedIn: 'root' })
export class OverviewShellFacade {
  private readonly memberLoginBridge = inject(LW_ACCOUNT_LOGIN_BRIDGE);
  private readonly overviewRegistry = inject(OverviewRegistryService);
  private readonly overviewThemeStore = inject(OverviewThemeStore);
  private readonly overviewWindowStore = inject(OverviewWindowStore);
  private readonly overviewClockStore = inject(OverviewClockStore);

  readonly clockNowIso = this.overviewClockStore.nowIso;
  readonly clockText = this.overviewClockStore.clockText;
  readonly clockDateText = this.overviewClockStore.dateText;

  readonly launchGroupDefs: readonly OverviewLaunchGroupDef[] = this.overviewRegistry.getLaunchGroupDefs();
  readonly launchItems = computed<readonly OverviewLaunchItem[]>(() =>
    this.overviewRegistry.getLaunchItems()
  );
  readonly canViewConnectedApps = computed(() => getOverviewRole(this.memberLoginBridge.accountView()) === 'OWNER');
  private readonly taskbarPinMeta = this.overviewRegistry.getTaskbarPinMeta();

  readonly visibleLaunchGroups = computed(() => {
    const groupIds = new Set(this.launchItems().map(item => item.group));
    return this.launchGroupDefs.filter(group => groupIds.has(group.id));
  });
  readonly workspaceCount = computed(() => this.visibleLaunchGroups().length);
  readonly startSections = computed<readonly OverviewStartGroupSection[]>(() =>
    this.visibleLaunchGroups().map(group => ({
      ...group,
      items: this.launchItems()
        .filter(item => item.group === group.id)
        .map(item => item.externalHref
          ? { ...item, externalHref: this.overviewThemeStore.buildThemeAwareExternalHref(item.externalHref) }
          : item),
    }))
  );
  /** 옆 메뉴에 보일 것. 실행 묶음마다 지금 계정이 열 수 있는 탭만 남긴다. */
  readonly navSections = computed<readonly OverviewStartGroupSection[]>(() => {
    const account = this.memberLoginBridge.accountView();
    return this.startSections()
      .map(section => ({ ...section, items: section.items.filter(item => !!item.tab && !item.externalHref && canAccessOverviewLaunchItem(item, account)) }))
      .filter(section => section.items.length > 0);
  });
  readonly taskbarPins = computed<readonly OverviewTaskbarPin[]>(() => {
    const runningTabs = this.overviewWindowStore.runningTabs();
    return [
      this.taskbarPinMeta['overview-explorer'],
      this.taskbarPinMeta['all-components'],
      ...runningTabs
        .filter(tab => tab !== 'overview-explorer' && tab !== 'all-components')
        .map(tab => this.taskbarPinMeta[tab]),
    ];
  });
  readonly explorerFolders = computed<readonly OverviewExplorerFolder[]>(() => {
    const appendAccessHint = (subtitle: string, item: OverviewLaunchItem): string => {
      const account = this.memberLoginBridge.accountView();
      if (canAccessOverviewLaunchItem(item, account)) {
        return subtitle;
      }
      const accessHint = getOverviewLaunchAccessHint(item);
      return accessHint ? `${subtitle} · ${accessHint}` : subtitle;
    };

    const folderLink = (
      id: OverviewExplorerFolderId,
      label: string,
      icon: OverviewIconId,
      subtitle: string,
    ): OverviewExplorerItem => ({
      id: `folder-${id}`,
      type: 'folder-link',
      label,
      subtitle,
      icon,
      targetFolderId: id,
    });

    const launchItemToExplorerItem = (folderId: string, item: OverviewLaunchItem, index: number): OverviewExplorerItem => ({
      id: `${folderId}-${index}`,
      type: item.externalHref ? 'external-link' : 'app',
      label: item.label,
      subtitle: item.externalHref
        ? 'Open in browser'
        : appendAccessHint(
            item.label.includes('모바일')
              ? 'Mobile preview'
              : item.label.includes('컴포넌트')
                ? 'Component catalog'
                : item.label.includes('데스크톱')
                  ? 'Desktop preview'
                  : (item.subtitle ?? 'Launch app'),
            item,
          ),
      icon: item.icon,
      launchItem: item.externalHref
        ? { ...item, externalHref: this.overviewThemeStore.buildThemeAwareExternalHref(item.externalHref) }
        : item,
    });

    // 앱의 폴더는 띄우는 쪽이 넣은 실행 묶음의 차례대로 만든다. OS는 어떤 앱이 있는지 모른다.
    const internalItems = this.launchItems().filter(item => !item.externalHref);
    const groups = new Map<string, OverviewLaunchGroupDef>();
    for (const group of this.launchGroupDefs) {
      const known = groups.get(group.id);
      groups.set(group.id, known ? { ...known, folder: known.folder ?? group.folder } : group);
    }
    const appFolders: OverviewExplorerFolder[] = [...groups.values()]
      .map((group): OverviewExplorerFolder => ({
        id: group.id,
        title: group.folder?.title ?? group.title,
        pathLabel: group.folder?.title ?? group.title,
        parentId: 'overview-apps',
        description: group.folder?.description ?? '',
        icon: group.folder?.icon ?? 'folder',
        items: internalItems
          .filter(item => item.group === group.id)
          .map((item, index) => launchItemToExplorerItem(group.id, item, index)),
      }))
      .filter(folder => folder.items.length > 0);
    const canvasHomeItem = internalItems
      .filter(item => item.tab === 'canvas-demo')
      .map((item, index) => launchItemToExplorerItem('home-canvas', item, index))[0] ?? null;
    const externalItems = this.canViewConnectedApps()
      ? this.launchItems()
          .filter(item => !!item.externalHref)
          .map((item, index) => launchItemToExplorerItem('external', item, index))
      : [];
    const externalFolder: OverviewExplorerFolder = {
      id: 'external',
      title: 'Connect',
      pathLabel: 'Connect',
      parentId: 'overview-apps',
      description: 'external links',
      icon: 'external',
      items: externalItems,
    };

    const overviewAppFolderLinks = [...appFolders, ...(externalItems.length > 0 ? [externalFolder] : [])]
      .map(folder => folderLink(folder.id, folder.title, folder.icon, folder.description ?? ''));

    const folders: OverviewExplorerFolder[] = [
      {
        id: 'home',
        title: 'Home',
        pathLabel: 'Home',
        description: '빠른 실행과 주요 overview 그룹에 접근합니다.',
        icon: 'home',
        items: [
          ...(canvasHomeItem ? [canvasHomeItem] : []),
          folderLink('overview-apps', 'Apps', 'monitor', '전체 앱 폴더 보기'),
          ...overviewAppFolderLinks.filter(item => item.targetFolderId !== 'external'),
        ],
      },
      {
        id: 'overview-apps',
        title: 'Apps',
        pathLabel: 'Apps',
        parentId: 'home',
        description: '데스크톱 폴더와 앱 그룹을 한 곳에서 탐색합니다.',
        icon: 'monitor',
        items: overviewAppFolderLinks,
      },
      ...appFolders,
      externalFolder,
    ];

    return folders.filter(folder => folder.id === 'home' || folder.id === 'overview-apps' || folder.items.length > 0);
  });
  readonly folderCount = computed(() =>
    this.explorerFolders().filter(folder => folder.id !== 'home' && folder.id !== 'overview-apps').length
  );

  getExplorerFolder(folderId: OverviewExplorerFolderId): OverviewExplorerFolder | null {
    return this.explorerFolders().find(folder => folder.id === folderId) ?? null;
  }
}