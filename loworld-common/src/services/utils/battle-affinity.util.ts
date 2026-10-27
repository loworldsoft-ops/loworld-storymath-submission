import type { AffinityType } from '../models/affinity.model';
import type { Character } from '../models/character.model';
import type { CharacterClass } from '../models/character-base.model';
import type { StoryMonsterEntry, StoryPartyEntry } from '../models/story-sidebar.model';
import { getSkillDefinition } from '../data/skill-catalog.data';
import { resolveSkillElementAffinity } from './skill-affinity.util';

const CLASS_AFFINITY: Partial<Record<CharacterClass, AffinityType>> = {
  warrior: 'fire',
  sorceress: 'fire',
  rogue: 'wind',
  paladin: 'light',
  necromancer: 'dark',
  druid: 'earth',
  assassin: 'dark',
};

const CREATURE_AFFINITY: Record<NonNullable<StoryMonsterEntry['creatureType']>, AffinityType> = {
  undead: 'dark',
  demon: 'dark',
  beast: 'earth',
  elite: 'light',
  'wuxia': 'wind',
  fantasy: 'none',
};

const PARTY_ID_AFFINITY: Record<string, AffinityType> = {
  adel: 'light',
  ella: 'water',
  balthazar: 'earth',
  wanderer: 'fire',
  'party-1': 'fire',
};

export function resolvePartyMemberElementAffinity(
  member: Pick<StoryPartyEntry, 'id' | 'name' | 'role'>,
  characterClass?: CharacterClass,
): AffinityType {
  const idKey = member.id.toLowerCase();
  if (PARTY_ID_AFFINITY[idKey]) {
    return PARTY_ID_AFFINITY[idKey];
  }
  const nameKey = member.name.toLowerCase();
  if (PARTY_ID_AFFINITY[nameKey]) {
    return PARTY_ID_AFFINITY[nameKey];
  }
  const role = member.role.toLowerCase();
  if (role.includes('성기') || role.includes('paladin')) return 'light';
  if (role.includes('강령') || role.includes('necro')) return 'dark';
  if (role.includes('마법') || role.includes('mage') || role.includes('소서')) return 'fire';
  if (role.includes('궁') || role.includes('archer')) return 'wind';
  if (role.includes('수호') || role.includes('방어')) return 'earth';
  if (characterClass && CLASS_AFFINITY[characterClass]) {
    return CLASS_AFFINITY[characterClass]!;
  }
  return 'none';
}

export function resolveMonsterElementAffinity(
  monster: Pick<StoryMonsterEntry, 'id' | 'name' | 'creatureType'>,
): AffinityType {
  if (monster.creatureType && CREATURE_AFFINITY[monster.creatureType]) {
    return CREATURE_AFFINITY[monster.creatureType];
  }
  const name = monster.name.toLowerCase();
  if (name.includes('해골') || name.includes('언데') || name.includes('망령')) return 'dark';
  if (name.includes('슬라') || name.includes('마법')) return 'fire';
  if (name.includes('늑대') || name.includes('야수')) return 'earth';
  return 'none';
}

export function resolveCharacterElementAffinity(
  character: Pick<Character, 'class' | 'skills'>,
  member?: Pick<StoryPartyEntry, 'id' | 'name' | 'role'>,
): AffinityType {
  if (member) {
    return resolvePartyMemberElementAffinity(member, character.class);
  }
  return CLASS_AFFINITY[character.class] ?? 'none';
}

/** 전투 스킬 id → 원소 (카탈로그 조회) */
export function resolveBattleSkillElementAffinity(skillId: string): AffinityType {
  const definition = getSkillDefinition(skillId);
  if (!definition) {
    return 'none';
  }
  return resolveSkillElementAffinity(definition);
}
