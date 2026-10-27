import type { AffinityType } from './affinity.model';
import type { CharacterClass } from './character-base.model';

export type SkillType = 'physical' | 'magic' | 'support';

export type RpgSkillKind =
  | 'active'
  | 'passive'
  | 'aura'
  | 'summon'
  | 'charge-up'
  | 'finisher'
  | 'corpse';

export type RpgSynergyKind = 'physical' | 'elemental' | 'duration';

export interface RpgSkillSynergy {
  sourceId: string;
  sourceRpgName: string;
  bonusPerLevel: number | null;
  kind: RpgSynergyKind;
}

/** blizzhackers/d2data — 7 LoD classes × 30 skills */
export interface RpgSkillRegistryEntry {
  id: string;
  rpgName: string;
  nameKo: string;
  descriptionKo: string;
  charclass: string;
  discipline: CharacterClass;
  treePage: number;
  treeRow: number;
  treeColumn: number;
  treeLabelEn: string;
  treeLabelKo: string;
  reqlevel: number;
  maxLevel: number;
  prerequisites: string[];
  prerequisiteRpgNames: string[];
  synergies: RpgSkillSynergy[];
  kind: RpgSkillKind;
  type: SkillType;
  elementAffinity?: AffinityType;
  manaLevel1: number;
  manaLevel20: number;
  /** novel-skill icon lookup — may differ from id for legacy 28 PNGs */
  iconId: string;
}

/** D2R hard point pool — Lv99 + 3난이도 스킬 퀘스트 = 110 */
export interface RpgSkillPointPool {
  /** character.level - 1 */
  fromLevel: number;
  /** Den + Radament + Izual × 3 difficulties (0–9) */
  fromQuests: number;
}

export const RPG_MAX_CHARACTER_LEVEL = 99;
export const RPG_MAX_SKILL_LEVEL = 20;
export const RPG_MAX_SKILL_POINTS_AT_99 = 110;
export const RPG_DEFAULT_SANDBOX_SKILL_POINTS = 600;
export const RPG_SKILL_QUEST_BONUS_PER_DIFFICULTY = 3;
export const RPG_SKILL_QUEST_COUNT = 3;

export function createRpgSkillPointPool(
  characterLevel: number,
  questBonus = RPG_DEFAULT_SANDBOX_SKILL_POINTS,
): RpgSkillPointPool {
  return {
    fromLevel: Math.max(0, characterLevel - 1),
    fromQuests: Math.max(0, questBonus),
  };
}

export function getRpgSkillPointsTotal(pool: RpgSkillPointPool): number {
  return pool.fromLevel + pool.fromQuests;
}

export function getRpgSkillPointsSpent(
  allocations: Readonly<Record<string, number>> | undefined,
): number {
  if (!allocations) return 0;
  return Object.values(allocations).reduce((sum, n) => sum + (n ?? 0), 0);
}

export function getRpgSkillPointsAvailable(
  pool: RpgSkillPointPool,
  allocations: Readonly<Record<string, number>> | undefined,
): number {
  return getRpgSkillPointsTotal(pool) - getRpgSkillPointsSpent(allocations);
}
