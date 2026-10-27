import { DestroyRef, inject } from '@angular/core';
import { LwComponentConfigStore } from '../services/stores/component-config.store';
import type { LifecycleComponentCategory } from './base-lifecycle.component';

/**
 * 컴포넌트가 생기고 사라질 때 콘솔에 적는다(설정에서 켰을 때만). 필드를 초기화하는 자리에서 부른다.
 * 기반 클래스를 상속해서 받던 기능이다. 상속 대신 이것을 부른다.
 */
export function injectLifecycleLog(name: string, category: LifecycleComponentCategory): void {
  const store = inject(LwComponentConfigStore, { optional: true });
  const allowed = () => store?.consoleLogsEnabled() ?? false;
  if (allowed()) console.log(`%c🟢 [LIFECYCLE:MOUNT] [${category}] ${name}`, 'font-weight: bold');
  inject(DestroyRef).onDestroy(() => {
    if (allowed()) console.log(`%c🔴 [LIFECYCLE:DESTROY] [${category}] ${name}`, 'font-weight: bold');
  });
}
