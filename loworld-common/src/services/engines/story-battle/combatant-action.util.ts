import type { BattleSkill } from '../../models/battle.model';
import type { BattleEnemy } from '../../models/battle.model';
import type { BattleAllyCombatant, EnemyCombatMods } from '../../models/story-battle-runtime.model';
import { rollSkillValue } from './damage.util';
import { sumStatusEffectPct } from './status-effect.util';
import { isAllAlliesTargetSkill } from './aoe-skill.util';
import { aliveAllies } from './combatant.util';

import { BASIC_ATTACK_SKILL_ID, createBasicAttackSkill } from './combatant.util';

export { BASIC_ATTACK_SKILL_ID, createBasicAttackSkill };

export function cloneBattleSkills(skills: BattleSkill[]): BattleSkill[] {
  return skills.map((entry) => ({ ...entry }));
}

export function pickCombatantSkill(
  ownedSkills: BattleSkill[] | undefined,
  mana: number,
  level: number,
): { skill: BattleSkill; fromLoadout: boolean } {
  const pool = (ownedSkills ?? []).filter(
    (entry) => entry.currentCooldown <= 0 && entry.manaCost <= mana,
  );
  if (pool.length === 0) {
    return { skill: createBasicAttackSkill(level), fromLoadout: false };
  }
  const skill = pool[Math.floor(Math.random() * pool.length)];
  return { skill, fromLoadout: true };
}

export function tickCombatantSkillCooldowns(
  skills: BattleSkill[] | undefined,
  usedSkillId: string | null,
): BattleSkill[] | undefined {
  if (!skills?.length) {
    return skills;
  }
  return skills.map((entry) => ({
    ...entry,
    currentCooldown:
      usedSkillId && entry.id === usedSkillId
        ? entry.cooldownTurns
        : Math.max(0, entry.currentCooldown - 1),
  }));
}

export function applyManaAfterSkill(
  mana: number,
  skill: BattleSkill,
): number {
  return Math.max(0, mana - skill.manaCost);
}

export interface CombatantHitVsAlly {
  actorName: string;
  targetName?: string;
  damage: number;
  skillName: string;
  manaSpent: number;
  icon: string;
}

export function resolveEnemySkillHitOnAlly(
  enemy: BattleEnemy,
  enemyMods: EnemyCombatMods,
  playerDamageReduction: number,
  allyReductionPct: number,
): { nextEnemy: BattleEnemy; hit: CombatantHitVsAlly | null } {
  if (enemy.life <= 0) {
    return { nextEnemy: enemy, hit: null };
  }

  const mana = enemy.mana ?? 0;
  const { skill, fromLoadout } = pickCombatantSkill(enemy.skills, mana, enemy.level);
  const { rawVal, isHeal } = rollSkillValue(skill);
  if (isHeal) {
    return { nextEnemy: enemy, hit: null };
  }

  const weakenPct = sumStatusEffectPct(enemy.statusEffects, 'weakenDamagePct');
  let damage = Math.max(1, Math.abs(rawVal) + enemyMods.damageBonus);
  damage = Math.max(0, Math.round(damage * (1 - weakenPct / 100)));
  damage = Math.max(0, damage - playerDamageReduction);
  damage = Math.max(0, Math.round(damage * (1 - allyReductionPct / 100)));

  const usedSkillId = fromLoadout && skill.id !== BASIC_ATTACK_SKILL_ID ? skill.id : null;
  const nextSkills = fromLoadout ? tickCombatantSkillCooldowns(enemy.skills, usedSkillId) : enemy.skills;

  const nextEnemy: BattleEnemy = {
    ...enemy,
    mana: applyManaAfterSkill(mana, skill),
    skills: nextSkills,
  };

  return {
    nextEnemy,
    hit: {
      actorName: enemy.name,
      damage,
      skillName: skill.name,
      manaSpent: skill.manaCost,
      icon: skill.iconHint ?? '⚔️',
    },
  };
}

/** 수동 적군 턴 — 지정 스킬을 특정 아군에게 적용 */
export function applyEnemySkillToAllyTarget(
  enemy: BattleEnemy,
  skill: BattleSkill,
  targetAlly: BattleAllyCombatant,
  enemyMods: EnemyCombatMods,
): {
  nextEnemy: BattleEnemy;
  nextTarget: BattleAllyCombatant;
  hit: CombatantHitVsAlly | null;
} {
  if (enemy.life <= 0 || targetAlly.life <= 0) {
    return { nextEnemy: enemy, nextTarget: targetAlly, hit: null };
  }

  const mana = enemy.mana ?? 0;
  if (mana < skill.manaCost || skill.currentCooldown > 0) {
    return { nextEnemy: enemy, nextTarget: targetAlly, hit: null };
  }

  const { rawVal, isHeal } = rollSkillValue(skill);
  if (isHeal) {
    return { nextEnemy: enemy, nextTarget: targetAlly, hit: null };
  }

  const weakenPct = sumStatusEffectPct(enemy.statusEffects, 'weakenDamagePct');
  let damage = Math.max(1, Math.abs(rawVal) + enemyMods.damageBonus);
  damage = Math.max(0, Math.round(damage * (1 - weakenPct / 100)));
  damage = Math.max(0, damage - targetAlly.damageReduction);
  damage = Math.max(0, Math.round(damage * (1 - sumStatusEffectPct(targetAlly.statusEffects, 'damageReductionPct') / 100)));

  const fromLoadout = skill.id !== BASIC_ATTACK_SKILL_ID;
  const usedSkillId = fromLoadout ? skill.id : null;
  const nextSkills = fromLoadout ? tickCombatantSkillCooldowns(enemy.skills, usedSkillId) : enemy.skills;

  const nextEnemy: BattleEnemy = {
    ...enemy,
    mana: applyManaAfterSkill(mana, skill),
    skills: nextSkills,
  };

  const nextTarget: BattleAllyCombatant = {
    ...targetAlly,
    life: Math.max(0, targetAlly.life - damage),
  };

  return {
    nextEnemy,
    nextTarget,
    hit: {
      actorName: enemy.name,
      damage,
      skillName: skill.name,
      manaSpent: skill.manaCost,
      icon: skill.iconHint ?? '⚔️',
    },
  };
}

