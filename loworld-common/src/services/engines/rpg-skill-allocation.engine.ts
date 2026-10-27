import type { Character } from '../models/character.model';
import type { CharacterClass } from '../models/character-base.model';
import type { RpgSkillRegistryEntry } from '../models/rpg-skill.model';
import { RPG_MAX_CHARACTER_LEVEL, RPG_MAX_SKILL_LEVEL, createRpgSkillPointPool, getRpgSkillPointsAvailable, getRpgSkillPointsSpent, getRpgSkillPointsTotal, type RpgSkillPointPool } from '../models/rpg-skill.model';
import { getRpgSkillById, getRpgSkillRegistry } from '../data/rpg-skill-loader.util';
import { resolveProtagonistClassId } from '../utils/protagonist-class.util';

export type RpgSkillAllocations = Record<string, number>;

export interface RpgSkillAllocationBlockReason {
  code:
    | 'unknown-skill'
    | 'wrong-class'
    | 'max-level'
    | 'no-points'
    | 'req-level'
    | 'missing-prerequisite'
    | 'would-break-dependent';
  message: string;
}

export function getRpgSkillAllocationsFromCharacter(
  character: Character,
): RpgSkillAllocations {
  const map: RpgSkillAllocations = {};
  for (const entry of character.skills ?? []) {
    if (entry.level > 0) {
      map[entry.skillId] = entry.level;
    }
  }
  return map;
}

export function getRpgSkillHardLevel(
  allocations: RpgSkillAllocations,
  skillId: string,
): number {
  return allocations[skillId] ?? 0;
}

export function resolveRpgSkillEntry(skillId: string): RpgSkillRegistryEntry | undefined {
  return getRpgSkillById(skillId);
}

export function getRpgSkillsForClass(
  classId: Character['class'] | string,
  registry: readonly RpgSkillRegistryEntry[] = getRpgSkillRegistry(),
): RpgSkillRegistryEntry[] {
  const targetClass = resolveProtagonistClassId(classId, 'warrior');
  return registry.filter((entry) => entry.discipline === targetClass);
}

function dependentSkillIds(skillId: string): string[] {
  return getRpgSkillRegistry()
    .filter((entry) => entry.prerequisites.includes(skillId))
    .map((entry) => entry.id);
}

export function canAllocateRpgSkillPoint(
  character: Character,
  skillId: string,
  pool: RpgSkillPointPool,
  allocations: RpgSkillAllocations = getRpgSkillAllocationsFromCharacter(character),
): { ok: true } | { ok: false; reason: RpgSkillAllocationBlockReason } {
  const entry = resolveRpgSkillEntry(skillId);
  if (!entry) {
    return { ok: false, reason: { code: 'unknown-skill', message: '알 수 없는 스킬입니다.' } };
  }

  const current = getRpgSkillHardLevel(allocations, skillId);
  if (current >= entry.maxLevel || current >= RPG_MAX_SKILL_LEVEL) {
    return { ok: false, reason: { code: 'max-level', message: '스킬 최대 레벨(20)입니다.' } };
  }

  return { ok: true };
}

export function canDeallocateRpgSkillPoint(
  skillId: string,
  allocations: RpgSkillAllocations,
): { ok: true } | { ok: false; reason: RpgSkillAllocationBlockReason } {
  const entry = resolveRpgSkillEntry(skillId);
  if (!entry) {
    return { ok: false, reason: { code: 'unknown-skill', message: '알 수 없는 스킬입니다.' } };
  }

  const current = getRpgSkillHardLevel(allocations, skillId);
  if (current <= 0) {
    return { ok: false, reason: { code: 'max-level', message: '투자된 포인트가 없습니다.' } };
  }

  return { ok: true };
}

export function allocateRpgSkillPoint(
  character: Character,
  skillId: string,
  pool: RpgSkillPointPool = createRpgSkillPointPool(character.level),
): { character: Character; allocations: RpgSkillAllocations } | null {
  const entry = resolveRpgSkillEntry(skillId);
  if (!entry) return null;

  const currentAllocations = getRpgSkillAllocationsFromCharacter(character);
  const currentLevel = currentAllocations[skillId] ?? 0;
  if (currentLevel >= (entry.maxLevel || RPG_MAX_SKILL_LEVEL)) {
    return null;
  }

  const requiredPrereqs: string[] = [];
  function collectPrereqs(id: string) {
    const item = resolveRpgSkillEntry(id);
    if (!item) return;
    for (const prereqId of item.prerequisites) {
      if (!requiredPrereqs.includes(prereqId)) {
        requiredPrereqs.push(prereqId);
        collectPrereqs(prereqId);
      }
    }
  }
  collectPrereqs(skillId);

  const skills = [...(character.skills ?? [])];

  for (const prereqId of requiredPrereqs) {
    const existingIndex = skills.findIndex((s) => s.skillId === prereqId);
    if (existingIndex < 0 || skills[existingIndex].level < 1) {
      const newEntry = { skillId: prereqId, level: 1, realmId: 'beginner' as const, exp: 0 };
      if (existingIndex >= 0) skills[existingIndex] = newEntry;
      else skills.push(newEntry);
    }
  }

  const nextLevel = currentLevel + 1;
  const targetIndex = skills.findIndex((s) => s.skillId === skillId);
  const targetEntry = { skillId, level: nextLevel, realmId: 'beginner' as const, exp: 0 };
  if (targetIndex >= 0) {
    skills[targetIndex] = targetEntry;
  } else {
    skills.push(targetEntry);
  }

  const nextCharacter = { ...character, skills };
  const allocations = getRpgSkillAllocationsFromCharacter(nextCharacter);
  return { character: nextCharacter, allocations };
}

