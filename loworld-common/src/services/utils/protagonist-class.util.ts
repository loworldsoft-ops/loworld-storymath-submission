import type { CharacterClass } from '../models/character-base.model';

export interface ProtagonistRpgClassPreset {
  id: CharacterClass;
  label: string;
  emoji: string;
  description: string;
  weaponHint: string;
}

/** full-mode 주인공 직업 피커 — Diablo II 7클래스 (LoD 포함) */
export const PROTAGONIST_RPG_CLASS_PRESETS: readonly ProtagonistRpgClassPreset[] = [
  {
    id: 'warrior',
    label: '야만용사',
    emoji: '🪓',
    description: '압도적인 체력과 근접 공격. 최전선에서 적을 pulverize한다.',
    weaponHint: '양손 도끼 · 검',
  },
  {
    id: 'sorceress',
    label: '원소술사',
    emoji: '🔥',
    description: '불·번개·얼음 원소 마법으로 전장을 지배한다.',
    weaponHint: '지팡이 · 보주',
  },
  {
    id: 'rogue',
    label: '아마존',
    emoji: '🏹',
    description: '활·투창 원거리 공격과 빠른 기동으로 적을 견제한다.',
    weaponHint: '활 · 창',
  },
  {
    id: 'paladin',
    label: '성기사',
    emoji: '🛡️',
    description: '성역 오라와 방패로 아군을 보호하고 정의를 수행한다.',
    weaponHint: '방패 · 성역',
  },
  {
    id: 'necromancer',
    label: '강령술사',
    emoji: '💀',
    description: '저주·독·언데드 소환으로 적의 전열을 붕괴시킨다.',
    weaponHint: '두개골 · 저주',
  },
  {
    id: 'druid',
    label: '드루이드',
    emoji: '🌿',
    description: '변신·소환·자연 마법으로 전장의 흐름을 바꾼다.',
    weaponHint: '둔기 · 지팡이',
  },
  {
    id: 'assassin',
    label: '암살자',
    emoji: '🗡️',
    description: '함정·무투·트랩으로 적의 약점을 정확히 찌른다.',
    weaponHint: '클로 · 단검',
  },
] as const;

export function findProtagonistRpgClassPreset(
  classId: CharacterClass | null | undefined,
): ProtagonistRpgClassPreset | undefined {
  if (!classId) {
    return undefined;
  }
  return PROTAGONIST_RPG_CLASS_PRESETS.find((entry) => entry.id === classId);
}

export function resolveProtagonistClassId(
  selectedClassId: string | null | undefined,
  fallback: CharacterClass,
): CharacterClass {
  if (!selectedClassId) {
    return fallback;
  }
  const normalized = selectedClassId.trim().toLowerCase();
  const aliasMap: Record<string, CharacterClass> = {
    barbarian: 'warrior',
    amazon: 'rogue',
    야만용사: 'warrior',
    아마존: 'rogue',
    원소술사: 'sorceress',
    강령술사: 'necromancer',
    성기사: 'paladin',
    드루이드: 'druid',
    암살자: 'assassin',
    // 🌸 무협 6대 문파 표준 정규화 매핑
    'hwashan-sword': 'hwashan-sword' as CharacterClass,
    'hwashan-swordsman': 'hwashan-sword' as CharacterClass,
    'hwashan_sword': 'hwashan-sword' as CharacterClass,
    'hwashan': 'hwashan-sword' as CharacterClass,
    '화산파': 'hwashan-sword' as CharacterClass,
    '화산': 'hwashan-sword' as CharacterClass,
    '화산파 (화산파)': 'hwashan-sword' as CharacterClass,
    '화산파 (華山派)': 'hwashan-sword' as CharacterClass,
    '화산파 검수': 'hwashan-sword' as CharacterClass,

    'shaolin-monk': 'shaolin-monk' as CharacterClass,
    'shaolin_monk': 'shaolin-monk' as CharacterClass,
    'shaolin': 'shaolin-monk' as CharacterClass,
    '소림사': 'shaolin-monk' as CharacterClass,
    '소림': 'shaolin-monk' as CharacterClass,
    '소림사 (소림사)': 'shaolin-monk' as CharacterClass,
    '소림사 (少林寺)': 'shaolin-monk' as CharacterClass,
    '소림사 권승': 'shaolin-monk' as CharacterClass,

    'dangmun-ranger': 'dangmun-ranger' as CharacterClass,
    'dangmun_ranger': 'dangmun-ranger' as CharacterClass,
    'dangmun': 'dangmun-ranger' as CharacterClass,
    '사천당가': 'dangmun-ranger' as CharacterClass,
    '사천당가 (사천당가)': 'dangmun-ranger' as CharacterClass,
    '사천당가 (四川唐門)': 'dangmun-ranger' as CharacterClass,
    '당가': 'dangmun-ranger' as CharacterClass,
    '당문': 'dangmun-ranger' as CharacterClass,
    '당문 암기사': 'dangmun-ranger' as CharacterClass,
    'tang-assassin': 'dangmun-ranger' as CharacterClass,

    'cult-berserker': 'cult-berserker' as CharacterClass,
    'cult_berserker': 'cult-berserker' as CharacterClass,
    'cult': 'cult-berserker' as CharacterClass,
    '천마신교': 'cult-berserker' as CharacterClass,
    '천마신교 (마교)': 'cult-berserker' as CharacterClass,
    '천마신교 (天魔神敎)': 'cult-berserker' as CharacterClass,
    '마교': 'cult-berserker' as CharacterClass,
    '마교 광전사': 'cult-berserker' as CharacterClass,
    'demonic-berserker': 'cult-berserker' as CharacterClass,

    'wudang-taoist': 'wudang-taoist' as CharacterClass,
    'wudang_taoist': 'wudang-taoist' as CharacterClass,
    'wudang': 'wudang-taoist' as CharacterClass,
    '무당파': 'wudang-taoist' as CharacterClass,
    '무당': 'wudang-taoist' as CharacterClass,
    '무당파 (무당파)': 'wudang-taoist' as CharacterClass,
    '무당파 (武當派)': 'wudang-taoist' as CharacterClass,
    '무당파 도사': 'wudang-taoist' as CharacterClass,

    'namgung-spear': 'namgung-spear' as CharacterClass,
    'namgung_spear': 'namgung-spear' as CharacterClass,
    'namgung': 'namgung-spear' as CharacterClass,
    '남궁세가': 'namgung-spear' as CharacterClass,
    '남궁': 'namgung-spear' as CharacterClass,
    '남궁세가 (남궁세가)': 'namgung-spear' as CharacterClass,
    '남궁세가 (南宮世家)': 'namgung-spear' as CharacterClass,
    '남궁세가 창술사': 'namgung-spear' as CharacterClass,
  };
  const mapped = aliasMap[normalized] || aliasMap[selectedClassId];
  if (mapped) {
    return mapped;
  }
  if (PROTAGONIST_RPG_CLASS_PRESETS.some((entry) => entry.id === (selectedClassId as CharacterClass))) {
    return selectedClassId as CharacterClass;
  }
  // 🛡️ 다장르 소설별 직업(예: wuxia의 hwashan-sword, shaolin-monk 등)은 fallback으로 강제 변환하지 않고 원본 유지
  return (selectedClassId as CharacterClass) || fallback;
}

