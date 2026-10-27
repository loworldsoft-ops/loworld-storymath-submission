import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

/**
 * 🪟 WINDOW Injection Token
 *
 * 브라우저 전역 `window` 객체에 대한 의존성 역전(DIP) 주입 토큰입니다.
 * SSR 환경(Angular Universal / SSR)에서 `window`가 존재하지 않을 때 `null`을 반환하여
 * `window is not defined` 에러를 방지하고, 단위 테스트 시 모킹(Mocking)을 용이하게 합니다.
 */
export const WINDOW = new InjectionToken<Window | null>('WINDOW', {
  providedIn: 'root',
  factory: () => {
    const document = inject(DOCUMENT, { optional: true });
    return document?.defaultView ?? (typeof window !== 'undefined' ? window : null);
  },
});
