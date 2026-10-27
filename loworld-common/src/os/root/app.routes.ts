import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Route, Routes } from '@angular/router';
import type { WindowTabRegistration } from '../platform/core/domain-registry/window-tab-registry.types';
import { overviewAuthGuard, overviewGuestGuard } from '../shell/overview/guards/overview-auth.guard';

/** 라우트 매칭 전용 빈 컴포넌트 (렌더링 없음) */
@Component({
  standalone: true,
  templateUrl: './app.routes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TabPage {}

/**
 * 앱의 탭마다 주소를 만든다. OS는 어떤 앱이 있는지 모르고, 띄우는 쪽이 넣은 등록에서 읽는다.
 * 탭 이름의 주소 하나와, 앱이 선언서에 적은 아래 주소(`routes`), 옛 주소(`routeAliases`)다.
 */
export function tabRoutes(registrations: readonly WindowTabRegistration[]): Routes {
  const page = (path: string): Route => ({ path, component: TabPage, canActivate: [overviewAuthGuard] });
  return registrations.flatMap((registration) => {
    const subs = registration.routes ?? [];
    return [
      page(registration.tab),
      ...subs.map((sub) => page(`${registration.tab}/${sub}`)),
      ...(registration.routeAliases ?? []).flatMap((alias): Route[] => [
        { path: alias, redirectTo: registration.tab, pathMatch: 'full' },
        ...subs.map((sub): Route => ({ path: `${alias}/${sub}`, redirectTo: `${registration.tab}/${sub}`, pathMatch: 'full' })),
      ]),
    ];
  });
}

/** OS가 스스로 갖는 주소다. 앱마다 따로 있던 도감 주소(`cal-components` 등)는 All Components로 넘긴다. 앱의 주소는 `tabRoutes`가 만든다. */
export const routes: Routes = [
  { path: 'login',         component: TabPage, canActivate: [overviewGuestGuard] },
  { path: '',              redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview',      component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'overview/common-components', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'overview/common-components/:id', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'overview/components', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'overview/components/:id', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'overview/:tab', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'overview/:tab/:id', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'overview/:tab/:id/:subId', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'overview/:tab/:id/:subId/:phase', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'overview/:tab/:id/:subId/:phase/:view', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'all-components', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'all-components/:id', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'all-components/:id/:subId', component: TabPage, canActivate: [overviewAuthGuard] },

  { path: 'components',    redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'components/:id', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'common-components', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'common-components/:id', redirectTo: 'overview/all-components', pathMatch: 'full' },
  { path: 'showcase-components', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'showcase-components/:id', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: 'all-components', component: TabPage, canActivate: [overviewAuthGuard] },
  { path: '**',            redirectTo: 'overview' },
];
