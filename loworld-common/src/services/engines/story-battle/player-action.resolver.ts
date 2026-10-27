import type { BattleSkill } from '../../models/battle.model';
import type { BattleEnemy } from '../../models/battle.model';
import type { BattleAllyCombatant, EnemyCombatMods, StoryBattleCombatModifiers } from '../../models/story-battle-runtime.model';
import { affinityTypeEmoji, applyElementAffinityToDamage } from '../affinity.engine';
import { calculatePlayerAttackDamage } from './damage.util';
import { createStatusEffectFromSkill, upsertStatusEffect } from './status-effect.util';
import { aliveEnemies } from './combatant.util';
import { isAllEnemiesTargetSkill } from './aoe-skill.util';

export interface AoeHitInfo {
  targetId: string;
  targetName: string;
  damage: number;
}

export interface StatusAppliedInfo {
  kind: 'buff' | 'debuff';
  targetName: string;
  label: string;
  durationTurns: number;
}

export interface PlayerActionResult {
  allies: BattleAllyCombatant[];
  enemies: BattleEnemy[];
  nextPlayerHp: number;
  narrative: string;
  playerDamage?: number;
  healAmount?: number;
  targetWasDefeated: boolean;
  statusApplied?: StatusAppliedInfo;
  isHeal: boolean;
  isCrit: boolean;
  aoeHits?: AoeHitInfo[];
}

export interface PlayerActionInput {
  skill: BattleSkill;
  rawVal: number;
  isHeal: boolean;
  isCrit: boolean;
  allies: BattleAllyCombatant[];
  enemies: BattleEnemy[];
  activeAllyId: string;
  targetEnemy: BattleEnemy | null;
  playerHp: number;
  playerMaxHp: number;
  playerName: string;
  enemyCombatMods: Record<string, EnemyCombatMods>;
  equipmentModifiers: StoryBattleCombatModifiers;
  allyDamageBonus: number;
  damageMultiplier?: number;
}

