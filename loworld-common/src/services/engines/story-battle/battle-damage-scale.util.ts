/** 전투 테스트 샌드박스 — 시작 전 선택 가능한 데미지 배율 */
export const BATTLE_DAMAGE_MULTIPLIER_OPTIONS = [1, 3, 5, 10] as const;

export type BattleDamageMultiplier = (typeof BATTLE_DAMAGE_MULTIPLIER_OPTIONS)[number];

export const DEFAULT_BATTLE_DAMAGE_MULTIPLIER: BattleDamageMultiplier = 3;

export function normalizeBattleDamageMultiplier(value: number | undefined | null): BattleDamageMultiplier {
  if (value === 1 || value === 3 || value === 5 || value === 10) {
    return value;
  }
  return DEFAULT_BATTLE_DAMAGE_MULTIPLIER;
}

export function scaleOutgoingBattleDamage(baseDamage: number, multiplier: number): number {
  if (multiplier <= 1) {
    return Math.max(1, baseDamage);
  }
  return Math.max(1, Math.round(baseDamage * multiplier));
}
