import type { AffinityType } from './affinity.model';
import type { BattleEnemy } from './battle.model';
import type { BattleReward, BattleSkill, BattleStateV2 } from './battle.model';
import type { BattleTimelineItemVm } from './battle-v2-presentation.model';
import type { BattleAllyCombatantVm, BattleProseEntry } from './story-battle-vm.model';

export interface StoryBattleCombatModifiers {
  playerDamageBonus: number;
  playerDamageReduction: number;
  enemyDamageBonus: number;
  enemyDefenseBonus: number;
}

export interface BattleAllyCombatant extends BattleAllyCombatantVm {
  damageBonus: number;
  damageReduction: number;
  elementAffinity?: AffinityType;
}

export interface EnemyCombatMods {
  damageBonus: number;
  defenseBonus: number;
}

export interface StoryBattleRuntime {
  phase: BattleStateV2['phase'];
  skills: BattleSkill[];
  timeline: BattleTimelineItemVm[];
  currentNarrative: string | null;
  rewards: BattleReward[];
  allies: BattleAllyCombatant[];
  enemies: BattleEnemy[];
  activeAllyId: string;
  selectedTargetId: string | null;
  enemyCombatMods: Record<string, EnemyCombatMods>;
  proseEntries: BattleProseEntry[];
  /** 아군(플레이어·AI) 가하는 피해 배율 — 전투 테스트 가속용 */
  damageMultiplier: number;
  /** true: 참전 전원 순차 수동 조작 (자동 동료 AI 비활성) */
  manualPartyControl?: boolean;
  /** 수동 아군 턴 — 아직 행동하지 않은 아군 id (순서) */
  manualPendingAllyIds?: string[];
  /** true: 적군 턴 페이즈에서 순차 수동(또는 호스트 자동) 행동 */
  manualEnemyControl?: boolean;
  /** 수동 적군 페이즈 — 미행동 적 id */
  manualPendingEnemyIds?: string[];
  /** 적군 턴 현재 행동 적 */
  activeEnemyId?: string;
  /** 적군 턴 공격 대상 아군 */
  selectedAllyTargetId?: string | null;
}
