import { InjectionToken, inject } from '@angular/core';
import { WindowTabRegistryService } from '../platform/core/domain-registry/window-tab-registry.service';
import { DeviceModeService } from '../shell/overview/device/device-mode.service';

/**
 * 단독 실행일 때 처음 여는 탭이다. OS 화면으로 띄울 때는 null이다.
 * 단독 실행에서는 OS 화면(바탕화면, 작업표시줄)으로 돌아가는 길이 없다.
 */
export const LW_OS_STANDALONE_TAB = new InjectionToken<string | null>('LW_OS_STANDALONE_TAB', {
  providedIn: 'root',
  factory: () => null,
});

/**
 * 처음 갈 탭이다. OS 화면이면 `overview`, 단독 실행이면 그 앱의 첫 탭이다.
 * 단독 실행을 휴대폰에서 열면 그 탭의 모바일 짝을 연다. 주입 맥락에서 부른다.
 */
export function lwOsHomeTab(): string {
  const standaloneTab = inject(LW_OS_STANDALONE_TAB);
  if (!standaloneTab) return 'overview';
  return inject(DeviceModeService).isMobile() ? inject(WindowTabRegistryService).mobileTabOf(standaloneTab) : standaloneTab;
}
