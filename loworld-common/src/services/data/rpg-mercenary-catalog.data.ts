import type { RpgMercenaryFamilyDefinition, RpgMercenaryVariantDefinition } from '../models/rpg-mercenary.model';

export const RPG_MERCENARY_FAMILIES: readonly RpgMercenaryFamilyDefinition[] = [
  {
    id: 'rogue_scout',
    labelKo: '로그 스카우트',
    weaponTypeKo: '활 · 아마존 보우',
    defaultTownTier: 1,
    namePool: ['알리스', '에린', '모이라', '실비아', '테resa'],
    rpgClassKey: 'amazon',
    heroGender: 'female',
  },
  {
    id: 'desert_mercenary',
    labelKo: '사막 용병',
    weaponTypeKo: '창 · 폴암 · 투창',
    defaultTownTier: 2,
    namePool: ['제피르', '하산', 'Jamal', '카림', '라시드', '오마르'],
    rpgClassKey: 'paladin',
    heroGender: 'male',
  },
  {
    id: 'iron_wolf',
    labelKo: '강철 늑대',
    weaponTypeKo: '한손검 + 방패',
    defaultTownTier: 3,
    namePool: ['브록', '드레이크', '가렌', '롤란', '톰'],
    rpgClassKey: 'sorceress',
    heroGender: 'male',
  },
  {
    id: 'barbarian',
    labelKo: '야만용병',
    weaponTypeKo: '한손 / 쌍수',
    defaultTownTier: 5,
    namePool: ['바르', '울프', 'Grim', '톨', 'Ulric'],
    rpgClassKey: 'barbarian',
    heroGender: 'male',
  },
] as const;

export const RPG_MERCENARY_VARIANTS: readonly RpgMercenaryVariantDefinition[] = [
  // rogue_scout
  {
    id: 'rogue_cold_arrow',
    familyId: 'rogue_scout',
    labelKo: '냉기 사격',
    auraId: 'cold_arrow',
    auraNameKo: 'Cold Arrow',
    auraDescriptionKo: '냉기 원소 피해를 추가하는 화살.',
    difficultyGate: 'all',
  },
  {
    id: 'rogue_fire_arrow',
    familyId: 'rogue_scout',
    labelKo: '화염 사격',
    auraId: 'fire_arrow',
    auraNameKo: 'Fire Arrow',
    auraDescriptionKo: '화염 원소 피해를 추가하는 화살.',
    difficultyGate: 'all',
  },
  {
    id: 'rogue_inner_sight',
    familyId: 'rogue_scout',
    labelKo: '내면의 시야',
    auraId: 'inner_sight',
    auraNameKo: 'Inner Sight',
    auraDescriptionKo: '적 방어력을 감소시키는 오라.',
    difficultyGate: 'all',
  },
  // desert_mercenary — Normal 3종
  {
    id: 'desert_combat_prayer',
    familyId: 'desert_mercenary',
    labelKo: '전투 · 기도',
    auraId: 'prayer',
    auraNameKo: 'Prayer',
    auraDescriptionKo: '파티 체력을 서서히 회복.',
    difficultyGate: 'all',
  },
  {
    id: 'desert_defensive_defiance',
    familyId: 'desert_mercenary',
    labelKo: '방어 · 저항',
    auraId: 'defiance',
    auraNameKo: 'Defiance',
    auraDescriptionKo: '물리 피해 저항 오라.',
    difficultyGate: 'all',
  },
  {
    id: 'desert_offensive_blessed_aim',
    familyId: 'desert_mercenary',
    labelKo: '공격 · 축복된 조준',
    auraId: 'blessed_aim',
    auraNameKo: 'Blessed Aim',
    auraDescriptionKo: '파티 명중률 증가.',
    difficultyGate: 'all',
  },
  // desert_mercenary — NM/Hell 추가 3종
  {
    id: 'desert_combat_thorns',
    familyId: 'desert_mercenary',
    labelKo: '전투 · 가시',
    auraId: 'thorns',
    auraNameKo: 'Thorns',
    auraDescriptionKo: '근접 공격자에게 반사 피해.',
    difficultyGate: 'nightmare_hell',
  },
  {
    id: 'desert_defensive_holy_freeze',
    familyId: 'desert_mercenary',
    labelKo: '방어 · 신성한 동결',
    auraId: 'holy_freeze',
    auraNameKo: 'Holy Freeze',
    auraDescriptionKo: '적 이동·공격 속도 감소.',
    difficultyGate: 'nightmare_hell',
  },
  {
    id: 'desert_offensive_might',
    familyId: 'desert_mercenary',
    labelKo: '공격 · 힘',
    auraId: 'might',
    auraNameKo: 'Might',
    auraDescriptionKo: '물리 피해 증폭 — Insight/Infinity 메타.',
    difficultyGate: 'nightmare_hell',
  },
  // iron_wolf
  {
    id: 'iron_wolf_frost',
    familyId: 'iron_wolf',
    labelKo: '서리',
    auraId: 'frost',
    auraNameKo: 'Frost',
    auraDescriptionKo: '냉기 마법 공격.',
    difficultyGate: 'all',
  },
  {
    id: 'iron_wolf_fire',
    familyId: 'iron_wolf',
    labelKo: '화염',
    auraId: 'fire',
    auraNameKo: 'Fire',
    auraDescriptionKo: '화염 마법 공격.',
    difficultyGate: 'all',
  },
  {
    id: 'iron_wolf_lightning',
    familyId: 'iron_wolf',
    labelKo: '번개',
    auraId: 'lightning',
    auraNameKo: 'Lightning',
    auraDescriptionKo: '번개 마법 공격.',
    difficultyGate: 'all',
  },
  // barbarian
  {
    id: 'barbarian_bash',
    familyId: 'barbarian',
    labelKo: '강타',
    auraId: 'bash',
    auraNameKo: 'Bash',
    auraDescriptionKo: '기절 가능 근접 공격.',
    difficultyGate: 'all',
  },
  {
    id: 'barbarian_stun',
    familyId: 'barbarian',
    labelKo: '기절',
    auraId: 'stun',
    auraNameKo: 'Stun',
    auraDescriptionKo: '적 기절 특화.',
    difficultyGate: 'all',
  },
  {
    id: 'barbarian_frenzy',
    familyId: 'barbarian',
    labelKo: '광란 (쌍수)',
    auraId: 'frenzy',
    auraNameKo: 'Frenzy',
    auraDescriptionKo: 'Patch 2.4 — 쌍수 공격.',
    difficultyGate: 'all',
  },
] as const;

const FAMILY_BY_ID = new Map(RPG_MERCENARY_FAMILIES.map((f) => [f.id, f] as const));

export function findRpgMercenaryFamily(familyId: string): RpgMercenaryFamilyDefinition | undefined {
  return FAMILY_BY_ID.get(familyId as RpgMercenaryFamilyDefinition['id']);
}

export function listRpgMercenaryVariantsForFamily(familyId: string): RpgMercenaryVariantDefinition[] {
  return RPG_MERCENARY_VARIANTS.filter((v) => v.familyId === familyId);
}
