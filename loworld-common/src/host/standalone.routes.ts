import type { Routes } from '@angular/router';
import type { LwAppManifest } from './app-manifest';

/**
 * 단독 실행 앱의 선언서(`manifest`)로부터 필요한 최소 라우트만을 생성합니다.
 * OS 쇼케이스의 overview/all-components/도감 라우트를 완전히 배제합니다.
 */
export function standaloneRoutes(manifest: LwAppManifest): Routes {
  const routes: Routes = [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: manifest.homeTab,
    },
  ];

  for (const tab of manifest.windowTabs) {
    const routeConfig = {
      ...(tab.loadComponent ? { loadComponent: tab.loadComponent } : tab.component ? { component: tab.component } : {}),
      data: {
        activeTab: tab.tab,
        themeMode: 'light',
      },
    };

    routes.push({
      path: tab.tab,
      ...routeConfig,
    });

    for (const sub of tab.routes ?? []) {
      routes.push({
        path: `${tab.tab}/${sub}`,
        ...routeConfig,
      });
    }

    for (const alias of tab.routeAliases ?? []) {
      routes.push({
        path: alias,
        pathMatch: 'full',
        redirectTo: tab.tab,
      });
      for (const sub of tab.routes ?? []) {
        routes.push({
          path: `${alias}/${sub}`,
          pathMatch: 'full',
          redirectTo: `${tab.tab}/${sub}`,
        });
      }
    }
  }

  routes.push({
    path: '**',
    redirectTo: manifest.homeTab,
  });

  return routes;
}
