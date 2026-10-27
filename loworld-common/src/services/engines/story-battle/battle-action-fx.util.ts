import type { BattleSkill } from '../../models/battle.model';
import type { BattleEnemy } from '../../models/battle.model';
import type { BattleActionFxEvent, BattleActionFxKind } from '../../models/battle-v2-presentation.model';
import { BATTLE_ACTION_FX_ICON } from '../../models/battle-v2-presentation.model';
import type { PlayerActionResult } from './player-action.resolver';

export function skillTypeToFxKind(skill: BattleSkill, isHeal: boolean): BattleActionFxKind {
  if (isHeal) {
    return 'heal';
  }
  switch (skill.type) {
    case 'magic':
      return 'skill';
    case 'buff':
      return 'buff';
    case 'debuff':
      return 'debuff';
    default:
      return 'attack';
  }
}

export function appendAllyPlayerSkillFxEvents(
  fxEvents: BattleActionFxEvent[],
  nextFxId: () => string,
  turnNumber: number,
  skill: BattleSkill,
  playerAction: PlayerActionResult,
  actorName: string,
  isHeal: boolean,
  isCrit: boolean,
  targetEnemy: BattleEnemy | null,
): void {
  const playerFxKind = skillTypeToFxKind(skill, isHeal);
  const fxTargetSide: 'ally' | 'enemy' = isHeal || playerAction.statusApplied?.kind === 'buff' ? 'ally' : 'enemy';

  if (playerAction.aoeHits?.length) {
    fxEvents.push({
      id: nextFxId(),
      turnNumber,
      kind: playerFxKind,
      icon: skill.iconHint ?? BATTLE_ACTION_FX_ICON[playerFxKind as keyof typeof BATTLE_ACTION_FX_ICON],
      label: `${skill.name} · 적 전체`,
      actorName,
      actorSide: 'ally',
      targetSide: 'enemy',
      scope: 'aoe',
      isCritical: isCrit,
    });
    for (const hit of playerAction.aoeHits) {
      fxEvents.push({
        id: nextFxId(),
        turnNumber,
        kind: playerFxKind,
        icon: skill.iconHint ?? '🌊',
        label: skill.name,
        actorName,
        actorSide: 'ally',
        targetName: hit.targetName,
        targetSide: 'enemy',
        amount: hit.damage,
        isCritical: isCrit,
        scope: 'single',
      });
    }
    return;
  }

  const fxTargetName = isHeal
    ? actorName
    : playerAction.statusApplied
      ? playerAction.statusApplied.targetName
      : targetEnemy?.name;
  fxEvents.push({
    id: nextFxId(),
    turnNumber,
    kind: playerFxKind,
    icon: BATTLE_ACTION_FX_ICON[playerFxKind as keyof typeof BATTLE_ACTION_FX_ICON],
    label: isHeal && playerAction.healAmount
      ? `${skill.name} · HP +${playerAction.healAmount}`
      : skill.name,
    actorName,
    actorSide: 'ally',
    targetName: fxTargetName,
    targetSide: fxTargetSide,
    amount: isHeal ? playerAction.healAmount : playerAction.playerDamage,
    isCritical: isCrit,
    scope: 'single',
  });
}
