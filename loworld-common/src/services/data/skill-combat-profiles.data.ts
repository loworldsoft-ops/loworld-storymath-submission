import type { SkillCombatProfile } from '../models/skill.model';

export const SKILL_COMBAT_PROFILES: Record<string, SkillCombatProfile> = {
  // ── 전사 ──
  'sword-wind': {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 10,
    baseMax: 16,
    powerPerLevel: 2,
    applicationDetail:
      '시전자 주변 회오리 범위 내 모든 적에게 물리 피해. 아군·소환수·본인에게는 적용되지 않는다.',
  },
  'mighty-blow': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 14,
    baseMax: 22,
    powerPerLevel: 2.5,
    applicationDetail:
      '지정한 적 1명에게 강타 피해와 기절. 아군·본인에게는 적용되지 않는다.',
  },
  'leap-strike': {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 12,
    baseMax: 18,
    powerPerLevel: 2,
    applicationDetail:
      '착지 지점 반경 내 모든 적에게 충격 피해. 비행·도약 중에는 본인만 이동하며, 아군에게는 피해 없음.',
  },
  'iron-wall': {
    effectKind: 'buff',
    targetScope: 'self',
    targetSide: 'self',
    effectPotencyLabel: '받는 피해 감소',
    effectPotencyBase: 8,
    effectPotencyPerLevel: 1,
    applicationDetail:
      '시전자 본인만 방어 버프. 아군·적군에게는 전달되지 않으며, 지속 중 받는 피해만 감소한다.',
  },

  // ── 마법사 ──
  fireball: {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 16,
    baseMax: 24,
    powerPerLevel: 3,
    applicationDetail:
      '지정한 적 1명에게 화염 마법 피해. 아군·본인에게는 적용되지 않는다.',
  },
  'frost-nova': {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 8,
    baseMax: 14,
    powerPerLevel: 2,
    applicationDetail:
      '시전자 중심 광역의 모든 적에게 서리 피해와 이동 둔화(디버프). 아군·본인에게는 피해·둔화 없음.',
  },
  'chain-lightning': {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 12,
    baseMax: 18,
    powerPerLevel: 2.5,
    applicationDetail:
      '최초 적 1명에서 시작해 인접 적에게 연쇄 타격(최대 다수). 아군·본인에게는 번개가 튕기지 않는다.',
  },
  meteor: {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 18,
    baseMax: 28,
    powerPerLevel: 3,
    applicationDetail:
      '지정 지역 대규모 광역의 모든 적에게 화염·충격 피해. 아군이 해당 지역에 있어도 피해를 받지 않는다.',
  },

  // ── 궁수 ──
  'magic-arrow': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 13,
    baseMax: 19,
    powerPerLevel: 2,
    applicationDetail:
      '지정한 적 1명에게 마력 화살 피해(방어 일부 무시). 아군·본인에게는 적용되지 않는다.',
  },
  multishot: {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 9,
    baseMax: 15,
    powerPerLevel: 1.5,
    applicationDetail:
      '부채꼴 광역 내 모든 적에게 다발 화살 피해. 아군·본인에게는 적용되지 않는다.',
  },
  'guided-arrow': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 15,
    baseMax: 21,
    powerPerLevel: 2.5,
    applicationDetail:
      '추적 화살로 지정 적 1명에게 피해. 아군·본인에게는 적용되지 않는다.',
  },
  strafe: {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 7,
    baseMax: 12,
    powerPerLevel: 1.5,
    applicationDetail:
      '이동하며 사거리 내 여러 적에게 연속 사격. 아군·본인에게는 적용되지 않는다.',
  },

  // ── 객사 ──
  'raise-skeleton': {
    effectKind: 'summon',
    targetScope: 'self',
    targetSide: 'ally',
    effectPotencyLabel: '소환 해골 체력',
    effectPotencyBase: 40,
    effectPotencyPerLevel: 5,
    applicationDetail:
      '시전자 주변에 아군 해골 병사를 소환. 소환수는 적을 공격하며 아군·본인에게 피해를 주지 않는다.',
  },
  'bone-spear': {
    effectKind: 'damage',
    targetScope: 'line',
    targetSide: 'enemy',
    baseMin: 14,
    baseMax: 20,
    powerPerLevel: 2.5,
    applicationDetail:
      '직선 경로상 모든 적에게 관통 마법 피해. 아군·본인에게는 적용되지 않는다.',
  },
  'corpse-explosion': {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 20,
    baseMax: 30,
    powerPerLevel: 3,
    applicationDetail:
      '시체 위치 반경 내 모든 적에게 폭발 피해. 시체·아군·본인에게는 피해 없음(시체 소모).',
  },
  'bone-armor': {
    effectKind: 'buff',
    targetScope: 'self',
    targetSide: 'self',
    effectPotencyLabel: '피해 흡수량',
    effectPotencyBase: 30,
    effectPotencyPerLevel: 4,
    applicationDetail:
      '시전자 본인만 뼈 방어막. 흡수량 소진 전까지 받는 피해를 줄이며, 아군·적군에게는 전달되지 않는다.',
  },

  // ── 성기사 ──
  'holy-bolt': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 14,
    baseMax: 22,
    powerPerLevel: 3,
    applicationDetail:
      '지정한 적 1명에게 성스러운 피해. 언데드에게 추가 피해. 아군·본인에게는 적용되지 않는다.',
  },
  zeal: {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 18,
    baseMax: 30,
    powerPerLevel: 3,
    applicationDetail:
      '지정한 적 1명에게 연속 타격(복수 히트 합산). 아군·본인에게는 적용되지 않는다.',
  },
  'blessed-hammer': {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 10,
    baseMax: 16,
    powerPerLevel: 2,
    applicationDetail:
      '회전하는 망치 궤도 범위 내 모든 적에게 마법 피해. 아군·본인에게는 적용되지 않는다.',
  },
  sacrifice: {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 22,
    baseMax: 32,
    powerPerLevel: 3.5,
    applicationDetail:
      '시전자 본인 체력 일부를 소모해 지정 적 1명에게 강력한 피해. 아군에게는 피해 없음.',
  },

  // ── 드루이드 ──
  tornado: {
    effectKind: 'damage',
    targetScope: 'line',
    targetSide: 'enemy',
    baseMin: 11,
    baseMax: 17,
    powerPerLevel: 2,
    applicationDetail:
      '직선으로 이동하는 회오리 경로상 적에게 피해·넉백. 아군·본인에게는 적용되지 않는다.',
  },
  armageddon: {
    effectKind: 'damage',
    targetScope: 'area',
    targetSide: 'enemy',
    baseMin: 16,
    baseMax: 26,
    powerPerLevel: 3,
    applicationDetail:
      '넓은 전장 광역의 모든 적에게 운석·번개 피해. 아군·본인에게는 적용되지 않는다.',
  },
  werewolf: {
    effectKind: 'buff',
    targetScope: 'self',
    targetSide: 'self',
    effectPotencyLabel: '공격·이동 보정',
    effectPotencyBase: 10,
    effectPotencyPerLevel: 1,
    applicationDetail:
      '시전자 본인만 늑대 변신 버프. 아군·적군에게는 전달되지 않으며, 본인 공격력·이동만 상승한다.',
  },
  'cyclone-armor': {
    effectKind: 'buff',
    targetScope: 'self',
    targetSide: 'self',
    effectPotencyLabel: '원거리 피해 흡수',
    effectPotencyBase: 25,
    effectPotencyPerLevel: 3,
    applicationDetail:
      '시전자 본인만 회오리 방어막. 원거리 공격 흡수량만큼 피해를 줄이며, 아군·적군에게는 전달되지 않는다.',
  },

  // ── 암살자 ──
  'tiger-strike': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 16,
    baseMax: 24,
    powerPerLevel: 2.5,
    applicationDetail:
      '지정한 적 1명에게 연속 타격 후 마무리 일격(합산 피해). 아군·본인에게는 적용되지 않는다.',
  },
  'dragon-claw': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 14,
    baseMax: 22,
    powerPerLevel: 2,
    applicationDetail:
      '지정한 적 1명에게 빠른 연속 발톱 피해. 아군·본인에게는 적용되지 않는다.',
  },
  'shadow-master': {
    effectKind: 'summon',
    targetScope: 'self',
    targetSide: 'ally',
    effectPotencyLabel: '그림자 분신 공격력',
    effectPotencyBase: 12,
    effectPotencyPerLevel: 2,
    applicationDetail:
      '시전자 주변에 아군 그림자 분신을 소환. 분신은 적을 공격하며 아군·본인에게 피해를 주지 않는다.',
  },
  'flash-strike': {
    effectKind: 'damage',
    targetScope: 'single',
    targetSide: 'enemy',
    baseMin: 18,
    baseMax: 26,
    powerPerLevel: 3,
    applicationDetail:
      '순간 이동 후 지정 적 1명에게 일섬 피해. 아군·본인에게는 적용되지 않는다.',
  },
};
