import type { BattleSkill } from '../../models/battle.model';
import type { BattleActionFxEvent, BattleTimelineItemVm } from '../../models/battle-v2-presentation.model';
import { BATTLE_ACTION_FX_ICON } from '../../models/battle-v2-presentation.model';
import type { BattleEnemy, BattleLogEntry, BattleState as LegacyBattleState } from '../../models/battle.model';
import type { Character } from '../../models/character.model';
import type { BattleAllyCombatant, StoryBattleCombatModifiers, StoryBattleRuntime } from '../../models/story-battle-runtime.model';
import type { PlayerActionResult } from './player-action.resolver';
import { buildBattleTurnProse, latestTurnProseSummary } from '../../utils/story-battle-prose.util';
import { applyAiAllyAttacks } from './ai-ally.resolver';
import { applyManaAfterSkill, tickCombatantSkillCooldowns } from './combatant-action.util';
import { findActingAllySkill } from './manual-turn.util';
import { aliveEnemies, reconcilePartyLeadership, resolveActingAllyVitals, resolvePlayerVitals, resolveTargetEnemy, syncPlayerAllyHp } from './combatant.util';
import { isStoryBattlePlayerActionPhase, normalizeRuntimeForPlayerAction, resolveManualTurnState } from './manual-turn.util';
import { resolvePrimaryBattleEnemy } from './combat-session.util';
import { appendOutcomeNarrative, combatOutcomeToPhase, resolveCombatOutcome, resolveFinalCombatOutcome } from './combat-outcome.resolver';
import { rollSkillValue } from './damage.util';
import { applyEnemyCounters } from './enemy-counter.resolver';
import { beginEnemyTurnRuntime } from './manual-enemy-turn.util';
import { applyPlayerAction } from './player-action.resolver';
import { tickStatusEffects } from './status-effect.util';
import { appendAllyPlayerSkillFxEvents } from './battle-action-fx.util';
import { isAllEnemiesTargetSkill } from './aoe-skill.util';

type BattleState = LegacyBattleState;

function syncActiveAllyVitals(
  allies: BattleAllyCombatant[],
  activeAllyId: string,
  life: number,
  mana: number,
  manualPartyControl: boolean,
): { allies: BattleAllyCombatant[]; activeAllyId: string; life: number } {
  const synced = syncPlayerAllyHp(allies, activeAllyId, life, mana);
  if (manualPartyControl) {
    return { allies: synced, activeAllyId, life };
  }
  const reconciled = reconcilePartyLeadership(synced, activeAllyId);
  let nextLife = life;
  if (reconciled.leadershipChanged && reconciled.lead) {
    nextLife = reconciled.lead.life;
  }
  return {
    allies: reconciled.allies,
    activeAllyId: reconciled.activeAllyId,
    life: nextLife,
  };
}

export interface StoryBattleSkillActionResult {
  runtime: StoryBattleRuntime;
  battle: BattleState;
  character: Character;
  logEntries: BattleLogEntry[];
  fxEvents: BattleActionFxEvent[];
}

interface ManualMidTurnParams {
  runtime: StoryBattleRuntime;
  battle: BattleState;
  character: Character;
  skill: BattleSkill;
  skillId: string;
  playerVitals: ReturnType<typeof resolveActingAllyVitals>;
  playerAction: PlayerActionResult;
  isHeal: boolean;
  isCrit: boolean;
  narrative: string;
  nextAllies: BattleAllyCombatant[];
  nextEnemies: BattleEnemy[];
  nextPlayerHp: number;
  nextMp: number;
  activeAllyId: string;
  nextPending: string[];
  targetEnemy: BattleEnemy | null;
  targetId: string | null;
  nextLogId: () => string;
  actingAlly: BattleAllyCombatant;
}

