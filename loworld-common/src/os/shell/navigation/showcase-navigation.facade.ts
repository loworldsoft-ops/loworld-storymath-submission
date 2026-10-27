import { Injectable, inject } from '@angular/core';
import { OverviewRouteService } from '../overview/route/overview-route.service';
import { ShowcaseSelectionService, type ShowcaseSelectionCatalogs } from './showcase-selection.service';

export type ShowcaseNavigationCommand =
  | { kind: 'overview-home' }
  | { kind: 'overview-explorer-home' }
  | { kind: 'overview-window'; tab: import('../../../services/models/os.types').OverviewWindowTab; detailId?: string; subDetailId?: string }
  | { kind: 'all-components'; section?: string; detailId?: string }
  | { kind: 'tab'; activeTab: string; selectedMenu: string };

@Injectable({ providedIn: 'root' })
export class ShowcaseNavigationFacade {
  private readonly overviewRouteService = inject(OverviewRouteService);
  private readonly showcaseSelection = inject(ShowcaseSelectionService);

  resolveUrl(urlAfterRedirects: string, catalogs: ShowcaseSelectionCatalogs): ShowcaseNavigationCommand {
    const pathOnly = urlAfterRedirects.split('?')[0]?.split('#')[0] ?? urlAfterRedirects;
    const segments = pathOnly.split('/').filter(Boolean);
    const tab = segments[0] || 'overview';

    if (tab === 'overview') {
      const overviewRequest = this.overviewRouteService.parseWindowRequest(segments.slice(1).join('/'));
      if (!overviewRequest) {
        return { kind: 'overview-home' };
      }

      if (overviewRequest.baseTab === 'overview-explorer') {
        return { kind: 'overview-explorer-home' };
      }

      return {
        kind: 'overview-window',
        tab: overviewRequest.baseTab,
        detailId: overviewRequest.detailId,
        subDetailId: overviewRequest.subDetailId,
      };
    }

    if (tab === 'all-components') {
      return {
        kind: 'overview-window',
        tab: 'all-components',
        detailId: segments[1],
        subDetailId: segments[2],
      };
    }

    return {
      kind: 'tab',
      activeTab: tab,
      selectedMenu: this.showcaseSelection.resolveSelection(tab, segments[1], catalogs),
    };
  }
}