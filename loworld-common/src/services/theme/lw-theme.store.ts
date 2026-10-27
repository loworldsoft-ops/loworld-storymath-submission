import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal, Signal } from '@angular/core';
import { LW_STORAGE_PORT } from '../ports/storage.port';
import type { StoryPlayThemeId } from '../models/story-play-theme.model';
import { LwThemeMode, LwResolvedMode, LwThemeSkinId, LwThemeTokens, THEME_TOKEN_PALETTES, THEME_SKIN_PRESETS, LwThemeSkinPreset } from './lw-theme-tokens.model';
import { LW_APPEARANCE_APP_DEFAULTS, LW_APPEARANCE_STORAGE_KEY, LW_DEFAULT_APPEARANCE, type LwAppearance, type LwDensity, type LwMotion, type LwScheme, type LwSkin, appearancePatchFromLegacyPlayTheme, appearancePatchFromLegacySkin, legacyPlayThemeIdOf, legacySkinIdOf, migrateLegacyAppearance, parseAppearance, resolveMotion, resolveScheme, skinOption } from './lw-appearance.model';

const LEGACY_THEME_KEY = 'loworld-ui.theme';
const LEGACY_PLAY_THEME_KEY = 'loworld-ui.play-theme';
const LEGACY_SKIN_KEY = 'loworld-ui.skin';

/**
 * 모양 설정의 단일 출처.
 *
 * 저장하는 것은 사용자가 고른 `LwAppearance` 하나다. 화면 모드(`resolved`), 예전 이름의 스킨·플레이 테마,
 * 문서 루트의 테마 속성은 모두 이 값에서 계산한다. 그래서 속성끼리 어긋나지 않는다.
 */
@Injectable({ providedIn: 'root' })
export class LwThemeStore {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = inject(LW_STORAGE_PORT);
  private readonly appDefaults = inject(LW_APPEARANCE_APP_DEFAULTS, { optional: true }) ?? {};

  private readonly _appearance = signal<LwAppearance>(this.loadAppearance());

  readonly systemPrefersDark = signal<boolean>(this.matches('(prefers-color-scheme: dark)'));
  readonly systemPrefersReducedMotion = signal<boolean>(this.matches('(prefers-reduced-motion: reduce)'));

  /** 사용자가 고른 모양 설정. */
  readonly appearance = this._appearance.asReadonly();
  readonly scheme: Signal<LwScheme> = computed(() => this._appearance().scheme);
  readonly appearanceSkin: Signal<LwSkin> = computed(() => this._appearance().skin);
  readonly density: Signal<LwDensity> = computed(() => this._appearance().density);
  readonly motion: Signal<LwMotion> = computed(() => this._appearance().motion);

  /** 실제로 그리는 화면 모드. */
  readonly resolved = computed<LwResolvedMode>(() => resolveScheme(this._appearance(), this.systemPrefersDark()));
  readonly resolvedMotion = computed<'full' | 'reduced'>(() =>
    resolveMotion(this._appearance().motion, this.systemPrefersReducedMotion())
  );

  /** 화면 모드 설정(`system` 포함). `scheme`과 같다. */
  readonly mode: Signal<LwThemeMode> = this.scheme;
  /** 기존 CSS가 읽는 스킨 이름. `data-lw-skin`에 찍히는 값이다. */
  readonly effectiveSkin = computed<LwThemeSkinId>(() => legacySkinIdOf(this.resolved(), this._appearance().skin));
  /** @deprecated `effectiveSkin`과 같은 값이다. 저장된 원래 값을 따로 두지 않는다. */
  readonly skin: Signal<LwThemeSkinId> = this.effectiveSkin;
  /** 기존 CSS가 읽는 플레이 테마 이름. `data-lw-play-theme`에 찍히는 값이다. */
  readonly playTheme = computed<StoryPlayThemeId>(() => legacyPlayThemeIdOf(this.resolved(), this._appearance().skin));

  readonly isDark = computed<boolean>(() => {
    return this.resolved() === 'dark';
  });

  readonly resolvedPlayTheme = this.playTheme;

  readonly activePreset = computed<LwThemeSkinPreset>(() => {
    const current = this.effectiveSkin();
    return THEME_SKIN_PRESETS.find((p) => p.id === current) || THEME_SKIN_PRESETS[0];
  });

