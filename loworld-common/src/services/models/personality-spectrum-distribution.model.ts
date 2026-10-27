import type { PersonalityCategorySubTabId } from './personality-codex.model';

export type PersonalityDistributionFilter = 'all' | 'four_seven' | 'virtues_sins' | 'human_desires' | 'moral_alignment';

export interface PersonalityCoordinateNode {
  id: string;
  name: string;
  hanja?: string;
  title: string;
  category: PersonalityCategorySubTabId;
  subcategory: string;
  icon: string;
  x: number; // -100 ~ +100 (친밀/유대 vs 경계/적대)
  y: number; // -100 ~ +100 (동경/승화 vs 질투/지배)
  motto: string;
  interactionDescription: string;
  color: string;
  tier: 1 | 2 | 3;
  tag?: string;
  shortEffect?: string;
}

export interface PersonalityHarmonySummary {
  harmonyScore: number; // 0 ~ 100
  fourSevenDominantTrait: string;
  tensionLevel: 'low' | 'moderate' | 'high' | 'critical';
  insightComment: string;
}
