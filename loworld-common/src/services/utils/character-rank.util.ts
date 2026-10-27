import { CharacterImmunity, CharacterRank, CharacterStrongTrait, StoryMonsterEntry, StoryPartyEntry } from '../models/story-sidebar.model';

export const RANK_ORDER: CharacterRank[] = [
  'grandmaster',
  'master',
  'diamond',
  'gold',
  'silver',
  'bronze',
];

export interface RankMeta {
  label: string;
  accent: string;
  bgLight: string;
  iconUrl: string;
}

export const CHARACTER_RANK_META: Record<CharacterRank, RankMeta> = {
  bronze: { label: '브론즈', accent: '#cd7f32', bgLight: 'rgba(205, 127, 50, 0.15)', iconUrl: 'assets/icons/rank/bronze.png' },
  silver: { label: '실버', accent: '#94a3b8', bgLight: 'rgba(148, 163, 184, 0.15)', iconUrl: 'assets/icons/rank/silver.png' },
  gold: { label: '골드', accent: '#eab308', bgLight: 'rgba(234, 179, 8, 0.15)', iconUrl: 'assets/icons/rank/gold.png' },
  diamond: { label: '다이아', accent: '#06b6d4', bgLight: 'rgba(6, 182, 212, 0.15)', iconUrl: 'assets/icons/rank/diamond.png' },
  master: { label: '마스터', accent: '#a855f7', bgLight: 'rgba(168, 85, 247, 0.15)', iconUrl: 'assets/icons/rank/master.png' },
  grandmaster: { label: '그랜드마스터', accent: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.15)', iconUrl: 'assets/icons/rank/grandmaster.png' },
};

export interface ImmunityMeta {
  label: string;
  accent: string;
  icon: string;
}

export const CHARACTER_IMMUNITY_META: Record<CharacterImmunity, ImmunityMeta> = {
  physical: { label: '물리 면역', accent: '#94a3b8', icon: '🛡️' },
  fire: { label: '화염 면역', accent: '#f97316', icon: '🔥' },
  cold: { label: '냉기 면역', accent: '#38bdf8', icon: '❄️' },
  lightning: { label: '번개 면역', accent: '#eab308', icon: '⚡' },
  poison: { label: '독 면역', accent: '#22c55e', icon: '☠️' },
  magic: { label: '마법 면역', accent: '#a855f7', icon: '✨' },
};

export interface StrongTraitMeta {
  label: string;
  description: string;
  accent: string;
}

export const CHARACTER_STRONG_TRAIT_META: Record<CharacterStrongTrait, StrongTraitMeta> = {
  extra_strong: { label: '강함 부여', description: '공격력 및 물리 폭발력 증대', accent: '#dc2626' },
  extra_fast: { label: '신속', description: '이동 및 행동/공격 속도 급증', accent: '#3b82f6' },
  stone_skin: { label: '돌 피부', description: '방어력 및 물리 피해 감소 태세 극대화', accent: '#78716c' },
  magic_resistant: { label: '마법 저항', description: '전 원소/마법 속성 저항력 급증', accent: '#a855f7' },
  cursed: { label: '저주 부여', description: '타격 시 상대에게 피해 증폭 저주', accent: '#b91c1c' },
  aura_enchanted: { label: '오라 강화', description: '주변 아군 능력 강화 및 속성 오라 방출', accent: '#eab308' },
  multishot: { label: '다중 발사', description: '투사체 및 기술 공격 연사 능력', accent: '#06b6d4' },
  teleportation: { label: '순간 이동', description: '위기 발생 시 순간 이동 및 회피율 급증', accent: '#8b5cf6' },
};

