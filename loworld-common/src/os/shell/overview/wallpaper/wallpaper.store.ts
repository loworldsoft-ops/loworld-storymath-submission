import { Injectable, computed, inject, signal } from '@angular/core';
import { LW_STORAGE_PORT, type LwStoragePort } from '../../../../services/ports/storage.port';
import { type LwThemeSkinId } from '../../../../services/theme/lw-theme-tokens.model';
import { LwThemeStore } from '../../../../services/theme/lw-theme.store';
import { WALLPAPER_ITEMS } from './wallpaper.registry';
import { WallpaperCategory, WallpaperItem } from './wallpaper.model';

/** 사용자가 배경을 고르지 않았을 때의 배경. 기본은 그림이 아니라 단색이다. */
export const DEFAULT_WALLPAPER_ID = 'solid-gray';
export const DEFAULT_WALLPAPER_BLUR = 0;

import { THEME_WALLPAPER_MAP } from '../../../../services/theme/theme-wallpaper.map';
export { THEME_WALLPAPER_MAP };

// 배경화면 설정은 데스크톱 OS와 모바일 OS가 함께 쓴다. 저장 이름은 예전 데스크톱 것을 이어 쓴다.
const STORAGE_KEY_WALLPAPER = 'loworld_overview_wallpaper_desktop_v2';
const STORAGE_KEY_BLUR = 'loworld_overview_wallpaper_blur_desktop_v4';
const STORAGE_KEY_ADAPTIVE = 'loworld_overview_wallpaper_adaptive_v1';

function loadStoredWallpaper(storage: LwStoragePort, key: string, defaultId: string = DEFAULT_WALLPAPER_ID): string {
  try {
    const saved = storage.getItem(key);
    if (saved && WALLPAPER_ITEMS.some(item => item.id === saved)) {
      return saved;
    }
  } catch {
    // fallback if storage disabled
  }
  return defaultId;
}

function saveStoredWallpaper(storage: LwStoragePort, key: string, id: string): void {
  try {
    storage.setItem(key, id);
  } catch {
    // ignore
  }
}

function loadStoredBlur(storage: LwStoragePort, key: string, defaultValue: number = DEFAULT_WALLPAPER_BLUR): number {
  try {
    const saved = storage.getItem(key);
    if (saved !== null) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val >= 0 && val <= 30) {
        return val;
      }
    }
  } catch {
    // fallback
  }
  return defaultValue;
}

function saveStoredBlur(storage: LwStoragePort, key: string, val: number): void {
  try {
    storage.setItem(key, val.toString());
  } catch {
    // ignore
  }
}

