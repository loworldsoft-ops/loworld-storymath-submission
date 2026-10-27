import { computed, inject, InjectionToken, Signal } from '@angular/core';
import { LwThemeStore } from './lw-theme.store';
import type { LwThemeMode, LwThemeSkinId, LwThemeTokens } from './lw-theme-tokens.model';
import { THEME_TOKEN_PALETTES } from './lw-theme-tokens.model';
import type { StoryPlayThemeId } from '../models/story-play-theme.model';

export const LOCAL_THEME_SCOPE = new InjectionToken<Signal<LwThemeSkinId> | null>('LOCAL_THEME_SCOPE', {
  factory: () => null,
});

/**
 * Functional composition helper for theme awareness and reactive token injection.
 * Can be called within any injection context (component, directive, service)
 * to access theme state and type-safe computed tokens.
 */
export function injectTheme() {
  const store = inject(LwThemeStore, { optional: true });
  const localScope = inject(LOCAL_THEME_SCOPE, { optional: true });

  const activeSkin = computed<LwThemeSkinId>(() => {
    if (localScope) {
      return localScope();
    }
    return store?.effectiveSkin() ?? 'standard';
  });

  const isDark = computed<boolean>(() => {
    const skin = activeSkin();
    if (skin === 'dark-novel') return true;
    if (skin === 'light-novel' || skin === 'newspaper' || skin === 'parchment') return false;
    return store?.isDark() ?? false;
  });

  const tokens = computed<LwThemeTokens>(() => {
    const skin = activeSkin();
    const mode = isDark() ? 'dark' : 'light';
    return THEME_TOKEN_PALETTES[skin]?.[mode] || THEME_TOKEN_PALETTES.standard[mode];
  });

  const hostStyleString = computed<string>(() => {
    const t = tokens();
    return [
      `--lw-surface: ${t.surface}`,
      `--lw-surface-alt: ${t.surfaceAlt}`,
      `--lw-surface-scrim: ${t.surfaceScrim}`,
      `--lw-text-primary: ${t.textPrimary}`,
      `--lw-text-secondary: ${t.textSecondary}`,
      `--lw-text-muted: ${t.textMuted}`,
      `--lw-border: ${t.border}`,
      `--lw-border-brown: ${t.borderBrown}`,
      `--lw-border-brown-strong: ${t.borderBrownStrong}`,
      `--lw-accent: ${t.accent}`,
      `--lw-accent-hover: ${t.accentHover}`,
      `--lw-accent-soft: ${t.accentSoft}`,
      `--lw-game-play-surface: ${t.surface}`,
      `--lw-game-play-text: ${t.textPrimary}`,
      `--lw-game-play-text-soft: ${t.textSecondary}`,
      `--lw-game-play-muted: ${t.textMuted}`,
      `--lw-game-play-border: ${t.border}`,
      `--lw-game-play-accent: ${t.accent}`,
      `--lw-game-accent: ${t.accent}`,
      `--lw-bg-panel: ${t.surface}`,
      `--lw-border-color: ${t.border}`,
    ].join('; ');
  });

  return {
    themeStore: store,
    themeMode: computed(() => store?.mode() ?? 'system'),
    resolvedTheme: computed(() => store?.resolved() ?? (isDark() ? 'dark' : 'light')),
    isDark,
    activeSkin,
    tokens,
    hostStyleString,
    playTheme: computed(() => store?.playTheme() ?? 'dark-novel'),
    resolvedPlayTheme: computed(() => store?.resolvedPlayTheme() ?? 'dark-novel'),
    toggle: () => store?.toggle(),
    setMode: (mode: LwThemeMode) => store?.setMode(mode),
    setSkin: (skinId: LwThemeSkinId) => store?.setSkin(skinId),
    setPlayTheme: (playTheme: StoryPlayThemeId) => store?.setPlayTheme(playTheme),
  };
}
