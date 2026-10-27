import { CharacterPersonality } from '../../../../services/models/character.model';
import { CharacterImmunity, CharacterRank, CharacterStrongTrait, MonsterCreatureType, StoryMonsterEntry } from '../../../../services/models/story-sidebar.model';
import { enemyTypeLabel, resolveMonsterCreatureType } from '../../../../services/utils/battle-roster-cluster.util';
import { resolveCharacterImmunities, resolveCharacterRank, resolveCharacterStrongTraits } from '../../../../services/utils/character-rank.util';

/** 몬스터 카드 "장비"/"스킬" 섹션에 노출할 항목 1개 — 캐릭터와 달리 실제 아이템/스킬 카탈로그와 연결되지 않은 flavor 데이터. */
export interface MonsterSummaryTraitVm {
  name: string;
  icon: string;
  description: string;
}

/** 몬스터 카드 "전투력" 배지 클릭 시 보여줄 상세 분해 — 레벨 기여분 + 종족 특성 보너스의 합. */
export interface MonsterSummaryCombatPowerBreakdownVm {
  total: number;
  level: number;
  /** 레벨 기여분 = `level * 100`. */
  levelValue: number;
  typeLabel: string;
  /** 종족 특성 보너스. */
  typeValue: number;
}

/** 몬스터 요약 카드(lw-monster-summary-card) 전용 얇은 뷰 모델 — 캐릭터와 달리 읽기 전용(편집 불가)이다. */
export interface MonsterSummaryVm {
  id: string;
  name: string;
  level: number;
  life: number;
  maxLife: number;
  area: string;
  summary: string;
  badge?: string;
  creatureType?: MonsterCreatureType;
  rank: CharacterRank;
  immunities: CharacterImmunity[];
  strongTraits: CharacterStrongTrait[];
  /** 레벨×100 + 종족 특성 보너스 — 캐릭터 카드의 전투력과 동일한 스케일(레벨×100)을 기준으로 비교 가능하게 맞춤. */
  combatPower: number;
  /** `combatPower`를 레벨 기여분 + 종족 보너스로 분해한 값 — 전투력 배지 클릭 시 상세 모달에서 사용. */
  combatPowerBreakdown: MonsterSummaryCombatPowerBreakdownVm;
  personality: CharacterPersonality;
  equipment: MonsterSummaryTraitVm[];
  skills: MonsterSummaryTraitVm[];
}

interface MonsterCreatureTypeProfile {
  personality: CharacterPersonality;
  equipment: MonsterSummaryTraitVm[];
  skills: MonsterSummaryTraitVm[];
  /** 종족 특성상 기본 전투력 가산치 — `level * 100`에 더해진다. */
  combatPowerBonus: number;
}

/**
 * 몬스터는 캐릭터처럼 개별적으로 장비를 장착하거나 스킬을 수련하는 대상이 아니라 도감(bestiary)
 * 엔트리이므로, 개체 단위가 아니라 종족(`creatureType`) 단위로 고정된 "종족 특성" 프로필을 부여한다.
 * 캐릭터 카드의 성격 fallback(콘텐츠가 없는 캐릭터에게 기본 성격을 부여하던 것)과 같은 지향점 —
 * 개별 몬스터 데이터(`StoryMonsterEntry`)에 성격/장비/스킬이 없어도 카드가 항상 의미 있는 정보를
 * 보여주도록 하는, 몬스터판 기본값이다.
 */
