import type { BattleEnemy, BattleStatusEffect } from '../../models/battle.model';
import type { EnemyCombatMods } from '../../models/story-battle-runtime.model';
import { resolveEnemySkillHitOnAlly, type CombatantHitVsAlly } from './combatant-action.util';
import { sumStatusEffectPct } from './status-effect.util';

export interface EnemyCounterResult {
  enemies: BattleEnemy[];
  nextPlayerHp: number;
  counterParts: string[];
  counterHits: CombatantHitVsAlly[];
  totalCounter: number;
}

export function applyEnemyCounters(
  enemies: BattleEnemy[],
  enemyCombatMods: Record<string, EnemyCombatMods>,
  playerDamageReduction: number,
  nextPlayerHp: number,
  activeAllyStatusEffects: BattleStatusEffect[] | undefined = undefined,
): EnemyCounterResult {
  let hp = nextPlayerHp;
  const counterParts: string[] = [];
  const counterHits: CombatantHitVsAlly[] = [];
  let totalCounter = 0;
  let nextEnemies = enemies.map((entry) => ({ ...entry }));
  const allyReductionPct = sumStatusEffectPct(activeAllyStatusEffects, 'damageReductionPct');

  for (let index = 0; index < nextEnemies.length; index += 1) {
    const enemy = nextEnemies[index];
    if (enemy.life <= 0 || hp <= 0) {
      continue;
    }
    const mods = enemyCombatMods[enemy.id] ?? { damageBonus: 0, defenseBonus: 0 };
    const result = resolveEnemySkillHitOnAlly(
      enemy,
      mods,
      playerDamageReduction,
      allyReductionPct,
    );
    nextEnemies[index] = result.nextEnemy;
    if (!result.hit || result.hit.damage <= 0) {
      continue;
    }
    hp = Math.max(0, hp - result.hit.damage);
    totalCounter += result.hit.damage;
    const mpNote = result.hit.manaSpent > 0 ? ` MP-${result.hit.manaSpent}` : '';
    counterParts.push(`${result.hit.actorName} ${result.hit.skillName} ${result.hit.damage}${mpNote}`);
    counterHits.push(result.hit);
  }

  return { enemies: nextEnemies, nextPlayerHp: hp, counterParts, counterHits, totalCounter };
}