  readonly tokens = computed<LwThemeTokens>(() => {
    const skin = this.effectiveSkin();
    const mode = this.isDark() ? 'dark' : 'light';
    return THEME_TOKEN_PALETTES[skin]?.[mode] || THEME_TOKEN_PALETTES.standard[mode];
  });

  readonly hostStyleString = computed<string>(() => {
    const t = this.tokens();
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

  constructor() {
    this.watch('(prefers-color-scheme: dark)', this.systemPrefersDark);
    this.watch('(prefers-reduced-motion: reduce)', this.systemPrefersReducedMotion);

    effect(() => {
      const attrs: Record<string, string> = {
        'data-lw-theme': this.resolved(),
        'data-lw-skin': this.effectiveSkin(),
        'data-lw-play-theme': this.playTheme(),
        'data-lw-density': this.density(),
        'data-lw-motion': this.resolvedMotion(),
      };
      const darkFlag = this.isDark();
      if (typeof window === 'undefined') {
        return;
      }
      for (const el of [this.doc.documentElement, this.doc.body]) {
        if (!el) continue;
        for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
      }
      this.doc.documentElement.style.colorScheme = darkFlag ? 'dark' : 'light';
    });
  }

  /**
   * 모양 설정을 바꾼다. 바꿀 항목만 넘긴다.
   * 화면 모드를 고르면서 스킨을 함께 정하지 않았고, 지금 스킨이 그 모드를 지원하지 않으면 스킨을 `plain`으로 돌린다.
   */
  set(patch: Partial<Omit<LwAppearance, 'v'>>): void {
    this._appearance.update((current) => {
      const next: LwAppearance = { ...current, ...patch, v: 1 };
      const wanted = patch.scheme;
      if (wanted && wanted !== 'system' && patch.skin === undefined && !skinOption(next.skin).schemes.includes(wanted)) {
        return { ...next, skin: 'plain' };
      }
      return next;
    });
    try {
      this.storage.setItem(LW_APPEARANCE_STORAGE_KEY, JSON.stringify(this._appearance()));
    } catch {
      // 저장소를 쓸 수 없어도 화면은 그대로 동작한다.
    }
  }

  /** 모든 항목을 기본값(꾸밈 없음)으로 되돌린다. */
  reset(): void {
    this._appearance.set({ ...LW_DEFAULT_APPEARANCE, ...this.appDefaults });
    try {
      this.storage.removeItem(LW_APPEARANCE_STORAGE_KEY);
    } catch {
      // 저장소를 쓸 수 없어도 화면은 그대로 동작한다.
    }
  }

  setMode(mode: LwThemeMode): void {
    this.set({ scheme: mode });
  }

  /** @deprecated `set({ skin })`을 쓴다. 예전 스킨 이름을 받아 새 설정으로 옮긴다. */
  setSkin(skinId: LwThemeSkinId): void {
    this.set(appearancePatchFromLegacySkin(skinId));
  }

  /** @deprecated `set({ skin })`을 쓴다. 예전 플레이 테마 이름을 받아 새 설정으로 옮긴다. */
  setPlayTheme(themeId: StoryPlayThemeId): void {
    this.set(appearancePatchFromLegacyPlayTheme(themeId));
  }

  toggle(): void {
    this.set({ scheme: this.resolved() === 'dark' ? 'light' : 'dark' });
  }

  private loadAppearance(): LwAppearance {
    try {
      const stored = parseAppearance(this.storage.getItem(LW_APPEARANCE_STORAGE_KEY));
      if (stored) return stored;
      const theme = this.storage.getItem(LEGACY_THEME_KEY);
      const skin = this.storage.getItem(LEGACY_SKIN_KEY);
      const playTheme = this.storage.getItem(LEGACY_PLAY_THEME_KEY);
      if (theme || skin || playTheme) return migrateLegacyAppearance({ theme, skin, playTheme });
    } catch {
      // 저장소를 읽을 수 없으면 기본값으로 시작한다.
    }
    return { ...LW_DEFAULT_APPEARANCE, ...this.appDefaults };
  }

  private matches(query: string): boolean {
    return typeof window !== 'undefined' ? window.matchMedia?.(query).matches ?? false : false;
  }

  private watch(query: string, target: { set(value: boolean): void }): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    target.set(mql.matches);
    mql.addEventListener?.('change', (e) => target.set(e.matches));
  }
}