export const MONSTER_CREATURE_TYPE_PROFILES: Record<MonsterCreatureType, MonsterCreatureTypeProfile> = {
  beast: {
    personality: {
      type: '야생의 본능',
      tags: ['거친', '영역 의식', '직관적인'],
      description: '무리를 지키려는 본능에 따라 움직이며, 위협을 감지하면 주저 없이 이빨과 발톱을 드러냅니다.',
    },
    equipment: [
      { name: '날카로운 발톱', icon: '🐾', description: '수없이 사냥해 온 발톱 — 방어구 틈새를 그대로 파고들어 찢어낸다.' },
      { name: '질긴 가죽', icon: '🦴', description: '두껍고 탄력 있는 천연 가죽으로, 웬만한 타격은 그대로 튕겨낸다.' },
    ],
    skills: [
      { name: '물어뜯기', icon: '🦷', description: '강한 턱으로 목표를 물어 놓아주지 않는 근접 공격.' },
      { name: '포효', icon: '📢', description: '무리 전체의 사기를 끌어올리는 위협적인 울음소리.' },
    ],
    combatPowerBonus: 40,
  },
  undead: {
    personality: {
      type: '차가운 원한',
      tags: ['불굴', '무자비한', '침묵하는'],
      description: '이미 죽었으나 원한으로 움직이며, 고통도 두려움도 느끼지 않고 전선을 밀어붙입니다.',
    },
    equipment: [
      { name: '부식된 강철 대검', icon: '🗡️', description: '녹슬었지만 여전히 무거운 일격을 꽂아 넣는 대검.' },
      { name: '저주받은 뼈 갑주', icon: '🦴', description: '죽은 자의 뼈를 엮어 만든 갑주 — 저주가 상처를 무디게 한다.' },
      { name: '망자의 인장', icon: '💍', description: '주인을 이승에 붙들어 두는 저주가 새겨진 인장.' },
    ],
    skills: [
      { name: '생명력 흡수', icon: '🩸', description: '적의 생기를 빨아들여 스스로를 회복시킨다.' },
      { name: '부패의 손길', icon: '☣️', description: '닿는 것마다 서서히 부패시키는 맹독의 손길.' },
      { name: '뼈 방벽', icon: '🛡️', description: '뼈 조각을 끌어모아 순간적으로 방어막을 세운다.' },
    ],
    combatPowerBonus: 90,
  },
  fantasy: {
    personality: {
      type: '신비로운 존재',
      tags: ['불가해한', '유려한', '초연한'],
      description: '인간의 상식으로는 가늠할 수 없는 힘을 지녔으며, 신비로운 마법으로 전황을 뒤흔듭니다.',
    },
    equipment: [
      { name: '정령의 지팡이', icon: '🪄', description: '자연의 정령과 교감해 마력을 증폭시키는 지팡이.' },
      { name: '마력 결정 목걸이', icon: '💠', description: '응축된 마력 결정이 시전자의 주문을 강화한다.' },
      { name: '별빛 로브', icon: '🌌', description: '밤하늘의 별빛을 짜 넣은 로브 — 마법 저항력을 높인다.' },
    ],
    skills: [
      { name: '정령 소환', icon: '🌟', description: '작은 정령을 불러내 함께 싸우게 한다.' },
      { name: '마력 폭발', icon: '✨', description: '응축된 마력을 한 번에 터뜨려 넓은 범위를 강타한다.' },
      { name: '차원 왜곡', icon: '🌀', description: '공간을 일그러뜨려 적의 균형을 무너뜨린다.' },
    ],
    combatPowerBonus: 110,
  },
  'wuxia': {
    personality: {
      type: '구도자의 기개',
      tags: ['수련된', '올곧은', '침착한'],
      description: '오랜 수련으로 다져진 내공을 바탕으로, 흔들림 없이 자신만의 무도(武道)를 관철합니다.',
    },
    equipment: [
      { name: '청강 장검', icon: '⚔️', description: '오랜 수련자의 손에 다듬어진, 푸른 광택이 도는 명검.' },
      { name: '호신강기 로브', icon: '🥋', description: '내공을 둘러 몸을 보호하는 무복 — 웬만한 타격을 흘려낸다.' },
      { name: '내공 단전', icon: '☯️', description: '평생 쌓아온 내공이 응축된 단전 — 초식의 위력을 뒷받침한다.' },
    ],
    skills: [
      { name: '검기 발출', icon: '💫', description: '검에 내공을 실어 멀리까지 검기를 뻗어낸다.' },
      { name: '경공술', icon: '🌀', description: '몸을 가볍게 하여 눈으로 쫓기 힘든 속도로 움직인다.' },
      { name: '내공 순환', icon: '♻️', description: '흐트러진 내공을 다시 갈무리해 기력을 회복한다.' },
    ],
    combatPowerBonus: 120,
  },
  demon: {
    personality: {
      type: '파괴적 광기',
      tags: ['잔혹한', '오만한', '충동적인'],
      description: '약자를 짓밟는 데서 즐거움을 느끼며, 압도적인 힘으로 순식간에 전장을 초토화시킵니다.',
    },
    equipment: [
      { name: '지옥불 채찍', icon: '🔥', description: '휘두를 때마다 지옥불이 타오르는 채찍 — 스치기만 해도 화상을 남긴다.' },
      { name: '악마의 뿔 투구', icon: '👹', description: '위압적인 뿔이 솟은 투구 — 마주한 상대의 사기를 꺾는다.' },
      { name: '재앙의 인장', icon: '🔱', description: '재앙을 부르는 힘이 봉인된 인장 — 착용자의 파괴력을 증폭시킨다.' },
    ],
    skills: [
      { name: '지옥불 강타', icon: '🔥', description: '지옥의 불길을 실어 내리찍는 강력한 일격.' },
      { name: '공포의 포효', icon: '😱', description: '주변 일대를 얼어붙게 만드는 공포의 울음.' },
      { name: '악마의 계약', icon: '📜', description: '스스로의 생명력을 대가로 순간적인 힘을 끌어올린다.' },
    ],
    combatPowerBonus: 140,
  },
  elite: {
    personality: {
      type: '냉철한 전술가',
      tags: ['훈련된', '절제된', '집요한'],
      description: '체계적인 전투 훈련을 받아 빈틈을 노리며, 무리를 이뤄 정교하게 상대를 압박합니다.',
    },
    equipment: [
      { name: '정예 부대 대검', icon: '⚔️', description: '정예 부대에 지급되는 표준 대검 — 균형 잡힌 무게로 다루기 쉽다.' },
      { name: '강화 판금 갑주', icon: '🛡️', description: '이중으로 덧댄 판금 갑주 — 일반 병기로는 뚫기 어렵다.' },
      { name: '지휘관의 견장', icon: '🎖️', description: '부대의 사기를 상징하는 견장 — 주변 동료의 전의를 북돋운다.' },
    ],
    skills: [
      { name: '일제 돌격', icon: '💨', description: '진형을 갖춰 한 방향으로 동시에 돌격한다.' },
      { name: '방어 진형', icon: '🛡️', description: '방패를 맞대어 견고한 방어선을 구축한다.' },
      { name: '약점 포착', icon: '🎯', description: '상대의 빈틈을 냉정하게 분석해 정확히 노린다.' },
    ],
    combatPowerBonus: 180,
  },
};

