import type { AffinityType } from './affinity.model';
import type { RpgSkillKind, RpgSkillSynergy, SkillType } from './rpg-skill.model';
import type { SkillParagraphStory } from './story-skill-narrative-base.model';

export type { SkillType };

/** 단일 / 광역 / 직선 / 본인 */
export type SkillTargetScope = 'single' | 'area' | 'line' | 'self';

/** 적군 / 아군 / 본인 / 전체(양측) */
export type SkillTargetSide = 'enemy' | 'ally' | 'self' | 'all';

/** 피해 / 치유 / 버프 / 디버프 / 소환 */
export type SkillEffectKind = 'damage' | 'heal' | 'buff' | 'debuff' | 'summon';

/** 스킬 전투 적용 메타 — 도감·수련 UI용 */
export interface SkillCombatProfile {
  effectKind: SkillEffectKind;
  targetScope: SkillTargetScope;
  targetSide: SkillTargetSide;
  /** Lv1 기본 min 위력 (피해·치유) */
  baseMin?: number;
  /** Lv1 기본 max 위력 */
  baseMax?: number;
  /** 글로벌 Lv 1당 min/max 각각 가산 */
  powerPerLevel?: number;
  /** 버프·디버프·소환 — Lv1 효과 설명 */
  effectPotencyLabel?: string;
  /** 버프·디버프·소환 — Lv1 효과 수치 */
  effectPotencyBase?: number;
  /** 글로벌 Lv 1당 효과 가산 (표시용) */
  effectPotencyPerLevel?: number;
  /** 아군·적군 적용 상세 */
  applicationDetail: string;
}

/** D2 직업 트리를 참고한 스킬 경지(분류) */
export type SkillDiscipline =
  | 'warrior'
  | 'sorceress'
  | 'archer'
  | 'necromancer'
  | 'paladin'
  | 'druid'
  | 'assassin';

export type SkillRealmId = 'beginner' | 'minor' | 'major' | 'perfect' | 'transcendent';

export interface SkillRealm {
  id: SkillRealmId;
  label: string;
  order: number;
}

/** D2R 메타 — generate-d2-skills-registry.mjs SSOT */
export interface RpgSkillMeta {
  rpgName: string;
  charclass: string;
  treePage: number;
  treeRow: number;
  treeColumn: number;
  treeLabelKo: string;
  reqlevel: number;
  maxLevel: number;
  prerequisites: string[];
  synergies: RpgSkillSynergy[];
  kind: RpgSkillKind;
  manaLevel1: number;
  manaLevel20: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  discipline: SkillDiscipline;
  iconHint?: string;
  /** novel-skill PNG id — D2 210종 중 legacy 28 alias */
  iconId?: string;
  /** D2R parity — d2-resurrection 모드 SSOT */
  rpg?: RpgSkillMeta;
  /** 전투 원소 상성 — 미지정 시 id/iconHint 휴리스틱 */
  elementAffinity?: AffinityType;
  combat?: SkillCombatProfile;
  /** 도감 스킬 고유 단락 스토리 (기승전결 4단락 구조) */
  story?: SkillParagraphStory;
}

/** 캐릭터가 보유한 스킬 인스턴스 — 레벨과 경지를 독립 관리 */
export interface CharacterSkill {
  skillId: string;
  level: number;
  realmId: SkillRealmId;
  exp: number;
}

export const SKILL_REALM_STAGES: SkillRealm[] = [
  { id: 'beginner', label: '입문', order: 1 },
  { id: 'minor', label: '소성', order: 2 },
  { id: 'major', label: '대성', order: 3 },
  { id: 'perfect', label: '완성', order: 4 },
  { id: 'transcendent', label: '극의', order: 5 },
];

export const SKILL_LEVELS_PER_REALM = 10;
export const SKILL_EXP_PER_LEVEL = 100;
export const SKILL_TRAINING_GAIN = 25;
export const SKILL_TRAINING_GOLD_COST = 100;
