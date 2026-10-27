/**
 * Story play reading skin and surface themes.
 */
export type StoryPlayThemeId = 'global' | 'newspaper' | 'dark' | 'light' | 'parchment' | 'glassmorphism';

export interface StoryPlayThemePreset {
  id: StoryPlayThemeId;
  name: string;
  icon: string;
  bgPreview: string;
  accentPreview: string;
  description: string;
}

export const STORY_PLAY_THEME_PRESETS: readonly StoryPlayThemePreset[] = [
  {
    id: 'light',
    name: '라이트 노블 (기본)',
    icon: '☀️',
    bgPreview: '#ffffff',
    accentPreview: '#0284c7',
    description: '밝고 깨끗한 명조 텍스트 라이트 모드 (기본값)',
  },
  {
    id: 'dark',
    name: '다크 노블',
    icon: '🌙',
    bgPreview: '#0f172a',
    accentPreview: '#38bdf8',
    description: '몰입감을 높여주는 프리미엄 슬레이트 다크 모드',
  },
  {
    id: 'newspaper',
    name: '신문 양식',
    icon: '📰',
    bgPreview: '#fbf9f4',
    accentPreview: '#991b1b',
    description: '클래식 수직 신문 칼럼과 버건디 잉크 테마',
  },
  {
    id: 'parchment',
    name: '고전 양피지',
    icon: '📜',
    bgPreview: '#fef3c7',
    accentPreview: '#d97706',
    description: '판타지 연출을 극대화하는 양피지 양식 테마',
  },
];

export const DEFAULT_STORY_PLAY_THEME_ID: StoryPlayThemeId = 'light';


