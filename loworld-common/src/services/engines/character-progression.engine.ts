/**
 * @file character-progression.engine.ts
 * @description 캐릭터 경험치(EXP) 및 레벨업 시스템 순수 도메인 엔진 (Pure Functions)
 */

export interface CharacterStatIncreases {
  maxLife: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
  defense: number;
}

export interface ExpProgressionResult {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  currentExp: number;
  nextLevelExp: number;
  expPercent: number;
  isLevelUp: boolean;
  totalExpGained: number;
  statIncreases: CharacterStatIncreases;
}

/**
 * 특정 레벨에서 다음 레벨로 가기 위해 필요한 경험치를 계산합니다.
 * 공식: floor(100 * level^1.4)
 * Lv.1: 100 EXP, Lv.2: 263 EXP, Lv.3: 465 EXP, Lv.4: 696 EXP, Lv.5: 951 EXP
 */
export function calculateRequiredExpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(100 * Math.pow(safeLevel, 1.4));
}

/**
 * 현재 경험치와 다음 레벨 목표 경험치로부터 0~100 사이의 정수 백분율을 반환합니다.
 */
export function calculateExpProgressPercent(currentExp: number, nextLevelExp: number): number {
  if (!nextLevelExp || nextLevelExp <= 0) return 0;
  const clampedExp = Math.max(0, currentExp);
  const percent = Math.floor((clampedExp / nextLevelExp) * 100);
  return Math.min(100, Math.max(0, percent));
}

/**
 * 캐릭터에게 경험치를 지급하고 레벨업 및 스탯 증가치를 산출합니다.
 * 초과 경험치는 다음 레벨로 안전하게 승계(Overflow carryover)됩니다.
 */
export function applyExpGainToCharacter(
  currentLevel: number,
  currentExp: number = 0,
  gainedExp: number = 0,
  characterClass?: string,
): ExpProgressionResult {
  let level = Math.max(1, Math.floor(currentLevel));
  let exp = Math.max(0, Math.floor(currentExp)) + Math.max(0, Math.floor(gainedExp));
  let levelsGained = 0;

  while (true) {
    const needed = calculateRequiredExpForLevel(level);
    if (exp >= needed) {
      exp -= needed;
      level += 1;
      levelsGained += 1;
    } else {
      break;
    }
  }

  const nextLevelExp = calculateRequiredExpForLevel(level);
  const expPercent = calculateExpProgressPercent(exp, nextLevelExp);

  // 직업별 주력 스탯 반영 (기본: 생명력 +15, 마나 +8, 올스탯 +2)
  const isCaster = characterClass === 'sorceress' || characterClass === 'necromancer';
  const isDex = characterClass === 'rogue' || characterClass === 'amazon' || characterClass === 'assassin';

  const statIncreases: CharacterStatIncreases = {
    maxLife: levelsGained * 15,
    maxMana: levelsGained * (isCaster ? 12 : 8),
    strength: levelsGained * (isCaster ? 1 : 2),
    dexterity: levelsGained * (isDex ? 3 : 2),
    vitality: levelsGained * 2,
    energy: levelsGained * (isCaster ? 3 : 1),
    defense: levelsGained * 3,
  };

  return {
    previousLevel: currentLevel,
    newLevel: level,
    levelsGained,
    currentExp: exp,
    nextLevelExp,
    expPercent,
    isLevelUp: levelsGained > 0,
    totalExpGained: Math.max(0, gainedExp),
    statIncreases,
  };
}
