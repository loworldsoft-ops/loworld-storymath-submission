import type { BattleSkill } from '../../models/battle.model';
import type { BattleStatusEffect } from '../../models/battle.model';

export function tickStatusEffects<T extends { statusEffects?: BattleStatusEffect[] }>(entities: T[]): T[] {
  return entities.map((entry) => {
    if (!entry.statusEffects?.length) {
      return { ...entry };
    }
    const nextEffects = entry.statusEffects
      .map((fx) => ({ ...fx, remainingTurns: fx.remainingTurns - 1 }))
      .filter((fx) => fx.remainingTurns > 0);
    return { ...entry, statusEffects: nextEffects };
  });
}

export function createStatusEffectFromSkill(skill: BattleSkill, kind: 'buff' | 'debuff'): BattleStatusEffect {
  const cfg = skill.statusEffect;
  return {
    id: skill.id,
    kind,
    icon: cfg?.icon ?? (kind === 'buff' ? '🛡️' : '💀'),
    label: cfg?.label ?? skill.name,
    remainingTurns: cfg?.durationTurns ?? 3,
    damageReductionPct: cfg?.damageReductionPct,
    damageBonusPct: cfg?.damageBonusPct,
    weakenDamagePct: cfg?.weakenDamagePct,
    vulnerabilityPct: cfg?.vulnerabilityPct,
  };
}

export function upsertStatusEffect(effects: BattleStatusEffect[] | undefined, next: BattleStatusEffect): BattleStatusEffect[] {
  const filtered = (effects ?? []).filter((fx) => fx.id !== next.id);
  return [...filtered, next];
}

export function sumStatusEffectPct(
  effects: BattleStatusEffect[] | undefined,
  key: 'damageReductionPct' | 'damageBonusPct' | 'weakenDamagePct' | 'vulnerabilityPct',
): number {
  if (!effects?.length) {
    return 0;
  }
  return effects.reduce((total, fx) => total + (fx[key] ?? 0), 0);
}
