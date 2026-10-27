import type { BattleSkill } from '../../models/battle.model';
import type { BattleEnemy, BattleStatusEffect } from '../../models/battle.model';
import { applyElementAffinityToDamage } from '../affinity.engine';
import type { AffinityType } from '../../models/affinity.model';
import type { EnemyCombatMods } from '../../models/story-battle-runtime.model';
import { sumStatusEffectPct } from './status-effect.util';
import { scaleOutgoingBattleDamage } from './battle-damage-scale.util';

export function rollSkillValue(skill: BattleSkill): { rawVal: number; isHeal: boolean; isCrit: boolean } {
  const [min, max] = skill.damageRange;
  const rawVal = Math.floor(Math.random() * (max - min + 1)) + min;
  const isHeal = rawVal < 0;
  const isCrit = !isHeal && Math.random() < 0.15;
  return { rawVal, isHeal, isCrit };
}

export interface PlayerAttackDamageInput {
  rawVal: number;
  isCrit: boolean;
  skill: BattleSkill;
  targetEnemy: BattleEnemy;
  targetMods: EnemyCombatMods;
  equipmentDamageBonus: number;
  allyDamageBonus: number;
  attackerAffinity: AffinityType;
  damageMultiplier?: number;
}

export function calculatePlayerAttackDamage(input: PlayerAttackDamageInput): number {
  const damage = input.isCrit ? Math.floor(input.rawVal * 1.5) : input.rawVal;
  const vulnerabilityPct = sumStatusEffectPct(input.targetEnemy.statusEffects, 'vulnerabilityPct');
  const bonusTotal = input.equipmentDamageBonus + input.allyDamageBonus;
  const baseDamage = Math.max(1, damage + bonusTotal - Math.floor(input.targetMods.defenseBonus / 3));
  const skillAffinity = input.skill.affinity ?? 'none';
  const defenderAffinity = input.targetEnemy.affinity ?? 'none';
  const affinityResult = applyElementAffinityToDamage(
    baseDamage,
    skillAffinity,
    input.attackerAffinity,
    defenderAffinity,
  );
  return scaleOutgoingBattleDamage(
    Math.max(1, Math.round(affinityResult.damage * (1 + vulnerabilityPct / 100))),
    input.damageMultiplier ?? 1,
  );
}

export function calculateEnemyCounterDamage(
  enemy: BattleEnemy,
  enemyMods: EnemyCombatMods,
  playerDamageReduction: number,
  allyReductionPct: number,
): number {
  const weakenPct = sumStatusEffectPct(enemy.statusEffects, 'weakenDamagePct');
  const rawCounter = Math.max(2, Math.floor(enemy.level * 1.5) + enemyMods.damageBonus);
  const weakenedCounter = Math.max(0, Math.round(rawCounter * (1 - weakenPct / 100)));
  const flatMitigated = Math.max(0, weakenedCounter - playerDamageReduction);
  return Math.max(0, Math.round(flatMitigated * (1 - allyReductionPct / 100)));
}

export function calculateAiAllyDamage(
  allyDamageBonus: number,
  targetMods: EnemyCombatMods,
  damageMultiplier = 1,
): number {
  const baseDamage = Math.floor(Math.random() * 7) + 6 + allyDamageBonus;
  const mitigated = Math.max(1, baseDamage - Math.floor(targetMods.defenseBonus / 2));
  return scaleOutgoingBattleDamage(mitigated, damageMultiplier);
}