export function deallocateRpgSkillPoint(
  character: Character,
  skillId: string,
): { character: Character; allocations: RpgSkillAllocations } | null {
  const allocations = { ...getRpgSkillAllocationsFromCharacter(character) };
  const check = canDeallocateRpgSkillPoint(skillId, allocations);
  if (!check.ok) return null;

  const nextLevel = (allocations[skillId] ?? 0) - 1;
  if (nextLevel <= 0) {
    delete allocations[skillId];
  } else {
    allocations[skillId] = nextLevel;
  }

  const skills = (character.skills ?? []).filter((s) => s.skillId !== skillId || nextLevel > 0);
  const index = skills.findIndex((s) => s.skillId === skillId);
  if (nextLevel > 0) {
    const nextEntry = { skillId, level: nextLevel, realmId: 'beginner' as const, exp: 0 };
    if (index >= 0) skills[index] = nextEntry;
    else skills.push(nextEntry);
  }

  return { character: { ...character, skills }, allocations };
}

export function masterAllRpgSkills(character: Character): Character {
  const classSkills = getRpgSkillsForClass(character.class);
  const skills = classSkills.map((entry) => ({
    skillId: entry.id,
    level: entry.maxLevel || RPG_MAX_SKILL_LEVEL,
    realmId: 'transcendent' as const,
    exp: 0,
  }));

  return {
    ...character,
    skills,
  };
}

export function resetAllRpgSkills(character: Character): Character {
  return {
    ...character,
    skills: [],
  };
}

function pickSkillToTrimForBudget(
  allocations: RpgSkillAllocations,
): string | null {
  const invested = Object.entries(allocations).filter(([, level]) => level > 0);
  if (invested.length === 0) return null;

  invested.sort(([idA, levelA], [idB, levelB]) => {
    const entryA = getRpgSkillById(idA);
    const entryB = getRpgSkillById(idB);
    const reqDiff = (entryB?.reqlevel ?? 0) - (entryA?.reqlevel ?? 0);
    if (reqDiff !== 0) return reqDiff;
    return levelB - levelA;
  });

  return invested[0]?.[0] ?? null;
}

/** 직업 변경 — 타 직업 스킬 투자분 제거 */
export function changeRpgSkillCharacterClass(
  character: Character,
  classId: CharacterClass,
): Character {
  if (character.class === classId) {
    return character;
  }

  const allowed = new Set(getRpgSkillsForClass(classId).map((entry) => entry.id));
  return {
    ...character,
    class: classId,
    skills: (character.skills ?? []).filter((entry) => allowed.has(entry.skillId)),
  };
}

/** 레벨 변경 — 범위 클램프, 포인트 초과 시 고티어 스킬부터 자동 회수 */
export function changeRpgSkillCharacterLevel(
  character: Character,
  level: number,
  questBonus = 0,
): Character {
  const clamped = Math.max(1, Math.min(RPG_MAX_CHARACTER_LEVEL, Math.floor(level)));
  let next: Character = { ...character, level: clamped };
  const pool = createRpgSkillPointPool(clamped, questBonus);

  while (getRpgSkillPointsSpent(getRpgSkillAllocationsFromCharacter(next)) > getRpgSkillPointsTotal(pool)) {
    const skillId = pickSkillToTrimForBudget(getRpgSkillAllocationsFromCharacter(next));
    if (!skillId) break;
    const result = deallocateRpgSkillPoint(next, skillId);
    if (!result) break;
    next = result.character;
  }

  return next;
}

export function buildRpgSkillPointSummary(
  character: Character,
  questBonus = 0,
): {
  pool: RpgSkillPointPool;
  total: number;
  spent: number;
  available: number;
} {
  const pool = createRpgSkillPointPool(character.level, questBonus);
  const allocations = getRpgSkillAllocationsFromCharacter(character);
  const spent = getRpgSkillPointsSpent(allocations);
  return {
    pool,
    total: pool.fromLevel + pool.fromQuests,
    spent,
    available: getRpgSkillPointsAvailable(pool, allocations),
  };
}

export function getRpgSynergyBonusPercent(
  target: RpgSkillRegistryEntry,
  allocations: RpgSkillAllocations,
): number {
  return target.synergies.reduce((sum, syn) => {
    const sourceLevel = allocations[syn.sourceId] ?? 0;
    return sum + sourceLevel * (syn.bonusPerLevel ?? 0);
  }, 0);
}
