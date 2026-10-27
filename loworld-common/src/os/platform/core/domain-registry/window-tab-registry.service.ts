import { Injectable, InjectionToken, Type, inject } from '@angular/core';
import type { WindowTabContext, WindowTabRegistration, WindowTabRegistryPort, WindowTabSettingsMode } from './window-tab-registry.types';

/** OS가 띄울 창의 등록. 띄우는 쪽(쇼케이스, 단독 실행)이 넣는다. 공통은 어떤 앱이 있는지 모른다. */
export const LW_OS_WINDOW_TABS = new InjectionToken<readonly WindowTabRegistration[]>('LW_OS_WINDOW_TABS', {
  providedIn: 'root',
  factory: () => [],
});

/** 모바일에서 다른 탭으로 바꿔 여는 짝. 등록에 `mobileTab`을 적을 수 없는 탭에만 쓴다. */
export const LW_OS_MOBILE_TAB_ALIASES = new InjectionToken<Readonly<Record<string, string>>>('LW_OS_MOBILE_TAB_ALIASES', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * 🪟 WindowTabRegistryService (OCP: Open-Closed Principle & Code Splitting)
 *
 * 윈도우 탭 렌더링을 템플릿의 거대 @switch 문에서 분리하고,
 * 각 도메인 쇼케이스 컴포넌트를 loadComponent 비동기 청크로 격리하여
 * 초기 main.js 번들 크기를 최적화합니다.
 */
@Injectable({ providedIn: 'root' })
export class WindowTabRegistryService implements WindowTabRegistryPort {
  private readonly registrations = new Map<string, WindowTabRegistration>();
  private readonly mobileAliases = inject(LW_OS_MOBILE_TAB_ALIASES);

  constructor() {
    for (const registration of inject(LW_OS_WINDOW_TABS)) this.register(registration);
  }

  register(registration: WindowTabRegistration): void {
    this.registrations.set(registration.tab, registration);
  }

  /** 탭 아래에 두 마디 이상의 주소(`mode/:id/play`)를 갖는 탭인지. 그런 탭은 창을 다시 잡아도 주소를 탭의 것으로 되돌리지 않는다. */
  hasDeepRoutes(tab: string): boolean {
    return (this.registrations.get(tab)?.routes ?? []).some((route) => route.includes('/'));
  }

  /** 모바일 모드에서 대신 여는 탭. 짝이 없으면 그대로 돌려준다. */
  mobileTabOf(tab: string): string {
    return this.registrations.get(tab)?.mobileTab ?? this.mobileAliases[tab] ?? tab;
  }

  /** `mobileTabOf`의 반대. 등록된 짝만 되돌린다. */
  desktopTabOf(tab: string): string {
    for (const registration of this.registrations.values()) {
      if (registration.mobileTab === tab) return registration.tab;
    }
    return tab;
  }

  settingsModeOf(tab: string): WindowTabSettingsMode | undefined {
    return this.registrations.get(tab)?.settingsMode;
  }

  has(tab: string): boolean {
    return this.registrations.has(tab);
  }

  get(tab: string): WindowTabRegistration | undefined {
    return this.registrations.get(tab);
  }

  getComponent(tab: string): Type<unknown> | undefined {
    return this.registrations.get(tab)?.component;
  }

  getLoadComponent(tab: string): (() => Promise<Type<unknown>>) | undefined {
    return this.registrations.get(tab)?.loadComponent;
  }

  resolveInputs(tab: string, context: WindowTabContext): Record<string, unknown> {
    const reg = this.registrations.get(tab);
    if (!reg) return {};
    if (reg.resolveInputs) {
      return reg.resolveInputs(context);
    }
    return {
      activeTab: context.window.tab,
      themeMode: context.themeMode,
    };
  }

  shouldWrapInScrollPage(tab: string): boolean {
    return !!this.registrations.get(tab)?.wrapInScrollPage;
  }
}
