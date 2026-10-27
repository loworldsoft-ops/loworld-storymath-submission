import type { StorySidebarPanel } from './story-sidebar.model';

export type StoryPlayInspectorPanelId =
  | 'character'
  | 'equipment'
  | 'stash'
  | 'inventory'
  | 'skills'
  | 'battle'
  | 'currency'
  | 'journey'
  | 'map'
  | 'database'
  | 'quest'
  | 'events'
  | 'shop'
  | 'hospital';

export type StoryPlayModeId =
  | 'chapter-100'
  | 'story-generate'
  | 'full-mode'
  | 'story'
  | 'journey-test'
  | 'battle-test'
  | 'training-test'
  | 'shop-test'
  | 'cube-test'
  | 'character-dialogue'
  | 'situation-test'
  | 'dungeon-test'
  | 'quest-test'
  | 'chronicle'
  | 'codex'
  | 'd2-resurrection'
  | 'character-detail-test'
  | 'mind-interaction-test'
  | 'random-card'
  | 'skill-story'
  | 'guide-mode';

/** showcase: catalog = mode grid, preview = selected not started, play = active sandbox */
export type StoryPlayPhase = 'catalog' | 'preview' | 'play';

export type StoryPlayAnchorView =
  | 'reader'
  | 'setup'
  | 'battle'
  | 'shop'
  | 'affinity'
  | 'dialogue'
  | 'training'
  | 'dungeon'
  | 'situation'
  | 'artifice'
  | 'quest'
  | 'quest-test'
  | 'chronicle'
  | 'codex'
  | 'character'
  | 'mind-interaction'
  | 'guide'
  | 'library';

export const STORY_PLAY_ANCHOR_VIEWS: readonly StoryPlayAnchorView[] = [
  'reader',
  'battle',
  'shop',
  'affinity',
  'dialogue',
  'training',
  'dungeon',
  'situation',
  'artifice',
  'quest',
  'quest-test',
  'chronicle',
  'codex',
  'character',
  'mind-interaction',
  'guide',
  'library',
] as const;

export type StoryPlayUrlSurface = 'showcase-desktop' | 'showcase-mobile' | 'production';

export interface StoryPlayUrlState {
  mode: StoryPlayModeId | null;
  phase: StoryPlayPhase;
  view: StoryPlayAnchorView;
  sidebar: StorySidebarPanel | null;
  inspector: StoryPlayInspectorPanelId | null;
  codexPanel: StorySidebarPanel | null;
  sceneId: string | null;
  chapterId: string | null;
  datasetId: string | null;
}

export const DEFAULT_STORY_PLAY_URL_STATE: StoryPlayUrlState = {
  mode: null,
  phase: 'catalog',
  view: 'reader',
  sidebar: null,
  inspector: null,
  codexPanel: null,
  sceneId: null,
  chapterId: null,
  datasetId: null,
};

export interface StoryPlayUrlContext {
  surface: StoryPlayUrlSurface;
}

export function storyPlayUrlBasePath(surface: StoryPlayUrlSurface): string {
  switch (surface) {
    case 'showcase-desktop':
      return '/novel-demo';
    case 'showcase-mobile':
      return '/novel-mobile-demo';
    case 'production':
      return '/novel';
  }
}
