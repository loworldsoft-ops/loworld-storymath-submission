/**
 * Unified Theme Tokens Model and Palette Registry
 * Provides type-safe contracts for all visual skins and semantic tokens.
 */

export interface LwThemeTokens {
  surface: string;
  surfaceAlt: string;
  surfaceScrim: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderBrown: string;
  borderBrownStrong: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
}

export type LwThemeSkinId =
  | 'standard'
  | 'newspaper'
  | 'parchment'
  | 'dark-novel'
  | 'light-novel'
  | 'glassmorphism'
  | 'cyberpunk'
  | 'night';

export type LwThemeMode = 'light' | 'dark' | 'system';
export type LwResolvedMode = 'light' | 'dark';
export type LwDomainId = 'common' | 'novel' | 'calendar' | 'homework' | 'note' | 'db';

export interface LwThemeSkinPreset {
  id: LwThemeSkinId;
  name: string;
  icon: string;
  accentColor: string;
  bgPreview: string;
  description: string;
}

export const THEME_SKIN_PRESETS: readonly LwThemeSkinPreset[] = [
  {
    id: 'light-novel',
    name: '라이트 테마 (기본)',
    icon: '☀️',
    accentColor: '#0284c7',
    bgPreview: '#ffffff',
    description: '밝고 선명한 명조 서체 중심의 클린 라이트 모드 (기본값)',
  },
  {
    id: 'dark-novel',
    name: '다크 테마 (Dark)',
    icon: '🌙',
    accentColor: '#38bdf8',
    bgPreview: '#0f172a',
    description: '몰입감을 극대화하는 프리미엄 슬레이트 다크 모드',
  },
  {
    id: 'newspaper',
    name: '신문 양식 (Newspaper)',
    icon: '📰',
    accentColor: '#991b1b',
    bgPreview: '#fbf9f4',
    description: '클래식 수직 신문 칼럼과 버건디 잉크 양식 스킨',
  },
  {
    id: 'parchment',
    name: '고전 양피지 (Parchment)',
    icon: '📜',
    accentColor: '#d97706',
    bgPreview: '#fef3c7',
    description: '판타지 연출을 극대화하는 양피지 고문서 스킨',
  },
  {
    id: 'cyberpunk',
    name: '사이버펑크 (Cyberpunk)',
    icon: '⚡',
    accentColor: '#00ffcc',
    bgPreview: '#0a0a12',
    description: '네온 시안과 마젠타 글리치가 적용된 SF 테마',
  },
  {
    id: 'night',
    name: '밤 (Night)',
    icon: '✨',
    accentColor: '#F2B544',
    bgPreview: '#15171D',
    description: '어두운 바탕과 호박색 강조. 차 안에서 눈이 편하다',
  },
];

