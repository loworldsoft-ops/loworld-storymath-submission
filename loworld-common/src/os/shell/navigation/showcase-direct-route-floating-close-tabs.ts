/** 창으로 띄우지 않고 주소로 바로 열어도 닫기 단추를 띄우지 않는 OS의 탭. 자기 화면에 돌아가는 길이 있다. */
const OS_TABS_WITHOUT_FLOATING_CLOSE = new Set<string>(['overview', 'overview-explorer', 'all-components', 'showcase-components']);

/** 주소로 바로 연 전체 화면 탭에 오른쪽 아래 닫기 단추를 띄울지. 등록된 앱의 탭이면 띄운다. */
export function isShowcaseDirectRouteFloatingCloseTab(tab: string, isRegisteredTab: (tab: string) => boolean): boolean {
  if (OS_TABS_WITHOUT_FLOATING_CLOSE.has(tab)) return false;
  return tab === 'layout-demo' || isRegisteredTab(tab);
}
