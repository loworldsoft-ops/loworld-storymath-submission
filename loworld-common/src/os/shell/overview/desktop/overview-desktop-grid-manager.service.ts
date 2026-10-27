import { appIconImage, appShortLabel, codexLook, folderShortLabel, homePageIdOf, homePages, isDesktopOnlyApp } from '../../../platform/core/domain-registry/app-look';
import { Injectable, inject, signal, computed } from '@angular/core';
import { OverviewExplorerFolder, OverviewExplorerItem } from '../../../../services/models/os.types';
import { OverviewAppUsageStore } from '../store/overview-app-usage.store';
import { isOverviewItemDisabled, isOverviewItemAuthRequired } from '../../../platform/overview-access';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { DesktopSurfaceEntry, OverviewDesktopAppPage, DesktopSortCriterion, DesktopSortDirection, DesktopViewMode } from './overview-desktop-surface.data';

@Injectable({
  providedIn: 'root',
})
export class OverviewDesktopGridManagerService {
  private readonly appUsageStore = inject(OverviewAppUsageStore);

  readonly folders = signal<readonly OverviewExplorerFolder[]>([]);
  readonly currentMemberSession = signal<LwMemberAuthSessionView | null>(null);

  readonly sortCriterion = signal<DesktopSortCriterion>('default');
  readonly sortDirection = signal<DesktopSortDirection>('asc');
  readonly viewMode = signal<DesktopViewMode>('large');
  readonly searchQuery = signal<string>('');

  protected isMobileItem(item: OverviewExplorerItem): boolean {
    const label = item.label.toLowerCase();
    const id = item.id.toLowerCase();
    const tab = item.launchItem?.tab?.toLowerCase() ?? '';
    const appId = item.launchItem?.appId?.toLowerCase() ?? '';
    return (
      label.includes('모바일') ||
      id.includes('mobile') ||
      tab.includes('mobile') ||
      appId.endsWith('.mobile') ||
      item.icon === 'mobile'
    );
  }

  protected isComponentSubApp(item: OverviewExplorerItem): boolean {
    const tab = item.launchItem?.tab;
    const label = item.label;
    if (tab === 'all-components' || label.includes('모든 컴포넌트')) {
      return false;
    }
    return label.includes('컴포넌트') || (!!tab && tab.includes('component'));
  }

  isMobileEntry(entry: DesktopSurfaceEntry): boolean {
    if (entry.kind !== 'app') return false;
    return this.isMobileItem(entry.item);
  }

  readonly homeApps = computed<readonly OverviewExplorerItem[]>(() =>
    (this.folders().find((folder) => folder.id === 'home')?.items ?? []).filter(
      (item) => item.type === 'app' && !!item.launchItem && !this.isComponentSubApp(item)
    )
  );

  readonly desktopEntries = computed<readonly DesktopSurfaceEntry[]>(() => {
    const appMap = new Map<string, OverviewExplorerItem>();
    for (const folder of this.folders()) {
      for (const item of folder.items) {
        if (item.type === 'app' && item.launchItem) {
          const key = item.launchItem.tab || item.id;
          if (!this.isMobileItem(item) && !this.isComponentSubApp(item) && !appMap.has(key)) {
            appMap.set(key, item);
          }
        }
      }
    }
    return Array.from(appMap.values()).map((item) => ({ kind: 'app' as const, item }));
  });

