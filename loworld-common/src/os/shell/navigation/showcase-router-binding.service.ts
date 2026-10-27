import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { OverviewRouteSyncService } from '../overview/route/overview-route-sync.service';
import { ShowcaseNavigationFacade, type ShowcaseNavigationCommand } from './showcase-navigation.facade';
import type { ShowcaseSelectionCatalogs } from './showcase-selection.service';

@Injectable({ providedIn: 'root' })
export class ShowcaseRouterBindingService {
  private readonly router = inject(Router);
  private readonly overviewRouteSync = inject(OverviewRouteSyncService);
  private readonly showcaseNavigation = inject(ShowcaseNavigationFacade);
  private readonly destroyRef = inject(DestroyRef);

  bind(
    catalogs: ShowcaseSelectionCatalogs,
    dispatch: (command: ShowcaseNavigationCommand) => void,
    callerDestroyRef?: DestroyRef,
  ): Subscription {
    const targetDestroyRef = callerDestroyRef ?? this.destroyRef;
    return this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(targetDestroyRef),
    ).subscribe(event => {
      if (this.overviewRouteSync.consumeSuppressedNavigation()) {
        return;
      }

      dispatch(this.showcaseNavigation.resolveUrl(event.urlAfterRedirects, catalogs));
    });
  }
}