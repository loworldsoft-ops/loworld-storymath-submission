/**
 * [Loworld UI Core] 디아블로2 식 3단계 베이스 티어 (Normal · Exceptional · Elite) 및 착용 제약 모델
 */

export type CodexBaseTier = 'normal' | 'exceptional' | 'elite';
export type CodexNumericTier = 1 | 2 | 3;

export interface CodexBaseTierMeta {
  tier: CodexBaseTier;
  numericTier: CodexNumericTier;
  label: string;
  shortLabel: string;
  defaultRequiredLevel: number;
  badgeClass: string;
  themeColor: string;
  statMultiplier: number;
  description: string;
}

export interface CodexEquipCheckResult {
  canEquip: boolean;
  requiredLevel: number;
  characterLevel: number;
  tierMeta: CodexBaseTierMeta;
  reason?: string;
}
