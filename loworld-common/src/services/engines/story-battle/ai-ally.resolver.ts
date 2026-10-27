import type { BattleEnemy } from '../../models/battle.model';
import type { BattleAllyCombatant, EnemyCombatMods } from '../../models/story-battle-runtime.model';
import { resolveAllySkillHitOnEnemy, type CombatantHitVsEnemy } from './combatant-action.util';

export interface AiAllyAttackResult {
  allies: BattleAllyCombatant[];
  enemies: BattleEnemy[];
  aiParts: string[];
  aiHits: CombatantHitVsEnemy[];
}

export function applyAiAllyAttacks(
  allies: BattleAllyCombatant[],
  enemies: BattleEnemy[],
  enemyCombatMods: Record<string, EnemyCombatMods>,
  damageMultiplier = 1,
): AiAllyAttackResult {
  const aiParts: string[] = [];
  const aiHits: CombatantHitVsEnemy[] = [];
  const nextAllies = allies.map((entry) => ({ ...entry }));
  const nextEnemies = enemies.map((entry) => ({ ...entry }));
  const alive = () => nextEnemies.filter((entry) => entry.life > 0);

  for (let allyIndex = 0; allyIndex < nextAllies.length; allyIndex += 1) {
    const ally = nextAllies[allyIndex];
    if (ally.isPlayerControlled || ally.life <= 0) {
      continue;
    }
    const targets = alive();
    if (targets.length === 0) {
      break;
    }
    const target = targets[Math.floor(Math.random() * targets.length)];
    const targetIndex = nextEnemies.findIndex((entry) => entry.id === target.id);
    if (targetIndex < 0) {
      continue;
    }
    const mods = enemyCombatMods[target.id] ?? { damageBonus: 0, defenseBonus: 0 };
    const result = resolveAllySkillHitOnEnemy(
      ally,
      nextEnemies[targetIndex],
      mods,
      damageMultiplier,
    );
    nextAllies[allyIndex] = result.nextAlly;
    nextEnemies[targetIndex] = result.nextTarget;
    if (!result.hit) {
      continue;
    }
    const mpNote = result.hit.manaSpent > 0 ? ` MP-${result.hit.manaSpent}` : '';
    aiParts.push(`${result.hit.actorName} ${result.hit.skillName} → ${result.hit.targetName} ${result.hit.damage}${mpNote}`);
    aiHits.push(result.hit);
  }

  return { allies: nextAllies, enemies: nextEnemies, aiParts, aiHits };
}
