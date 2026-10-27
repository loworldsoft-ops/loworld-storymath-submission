import { inject, Injectable } from '@angular/core';
import { LwThemeStore } from '../theme/lw-theme.store';
import type { LwThemeSkinId } from '../theme/lw-theme-tokens.model';
import { type StoryPlayThemeId } from '../models/story-play-theme.model';

/**
 * 스토리 화면이 쓰는 테마 서비스. 상태와 문서 속성은 모두 `LwThemeStore`가 가진다.
 */
@Injectable({ providedIn: 'root' })
export class LwStoryPlayThemeService {
  private readonly themeStore = inject(LwThemeStore);

  readonly activeTheme = this.themeStore.playTheme;
  readonly effectiveSkin = this.themeStore.effectiveSkin;
  readonly skin = this.themeStore.skin;

  setTheme(themeId: StoryPlayThemeId): void {
    this.themeStore.setPlayTheme(themeId);
  }

  setSkin(skinId: LwThemeSkinId): void {
    this.themeStore.setSkin(skinId);
  }
}

