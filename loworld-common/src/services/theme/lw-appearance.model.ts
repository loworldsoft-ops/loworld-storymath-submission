import { InjectionToken } from '@angular/core';
import type { StoryPlayThemeId } from '../models/story-play-theme.model';
import type { LwResolvedMode, LwThemeSkinId } from './lw-theme-tokens.model';

/**
 * 모양 설정. 사용자가 고른 값만 담는다.
 * 화면에 찍히는 테마 속성(`data-lw-theme`, `data-lw-skin`, `data-lw-play-theme`)은 모두 여기서 계산한다.
 */
export type LwScheme = 'system' | 'light' | 'dark';
export type LwSkin = 'plain' | 'newspaper' | 'parchment' | 'cyberpunk' | 'glass' | 'night';
export type LwDensity = 'comfortable' | 'compact';
export type LwMotion = 'system' | 'full' | 'reduced';

export interface LwAppearance {
  readonly v: 1;
  readonly scheme: LwScheme;
  readonly skin: LwSkin;
  readonly density: LwDensity;
  readonly motion: LwMotion;
}

/** 앱이 정하는 모양의 기본값. 사용자가 고른 값이 없을 때만 쓴다. */
export type LwAppearanceDefaults = Partial<Pick<LwAppearance, 'scheme' | 'skin'>>;

export const LW_APPEARANCE_APP_DEFAULTS = new InjectionToken<LwAppearanceDefaults>('LW_APPEARANCE_APP_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({}),
});

export const LW_APPEARANCE_STORAGE_KEY = 'loworld-ui.appearance';

/** 기본은 꾸밈 없는 상태다. 화려한 스킨과 배경은 사용자가 고를 때만 켜진다. */
export const LW_DEFAULT_APPEARANCE: LwAppearance = {
  v: 1,
  scheme: 'system',
  skin: 'plain',
  density: 'comfortable',
  motion: 'system',
};

export interface LwSkinOption {
  readonly id: LwSkin;
  readonly name: string;
  readonly description: string;
  /** 이 스킨이 지원하는 화면 모드. 하나뿐이면 화면 모드 설정과 관계없이 그 모드로 그린다. */
  readonly schemes: readonly LwResolvedMode[];
  readonly preview: { readonly bg: string; readonly fg: string; readonly accent: string };
}

export const LW_SKIN_OPTIONS: readonly LwSkinOption[] = [
  { id: 'plain', name: '기본', description: '꾸밈 없는 단정한 화면', schemes: ['light', 'dark'], preview: { bg: '#ffffff', fg: '#0f172a', accent: '#0284c7' } },
  { id: 'newspaper', name: '신문', description: '신문 지면과 버건디 잉크', schemes: ['light'], preview: { bg: '#fbf9f4', fg: '#1c1917', accent: '#991b1b' } },
  { id: 'parchment', name: '양피지', description: '고문서 느낌의 양피지', schemes: ['light'], preview: { bg: '#fef3c7', fg: '#451a03', accent: '#d97706' } },
  { id: 'cyberpunk', name: '사이버펑크', description: '네온 시안과 마젠타', schemes: ['dark'], preview: { bg: '#0a0a12', fg: '#e2e8f0', accent: '#00ffcc' } },
  { id: 'glass', name: '글래스', description: '반투명 유리 질감', schemes: ['light', 'dark'], preview: { bg: '#e0f2fe', fg: '#0f172a', accent: '#6366f1' } },
  { id: 'night', name: '밤', description: '어두운 바탕과 호박색 강조. 차 안에서 눈이 편하다', schemes: ['dark'], preview: { bg: '#15171D', fg: '#F3F1EA', accent: '#F2B544' } },
];

const SCHEMES: readonly LwScheme[] = ['system', 'light', 'dark'];
const SKINS: readonly LwSkin[] = LW_SKIN_OPTIONS.map((o) => o.id);
const DENSITIES: readonly LwDensity[] = ['comfortable', 'compact'];
const MOTIONS: readonly LwMotion[] = ['system', 'full', 'reduced'];

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** 저장된 문자열을 읽는다. 모르는 값은 기본값으로 바꾼다. 읽을 수 없으면 `null`. */
export function parseAppearance(raw: string | null): LwAppearance | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Record<keyof LwAppearance, unknown>> | null;
    if (!data || typeof data !== 'object') return null;
    return {
      v: 1,
      scheme: pick(SCHEMES, data.scheme, LW_DEFAULT_APPEARANCE.scheme),
      skin: pick(SKINS, data.skin, LW_DEFAULT_APPEARANCE.skin),
      density: pick(DENSITIES, data.density, LW_DEFAULT_APPEARANCE.density),
      motion: pick(MOTIONS, data.motion, LW_DEFAULT_APPEARANCE.motion),
    };
  } catch {
    return null;
  }
}

