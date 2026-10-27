import { Injectable, inject, signal } from '@angular/core';
import type { StoryPlayAnchorView } from '../models/story-play-url.model';
import { DEFAULT_STORY_PLAY_THEME_ID, type StoryPlayThemeId } from '../models/story-play-theme.model';
import { LwStoryPlayThemeService } from './story-play-theme.service';

/**
 * Facade service for Narrative/Novel Play state and action coordination.
 * Acts as an Application Layer boundary between complex Shell UI components
 * and domain models/events.
 */
@Injectable({ providedIn: 'root' })
export class NarrativePlayFacadeService {
  private readonly themeService = inject(LwStoryPlayThemeService);

  readonly activeView = signal<StoryPlayAnchorView>('reader');
  readonly readingTheme = this.themeService.activeTheme;
  readonly inspectorOpen = signal(true);
  readonly readerAutoModeEnabled = signal(false);

  setActiveView(view: StoryPlayAnchorView): void {
    this.activeView.set(view);
  }

  setReadingTheme(themeId: StoryPlayThemeId): void {
    this.themeService.setTheme(themeId);
  }

  toggleInspector(): void {
    this.inspectorOpen.update((open) => !open);
  }

  setReaderAutoMode(enabled: boolean): void {
    this.readerAutoModeEnabled.set(enabled);
  }
}