function loadStoredAdaptive(storage: LwStoragePort, defaultValue: boolean = true): boolean {
  try {
    const saved = storage.getItem(STORAGE_KEY_ADAPTIVE);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {
    // fallback
  }
  return defaultValue;
}

function saveStoredAdaptive(storage: LwStoragePort, enabled: boolean): void {
  try {
    storage.setItem(STORAGE_KEY_ADAPTIVE, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export interface WallpaperTone {
  /** 배경이 밝은가 어두운가. 그림 배경은 어둡다고 본다(흰 글자 + 그림자). */
  readonly tone: 'light' | 'dark';
  readonly kind: 'solid' | 'image';
}

/** 단색 배경은 색의 밝기로, 그림 배경은 어두운 쪽으로 판정한다. */
export function wallpaperToneOf(item: WallpaperItem): WallpaperTone {
  if (!item.isSolidColor || !item.solidColorHex) return { tone: 'dark', kind: 'image' };
  const hex = item.solidColorHex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { tone: luminance > 0.55 ? 'light' : 'dark', kind: 'solid' };
}

@Injectable({ providedIn: 'root' })
export class WallpaperStore {
  private readonly storage = inject(LW_STORAGE_PORT);
  private readonly themeStore = inject(LwThemeStore);

  /** 전체 사용 가능한 배경화면 목록 */
  readonly items = signal<readonly WallpaperItem[]>(WALLPAPER_ITEMS);

  /** 테마 자동 연동 활성화 여부 (기본: true) */
  readonly isThemeAdaptive = signal<boolean>(
    loadStoredAdaptive(this.storage, true)
  );

  /** 활성 테마/스킨에 따라 자동으로 계산된 추천 배경화면 ID */
  readonly themeResolvedWallpaperId = computed<string>(() => {
    const skin = this.themeStore.effectiveSkin();
    if (skin === 'glassmorphism' && this.themeStore.resolved() === 'dark') return 'aurora-fjord';
    return THEME_WALLPAPER_MAP[skin] ?? DEFAULT_WALLPAPER_ID;
  });

  /** 사용자가 고른 배경화면 ID. 데스크톱 OS와 모바일 OS에 똑같이 적용된다. */
  readonly wallpaperId = signal<string>(loadStoredWallpaper(this.storage, STORAGE_KEY_WALLPAPER, DEFAULT_WALLPAPER_ID));

  /** 실제로 화면에 적용되는 배경화면 ID */
  readonly effectiveWallpaperId = computed<string>(() =>
    this.isThemeAdaptive() ? this.themeResolvedWallpaperId() : this.wallpaperId(),
  );

  /** 배경화면 블러 (px). 두 OS가 함께 쓴다. */
  readonly wallpaperBlur = signal<number>(loadStoredBlur(this.storage, STORAGE_KEY_BLUR, DEFAULT_WALLPAPER_BLUR));

  /** 배경화면 변경 모달 열림 여부 */
  readonly isModalOpen = signal<boolean>(false);

  /** 모달 내 카테고리 필터 */
  readonly activeCategory = signal<WallpaperCategory>('all');

  /** 현재 적용된 배경화면. 그림은 화면에 맞춰 `desktopUrl`/`mobileUrl` 중에서 고른다. */
  readonly currentWallpaper = computed<WallpaperItem>(() => {
    const id = this.effectiveWallpaperId();
    return this.items().find(item => item.id === id) ??
      this.items().find(item => item.id === DEFAULT_WALLPAPER_ID) ??
      this.items()[0];
  });

  /** 배경의 밝기와 종류. 배경 위에 놓이는 글자색을 정하는 데 쓴다. */
  readonly wallpaperTone = computed<WallpaperTone>(() => wallpaperToneOf(this.currentWallpaper()));

  /** 필터링된 배경화면 목록 */
  readonly filteredItems = computed<readonly WallpaperItem[]>(() => {
    const cat = this.activeCategory();
    if (cat === 'all') return this.items();
    return this.items().filter(item => item.category === cat);
  });

  /** 테마 자동 연동 모드 토글 */
  toggleThemeAdaptive(): void {
    const next = !this.isThemeAdaptive();
    this.setThemeAdaptive(next);
  }

  /** 테마 자동 연동 모드 설정 */
  setThemeAdaptive(enabled: boolean): void {
    this.isThemeAdaptive.set(enabled);
    saveStoredAdaptive(this.storage, enabled);
  }

  /** 배경화면 적용. 직접 고르면 테마 자동 연동은 꺼진다. */
  applyWallpaper(id: string): void {
    if (!WALLPAPER_ITEMS.some(item => item.id === id)) return;
    this.wallpaperId.set(id);
    saveStoredWallpaper(this.storage, STORAGE_KEY_WALLPAPER, id);
    this.setThemeAdaptive(false);
  }

  /** 모달 열기 */
  openModal(): void {
    this.isModalOpen.set(true);
  }

  /** 모달 닫기 */
  closeModal(): void {
    this.isModalOpen.set(false);
  }

  /** 배경화면 블러 조절 (0px ~ 25px) */
  setBlur(value: number): void {
    const clamped = Math.round(Math.max(0, Math.min(25, value)) * 10) / 10;
    this.wallpaperBlur.set(clamped);
    saveStoredBlur(this.storage, STORAGE_KEY_BLUR, clamped);
  }

  /** 카테고리 전환 */
  setCategory(category: WallpaperCategory): void {
    this.activeCategory.set(category);
  }
}

