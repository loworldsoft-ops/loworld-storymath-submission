import type { Character } from '../models/character.model';
import type { ChronicleEntry } from '../models/chronicle.model';
import type { Inventory } from '../models/inventory.model';
import type { Item } from '../models/item.model';
import { SKILL_EXP_PER_LEVEL, SKILL_LEVELS_PER_REALM, SKILL_REALM_STAGES, SKILL_TRAINING_GAIN, SKILL_TRAINING_GOLD_COST, type CharacterSkill, type SkillDefinition, type SkillRealm, type SkillRealmId } from '../models/skill.model';
import { DEFAULT_SKILL_CATALOG, getSkillDefinition } from '../data/skill-catalog.data';

export function getSkillRealm(realmId: SkillRealmId): SkillRealm {
  return SKILL_REALM_STAGES.find((realm) => realm.id === realmId) ?? SKILL_REALM_STAGES[0];
}

export function getNextSkillRealm(realmId: SkillRealmId): SkillRealm | null {
  const current = getSkillRealm(realmId);
  return SKILL_REALM_STAGES.find((realm) => realm.order === current.order + 1) ?? null;
}

export function isSkillMaxed(skill: CharacterSkill): boolean {
  const realm = getSkillRealm(skill.realmId);
  return realm.order === SKILL_REALM_STAGES.length && skill.level >= SKILL_LEVELS_PER_REALM;
}

export function canAdvanceSkillRealm(skill: CharacterSkill): boolean {
  if (isSkillMaxed(skill)) return false;
  return skill.level >= SKILL_LEVELS_PER_REALM && getNextSkillRealm(skill.realmId) !== null;
}

export function characterHasSkill(character: Character, skillId: string): boolean {
  return (character.skills ?? []).some((entry) => entry.skillId === skillId);
}

export function practiceCharacterSkill(skill: CharacterSkill): {
  skill: CharacterSkill;
  leveledUp: boolean;
  reachedRealmCap: boolean;
} {
  if (isSkillMaxed(skill)) {
    return { skill, leveledUp: false, reachedRealmCap: false };
  }

  if (canAdvanceSkillRealm(skill)) {
    return { skill, leveledUp: false, reachedRealmCap: true };
  }

  let exp = skill.exp + SKILL_TRAINING_GAIN;
  let level = skill.level;
  let leveledUp = false;

  if (exp >= SKILL_EXP_PER_LEVEL) {
    exp = 0;
    level = Math.min(level + 1, SKILL_LEVELS_PER_REALM);
    leveledUp = true;
  }

  return {
    skill: { ...skill, exp, level },
    leveledUp,
    reachedRealmCap: level >= SKILL_LEVELS_PER_REALM && getNextSkillRealm(skill.realmId) !== null,
  };
}

export function advanceCharacterSkillRealm(skill: CharacterSkill): {
  skill: CharacterSkill;
  advanced: boolean;
  previousRealmLabel: string;
  nextRealmLabel: string | null;
} {
  if (!canAdvanceSkillRealm(skill)) {
    return {
      skill,
      advanced: false,
      previousRealmLabel: getSkillRealm(skill.realmId).label,
      nextRealmLabel: null,
    };
  }

  const nextRealm = getNextSkillRealm(skill.realmId)!;
  return {
    skill: { ...skill, realmId: nextRealm.id, level: 1, exp: 0 },
    advanced: true,
    previousRealmLabel: getSkillRealm(skill.realmId).label,
    nextRealmLabel: nextRealm.label,
  };
}

export function createInitialCharacterSkill(skillId: string): CharacterSkill {
  return { skillId, level: 1, realmId: 'beginner', exp: 0 };
}

export function learnSkillFromScroll(
  character: Character,
  scroll: Item,
  catalog: SkillDefinition[] = DEFAULT_SKILL_CATALOG,
): { character: Character; learned: boolean; skillName: string | null } {
  const skillId = scroll.skillRefId;
  if (!skillId || scroll.type !== 'skill_scroll') {
    return { character, learned: false, skillName: null };
  }

  return learnSkillFromCodex(character, skillId, catalog);
}

export function learnSkillFromCodex(
  character: Character,
  skillId: string,
  catalog: SkillDefinition[] = DEFAULT_SKILL_CATALOG,
): { character: Character; learned: boolean; skillName: string | null } {
  if (characterHasSkill(character, skillId)) {
    return {
      character,
      learned: false,
      skillName: getSkillDefinition(skillId, catalog)?.name ?? null,
    };
  }

  const definition = getSkillDefinition(skillId, catalog);
  const skills = [...(character.skills ?? []), createInitialCharacterSkill(skillId)];

  return {
    character: { ...character, skills },
    learned: true,
    skillName: definition?.name ?? skillId,
  };
}

export function removeSkillFromCharacter(
  character: Character,
  skillId: string,
  catalog: SkillDefinition[] = DEFAULT_SKILL_CATALOG,
): { character: Character; removed: boolean; skillName: string | null } {
  if (!characterHasSkill(character, skillId)) {
    return { character, removed: false, skillName: null };
  }

  const definition = getSkillDefinition(skillId, catalog);
  const skills = (character.skills ?? []).filter((entry) => entry.skillId !== skillId);

  return {
    character: { ...character, skills },
    removed: true,
    skillName: definition?.name ?? skillId,
  };
}

export function removeItemFromInventory(inventory: Inventory, itemId: string): Inventory {
  return {
    ...inventory,
    items: inventory.items.filter((item) => item.id !== itemId),
  };
}

export function buildSkillLearnChronicle(skillName: string, skillId: string, source: 'scroll' | 'codex' = 'scroll'): ChronicleEntry {
  const idPrefix = source === 'codex' ? 'skill-codex-learn' : 'skill-learn';
  return {
    id: `${idPrefix}-${skillId}`,
    title: `${skillName} 습득`,
    summary: source === 'codex'
      ? `${skillName}의 입문 경지를 스킬 도감에서 익혔다.`
      : `${skillName}의 입문 경지에 들어섰다.`,
    createdAt: new Date().toISOString(),
    category: 'skill',
  };
}

export function buildSkillRemoveChronicle(skillName: string, skillId: string): ChronicleEntry {
  return {
    id: `skill-remove-${skillId}`,
    title: `${skillName} 망각`,
    summary: `${skillName}의 수련 기록을 떠올리지 못하게 되었다.`,
    createdAt: new Date().toISOString(),
    category: 'skill',
  };
}

export function buildSkillLevelChronicle(skillName: string, skillId: string, level: number): ChronicleEntry {
  return {
    id: `skill-level-${skillId}-${level}`,
    title: `${skillName} Lv.${level} 달성`,
    summary: `${skillName}의 수련이 한층 깊어졌다.`,
    createdAt: new Date().toISOString(),
    category: 'skill',
  };
}

export function buildSkillRealmChronicle(skillName: string, skillId: string, realmLabel: string, realmId: SkillRealmId): ChronicleEntry {
  return {
    id: `skill-realm-${skillId}-${realmId}`,
    title: `${skillName} · ${realmLabel} 경지 돌파`,
    summary: `${skillName}이(가) ${realmLabel}의 경지에 이르렀다.`,
    createdAt: new Date().toISOString(),
    category: 'skill',
  };
}

export function isSkillScrollItem(item: Item | null | undefined): boolean {
  return item?.type === 'skill_scroll' && !!item.skillRefId;
}
