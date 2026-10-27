/**
 * 반응형 표준 경계값(px). `_mobile-responsive.scss`의 Sass 토큰과 같은 값이다.
 * "모바일"은 TABLET(768) 이하를 뜻한다. MOBILE(640)은 좁은 휴대폰 레이아웃에만 쓴다.
 */
export const LW_BREAKPOINT_COMPACT = 380;
export const LW_BREAKPOINT_MOBILE = 640;
export const LW_BREAKPOINT_TABLET = 768;
export const LW_BREAKPOINT_DESKTOP = 1024;
export const LW_BREAKPOINT_DESKTOP_WIDE = 1440;

export type LwFormFactor = 'phone' | 'tablet' | 'desktop';

/** 폭으로 화면 종류를 정한다: 768 이하 phone, 1024 미만 tablet, 그 이상 desktop. */
export function formFactorOf(width: number): LwFormFactor {
  if (width <= LW_BREAKPOINT_TABLET) return 'phone';
  return width < LW_BREAKPOINT_DESKTOP ? 'tablet' : 'desktop';
}
