import type { BattleSkill } from '../../models/battle.model';
import type { BattleEnemy } from '../../models/battle.model';
import type { StoryBattleRuntime } from '../../models/story-battle-runtime.model';
import { createBasicAttackSkill } from './combatant.util';
import { aliveAllies, aliveEnemies, findPlayerControlledAlly } from './combatant.util';

export function initManualEnemyTurnQueue(enemies: BattleEnemy[]): string[] {
  return aliveEnemies(enemies).map((entry) => entry.id);
}

export function pickDefaultAllyTargetId(allies: StoryBattleRuntime['allies']): string | null {
  const lead = findPlayerControlledAlly(allies);
  if (lead) {
    return lead.id;
  }
  const living = aliveAllies(allies);
  return living[0]?.id ?? null;
}

export function beginEnemyTurnRuntime(runtime: StoryBattleRuntime): StoryBattleRuntime {
  const pending = initManualEnemyTurnQueue(runtime.enemies);
  const activeEnemyId = pending[0] ?? runtime.activeEnemyId ?? runtime.enemies[0]?.id;
  const selectedAllyTargetId = pickDefaultAllyTargetId(runtime.allies);

  return {
    ...runtime,
    phase: 'enemy_turn',
    manualPendingEnemyIds: pending,
    activeEnemyId,
    selectedAllyTargetId,
  };
}

export function resolveManualEnemyTurnState(runtime: StoryBattleRuntime): {
  pending: string[];
  activeEnemyId: string;
} | null {
  if (runtime.phase !== 'enemy_turn') {
    return null;
  }

  let pending = runtime.manualPendingEnemyIds ?? [];
  const queueReinitialized = pending.length === 0;
  if (queueReinitialized) {
    pending = initManualEnemyTurnQueue(runtime.enemies);
  }
  pending = pending.filter((id) => {
    const enemy = runtime.enemies.find((entry) => entry.id === id);
    return !!enemy && enemy.life > 0;
  });
  if (pending.length === 0) {
    return null;
  }

  const activeEnemyId = queueReinitialized
    ? pending[0]
    : pending.includes(runtime.activeEnemyId ?? '')
      ? (runtime.activeEnemyId as string)
      : pending[0];

  return { pending, activeEnemyId };
}

export function resolveActingEnemySkillList(enemy: BattleEnemy | undefined): BattleSkill[] {
  if (!enemy) {
    return [];
  }
  if (enemy.skills?.length) {
    return enemy.skills;
  }
  return [createBasicAttackSkill(enemy.level)];
}

export function findActingEnemySkill(enemy: BattleEnemy, skillId: string): BattleSkill | undefined {
  return resolveActingEnemySkillList(enemy).find((entry) => entry.id === skillId);
}

export function syncManualEnemyControlWithParty(runtime: StoryBattleRuntime, partyManual: boolean): StoryBattleRuntime {
  if (!partyManual) {
    return {
      ...runtime,
      manualEnemyControl: false,
      manualPendingEnemyIds: undefined,
      activeEnemyId: undefined,
      selectedAllyTargetId: undefined,
    };
  }
  return { ...runtime, manualEnemyControl: true };
}
