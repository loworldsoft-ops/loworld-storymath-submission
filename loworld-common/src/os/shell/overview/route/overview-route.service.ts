import { Injectable, inject } from '@angular/core';
import type { OverviewWindowTab } from '../../../../services/models/os.types';
import { OverviewRegistryService } from '../registry/overview-registry.service';
import { WindowTabRegistryService } from '../../../platform/core/domain-registry/window-tab-registry.service';


export type OverviewWindowRequest = {
  baseTab: OverviewWindowTab;
  detailId?: string;
  subDetailId?: string;
};

@Injectable({ providedIn: 'root' })
export class OverviewRouteService {
  private readonly overviewRegistry = inject(OverviewRegistryService);
  private readonly windowTabs = inject(WindowTabRegistryService);

  parseWindowRequest(tab: string): OverviewWindowRequest | null {
    const segments = tab.split('/').filter(segment => segment.length > 0);
    const baseTab = segments[0];
    // 앱마다 따로 있던 도감 탭(`<앱>-components`)은 없다. All Components 하나로 넘긴다.
    if (baseTab === 'components' || (!!baseTab && baseTab.endsWith('-components') && baseTab !== 'all-components' && baseTab !== 'showcase-components')) {
      return {
        baseTab: 'all-components',
        detailId: segments[1],
        subDetailId: segments[2],
      };
    }
    if (!this.overviewRegistry.getWindowTabs().includes(baseTab as OverviewWindowTab)) {
      return null;
    }

    return {
      baseTab: baseTab as OverviewWindowTab,
      detailId: segments[1],
      subDetailId: segments.length > 2 ? segments.slice(2).join('/') : undefined,
    };
  }

  getRouteSegments(tab: OverviewWindowTab, detailId?: string, subDetailId?: string): string[] {
    if (tab === 'all-components') {
      if (detailId && detailId !== 'all-components') {
        if (subDetailId) {
          return ['overview', 'all-components', detailId, subDetailId];
        }
        return ['overview', 'all-components', detailId];
      }
      return ['overview', 'all-components'];
    }

    if (this.windowTabs.hasDeepRoutes(tab)) {
      if (detailId && detailId !== tab) {
        if (subDetailId) {
          const subParts = subDetailId.split('/').filter(Boolean);
          return ['overview', tab, detailId, ...subParts];
        }
        return ['overview', tab, detailId];
      }
      return ['overview', tab];
    }

    if ((this.windowTabs.get(tab)?.routes?.length ?? 0) > 0 || tab === 'showcase-components') {
      if (detailId && detailId !== tab) {
        return ['overview', tab, detailId];
      }
    }

    return ['overview', tab];
  }
}