/** 적 광역 — 생존 아군 전원 피해 */
export function applyEnemyAoeSkillToAllAllies(
  enemy: BattleEnemy,
  skill: BattleSkill,
  allies: BattleAllyCombatant[],
  enemyMods: EnemyCombatMods,
): {
  nextEnemy: BattleEnemy;
  nextAllies: BattleAllyCombatant[];
  hits: CombatantHitVsAlly[];
} {
  if (enemy.life <= 0 || !isAllAlliesTargetSkill(skill)) {
    return { nextEnemy: enemy, nextAllies: allies, hits: [] };
  }

  const mana = enemy.mana ?? 0;
  if (mana < skill.manaCost || skill.currentCooldown > 0) {
    return { nextEnemy: enemy, nextAllies: allies, hits: [] };
  }

  const { rawVal, isHeal } = rollSkillValue(skill);
  if (isHeal) {
    return { nextEnemy: enemy, nextAllies: allies, hits: [] };
  }

  const weakenPct = sumStatusEffectPct(enemy.statusEffects, 'weakenDamagePct');
  let baseDamage = Math.max(1, Math.abs(rawVal) + enemyMods.damageBonus);
  baseDamage = Math.max(0, Math.round(baseDamage * (1 - weakenPct / 100)));

  const fromLoadout = skill.id !== BASIC_ATTACK_SKILL_ID;
  const usedSkillId = fromLoadout ? skill.id : null;
  const nextSkills = fromLoadout ? tickCombatantSkillCooldowns(enemy.skills, usedSkillId) : enemy.skills;

  const nextEnemy: BattleEnemy = {
    ...enemy,
    mana: applyManaAfterSkill(mana, skill),
    skills: nextSkills,
  };

  const hits: CombatantHitVsAlly[] = [];
  let nextAllies = allies.map((entry) => ({ ...entry }));
  for (const ally of aliveAllies(nextAllies)) {
    let damage = Math.max(0, baseDamage - ally.damageReduction);
    damage = Math.max(0, Math.round(damage * (1 - sumStatusEffectPct(ally.statusEffects, 'damageReductionPct') / 100)));
    if (damage <= 0) {
      continue;
    }
    nextAllies = nextAllies.map((entry) =>
      entry.id === ally.id ? { ...entry, life: Math.max(0, entry.life - damage) } : entry,
    );
    hits.push({
      actorName: enemy.name,
      targetName: ally.name,
      damage,
      skillName: skill.name,
      manaSpent: skill.manaCost,
      icon: skill.iconHint ?? '🌊',
    });
  }

  return { nextEnemy, nextAllies, hits };
}

export interface CombatantHitVsEnemy {
  actorName: string;
  targetName: string;
  damage: number;
  skillName: string;
  manaSpent: number;
  icon: string;
}

export function resolveAllySkillHitOnEnemy(
  ally: BattleAllyCombatant,
  target: BattleEnemy,
  targetMods: EnemyCombatMods,
  damageMultiplier = 1,
): { nextAlly: BattleAllyCombatant; nextTarget: BattleEnemy; hit: CombatantHitVsEnemy | null } {
  if (ally.isPlayerControlled || ally.life <= 0 || target.life <= 0) {
    return { nextAlly: ally, nextTarget: target, hit: null };
  }

  const mana = ally.mana ?? 0;
  const { skill, fromLoadout } = pickCombatantSkill(ally.skills, mana, ally.level);
  const { rawVal, isHeal } = rollSkillValue(skill);
  if (isHeal) {
    return { nextAlly: ally, nextTarget: target, hit: null };
  }

  let damage = Math.max(1, Math.abs(rawVal) + ally.damageBonus);
  damage = Math.max(1, damage - Math.floor(targetMods.defenseBonus / 2));
  damage = Math.max(1, Math.round(damage * damageMultiplier));

  const usedSkillId = fromLoadout && skill.id !== BASIC_ATTACK_SKILL_ID ? skill.id : null;
  const nextSkills = fromLoadout ? tickCombatantSkillCooldowns(ally.skills, usedSkillId) : ally.skills;

  const nextAlly: BattleAllyCombatant = {
    ...ally,
    mana: applyManaAfterSkill(mana, skill),
    skills: nextSkills,
  };

  const nextTarget: BattleEnemy = {
    ...target,
    life: Math.max(0, target.life - damage),
  };

  return {
    nextAlly,
    nextTarget,
    hit: {
      actorName: ally.name,
      targetName: target.name,
      damage,
      skillName: skill.name,
      manaSpent: skill.manaCost,
      icon: skill.iconHint ?? '⚔️',
    },
  };
}