function buildManualMidTurnResult(params: ManualMidTurnParams): StoryBattleSkillActionResult {
  const {
    runtime,
    battle,
    character,
    skill,
    skillId,
    playerVitals,
    playerAction,
    isHeal,
    isCrit,
    narrative,
    nextAllies,
    nextEnemies,
    nextPlayerHp,
    nextMp,
    activeAllyId,
    nextPending,
    targetEnemy,
    nextLogId,
    actingAlly,
  } = params;

  const nextActiveId = nextPending[0] ?? activeAllyId;
  const proseSummary = narrative;
  const nextSkills = actingAlly.isPlayerControlled
    ? runtime.skills.map((entry) => ({
        ...entry,
        currentCooldown:
          entry.id === skillId
            ? entry.cooldownTurns
            : Math.max(0, entry.currentCooldown - 1),
      }))
    : runtime.skills;

  let alliesWithCooldowns = nextAllies;
  if (!actingAlly.isPlayerControlled) {
    alliesWithCooldowns = nextAllies.map((entry) =>
      entry.id === activeAllyId
        ? {
            ...entry,
            mana: nextMp,
            life: nextPlayerHp,
            skills: tickCombatantSkillCooldowns(entry.skills, skillId),
          }
        : entry,
    );
  }

  const nextRuntime: StoryBattleRuntime = {
    ...runtime,
    phase: 'player_turn',
    skills: nextSkills,
    currentNarrative: proseSummary,
    proseEntries: runtime.proseEntries,
    allies: alliesWithCooldowns,
    enemies: nextEnemies,
    activeAllyId: nextActiveId,
    manualPartyControl: true,
    manualPendingAllyIds: nextPending,
  };

  const nextCharacter: Character = actingAlly.isPlayerControlled
    ? {
        ...character,
        stats: {
          ...character.stats,
          life: nextPlayerHp,
          mana: nextMp,
        },
      }
    : character;

  const logEntries: BattleLogEntry[] = [{ id: nextLogId(), message: narrative }];
  const fxEvents: BattleActionFxEvent[] = [];
  let midFxSeq = 0;
  appendAllyPlayerSkillFxEvents(
    fxEvents,
    () => `fx-${battle.turn}-mid-${activeAllyId}-${++midFxSeq}`,
    battle.turn,
    skill,
    playerAction,
    playerVitals.playerName,
    isHeal,
    isCrit,
    targetEnemy,
  );

  return {
    runtime: nextRuntime,
    battle: {
      ...battle,
      logs: [...battle.logs, ...logEntries],
    },
    character: nextCharacter,
    logEntries,
    fxEvents,
  };
}

