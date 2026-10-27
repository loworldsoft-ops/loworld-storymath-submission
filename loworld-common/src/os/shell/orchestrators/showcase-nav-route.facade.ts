import { Injectable, inject } from '@angular/core';
import { OverviewRouteService } from '../overview/route/overview-route.service';
import { OverviewRouteSyncService } from '../overview/route/overview-route-sync.service';
import { ShowcaseMenuActionFacade } from '../navigation/showcase-menu-action.facade';
import { ShowcaseNavigationFacade } from '../navigation/showcase-navigation.facade';
import { ShowcaseRouterBindingService } from '../navigation/showcase-router-binding.service';

/**
 * 🧭 ShowcaseNavRouteFacade (SRP / Facade)
 * 쇼케이스 내비게이션, 라우팅, 메뉴 액션을 전담하는 파사드
 */
@Injectable({ providedIn: 'root' })
export class ShowcaseNavRouteFacade {
  readonly routeService = inject(OverviewRouteService);
  readonly routeSync = inject(OverviewRouteSyncService);
  readonly menuAction = inject(ShowcaseMenuActionFacade);
  readonly navigation = inject(ShowcaseNavigationFacade);
  readonly routerBinding = inject(ShowcaseRouterBindingService);
}