  readonly processedDesktopEntries = computed<readonly DesktopSurfaceEntry[]>(() => {
    let list = [...this.desktopEntries()];

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter((entry) => {
        const title = (entry.kind === 'app' ? entry.item.label : entry.folder.title).toLowerCase();
        const meta = this.getEntryMetaText(entry).toLowerCase();
        const type = this.getEntryTypeLabel(entry).toLowerCase();
        return title.includes(query) || meta.includes(query) || type.includes(query);
      });
    }

    const criterion = this.sortCriterion();
    const isAsc = this.sortDirection() === 'asc';

    if (criterion === 'name') {
      list.sort((a, b) => {
        const nameA = a.kind === 'app' ? a.item.label : a.folder.title;
        const nameB = b.kind === 'app' ? b.item.label : b.folder.title;
        const cmp = nameA.localeCompare(nameB, 'ko');
        return isAsc ? cmp : -cmp;
      });
    } else if (criterion === 'type') {
      list.sort((a, b) => {
        const typeOrderA = a.kind === 'folder' ? 0 : 1;
        const typeOrderB = b.kind === 'folder' ? 0 : 1;
        if (typeOrderA !== typeOrderB) {
          return isAsc ? typeOrderA - typeOrderB : typeOrderB - typeOrderA;
        }
        const nameA = a.kind === 'app' ? a.item.label : a.folder.title;
        const nameB = b.kind === 'app' ? b.item.label : b.folder.title;
        return nameA.localeCompare(nameB, 'ko');
      });
    } else if (criterion === 'items') {
      list.sort((a, b) => {
        const countA = a.kind === 'folder' ? a.folder.items.length : 1;
        const countB = b.kind === 'folder' ? b.folder.items.length : 1;
        const cmp = countA - countB;
        return isAsc ? cmp : -cmp;
      });
    } else if (!isAsc) {
      list.reverse();
    }

    return list;
  });

  getEntryCanonicalId(entry: DesktopSurfaceEntry): string {
    const raw =
      entry.kind === 'app'
        ? entry.item.launchItem?.tab || entry.item.launchItem?.appId || entry.item.id
        : entry.folder.id;
    return this.appUsageStore.normalizeCanonicalId(raw);
  }

  getEntryLaunchCount(entry: DesktopSurfaceEntry): number {
    const raw =
      entry.kind === 'app'
        ? entry.item.launchItem?.tab || entry.item.launchItem?.appId || entry.item.id
        : entry.folder.id;
    return this.appUsageStore.getLaunchCount(raw);
  }

  readonly hasAnyUsedApp = computed<boolean>(() => {
    return this.desktopEntries().some((e) => e.kind === 'app' && this.getEntryLaunchCount(e) > 0);
  });

  readonly desktopAppPages = computed<readonly OverviewDesktopAppPage[]>(() => {
    const entries = this.processedDesktopEntries();

    const sortedKeys = this.appUsageStore.sortedCanonicalAppKeys();
    const appEntries = entries.filter((e) => e.kind === 'app');
    const usedAppEntries = appEntries.filter((e) => this.getEntryLaunchCount(e) > 0);
    const sortedAppEntries = [...usedAppEntries].sort((a, b) => {
      const countA = this.getEntryLaunchCount(a);
      const countB = this.getEntryLaunchCount(b);
      if (countA !== countB) {
        return countB - countA;
      }
      const keyA = this.getEntryCanonicalId(a);
      const keyB = this.getEntryCanonicalId(b);
      const idxA = sortedKeys.indexOf(keyA);
      const idxB = sortedKeys.indexOf(keyB);
      return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
    });

    const mostUsedEntries = sortedAppEntries.slice(0, 8);
    // 나머지 쪽은 띄우는 쪽이 정한 구성을 따른다. OS는 어느 앱이 어느 쪽인지 모른다.
    const rest = homePages().map((page, index): OverviewDesktopAppPage => {
      const pageEntries = entries.filter((e) => homePageIdOf(this.getEntryCanonicalId(e)) === page.id);
      return {
        id: page.id,
        badge: `PAGE ${index + 2}`,
        title: page.title,
        subtitle: [...new Set(pageEntries.map((e) => this.cleanEntryLabel(e)))].join(' · '),
        entries: pageEntries,
      };
    });

    return [
      {
        id: 'page-most-used',
        badge: 'PAGE 1 (인기)',
        title: '자주 사용하는 앱',
        subtitle: '실행 횟수 기반 스마트 추천',
        entries: mostUsedEntries,
      },
      ...rest,
    ];
  });

  private readonly labelCache = new WeakMap<DesktopSurfaceEntry, string>();
  private readonly appImageCache = new WeakMap<DesktopSurfaceEntry, string>();
  private readonly codexTagCache = new WeakMap<DesktopSurfaceEntry, { tag: string; tone: string }>();

  cleanEntryLabel(entry: DesktopSurfaceEntry): string {
    const cached = this.labelCache.get(entry);
    if (cached !== undefined) return cached;
    const val = this.computeCleanEntryLabel(entry);
    this.labelCache.set(entry, val);
    return val;
  }

  private computeCleanEntryLabel(entry: DesktopSurfaceEntry): string {
    return entry.kind === 'folder' ? folderShortLabel(entry.folder) : appShortLabel(entry.item);
  }

  getEntryAppImage(entry: DesktopSurfaceEntry): string {
    const cached = this.appImageCache.get(entry);
    if (cached !== undefined) return cached;
    const val = this.computeEntryAppImage(entry);
    this.appImageCache.set(entry, val);
    return val;
  }

  isDesktopExclusiveEntry(entry: DesktopSurfaceEntry): boolean {
    if (entry.kind !== 'app') return false;
    const label = (entry.item.label || '').toLowerCase();
    return isDesktopOnlyApp(entry.item) || label.includes('데스크톱 전용') || label.includes('desktop exclusive');
  }

  private computeEntryAppImage(entry: DesktopSurfaceEntry): string {
    const image = entry.kind === 'app' ? appIconImage(entry.item) : '';
    if (image) return image;
    return this.isMobileEntry(entry) ? '/assets/macos/app_mobile.jpg' : '/assets/macos/app_desktop.jpg';
  }

  getEntryCodexImage(entry: DesktopSurfaceEntry): string {
    return codexLook(entry.kind === 'app' ? entry.item.id : entry.folder.id).image;
  }

  getEntryCodexTag(entry: DesktopSurfaceEntry): { tag: string; tone: string } {
    const cached = this.codexTagCache.get(entry);
    if (cached !== undefined) return cached;
    const key = entry.kind === 'app' ? entry.item.id : entry.folder.id;
    const { tag, tone } = codexLook(key);
    const result = { tag, tone };
    this.codexTagCache.set(entry, result);
    return result;
  }

  getEntryTypeLabel(entry: DesktopSurfaceEntry): string {
    return entry.kind === 'app' ? '응용 프로그램' : '파일 폴더';
  }

  getEntryMetaText(entry: DesktopSurfaceEntry): string {
    if (entry.kind === 'app') {
      return entry.item.subtitle ?? '응용 프로그램';
    }
    return `${entry.folder.items.length}개 항목`;
  }

  isEntryDisabled(entry: DesktopSurfaceEntry): boolean {
    if (entry.kind !== 'app') return false;
    return isOverviewItemDisabled(entry.item.launchItem ?? entry.item.id, this.currentMemberSession());
  }

  isItemDisabled(item: OverviewExplorerItem): boolean {
    return isOverviewItemDisabled(item.launchItem ?? item.id, this.currentMemberSession());
  }

  isEntryAuthRequired(entry: DesktopSurfaceEntry): boolean {
    if (entry.kind !== 'app') return false;
    return isOverviewItemAuthRequired(entry.item.launchItem ?? entry.item.id);
  }

  getEntryTooltip(entry: DesktopSurfaceEntry): string {
    const title = this.cleanEntryLabel(entry);
    if (this.isEntryDisabled(entry)) {
      return `${title} (포털 로그인 필요 — 클릭하여 로그인 후 바로 실행)`;
    }
    const launchCount = this.getEntryLaunchCount(entry);
    const countText = launchCount > 0 ? ` (${launchCount}회 실행)` : '';
    const subtitle =
      entry.kind === 'app'
        ? entry.item.subtitle ?? '실행하려면 클릭하세요'
        : `${entry.folder.items.length}개 항목`;
    return `${title}${countText} (${this.getEntryTypeLabel(entry)}) — ${subtitle}`;
  }
}
