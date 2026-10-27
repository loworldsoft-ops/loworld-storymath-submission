import type { LwMobileAppControlAction } from '../../../../services/models/mobile-app-control.model';
import { appKeyOf, appMobileOf, isKnownAppKey } from '../../../platform/core/domain-registry/app-look';

/**
 * 모바일 하단 바의 기본 단추. 앱이 띄워진 뒤 스스로 단추를 넣기 전에 보이는 것이다.
 * 앱의 것은 선언서(`domain.mobile.dock`)에 적는다. 여기에는 OS가 스스로 갖는 화면의 것만 있다.
 */
const OS_MOBILE_DEFAULT_ACTIONS: Record<string, readonly LwMobileAppControlAction[]> = {
  'components': [
    { id: 'home', label: '홈', icon: 'home', role: 'os', tooltip: '스마트폰 홈으로 이동' },
    { id: 'allcomp-dashboard', label: '대시보드', icon: 'dashboard', active: true, role: 'app', tooltip: '통계 & KPI 대시보드' },
    { id: 'allcomp-catalog', label: '컴포넌트', icon: 'catalog', role: 'app', tooltip: '전체 컴포넌트 도감 갤러리' },
    { id: 'allcomp-category', label: '카테고리', icon: 'category', role: 'app', tooltip: '카테고리 탐색 서랍' },
    { id: 'allcomp-search', label: '검색', icon: 'search', role: 'app', tooltip: '컴포넌트 실시간 검색' },
    { id: 'allcomp-filter', label: '인스펙터', icon: 'filter', role: 'app', tooltip: '컴포넌트 속성 인스펙터' },
    { id: 'switcher', label: '앱 전환', icon: 'switcher', role: 'os', tooltip: '실행 중인 앱 전환' },
  ],
};

/** 탭이 어느 앱의 것인지. 모르는 탭은 'default'다. */
export function resolveOverviewDomainKey(tab?: string | null): string {
  if (!tab) return 'default';
  const key = appKeyOf(tab);
  return isKnownAppKey(key) ? key : 'default';
}

/** 하단 바를 다루는 쪽에 알릴 앱의 id. 탭이 여럿인 앱이 하나의 id를 쓰겠다고 적었으면 그것이다. */
export function resolveOverviewMobileControlAppId(tab?: string | null): string | null {
  if (!tab) return null;
  return appMobileOf(tab)?.controlAppId ?? tab;
}

export function getOverviewMobileDefaultActions(tab?: string | null): readonly LwMobileAppControlAction[] {
  const actions = (tab ? appMobileOf(tab)?.dock : undefined) ?? OS_MOBILE_DEFAULT_ACTIONS[resolveOverviewDomainKey(tab)];
  if (actions) return actions;

  // 적지 않은 앱의 표준 단추 넷
  return [
    { id: 'home', label: '홈', icon: 'home', role: 'os', tooltip: '스마트폰 홈으로 이동' },
    { id: 'settings', label: '설정', icon: 'settings', role: 'os', tooltip: '현재 앱 설정 열기' },
    { id: 'switcher', label: '앱 전환', icon: 'switcher', role: 'os', tooltip: '실행 중인 앱 목록 및 전환' },
    { id: 'close', label: '닫기', icon: 'close', role: 'danger', tooltip: '현재 앱 닫기' },
  ];
}

/** 하단 바에 캐릭터 단추를 보이는 앱인지. 앱이 선언서에 적는다. */
export function isOverviewMobileCharacterApp(tab?: string | null): boolean {
  return !!tab && (appMobileOf(tab)?.characterSession ?? false);
}
