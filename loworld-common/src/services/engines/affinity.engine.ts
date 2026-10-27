import type { AffinityDamageResult, AffinityType } from '../models/affinity.model';

/** 스킬 원소 vs 방어자 원소 상성 배율 */
export function calculateAffinityMultiplier(
  skillAffinity: AffinityType,
  defenderAffinity: AffinityType,
): number {
  if (skillAffinity === 'none' || defenderAffinity === 'none') {
    return 1.0;
  }
  if (skillAffinity === defenderAffinity) {
    if (skillAffinity === 'light' || skillAffinity === 'dark') {
      return 0.8;
    }
    return 1.0;
  }

  if (skillAffinity === 'light' && defenderAffinity === 'dark') {
    return 1.6;
  }
  if (skillAffinity === 'dark' && defenderAffinity === 'light') {
    return 1.6;
  }

  const cycle: Record<AffinityType, AffinityType> = {
    fire: 'wind',
    wind: 'earth',
    earth: 'water',
    water: 'fire',
    light: 'none',
    dark: 'none',
    none: 'none',
  };

  if (cycle[skillAffinity] === defenderAffinity) {
    return 1.5;
  }
  if (cycle[defenderAffinity] === skillAffinity) {
    return 0.7;
  }

  return 1.0;
}

export function getAffinityRelationLabel(multiplier: number): {
  label: string;
  tone: AffinityDamageResult['relationTone'];
} {
  if (multiplier > 1.2) {
    return {
      label: multiplier >= 1.6 ? '❌ 극상 상성' : '🔥 우세 상성',
      tone: 'good',
    };
  }
  if (multiplier < 0.9) {
    return { label: '💧 열세 상성', tone: 'danger' };
  }
  return { label: '상성 보통', tone: 'neutral' };
}

/** 자속(SEDB): 스킬·시전자 원소 일치 시 +20% */
export function applyElementAffinityToDamage(
  baseDamage: number,
  skillAffinity: AffinityType,
  attackerAffinity: AffinityType,
  defenderAffinity: AffinityType,
): AffinityDamageResult {
  const multiplier = calculateAffinityMultiplier(skillAffinity, defenderAffinity);
  const isSameElementBonus =
    skillAffinity === attackerAffinity && skillAffinity !== 'none';
  const sedbMultiplier = isSameElementBonus ? 1.2 : 1.0;
  const damage = Math.max(1, Math.round(baseDamage * multiplier * sedbMultiplier));
  const relation = getAffinityRelationLabel(multiplier);

  return {
    damage,
    multiplier,
    isSameElementBonus,
    relationLabel: relation.label,
    relationTone: relation.tone,
  };
}

export function affinityTypeEmoji(type: AffinityType): string {
  switch (type) {
    case 'fire': return '🔥';
    case 'water': return '💧';
    case 'wind': return '🌪️';
    case 'earth': return '⛰️';
    case 'light': return '☀️';
    case 'dark': return '😈';
    default: return '⚪';
  }
}
