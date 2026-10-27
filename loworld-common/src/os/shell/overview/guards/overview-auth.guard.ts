import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OverviewSessionFacade } from '../facade/overview-session.facade';
import { lwOsHomeTab } from '../../../host/standalone.token';

/**
 * 🔒 인증 가드: 로그인되지 않은 사용자의 보호된 라우트(overview, 데모 등) 접근 및 뒤로가기 진입 차단
 * 미인증 상태일 경우 무조건 독립된 `/login` 라우터로 리다이렉트 (이전 요청 URL을 returnUrl에 보존)
 */
export const overviewAuthGuard: CanActivateFn = (_route, state) => {
  const session = inject(OverviewSessionFacade);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' && state.url !== '/login' ? { returnUrl: state.url } : undefined,
  });
};

/**
 * 🔓 게스트 가드: 이미 로그인된 사용자가 `/login` 라우터로 접근 시 `/overview`로 즉시 복귀
 */
export const overviewGuestGuard: CanActivateFn = (_route, state) => {
  const session = inject(OverviewSessionFacade);
  const router = inject(Router);

  if (session.isAuthenticated()) {
    const returnUrl = state.root.queryParams['returnUrl'] as string | undefined;
    // 단독 실행에서는 그 앱의 첫 탭이 집이다.
    return router.createUrlTree([returnUrl || '/' + lwOsHomeTab()]);
  }

  return true;
};
