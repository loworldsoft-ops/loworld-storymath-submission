import type { Character, CharacterStats } from '../models/character.model';
import type { CharacterClass } from '../models/character-base.model';
import type { CharacterSkill } from '../models/skill.model';
import type { StoryPartyEntry } from '../models/story-sidebar.model';

/** 파티 역할 문자열 → 캐릭터 클래스 추정 */
export function inferCharacterClassFromRole(role: string): CharacterClass {
  const normalized = role.toLowerCase();
  if (normalized.includes('마법') || normalized.includes('mage') || normalized.includes('sorcer')) {
    return 'sorceress';
  }
  if (normalized.includes('드루') || normalized.includes('druid')) {
    return 'druid';
  }
  if (normalized.includes('암살') || normalized.includes('assassin')) {
    return 'assassin';
  }
  if (normalized.includes('도적') || normalized.includes('rogue') || normalized.includes('정찰')) {
    return 'rogue';
  }
  if (normalized.includes('성기') || normalized.includes('paladin')) {
    return 'paladin';
  }
  if (normalized.includes('강령') || normalized.includes('necro')) {
    return 'necromancer';
  }
  return 'warrior';
}

/** 레벨·역할 기반 HP/MP 추정 — 전투 샌드박스와 동일 휴리스틱 */
export function estimateTrainingCharacterStats(
  member: StoryPartyEntry,
): Pick<CharacterStats, 'life' | 'maxLife' | 'mana' | 'maxMana'> {
  const role = member.role.toLowerCase();
  const isMage = role.includes('마법') || role.includes('mage') || role.includes('지원');
  const isRogue = role.includes('도적') || role.includes('rogue') || role.includes('정찰');

  let maxLife = member.level * 14 + 30;
  let maxMana = member.level * 6 + 20;

  if (isMage) {
    maxLife = member.level * 8 + 24;
    maxMana = member.level * 14 + 40;
  } else if (isRogue) {
    maxLife = member.level * 10 + 28;
    maxMana = member.level * 8 + 24;
  }

  return { life: maxLife, maxLife, mana: maxMana, maxMana };
}

/** 샌드박스 파티 멤버 → 수련용 Character 스냅샷 */
export function buildTrainingCharacterFromPartyEntry(
  member: StoryPartyEntry,
  template: Character,
  skills: CharacterSkill[] = [],
): Character {
  const vitalityStats = estimateTrainingCharacterStats(member);

  return {
    id: member.id,
    name: member.name,
    class: inferCharacterClassFromRole(member.role),
    level: member.level,
    equipment: { ...template.equipment },
    inventory: template.inventory,
    stats: {
      ...template.stats,
      ...vitalityStats,
    },
    skills: [...skills],
    personality: member.personality,
  };
}

/** 주인공과 동일 인물인지 (ID 또는 이름 일치) */
export function isSameTraineeAsHero(member: StoryPartyEntry, hero: Character): boolean {
  return member.id === hero.id || member.name === hero.name;
}

/** localStorage에 저장된 스킬·장비·전투 로드아웃 진행을 캐논 맵 위에 병합 */
export function mergeTrainingCharacterMap(
  base: Record<string, Character>,
  saved: Record<string, Pick<Character, 'id' | 'skills' | 'level' | 'stats'> & { equipment?: Character['equipment'] }>,
): Record<string, Character> {
  const merged: Record<string, Character> = { ...base };

  for (const [id, patch] of Object.entries(saved)) {
    const current = merged[id];
    if (!current) {
      continue;
    }

    merged[id] = {
      ...current,
      level: patch.level ?? current.level,
      skills: patch.skills ?? current.skills,
      stats: {
        ...current.stats,
        ...patch.stats,
      },
      equipment: patch.equipment ?? current.equipment,
    };
  }

  return merged;
}

/** 파티 로스터 → 수련 캐릭터 맵 초기화 */
export function buildTrainingCharacterMap(
  roster: StoryPartyEntry[],
  hero: Character,
): Record<string, Character> {
  const map: Record<string, Character> = {};

  for (const member of roster) {
    const initialSkills = isSameTraineeAsHero(member, hero) ? [...(hero.skills ?? [])] : [];
    map[member.id] = buildTrainingCharacterFromPartyEntry(member, hero, initialSkills);
  }

  return map;
}