export function executeStoryBattleTurn(
  character: Character,
  battle: BattleState,
  runtime: StoryBattleRuntime,
  skillId: string,
  nextLogId: () => string,
  equipmentModifiers: StoryBattleCombatModifiers = {
    playerDamageBonus: 0,
    playerDamageReduction: 0,
    enemyDamageBonus: 0,
    enemyDefenseBonus: 0,
  },
  targetEnemyId?: string | null,
): StoryBattleSkillActionResult | null {
  if (!isStoryBattlePlayerActionPhase(runtime.phase)) {
    return null;
  }

  const activeRuntime = normalizeRuntimeForPlayerAction(runtime);

  if (aliveEnemies(activeRuntime.enemies).length === 0) {
    return null;
  }

  const manualState = resolveManualTurnState(activeRuntime);
  const manualPartyControl = manualState !== null;

  let activeAllyId: string;
  let workingAllies: BattleAllyCombatant[];
  let manualPending: string[] = [];

  if (manualState) {
    manualPending = manualState.pending;
    activeAllyId = manualState.activeAllyId;
    workingAllies = activeRuntime.allies;
  } else {
    const leadershipAtTurnStart = reconcilePartyLeadership(activeRuntime.allies, activeRuntime.activeAllyId);
    activeAllyId = leadershipAtTurnStart.activeAllyId;
    workingAllies = leadershipAtTurnStart.allies;
  }

  const actingAlly = workingAllies.find((entry) => entry.id === activeAllyId);
  if (!actingAlly || actingAlly.life <= 0) {
    return null;
  }

  const skill = findActingAllySkill(actingAlly, activeRuntime.skills, skillId);
  if (!skill) {
    return null;
  }

  const playerVitals = resolveActingAllyVitals(character, workingAllies, activeAllyId);
  let nextPlayerHp = playerVitals.life;
  if (playerVitals.mana < skill.manaCost) {
    return null;
  }

  let nextEnemies = tickStatusEffects(activeRuntime.enemies);
  let nextAllies = tickStatusEffects(workingAllies);
  const targetId = targetEnemyId ?? activeRuntime.selectedTargetId;
  const targetEnemy = resolveTargetEnemy(nextEnemies, targetId);

  if (!targetEnemy && !isAllEnemiesTargetSkill(skill) && !skill.damageRange[0] && skill.type !== 'heal') {
    return null;
  }

  const nextMp = applyManaAfterSkill(playerVitals.mana, skill);
  const { rawVal, isHeal, isCrit } = rollSkillValue(skill);

  const actionEquipmentMods = actingAlly.isPlayerControlled
    ? equipmentModifiers
    : {
        ...equipmentModifiers,
        playerDamageBonus: 0,
        playerDamageReduction: 0,
      };

  const playerAction = applyPlayerAction({
    skill,
    rawVal,
    isHeal,
    isCrit,
    allies: nextAllies,
    enemies: nextEnemies,
    activeAllyId,
    targetEnemy,
    playerHp: playerVitals.life,
    playerMaxHp: playerVitals.maxLife,
    playerName: playerVitals.playerName,
    enemyCombatMods: activeRuntime.enemyCombatMods,
    equipmentModifiers: {
      ...actionEquipmentMods,
      playerDamageBonus: actingAlly.isPlayerControlled ? actionEquipmentMods.playerDamageBonus : 0,
      playerDamageReduction: actingAlly.isPlayerControlled ? actionEquipmentMods.playerDamageReduction : 0,
    },
    allyDamageBonus: playerVitals.damageBonus,
    damageMultiplier: activeRuntime.damageMultiplier ?? 1,
  });

  nextAllies = playerAction.allies;
  nextEnemies = playerAction.enemies;
  nextPlayerHp = playerAction.nextPlayerHp;
  let narrative = playerAction.narrative;
  let totalCounter = 0;
  let counterHits: import('./enemy-counter.resolver').EnemyCounterResult['counterHits'] = [];
  let aiHits: import('./ai-ally.resolver').AiAllyAttackResult['aiHits'] = [];

  if (isHeal && playerAction.healAmount) {
    narrative = `${playerAction.narrative.replace(/\.$/, '')} · 스킬 회복 +${playerAction.healAmount} HP.`;
  }

  const playerDamageReduction = playerVitals.damageReduction;

  ({
    allies: nextAllies,
    activeAllyId,
    life: nextPlayerHp,
  } = syncActiveAllyVitals(nextAllies, activeAllyId, nextPlayerHp, nextMp, manualPartyControl));

  let outcome = resolveCombatOutcome(nextEnemies, nextAllies);

  if (outcome !== 'ongoing') {
    narrative = appendOutcomeNarrative(narrative, outcome);
  } else if (manualPartyControl) {
    const nextPending = manualPending.filter((id) => id !== activeAllyId);
    if (nextPending.length > 0) {
      return buildManualMidTurnResult({
        runtime: activeRuntime,
        battle,
        character,
        skill,
        skillId,
        playerVitals,
        playerAction,
        isHeal,
        isCrit,
        narrative,
        nextAllies,
        nextEnemies,
        nextPlayerHp,
        nextMp,
        activeAllyId,
        nextPending,
        targetEnemy,
        targetId,
        nextLogId,
        actingAlly,
      });
    }
  }

  if (outcome === 'ongoing' && !isHeal) {
    const activeAllyStatusEffects = nextAllies.find((entry) => entry.id === activeAllyId)?.statusEffects;
    const deferEnemyToPhase = true;

    if (!deferEnemyToPhase) {
      const counterResult = applyEnemyCounters(
        nextEnemies,
        activeRuntime.enemyCombatMods,
        playerDamageReduction,
        nextPlayerHp,
        activeAllyStatusEffects,
      );
      nextEnemies = counterResult.enemies;
      nextPlayerHp = counterResult.nextPlayerHp;
      totalCounter = counterResult.totalCounter;
      counterHits = counterResult.counterHits;
      if (counterResult.counterParts.length > 0) {
        narrative += ` 반격: ${counterResult.counterParts.join(' · ')}.`;
      }

      nextAllies = syncPlayerAllyHp(nextAllies, activeAllyId, nextPlayerHp, nextMp);

      if (!manualPartyControl && nextPlayerHp > 0 && aliveEnemies(nextEnemies).length > 0) {
        const aiResult = applyAiAllyAttacks(
          nextAllies,
          nextEnemies,
          activeRuntime.enemyCombatMods,
          activeRuntime.damageMultiplier ?? 1,
        );
        nextAllies = aiResult.allies;
        nextEnemies = aiResult.enemies;
        aiHits = aiResult.aiHits;
        if (aiResult.aiParts.length > 0) {
          narrative += ` 동료: ${aiResult.aiParts.join(' · ')}.`;
        }
      }

      ({
        allies: nextAllies,
        activeAllyId,
        life: nextPlayerHp,
      } = syncActiveAllyVitals(nextAllies, activeAllyId, nextPlayerHp, nextMp, manualPartyControl));

      outcome = resolveCombatOutcome(nextEnemies, nextAllies);
    }
  }

  outcome = resolveFinalCombatOutcome(nextEnemies, nextAllies);

  if (outcome !== 'ongoing') {
    narrative = appendOutcomeNarrative(narrative, outcome);
  }

  const nextPhase = outcome === 'ongoing' ? 'enemy_turn' : combatOutcomeToPhase(outcome);
  const battlePhase: BattleState['phase'] = outcome === 'victory' ? 'victory' : 'engaged';
  const incrementTurn = outcome !== 'ongoing';

  const nextSelectedTarget = resolveTargetEnemy(nextEnemies, targetEnemy?.id ?? targetId)?.id ?? null;
  const outcomePhase = outcome === 'victory' ? 'victory' : outcome === 'defeat' ? 'defeat' : 'ongoing';

  const turnProse = buildBattleTurnProse({
    turnNumber: battle.turn,
    playerName: playerVitals.playerName,
    skill,
    isHeal: playerAction.isHeal,
    isCrit: playerAction.isCrit,
    damage: playerAction.playerDamage,
    healAmount: playerAction.healAmount,
    targetEnemy: targetEnemy ?? undefined,
    targetWasDefeated: playerAction.targetWasDefeated,
    statusApplied: playerAction.statusApplied,
    counterParts: counterHits.map((hit) => ({
      enemyName: hit.actorName,
      damage: hit.damage,
      skillName: hit.skillName,
      manaSpent: hit.manaSpent,
    })),
    aiParts: aiHits.map((hit) => ({
      allyName: hit.actorName,
      targetName: hit.targetName,
      damage: hit.damage,
      skillName: hit.skillName,
      manaSpent: hit.manaSpent,
    })),
    outcomePhase,
    nextEntryId: () => nextLogId(),
  });

  const nextProseEntries = [...activeRuntime.proseEntries, ...turnProse];
  const proseSummary = latestTurnProseSummary(nextProseEntries, battle.turn) || narrative;

  const timelineItem: BattleTimelineItemVm = {
    turnNumber: battle.turn,
    playerSkillName: isHeal && playerAction.healAmount
      ? `${skill.name} (+${playerAction.healAmount} HP)`
      : skill.name,
    playerDamage: isHeal ? undefined : playerAction.playerDamage,
    isCritical: isCrit,
    enemySkillName: totalCounter > 0 && !isHeal && counterHits[0]?.skillName
      ? counterHits[0].skillName
      : totalCounter > 0 && !isHeal
        ? '반격'
        : undefined,
    enemyDamage: totalCounter > 0 && !isHeal ? totalCounter : undefined,
    resultNarrative: proseSummary,
    tone: nextPhase === 'victory' ? 'success' : nextPhase === 'defeat' ? 'danger' : 'neutral',
  };

  const nextSkills = actingAlly.isPlayerControlled
    ? activeRuntime.skills.map((entry) => ({
        ...entry,
        currentCooldown:
          entry.id === skillId
            ? entry.cooldownTurns
            : Math.max(0, entry.currentCooldown - 1),
      }))
    : activeRuntime.skills;

  if (!actingAlly.isPlayerControlled) {
    nextAllies = nextAllies.map((entry) =>
      entry.id === activeAllyId
        ? {
            ...entry,
            mana: nextMp,
            life: nextPlayerHp,
            skills: tickCombatantSkillCooldowns(entry.skills, skillId),
          }
        : entry,
    );
  }

  ({
    allies: nextAllies,
    activeAllyId,
    life: nextPlayerHp,
  } = syncActiveAllyVitals(nextAllies, activeAllyId, nextPlayerHp, nextMp, manualPartyControl));

  const leadVitals = resolvePlayerVitals(
    { ...character, stats: { ...character.stats, life: nextPlayerHp, mana: nextMp } },
    nextAllies,
    activeAllyId,
  );

  let nextRuntime: StoryBattleRuntime = {
    ...activeRuntime,
    phase: nextPhase,
    skills: nextSkills,
    timeline: [...activeRuntime.timeline, timelineItem],
    currentNarrative: proseSummary,
    proseEntries: nextProseEntries,
    allies: nextAllies,
    enemies: nextEnemies,
    selectedTargetId: nextSelectedTarget,
    activeAllyId,
    manualPendingAllyIds: manualPartyControl ? [] : activeRuntime.manualPendingAllyIds,
  };

  if (nextPhase === 'enemy_turn') {
    nextRuntime = beginEnemyTurnRuntime(nextRuntime);
  }

  const nextCharacter: Character = actingAlly.isPlayerControlled
    ? {
        ...character,
        stats: {
          ...character.stats,
          life: nextPlayerHp,
          maxLife: leadVitals.maxLife,
          mana: nextMp,
          maxMana: leadVitals.maxMana,
        },
      }
    : character;

  const logEntries: BattleLogEntry[] = [{ id: nextLogId(), message: narrative }];
  if (isCrit && !isHeal) {
    logEntries[0] = { ...logEntries[0], emphasis: 'critical' };
  }
  if (nextPhase === 'victory') {
    logEntries.push({ id: nextLogId(), message: '전투에서 승리했습니다.', emphasis: 'loot' });
  }

  const primaryEnemy = resolvePrimaryBattleEnemy(nextEnemies, nextSelectedTarget, battle.enemy);

  const nextBattle: BattleState = {
    ...battle,
    phase: battlePhase,
    turn: incrementTurn ? battle.turn + 1 : battle.turn,
    enemy: primaryEnemy,
    logs: [...battle.logs, ...logEntries],
  };

  const fxEvents: BattleActionFxEvent[] = [];
  let fxSeq = 0;
  const nextFxId = () => `fx-${battle.turn}-${++fxSeq}`;

  appendAllyPlayerSkillFxEvents(
    fxEvents,
    nextFxId,
    battle.turn,
    skill,
    playerAction,
    playerVitals.playerName,
    isHeal,
    isCrit,
    targetEnemy,
  );

  for (const hit of counterHits) {
    fxEvents.push({
      id: nextFxId(),
      turnNumber: battle.turn,
      kind: 'attack',
      icon: hit.icon ?? BATTLE_ACTION_FX_ICON.attack,
      label: hit.skillName ?? '반격',
      actorName: hit.actorName,
      actorSide: 'enemy',
      targetName: playerVitals.playerName,
      targetSide: 'ally',
      amount: hit.damage,
    });
  }

  for (const hit of aiHits) {
    fxEvents.push({
      id: nextFxId(),
      turnNumber: battle.turn,
      kind: 'attack',
      icon: hit.icon ?? BATTLE_ACTION_FX_ICON.attack,
      label: hit.skillName ?? hit.actorName,
      actorName: hit.actorName,
      actorSide: 'ally',
      targetName: hit.targetName,
      targetSide: 'enemy',
      amount: hit.damage,
    });
  }

  return {
    runtime: nextRuntime,
    battle: nextBattle,
    character: nextCharacter,
    logEntries,
    fxEvents,
  };
}
