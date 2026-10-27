import type { BattleSkill } from '../../models/battle.model';
import type { BattleAllyCombatant, StoryBattleRuntime } from '../../models/story-battle-runtime.model';
import { createBasicAttackSkill } from './combatant.util';
import { aliveAllies } from './combatant.util';
import { syncManualEnemyControlWithParty } from './manual-enemy-turn.util';

export function initManualPartyTurnQueue(allies: BattleAllyCombatant[]): string[] {
  return aliveAllies(allies).map((entry) => entry.id);
}

export function resolveManualTurnState(runtime: StoryBattleRuntime): {
  manualPartyControl: boolean;
  pending: string[];
  activeAllyId: string;
} | null {
  if (runtime.manualPartyControl !== true) {
    return null;
  }

  let pending = runtime.manualPendingAllyIds ?? [];
  const queueReinitialized = pending.length === 0;
  if (queueReinitialized) {
    pending = initManualPartyTurnQueue(runtime.allies);
  }
  pending = pending.filter((id) => {
    const ally = runtime.allies.find((entry) => entry.id === id);
    return !!ally && ally.life > 0;
  });
  if (pending.length === 0) {
    return null;
  }

  const activeAllyId = queueReinitialized
    ? pending[0]
    : pending.includes(runtime.activeAllyId)
      ? runtime.activeAllyId
      : pending[0];

  return { manualPartyControl: true, pending, activeAllyId };
}

export function resolveActingAllySkillList(
  actingAlly: BattleAllyCombatant | undefined,
  runtimeSkills: BattleSkill[],
): BattleSkill[] {
  if (!actingAlly) {
    return runtimeSkills;
  }
  if (actingAlly.isPlayerControlled) {
    return runtimeSkills;
  }
  if (actingAlly.skills?.length) {
    return actingAlly.skills;
  }
  return [createBasicAttackSkill(actingAlly.level)];
}

export function findActingAllySkill(
  actingAlly: BattleAllyCombatant,
  runtimeSkills: BattleSkill[],
  skillId: string,
): BattleSkill | undefined {
  const pool = resolveActingAllySkillList(actingAlly, runtimeSkills);
  return pool.find((entry) => entry.id === skillId);
}

export function isStoryBattlePlayerActionPhase(phase: StoryBattleRuntime['phase']): boolean {
  return phase === 'player_turn' || phase === 'engaged';
}

/** 교전 준비(engaged) → 플레이어 턴 개시. 호스트·파사드에서 단일 진입점으로 사용 */
export function beginStoryBattleEngagement(
  runtime: StoryBattleRuntime,
  autoBattle: boolean,
): StoryBattleRuntime {
  const atPlayerTurn = { ...runtime, phase: 'player_turn' as const };
  return applyManualPartyControlToRuntime(atPlayerTurn, !autoBattle);
}

/** engaged 상태에서 첫 스킬 실행 전 런타임을 player_turn으로 정규화 */
export function normalizeRuntimeForPlayerAction(
  runtime: StoryBattleRuntime,
): StoryBattleRuntime {
  if (runtime.phase !== 'engaged') {
    return runtime;
  }
  const manual = runtime.manualPartyControl === true || runtime.manualPartyControl === undefined;
  return applyManualPartyControlToRuntime({ ...runtime, phase: 'player_turn' }, manual);
}

/** 자동 교전 OFF — 아군 전원이 순차 수동 행동 */
export function applyManualPartyControlToRuntime(
  runtime: StoryBattleRuntime,
  enabled: boolean,
): StoryBattleRuntime {
  if (!enabled) {
    return syncManualEnemyControlWithParty(
      {
        ...runtime,
        manualPartyControl: false,
        manualPendingAllyIds: undefined,
      },
      false,
    );
  }

  const pending = initManualPartyTurnQueue(runtime.allies);
  const activeAllyId = pending.includes(runtime.activeAllyId)
    ? runtime.activeAllyId
    : (pending[0] ?? runtime.activeAllyId);

  return syncManualEnemyControlWithParty(
    {
      ...runtime,
      manualPartyControl: true,
      manualPendingAllyIds: pending,
      activeAllyId,
    },
    true,
  );
}

/** player_turn에서 자동이 꺼져 있으면 전군 수동 큐 보장 */
export function ensureManualPartyControlWhenAutoOff(
  runtime: StoryBattleRuntime,
): StoryBattleRuntime {
  if (runtime.phase === 'engaged') {
    return normalizeRuntimeForPlayerAction(runtime);
  }
  if (runtime.phase === 'player_turn') {
    const state = resolveManualTurnState(runtime);
    if (state) {
      if (runtime.manualPartyControl === true) {
        return runtime;
      }
      return applyManualPartyControlToRuntime(runtime, true);
    }
    return applyManualPartyControlToRuntime(runtime, true);
  }

  if (runtime.manualPartyControl === true) {
    return runtime;
  }
  return { ...runtime, manualPartyControl: true };
}