export function calculateMonsterCombatPower(level: number, creatureType: MonsterCreatureType): number {
  return level * 100 + (MONSTER_CREATURE_TYPE_PROFILES[creatureType]?.combatPowerBonus ?? 0);
}

/** 전투력 배지 상세 모달용 — 레벨 기여분 + 종족 특성 보너스로 분해. */
export function buildMonsterCombatPowerBreakdown(
  level: number,
  creatureType: MonsterCreatureType,
): MonsterSummaryCombatPowerBreakdownVm {
  const levelValue = level * 100;
  const typeValue = MONSTER_CREATURE_TYPE_PROFILES[creatureType]?.combatPowerBonus ?? 0;
  return {
    total: levelValue + typeValue,
    level,
    levelValue,
    typeLabel: enemyTypeLabel(creatureType),
    typeValue,
  };
}

/**
 * 도감 엔트리(`StoryMonsterEntry`)에는 체력이 없으므로, 전투 다이어그노스틱스의
 * `monsterEntryToBattleEnemy()`(component-diagnostics-panel/battle-diagnostics-presets.ts)와
 * 동일한 레벨 기반 스케일(`level * 12 + 18`)로 추정한다. 두 곳의 공식이 갈리면 같은 몬스터인데
 * 셋업 화면·전투 화면·이 요약 카드가 서로 다른 체력을 보여주게 되므로, 공식을 바꿀 때는 함께 맞춘다.
 */
export function buildMonsterSummaryVm(entry: StoryMonsterEntry): MonsterSummaryVm {
  const baseCalculated = Math.round(entry.level * 12 + 18);
  const maxLife = entry.maxLife ?? entry.life ?? baseCalculated;
  const life = entry.life ?? maxLife;
  const creatureType = resolveMonsterCreatureType(entry);
  const profile = MONSTER_CREATURE_TYPE_PROFILES[creatureType];
  const rank = resolveCharacterRank(entry);
  const immunities = resolveCharacterImmunities(entry);
  const strongTraits = resolveCharacterStrongTraits(entry);

  const baseCp = calculateMonsterCombatPower(entry.level, creatureType);
  const hpBonus = maxLife > baseCalculated ? Math.round((maxLife - baseCalculated) * 0.6) : 0;
  const rankBonus = rank === 'grandmaster' ? 800 : rank === 'master' ? 500 : rank === 'diamond' ? 300 : rank === 'gold' ? 150 : 0;
  const traitBonus = (strongTraits.length * 60) + (immunities.length * 80);
  const totalCp = baseCp + hpBonus + rankBonus + traitBonus;

  return {
    id: entry.id,
    name: entry.name,
    level: entry.level,
    life,
    maxLife,
    area: entry.area,
    summary: entry.summary,
    badge: entry.badge,
    creatureType: entry.creatureType,
    rank,
    immunities,
    strongTraits,
    combatPower: totalCp,
    combatPowerBreakdown: {
      total: totalCp,
      level: entry.level,
      levelValue: entry.level * 100,
      typeLabel: enemyTypeLabel(creatureType),
      typeValue: (profile?.combatPowerBonus ?? 0) + hpBonus + rankBonus + traitBonus,
    },
    personality: profile.personality,
    equipment: profile.equipment,
    skills: profile.skills,
  };
}

export function monsterSummariesFromEntries(entries: StoryMonsterEntry[]): MonsterSummaryVm[] {
  return entries.map(buildMonsterSummaryVm);
}
