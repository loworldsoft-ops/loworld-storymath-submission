import { Injectable, inject } from '@angular/core';
import type { OverviewLaunchGroupDef, OverviewLaunchItem, OverviewTaskbarPin, OverviewWindowMobileChrome, OverviewWindowSize, OverviewWindowTab, OverviewIconId } from '../../../../services/models/os.types';
import { DomainRegistryService } from '../../../platform/core/domain-registry/domain-registry.service';
import { LW_OS_WINDOW_TABS } from '../../../platform/core/domain-registry/window-tab-registry.service';

type OverviewWindowMeta = {
  title: string;
  icon: OverviewIconId;
  size: OverviewWindowSize;
  mobileChrome?: OverviewWindowMobileChrome;
};

const TOOL_LAUNCH_GROUP: OverviewLaunchGroupDef = { id: 'tools', title: 'Tools', folder: { icon: 'tools', description: 'system utilities' } };

const TOOL_LAUNCH_ITEMS: readonly OverviewLaunchItem[] = [
  { appId: 'workspace.canvas', group: 'tools', tab: 'canvas-demo', label: 'Canvas', icon: 'builder', audience: 'authenticated' },
  { appId: 'workspace.all-components', group: 'tools', tab: 'all-components', label: 'Components', icon: 'book', audience: 'public' },
];

/**
 * OS가 스스로 갖는 탭이다(탐색기, 도감, 캔버스). 앱의 탭은 여기 없다.
 * 앱은 선언서의 `windowTabs[].window`에 자기 창의 제목, 아이콘, 크기를 적는다.
 */
const OS_WINDOW_META: Record<string, OverviewWindowMeta> = {
  'overview-explorer': { title: 'Explorer', icon: 'folder', size: 'wide' },
  'canvas-demo': { title: 'Canvas', icon: 'builder', size: 'wide' },
  'all-components': { title: 'Components', icon: 'book', size: 'wide' },
  'showcase-components': { title: 'Components', icon: 'components', size: 'desktop' },
};

/** 창이 아니라 주소로만 열리는 화면의 제목. */
const OS_PAGE_TITLES: Record<string, string> = {
  'overview': 'Overview',
  'layout-demo': 'Layout',
};

@Injectable({ providedIn: 'root' })
export class OverviewRegistryService {
  private readonly domainRegistry = inject(DomainRegistryService);
  private readonly windowMeta: Record<string, OverviewWindowMeta> = { ...OS_WINDOW_META };
  private readonly pinLabels: Record<string, string> = {};

  constructor() {
    for (const registration of inject(LW_OS_WINDOW_TABS)) {
      if (!registration.window && this.windowMeta[registration.tab]) continue;
      const { pinLabel, ...meta } = registration.window ?? { title: registration.tab, icon: 'folder' as const, size: 'wide' as const };
      this.windowMeta[registration.tab] = meta;
      if (pinLabel) this.pinLabels[registration.tab] = pinLabel;
    }
  }

  getToolLaunchGroup(): OverviewLaunchGroupDef {
    return TOOL_LAUNCH_GROUP;
  }

  getToolLaunchItems(): readonly OverviewLaunchItem[] {
    return TOOL_LAUNCH_ITEMS;
  }

  /** 여러 앱이 같은 묶음에 들어갈 수 있다(플랫폼 관리, 도구). 묶음은 한 번만 나온다. 폴더의 모양은 먼저 적은 쪽의 것이다. */
  getLaunchGroupDefs(): readonly OverviewLaunchGroupDef[] {
    const groups = new Map<string, OverviewLaunchGroupDef>();
    for (const group of [...this.domainRegistry.getLaunchGroupDefs(), TOOL_LAUNCH_GROUP]) {
      const known = groups.get(group.id);
      groups.set(group.id, known ? { ...known, folder: known.folder ?? group.folder } : group);
    }
    return [...groups.values()];
  }

  /** 같은 앱(appId)을 두 곳에서 넣었으면 먼저 넣은 것만 남긴다. */
  getLaunchItems(): readonly OverviewLaunchItem[] {
    const seen = new Set<string>();
    return [...this.domainRegistry.getLaunchItems(), ...TOOL_LAUNCH_ITEMS].filter((item) => !seen.has(item.appId) && !!seen.add(item.appId));
  }

  getTaskbarPinMeta(): Record<OverviewWindowTab, OverviewTaskbarPin> {
    return Object.fromEntries(
      Object.entries(this.windowMeta).map(([tab, meta]) => [tab, { tab, label: this.pinLabels[tab] ?? meta.title, icon: meta.icon }]),
    ) as Record<OverviewWindowTab, OverviewTaskbarPin>;
  }

  getWindowTabs(): readonly OverviewWindowTab[] {
    return Object.keys(this.windowMeta);
  }

  /** 등록되지 않은 탭이 와도 창은 뜬다. 탭 이름을 제목으로 쓴다. */
  getWindowMeta(tab: OverviewWindowTab): OverviewWindowMeta {
    return this.windowMeta[tab] ?? { title: tab, icon: 'folder', size: 'wide' };
  }

  getPageTitle(tab: string): string {
    return OS_PAGE_TITLES[tab] ?? this.windowMeta[tab]?.title ?? '';
  }
}