/** 6원소 + 무속성 — 전투 스킬·캐릭터·몬스터 공통 */
export type AffinityType = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'dark' | 'none';

export interface AffinityDamageResult {
  damage: number;
  multiplier: number;
  isSameElementBonus: boolean;
  relationLabel: string;
  relationTone: 'good' | 'danger' | 'neutral';
}
