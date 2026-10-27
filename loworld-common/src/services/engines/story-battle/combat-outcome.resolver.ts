import type { BattleEnemy } from '../../models/battle.model';
import type { BattleStateV2 } from '../../models/battle.model';
import type { BattleAllyCombatant } from '../../models/story-battle-runtime.model';
import { aliveAllies, aliveEnemies } from './combatant.util';

export type CombatOutcome = 'victory' | 'defeat' | 'ongoing';

/** 적 전멸 → 승리. 적이 남아 있는데 아군 전원 전투 불능 또는 주인공(리더) 전사 → 패배. */
export function resolveCombatOutcome(
  enemies: BattleEnemy[],
  allies: BattleAllyCombatant[],
): CombatOutcome {
  if (aliveEnemies(enemies).length === 0) {
    return 'victory';
  }

  if (aliveAllies(allies).length === 0) {
    return 'defeat';
  }

  return 'ongoing';
}

/** 턴 종료 직전 — 적 전멸/아군 전멸과 phase 불일치를 한 번 더 보정한다. */
export function resolveFinalCombatOutcome(
  enemies: BattleEnemy[],
  allies: BattleAllyCombatant[],
): CombatOutcome {
  return resolveCombatOutcome(enemies, allies);
}

export function combatOutcomeToPhase(outcome: CombatOutcome): BattleStateV2['phase'] {
  switch (outcome) {
    case 'victory':
      return 'victory';
    case 'defeat':
      return 'defeat';
    default:
      return 'player_turn';
  }
}

export function appendOutcomeNarrative(narrative: string, outcome: CombatOutcome): string {
  switch (outcome) {
    case 'victory':
      return `${narrative} 적 전멸!`;
    case 'defeat':
      return `${narrative} 아군이 전멸했습니다.`;
    default:
      return narrative;
  }
}
