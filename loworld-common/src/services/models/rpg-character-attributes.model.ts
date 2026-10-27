import type { CharacterClass } from './character-base.model';

export type CampaignDifficulty = 'normal' | 'nightmare' | 'hell';

export interface RpgStatPair {
  base: number;
  bonus: number;
  total: number;
}

export interface RPGesourcePair {
  current: number;
  max: number;
}

export interface RpgResistDetail {
  value: number;       // 난이도 감산 후 최종 적용 저항 (%)
  uncapped: number;    // 캡 적용 전 저항 (%)
  maxCap: number;      // 최대 저항 캡 (기본 75%, 최대 95%)
  penalty: number;     // 난이도 감산 페널티 (Normal 0, NM -40, Hell -100)
}

export interface RpgCharacterAttributes {
  // 캐릭터 기본 메타
  characterName: string;
  characterClass: CharacterClass;
  level: number;
  difficulty: CampaignDifficulty;

  // 1. 핵심 능력치 (Core Attributes)
  strength: RpgStatPair;
  dexterity: RpgStatPair;
  vitality: RpgStatPair;
  energy: RpgStatPair;

  // 2. 생존 & 자원 (Vitals)
  life: RPGesourcePair;
  mana: RPGesourcePair;
  stamina: RPGesourcePair;

  // 3. 기본 전투 수치 (Primary Combat)
  mainHandDamage: { min: number; max: number };
  offHandDamage?: { min: number; max: number };
  attackRating: number;
  chanceToHit: number;       // 명중률 (%)
  defense: number;
  chanceToBeHit: number;     // 피격 확률 (%)
  chanceToBlock: number;     // 방어 기회/블록률 (%) - D2R 캡 75%

  // 4. 원소 저항력 (Resistances)
  fireResist: RpgResistDetail;
  coldResist: RpgResistDetail;
  lightningResist: RpgResistDetail;
  poisonResist: RpgResistDetail;

  // 5. 프레임 속도 속성 (Speed Modifiers)
  ias: number;   // Increased Attack Speed (%)
  fcr: number;   // Faster Cast Rate (%)
  fhr: number;   // Faster Hit Recovery (%)
  frw: number;   // Faster Run/Walk (%)
  fbr: number;   // Faster Block Rate (%)

  // 6. 고급 특수 공격 속성 (Special Offense)
  crushingBlow: number;      // 강타 확률 (%)
  deadlyStrike: number;      // 치명적 타격 (%)
  openWounds: number;        // 상처 악화 (%)
  ignoreTargetDefense: boolean; // 적 방어 무시
  lifeSteal: number;         // 타격당 생명력 흡수 (%)
  manaSteal: number;         // 타격당 마나 흡수 (%)
  pierceResistances: {
    fire: number;
    cold: number;
    lightning: number;
    poison: number;
  };

  // 7. 고급 특수 방어 & 생존 (Special Defense & Survival)
  replenishLife: number;     // 생명력 재생 (초당 N)
  regenerateMana: number;    // 마나 재생 (%)
  damageReduction: {
    flat: number;            // 정수 피해 감산
    percent: number;         // % 피해 감산 (최대 50% 캡)
  };
  magicDamageReduction: number; // 정수 마법 피해 감산
  elementAbsorb: {
    fireFlat: number;
    firePercent: number;
    coldFlat: number;
    coldPercent: number;
    lightningFlat: number;
    lightningPercent: number;
  };
  cannotBeFrozen: boolean;
  halfFreezeDuration: boolean;

  // 8. 유틸리티 & 드랍 (Utility & MF)
  magicFind: number;         // 매직 아이템 발견 확률 (%)
  extraGold: number;         // 획득 골드 증가 (%)
  lightRadius: number;       // 시야 증가 (+N)
  requirementsReduction: number; // 착용 요구치 감소 (-%)
  skillBonusAll: number;     // 모든 기술 레벨 (+N)
  skillBonusClass: number;   // 본인 직업 기술 레벨 (+N)
}
