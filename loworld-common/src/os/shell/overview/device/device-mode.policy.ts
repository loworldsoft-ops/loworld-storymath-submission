export type DeviceMode = 'desktop' | 'mobile';

export interface DeviceTraits {
  /** 화면 폭 기준 종류: 768px 이하 phone, 1024px 미만 tablet, 그 이상 desktop */
  readonly formFactor: 'phone' | 'tablet' | 'desktop';
  /** 주 입력 장치가 터치인가 */
  readonly coarsePointer: boolean;
  readonly canHover: boolean;
}

/**
 * 화면과 입력 장치만 보고 정하는 기본 모드. 기기 이름(UA)은 보지 않는다.
 *
 * - 폭이 휴대폰 범위면 모바일.
 * - 태블릿 범위는 터치 전용 기기일 때만 모바일(마우스가 있는 좁은 창은 데스크톱).
 * - 폭이 데스크톱 범위면 터치 기기여도 데스크톱(가로로 둔 태블릿 등).
 */
export function resolveAutoDeviceMode(traits: DeviceTraits): DeviceMode {
  if (traits.formFactor === 'phone') return 'mobile';
  const touchOnly = traits.coarsePointer && !traits.canHover;
  return traits.formFactor === 'tablet' && touchOnly ? 'mobile' : 'desktop';
}

/** 사용자가 고른 모드를 저장할 값. 기본 모드와 같으면 따로 기억하지 않는다. */
export function preferenceFor(chosen: DeviceMode, auto: DeviceMode): DeviceMode | null {
  return chosen === auto ? null : chosen;
}

/** 모바일 화면을 기종 프레임 안에 그려야 하는가: 데스크톱 환경에서 사용자가 모바일을 골랐을 때만. */
export function shouldSimulate(mode: DeviceMode, auto: DeviceMode): boolean {
  return mode === 'mobile' && auto === 'desktop';
}
