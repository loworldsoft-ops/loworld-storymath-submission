import type { LwThemeSkinId } from './lw-theme-tokens.model';

/** "테마에 맞춰 자동"일 때 스킨(`data-lw-skin` 값)별로 쓰는 단색 배경. */
export const THEME_WALLPAPER_MAP: Record<LwThemeSkinId, string> = {
  'light-novel': 'solid-gray',
  'dark-novel': 'solid-slate',
  'standard': 'solid-gray',
  'newspaper': 'solid-cream',
  'parchment': 'solid-cream',
  'cyberpunk': 'solid-black',
  'glassmorphism': 'summer-alpine',
  'night': 'solid-black',
};