export const THEME_TOKEN_PALETTES: Record<LwThemeSkinId, { light: LwThemeTokens; dark: LwThemeTokens }> = {
  standard: {
    light: {
      surface: '#ffffff',
      surfaceAlt: '#f8fafc',
      surfaceScrim: 'rgba(0, 0, 0, 0.4)',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      borderBrown: 'rgba(160, 120, 75, 0.45)',
      borderBrownStrong: 'rgba(160, 120, 75, 0.75)',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSoft: 'rgba(2, 132, 199, 0.12)',
    },
    dark: {
      surface: '#152131',
      surfaceAlt: '#0c141f',
      surfaceScrim: 'rgba(0, 0, 0, 0.65)',
      textPrimary: '#edf5ff',
      textSecondary: '#c4d4e8',
      textMuted: '#6b829e',
      border: '#2a3b53',
      borderBrown: 'rgba(201, 162, 39, 0.35)',
      borderBrownStrong: 'rgba(201, 162, 39, 0.75)',
      accent: '#38bdf8',
      accentHover: '#7dd3fc',
      accentSoft: 'rgba(56, 189, 248, 0.15)',
    },
  },
  newspaper: {
    light: {
      surface: '#f4f0e6',
      surfaceAlt: '#eae4d8',
      surfaceScrim: 'rgba(28, 25, 23, 0.4)',
      textPrimary: '#1c1917',
      textSecondary: '#44403c',
      textMuted: '#78716c',
      border: '#d6d3d1',
      borderBrown: 'rgba(139, 90, 43, 0.45)',
      borderBrownStrong: 'rgba(139, 90, 43, 0.8)',
      accent: '#991b1b',
      accentHover: '#7f1d1d',
      accentSoft: 'rgba(153, 27, 27, 0.12)',
    },
    dark: {
      surface: '#24201c',
      surfaceAlt: '#1c1917',
      surfaceScrim: 'rgba(0, 0, 0, 0.7)',
      textPrimary: '#f5f0e6',
      textSecondary: '#d6cebf',
      textMuted: '#9e9587',
      border: '#443e37',
      borderBrown: 'rgba(180, 120, 60, 0.5)',
      borderBrownStrong: 'rgba(180, 120, 60, 0.85)',
      accent: '#f87171',
      accentHover: '#ef4444',
      accentSoft: 'rgba(248, 113, 113, 0.15)',
    },
  },
  parchment: {
    light: {
      surface: '#fef3c7',
      surfaceAlt: '#fde68a',
      surfaceScrim: 'rgba(69, 26, 3, 0.4)',
      textPrimary: '#451a03',
      textSecondary: '#78350f',
      textMuted: '#92400e',
      border: '#fcd34d',
      borderBrown: 'rgba(180, 83, 9, 0.5)',
      borderBrownStrong: 'rgba(180, 83, 9, 0.85)',
      accent: '#d97706',
      accentHover: '#b45309',
      accentSoft: 'rgba(217, 119, 6, 0.15)',
    },
    dark: {
      surface: '#291b0f',
      surfaceAlt: '#1f140a',
      surfaceScrim: 'rgba(0, 0, 0, 0.7)',
      textPrimary: '#fef3c7',
      textSecondary: '#fde68a',
      textMuted: '#d97706',
      border: '#573a1c',
      borderBrown: 'rgba(217, 119, 6, 0.5)',
      borderBrownStrong: 'rgba(217, 119, 6, 0.85)',
      accent: '#fbbf24',
      accentHover: '#f59e0b',
      accentSoft: 'rgba(251, 191, 36, 0.15)',
    },
  },
  'dark-novel': {
    light: {
      surface: '#1e293b',
      surfaceAlt: '#0f172a',
      surfaceScrim: 'rgba(0, 0, 0, 0.65)',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      borderBrown: 'rgba(201, 162, 39, 0.35)',
      borderBrownStrong: 'rgba(201, 162, 39, 0.75)',
      accent: '#38bdf8',
      accentHover: '#7dd3fc',
      accentSoft: 'rgba(56, 189, 248, 0.15)',
    },
    dark: {
      surface: '#0f172a',
      surfaceAlt: '#020617',
      surfaceScrim: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#1e293b',
      borderBrown: 'rgba(201, 162, 39, 0.35)',
      borderBrownStrong: 'rgba(201, 162, 39, 0.75)',
      accent: '#38bdf8',
      accentHover: '#7dd3fc',
      accentSoft: 'rgba(56, 189, 248, 0.15)',
    },
  },
  'light-novel': {
    light: {
      surface: '#ffffff',
      surfaceAlt: '#f8fafc',
      surfaceScrim: 'rgba(0, 0, 0, 0.35)',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      border: '#e2e8f0',
      borderBrown: 'rgba(160, 120, 75, 0.45)',
      borderBrownStrong: 'rgba(160, 120, 75, 0.75)',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSoft: 'rgba(2, 132, 199, 0.12)',
    },
    dark: {
      surface: '#f1f5f9',
      surfaceAlt: '#e2e8f0',
      surfaceScrim: 'rgba(0, 0, 0, 0.4)',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      border: '#cbd5e1',
      borderBrown: 'rgba(160, 120, 75, 0.45)',
      borderBrownStrong: 'rgba(160, 120, 75, 0.75)',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSoft: 'rgba(2, 132, 199, 0.12)',
    },
  },
  glassmorphism: {
    light: {
      surface: 'rgba(255, 255, 255, 0.20)',
      surfaceAlt: 'rgba(241, 245, 249, 0.12)',
      surfaceScrim: 'rgba(99, 102, 241, 0.12)',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      border: 'rgba(255, 255, 255, 0.35)',
      borderBrown: 'rgba(99, 102, 241, 0.25)',
      borderBrownStrong: 'rgba(99, 102, 241, 0.55)',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentSoft: 'rgba(99, 102, 241, 0.15)',
    },
    dark: {
      surface: 'rgba(15, 23, 42, 0.25)',
      surfaceAlt: 'rgba(30, 41, 59, 0.18)',
      surfaceScrim: 'rgba(0, 0, 0, 0.5)',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: 'rgba(255, 255, 255, 0.18)',
      borderBrown: 'rgba(129, 140, 248, 0.35)',
      borderBrownStrong: 'rgba(129, 140, 248, 0.75)',
      accent: '#818cf8',
      accentHover: '#a5b4fc',
      accentSoft: 'rgba(129, 140, 248, 0.2)',
    },
  },
  cyberpunk: {
    light: {
      surface: '#121124',
      surfaceAlt: '#0a0a12',
      surfaceScrim: 'rgba(0, 0, 0, 0.8)',
      textPrimary: '#00ffcc',
      textSecondary: '#ff007f',
      textMuted: '#707090',
      border: '#ff007f',
      borderBrown: '#00ffcc',
      borderBrownStrong: '#ff007f',
      accent: '#00ffcc',
      accentHover: '#33ffdd',
      accentSoft: 'rgba(0, 255, 204, 0.18)',
    },
    dark: {
      surface: '#0a0a12',
      surfaceAlt: '#05050a',
      surfaceScrim: 'rgba(0, 0, 0, 0.85)',
      textPrimary: '#00ffcc',
      textSecondary: '#ff007f',
      textMuted: '#707090',
      border: '#ff007f',
      borderBrown: '#00ffcc',
      borderBrownStrong: '#ff007f',
      accent: '#00ffcc',
      accentHover: '#33ffdd',
      accentSoft: 'rgba(0, 255, 204, 0.18)',
    },
  },
  night: {
    light: {
      surface: '#1F222B',
      surfaceAlt: '#15171D',
      surfaceScrim: 'rgba(0, 0, 0, 0.85)',
      textPrimary: '#F3F1EA',
      textSecondary: '#A9ADB8',
      textMuted: '#6B7080',
      border: '#3A3F4C',
      borderBrown: '#3A3F4C',
      borderBrownStrong: '#F2B544',
      accent: '#F2B544',
      accentHover: '#f5c366',
      accentSoft: 'rgba(242, 181, 68, 0.16)',
    },
    dark: {
      surface: '#1F222B',
      surfaceAlt: '#15171D',
      surfaceScrim: 'rgba(0, 0, 0, 0.85)',
      textPrimary: '#F3F1EA',
      textSecondary: '#A9ADB8',
      textMuted: '#6B7080',
      border: '#3A3F4C',
      borderBrown: '#3A3F4C',
      borderBrownStrong: '#F2B544',
      accent: '#F2B544',
      accentHover: '#f5c366',
      accentSoft: 'rgba(242, 181, 68, 0.16)',
    },
  },
};