/** 예전 저장값은 따옴표가 붙은 것과 안 붙은 것이 섞여 있다. */
const unquote = (value: string | null): string | null => (value ? value.replace(/^"|"$/g, '') : value);

/**
 * 예전 저장값 세 개(`loworld-ui.theme`, `.skin`, `.play-theme`)를 새 설정 하나로 옮긴다.
 * `standard`·`light-novel`·`dark-novel`은 꾸밈 없는 스킨이었으므로 `plain`이 된다.
 */
export function migrateLegacyAppearance(legacy: {
  theme: string | null;
  skin: string | null;
  playTheme: string | null;
}): LwAppearance {
  const theme = unquote(legacy.theme);
  const skin = unquote(legacy.skin);
  const playTheme = unquote(legacy.playTheme);

  let nextSkin: LwSkin = 'plain';
  if (skin === 'newspaper' || skin === 'parchment' || skin === 'cyberpunk' || skin === 'night') nextSkin = skin;
  else if ((!skin || skin === 'standard') && (playTheme === 'newspaper' || playTheme === 'parchment')) nextSkin = playTheme;

  return { ...LW_DEFAULT_APPEARANCE, scheme: pick(SCHEMES, theme, 'system'), skin: nextSkin };
}

export function skinOption(skin: LwSkin): LwSkinOption {
  return LW_SKIN_OPTIONS.find((o) => o.id === skin) ?? LW_SKIN_OPTIONS[0];
}

/** 실제로 그릴 화면 모드. 스킨이 한 모드만 지원하면 스킨이 정한다. */
export function resolveScheme(appearance: Pick<LwAppearance, 'scheme' | 'skin'>, systemPrefersDark: boolean): LwResolvedMode {
  const { schemes } = skinOption(appearance.skin);
  if (schemes.length === 1) return schemes[0];
  if (appearance.scheme === 'system') return systemPrefersDark ? 'dark' : 'light';
  return appearance.scheme;
}

export function resolveMotion(motion: LwMotion, systemPrefersReduced: boolean): 'full' | 'reduced' {
  if (motion === 'system') return systemPrefersReduced ? 'reduced' : 'full';
  return motion;
}

/** 기존 CSS가 읽는 `data-lw-skin` 값. */
export function legacySkinIdOf(resolved: LwResolvedMode, skin: LwSkin): LwThemeSkinId {
  switch (skin) {
    case 'newspaper':
    case 'parchment':
    case 'cyberpunk':
    case 'night':
      return skin;
    case 'glass':
      return 'glassmorphism';
    default:
      return resolved === 'dark' ? 'dark-novel' : 'light-novel';
  }
}

/** 기존 CSS가 읽는 `data-lw-play-theme` 값. */
export function legacyPlayThemeIdOf(resolved: LwResolvedMode, skin: LwSkin): StoryPlayThemeId {
  switch (skin) {
    case 'newspaper':
    case 'parchment':
      return skin;
    case 'glass':
      return 'glassmorphism';
    default:
      return resolved;
  }
}

/** 예전 스킨 이름으로 들어온 요청을 새 설정의 바뀔 부분으로 옮긴다. */
export function appearancePatchFromLegacySkin(skinId: LwThemeSkinId): Partial<LwAppearance> {
  switch (skinId) {
    case 'newspaper':
    case 'parchment':
    case 'cyberpunk':
    case 'night':
      return { skin: skinId };
    case 'glassmorphism':
      return { skin: 'glass' };
    case 'dark-novel':
      return { skin: 'plain', scheme: 'dark' };
    case 'light-novel':
      return { skin: 'plain', scheme: 'light' };
    default:
      return { skin: 'plain' };
  }
}

/** 예전 플레이 테마 이름으로 들어온 요청을 새 설정의 바뀔 부분으로 옮긴다. */
export function appearancePatchFromLegacyPlayTheme(themeId: StoryPlayThemeId): Partial<LwAppearance> {
  switch (themeId) {
    case 'newspaper':
    case 'parchment':
      return { skin: themeId };
    case 'glassmorphism':
      return { skin: 'glass' };
    case 'dark':
      return { skin: 'plain', scheme: 'dark' };
    case 'light':
      return { skin: 'plain', scheme: 'light' };
    default:
      return { skin: 'plain' };
  }
}