export function resolveCharacterRank(entry: {
  rank?: CharacterRank;
  immunities?: CharacterImmunity[];
  strongTraits?: CharacterStrongTrait[];
  id?: string;
  name?: string;
  level?: number;
  threatLevel?: string;
  badge?: string;
}): CharacterRank {
  const totalTraitsCount = (entry.immunities?.length ?? 0) + (entry.strongTraits?.length ?? 0);
  if (totalTraitsCount > 0) {
    if (totalTraitsCount >= 6) return 'grandmaster';
    if (totalTraitsCount === 5) return 'master';
    if (totalTraitsCount === 4) return 'diamond';
    if (totalTraitsCount === 3) return 'gold';
    if (totalTraitsCount === 2) return 'silver';
    return 'bronze';
  }

  if (entry.rank) {
    return entry.rank;
  }
  const threat = entry.threatLevel ?? (entry.badge === '보스' ? 'boss' : entry.badge === '정예' ? 'elite' : undefined);
  const lvl = entry.level ?? 1;

  if (threat === 'boss') {
    return lvl >= 80 ? 'grandmaster' : 'master';
  }
  if (threat === 'elite') {
    return lvl >= 60 ? 'diamond' : 'gold';
  }

  const key = entry.id || entry.name;
  if (key) {
    const hash = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return RANK_ORDER[hash % RANK_ORDER.length];
  }

  if (lvl >= 86) return 'grandmaster';
  if (lvl >= 71) return 'master';
  if (lvl >= 51) return 'diamond';
  if (lvl >= 31) return 'gold';
  if (lvl >= 16) return 'silver';
  return 'bronze';
}

export function resolveCharacterImmunities(entry: {
  immunities?: CharacterImmunity[];
  strongTraits?: CharacterStrongTrait[];
  rank?: CharacterRank;
  id?: string;
  name?: string;
  level?: number;
  threatLevel?: string;
  badge?: string;
}): CharacterImmunity[] {
  const rank = resolveCharacterRank(entry);
  if (rank !== 'master' && rank !== 'grandmaster') {
    return [];
  }
  if (entry.immunities && entry.immunities.length > 0) {
    return entry.immunities;
  }
  return rank === 'grandmaster' ? ['physical', 'fire', 'magic'] : ['fire', 'lightning'];
}

export function resolveCharacterStrongTraits(entry: {
  immunities?: CharacterImmunity[];
  strongTraits?: CharacterStrongTrait[];
  rank?: CharacterRank;
  id?: string;
  name?: string;
  level?: number;
  threatLevel?: string;
  badge?: string;
}): CharacterStrongTrait[] {
  if (entry.strongTraits && entry.strongTraits.length > 0) {
    return entry.strongTraits;
  }
  const rank = resolveCharacterRank(entry);
  switch (rank) {
    case 'bronze':
      return ['extra_fast'];
    case 'silver':
      return ['extra_strong', 'stone_skin'];
    case 'gold':
      return ['extra_strong', 'stone_skin', 'cursed'];
    case 'diamond':
      return ['extra_strong', 'stone_skin', 'magic_resistant', 'teleportation'];
    case 'master':
      return ['extra_strong', 'cursed', 'aura_enchanted'];
    case 'grandmaster':
      return ['extra_strong', 'multishot', 'teleportation'];
  }
}

export function getCharacterRankLabel(rank: CharacterRank): string {
  return CHARACTER_RANK_META[rank]?.label ?? rank;
}

export function getCharacterRankColor(rank: CharacterRank): string {
  return CHARACTER_RANK_META[rank]?.accent ?? '#94a3b8';
}

export function getCharacterRankWeight(rank: CharacterRank): number {
  switch (rank) {
    case 'grandmaster':
      return 6;
    case 'master':
      return 5;
    case 'diamond':
      return 4;
    case 'gold':
      return 3;
    case 'silver':
      return 2;
    case 'bronze':
      return 1;
    default:
      return 0;
  }
}

export function sortEntriesByRank<T extends { rank?: CharacterRank; level?: number; threatLevel?: string; badge?: string }>(
  entries: T[]
): T[] {
  return [...entries].sort((a, b) => {
    const weightA = getCharacterRankWeight(resolveCharacterRank(a));
    const weightB = getCharacterRankWeight(resolveCharacterRank(b));
    if (weightA !== weightB) {
      return weightB - weightA; // 내림차순 (그랜드마스터 -> 브론즈)
    }
    return (b.level ?? 0) - (a.level ?? 0);
  });
}