export function applyPlayerAction(input: PlayerActionInput): PlayerActionResult {
  const {
    skill,
    rawVal,
    isHeal,
    isCrit,
    activeAllyId,
    targetEnemy,
    playerHp,
    playerMaxHp,
    playerName,
    equipmentModifiers,
    allyDamageBonus,
  } = input;

  let nextAllies = input.allies;
  let nextEnemies = input.enemies;
  let nextPlayerHp = playerHp;
  let narrative = '';
  let playerDamage: number | undefined;
  let healAmount: number | undefined;
  let targetWasDefeated = false;
  let statusApplied: StatusAppliedInfo | undefined;

  if (isHeal) {
    healAmount = Math.abs(rawVal);
    nextPlayerHp = Math.min(playerMaxHp, playerHp + healAmount);
    narrative = `[${skill.name}] 체력 ${healAmount} 회복.`;
  } else if (skill.type === 'buff') {
    const buffEffect = createStatusEffectFromSkill(skill, 'buff');
    nextAllies = nextAllies.map((entry) =>
      entry.id === activeAllyId
        ? { ...entry, statusEffects: upsertStatusEffect(entry.statusEffects, buffEffect) }
        : entry,
    );
    narrative = `[${skill.name}] ${playerName}에게 ${buffEffect.label} 효과 부여 (${buffEffect.remainingTurns}턴).`;
    statusApplied = {
      kind: 'buff',
      targetName: playerName,
      label: buffEffect.label,
      durationTurns: buffEffect.remainingTurns,
    };
  } else if (skill.type === 'debuff' && targetEnemy) {
    const debuffEffect = createStatusEffectFromSkill(skill, 'debuff');
    nextEnemies = nextEnemies.map((entry) =>
      entry.id === targetEnemy.id
        ? { ...entry, statusEffects: upsertStatusEffect(entry.statusEffects, debuffEffect) }
        : entry,
    );
    narrative = `[${skill.name}] ${targetEnemy.name}에게 ${debuffEffect.label} 효과 부여 (${debuffEffect.remainingTurns}턴).`;
    statusApplied = {
      kind: 'debuff',
      targetName: targetEnemy.name,
      label: debuffEffect.label,
      durationTurns: debuffEffect.remainingTurns,
    };
  } else if (isAllEnemiesTargetSkill(skill)) {
    const activeAlly = nextAllies.find((entry) => entry.id === activeAllyId);
    const hits: AoeHitInfo[] = [];
    let totalDamage = 0;
    for (const enemy of aliveEnemies(nextEnemies)) {
      const targetMods = input.enemyCombatMods[enemy.id] ?? {
        damageBonus: 0,
        defenseBonus: equipmentModifiers.enemyDefenseBonus,
      };
      const damage = calculatePlayerAttackDamage({
        rawVal,
        isCrit,
        skill,
        targetEnemy: enemy,
        targetMods,
        equipmentDamageBonus: equipmentModifiers.playerDamageBonus,
        allyDamageBonus,
        attackerAffinity: activeAlly?.elementAffinity ?? 'none',
        damageMultiplier: input.damageMultiplier ?? 1,
      });
      hits.push({ targetId: enemy.id, targetName: enemy.name, damage });
      totalDamage += damage;
    }
    nextEnemies = nextEnemies.map((entry) => {
      const hit = hits.find((h) => h.targetId === entry.id);
      if (!hit) {
        return entry;
      }
      return { ...entry, life: Math.max(0, entry.life - hit.damage) };
    });
    playerDamage = totalDamage;
    const parts = hits.map((h) => `${h.targetName} ${h.damage}`).join(', ');
    narrative = isCrit
      ? `💥 치명타! [${skill.name}] 적 전체 ${totalDamage} ( ${parts} ).`
      : `[${skill.name}] 적 전체 ${totalDamage} ( ${parts} ).`;
    targetWasDefeated = hits.some((h) =>
      nextEnemies.find((entry) => entry.id === h.targetId)?.life === 0,
    );
    return {
      allies: nextAllies,
      enemies: nextEnemies,
      nextPlayerHp,
      narrative,
      playerDamage,
      healAmount,
      targetWasDefeated,
      statusApplied,
      isHeal,
      isCrit,
      aoeHits: hits,
    };
  } else if (targetEnemy) {
    const targetMods = input.enemyCombatMods[targetEnemy.id] ?? {
      damageBonus: 0,
      defenseBonus: equipmentModifiers.enemyDefenseBonus,
    };
    const activeAlly = nextAllies.find((entry) => entry.id === activeAllyId);
    const totalDamage = calculatePlayerAttackDamage({
      rawVal,
      isCrit,
      skill,
      targetEnemy,
      targetMods,
      equipmentDamageBonus: equipmentModifiers.playerDamageBonus,
      allyDamageBonus,
      attackerAffinity: activeAlly?.elementAffinity ?? 'none',
      damageMultiplier: input.damageMultiplier ?? 1,
    });
    playerDamage = totalDamage;
    nextEnemies = nextEnemies.map((entry) =>
      entry.id === targetEnemy.id
        ? { ...entry, life: Math.max(0, entry.life - totalDamage) }
        : entry,
    );
    const skillAffinity = skill.affinity ?? 'none';
    const defenderAffinity = targetEnemy.affinity ?? 'none';
    const affinityPreview = applyElementAffinityToDamage(
      totalDamage,
      skillAffinity,
      activeAlly?.elementAffinity ?? 'none',
      defenderAffinity,
    );
    const affinityNote =
      skillAffinity !== 'none' && affinityPreview.multiplier !== 1
        ? ` ${affinityTypeEmoji(skillAffinity)} ${affinityPreview.relationLabel}`
        : affinityPreview.isSameElementBonus
          ? ` ${affinityTypeEmoji(skillAffinity)} 자속 보너스`
          : '';
    narrative = isCrit
      ? `💥 치명타! [${skill.name}] ${targetEnemy.name}에게 ${totalDamage} 피해.${affinityNote}`
      : `[${skill.name}] ${targetEnemy.name}에게 ${totalDamage} 피해.${affinityNote}`;
    targetWasDefeated = nextEnemies.find((entry) => entry.id === targetEnemy.id)?.life === 0;
  }

  return {
    allies: nextAllies,
    enemies: nextEnemies,
    nextPlayerHp,
    narrative,
    playerDamage,
    healAmount,
    targetWasDefeated,
    statusApplied,
    isHeal,
    isCrit,
  };
}
