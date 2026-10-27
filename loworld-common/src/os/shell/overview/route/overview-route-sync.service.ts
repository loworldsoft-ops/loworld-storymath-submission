import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { OverviewWindowTab } from '../../../../services/models/os.types';
import { OverviewRouteService } from './overview-route.service';

export type OverviewRouteNavigationMode = 'push' | 'replace';

@Injectable({ providedIn: 'root' })
export class OverviewRouteSyncService {
  private readonly router = inject(Router);
  private readonly overviewRouteService = inject(OverviewRouteService);
  private suppressOverviewRouteHandling = false;

  consumeSuppressedNavigation(): boolean {
    if (!this.suppressOverviewRouteHandling) {
      return false;
    }

    this.suppressOverviewRouteHandling = false;
    return true;
  }

  syncRoute(
    tab: OverviewWindowTab | null,
    detailId?: string,
    mode: OverviewRouteNavigationMode = 'replace',
    subDetailId?: string,
  ): void {
    const nextSegments = tab
      ? this.overviewRouteService.getRouteSegments(tab, detailId, subDetailId)
      : ['overview'];
    // 경로만 비교한다. 쿼리스트링은 창 안의 화면(가이드·도감의 현재 문서 등)이 쓰므로 같은 경로에서는 지우지 않는다.
    const currentPath = this.router.url.replace(/^\//, '').split(/[?#]/)[0];
    const nextUrl = nextSegments.join('/');

    if (currentPath === nextUrl) {
      return;
    }

    this.suppressOverviewRouteHandling = true;
    void this.router.navigateByUrl('/' + nextUrl, mode === 'replace' ? { replaceUrl: true } : undefined);
  }
}