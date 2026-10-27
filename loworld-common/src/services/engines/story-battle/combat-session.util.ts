import type { BattleEnemy, BattleState } from '../../models/battle.model';
import type { StoryBattleRuntime } from '../../models/story-battle-runtime.model';
import { resolveTargetEnemy } from './combatant.util';

export function isBattleRuntimeConcluded(runtime: StoryBattleRuntime): boolean {
  return runtime.phase === 'victory' || runtime.phase === 'defeat';
}

export function isBattleRuntimeInProgress(runtime: StoryBattleRuntime): boolean {
  return runtime.phase === 'player_turn'
    || runtime.phase === 'engaged'
    || runtime.phase === 'enemy_turn'
    || runtime.phase === 'animating';
}

/** runtime이 존재하면 encounter VM을 투영해야 함 (종결 포함) */
export function shouldProjectBattleEncounter(
  runtime: StoryBattleRuntime | null | undefined,
): runtime is StoryBattleRuntime {
  return runtime != null;
}

/** battle.enemy가 null이 되지 않도록 — 생존 적 없으면 runtime 적 스냅샷 유지 */
export function resolvePrimaryBattleEnemy(
  enemies: BattleEnemy[],
  selectedTargetId: string | null,
  fallback?: BattleEnemy | null,
): BattleEnemy | null {
  return resolveTargetEnemy(enemies, selectedTargetId) ?? enemies[0] ?? fallback ?? null;
}

export function hasBattleEnemyReference(
  runtime: StoryBattleRuntime | null | undefined,
  battle?: BattleState | null,
): boolean {
  if (runtime?.enemies.length) {
    return true;
  }
  return !!battle?.enemy;
}
