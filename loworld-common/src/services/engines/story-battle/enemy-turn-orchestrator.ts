import type { BattleActionFxEvent } from '../../models/battle-v2-presentation.model';
import { BATTLE_ACTION_FX_ICON } from '../../models/battle-v2-presentation.model';
import type { BattleEnemy, BattleLogEntry, BattleState as LegacyBattleState } from '../../models/battle.model';
import type { Character } from '../../models/character.model';
import type { StoryBattleRuntime } from '../../models/story-battle-runtime.model';
import type { StoryBattleSkillActionResult } from './turn-orchestrator';
import { applyEnemyAoeSkillToAllAllies, applyEnemySkillToAllyTarget, pickCombatantSkill } from './combatant-action.util';
import { isAllAlliesTargetSkill } from './aoe-skill.util';
import { aliveAllies, findPlayerControlledAlly, resolveTargetEnemy } from './combatant.util';
import { appendOutcomeNarrative, resolveCombatOutcome, resolveFinalCombatOutcome } from './combat-outcome.resolver';
import { resolvePrimaryBattleEnemy } from './combat-session.util';
import { beginEnemyTurnRuntime, findActingEnemySkill, initManualEnemyTurnQueue, pickDefaultAllyTargetId, resolveManualEnemyTurnState } from './manual-enemy-turn.util';
import { applyManualPartyControlToRuntime } from './manual-turn.util';

type BattleState = LegacyBattleState;

function resolveAllyTarget(
  allies: StoryBattleRuntime['allies'],
  selectedAllyTargetId: string | null | undefined,
): StoryBattleRuntime['allies'][number] | null {
  const living = aliveAllies(allies);
  if (living.length === 0) {
    return null;
  }
  if (selectedAllyTargetId) {
    const targeted = living.find((entry) => entry.id === selectedAllyTargetId);
    if (targeted) {
      return targeted;
    }
  }
  const fallbackId = pickDefaultAllyTargetId(allies);
  return living.find((entry) => entry.id === fallbackId) ?? living[0];
}

export function resolveEnemyTurnAuto(
  character: Character,
  battle: BattleState,
  runtime: StoryBattleRuntime,
  nextLogId: () => string,
): StoryBattleSkillActionResult | null {
  if (runtime.phase !== 'enemy_turn') {
    return null;
  }

  let nextEnemies = runtime.enemies.map((entry) => ({ ...entry }));
  let nextAllies = runtime.allies.map((entry) => ({ ...entry }));
  const narrativeParts: string[] = [];
  const fxEvents: BattleActionFxEvent[] = [];
  let fxSeq = 0;
  const nextFxId = () => `fx-en-auto-${battle.turn}-${++fxSeq}`;

  for (let index = 0; index < nextEnemies.length; index += 1) {
    const enemy = nextEnemies[index];
    if (enemy.life <= 0) {
      continue;
    }
    if (aliveAllies(nextAllies).length === 0) {
      break;
    }

    const mods = runtime.enemyCombatMods[enemy.id] ?? { damageBonus: 0, defenseBonus: 0 };
    const mana = enemy.mana ?? 0;
    const { skill } = pickCombatantSkill(enemy.skills, mana, enemy.level);

    if (isAllAlliesTargetSkill(skill)) {
      const aoe = applyEnemyAoeSkillToAllAllies(enemy, skill, nextAllies, mods);
      if (aoe.hits.length === 0) {
        continue;
      }
      nextEnemies[index] = aoe.nextEnemy;
      nextAllies = aoe.nextAllies;
      const part = `${enemy.name} ${skill.name} → 아군 전체 (${aoe.hits.map((h) => `${h.targetName} ${h.damage}`).join(', ')})`;
      narrativeParts.push(part);
      fxEvents.push({
        id: nextFxId(),
        turnNumber: battle.turn,
        kind: 'skill',
        icon: skill.iconHint ?? '🌊',
        label: `${skill.name} · 아군 전체`,
        actorName: enemy.name,
        actorSide: 'enemy',
        targetSide: 'ally',
        scope: 'aoe',
      });
      for (const hit of aoe.hits) {
        fxEvents.push({
          id: nextFxId(),
          turnNumber: battle.turn,
          kind: 'attack',
          icon: hit.icon ?? BATTLE_ACTION_FX_ICON.attack,
          label: hit.skillName,
          actorName: enemy.name,
          actorSide: 'enemy',
          targetName: hit.targetName,
          targetSide: 'ally',
          amount: hit.damage,
          scope: 'single',
        });
      }
      continue;
    }

    const target = resolveAllyTarget(nextAllies, runtime.selectedAllyTargetId);
    if (!target) {
      break;
    }

    const result = applyEnemySkillToAllyTarget(enemy, skill, target, mods);
    if (!result.hit) {
      continue;
    }

    nextEnemies[index] = result.nextEnemy;
    nextAllies = nextAllies.map((entry) =>
      entry.id === target.id ? result.nextTarget : entry,
    );
    const mpNote = result.hit.manaSpent > 0 ? ` MP-${result.hit.manaSpent}` : '';
    narrativeParts.push(`${result.hit.actorName} ${result.hit.skillName} → ${target.name} ${result.hit.damage}${mpNote}`);

    fxEvents.push({
      id: nextFxId(),
      turnNumber: battle.turn,
      kind: 'attack',
      icon: result.hit.icon ?? BATTLE_ACTION_FX_ICON.attack,
      label: result.hit.skillName,
      actorName: result.hit.actorName,
      actorSide: 'enemy',
      targetName: target.name,
      targetSide: 'ally',
      amount: result.hit.damage,
    });
  }

  return finalizeEnemyPhase({
    character,
    battle,
    runtime,
    nextAllies,
    nextEnemies,
    narrative: narrativeParts.length > 0 ? `적군: ${narrativeParts.join(' · ')}.` : '적군이 행동하지 않았습니다.',
    nextLogId,
    fxEvents,
  });
}

interface FinalizeEnemyPhaseParams {
  character: Character;
  battle: BattleState;
  runtime: StoryBattleRuntime;
  nextAllies: StoryBattleRuntime['allies'];
  nextEnemies: BattleEnemy[];
  narrative: string;
  nextLogId: () => string;
  fxEvents: BattleActionFxEvent[];
}

function finalizeEnemyPhase(params: FinalizeEnemyPhaseParams): StoryBattleSkillActionResult {
  const { character, battle, runtime, nextAllies, nextEnemies, narrative, nextLogId, fxEvents } = params;

  const outcome = resolveFinalCombatOutcome(nextEnemies, nextAllies);
  let prose = narrative;
  if (outcome !== 'ongoing') {
    prose = appendOutcomeNarrative(prose, outcome);
  }

  const nextPhase = outcome === 'ongoing' ? 'player_turn' : outcome;
  const battlePhase: BattleState['phase'] = outcome === 'victory' ? 'victory' : 'engaged';

  const lead = findPlayerControlledAlly(nextAllies);
  let nextCharacter = character;
  if (lead?.isPlayerControlled) {
    nextCharacter = {
      ...character,
      stats: {
        ...character.stats,
        life: lead.life,
        maxLife: lead.maxLife,
        mana: lead.mana,
        maxMana: lead.maxMana,
      },
    };
  }

  let nextRuntime: StoryBattleRuntime = {
    ...runtime,
    phase: nextPhase,
    allies: nextAllies,
    enemies: nextEnemies,
    manualPendingEnemyIds: [],
    activeEnemyId: undefined,
    selectedAllyTargetId: null,
    currentNarrative: prose,
    proseEntries: [...runtime.proseEntries],
    selectedTargetId: resolveTargetEnemy(nextEnemies, runtime.selectedTargetId)?.id ?? null,
  };

  if (outcome === 'ongoing' && runtime.manualPartyControl) {
    nextRuntime = applyManualPartyControlToRuntime(nextRuntime, true);
  }

  const logEntries: BattleLogEntry[] = [{ id: nextLogId(), message: prose }];
  if (nextPhase === 'victory') {
    logEntries.push({ id: nextLogId(), message: '전투에서 승리했습니다.', emphasis: 'loot' });
  }

  const primaryEnemy = resolvePrimaryBattleEnemy(nextEnemies, nextRuntime.selectedTargetId, battle.enemy);
  const nextBattle: BattleState = {
    ...battle,
    phase: battlePhase,
    turn: battle.turn + 1,
    enemy: primaryEnemy,
    logs: [...battle.logs, ...logEntries],
  };

  return {
    runtime: nextRuntime,
    battle: nextBattle,
    character: nextCharacter,
    logEntries,
    fxEvents,
  };
}

export function executeStoryBattleEnemyTurn(
  character: Character,
  battle: BattleState,
  runtime: StoryBattleRuntime,
  skillId: string,
  nextLogId: () => string,
  allyTargetId?: string | null,
): StoryBattleSkillActionResult | null {
  if (runtime.phase !== 'enemy_turn') {
    return null;
  }

  const manualState = resolveManualEnemyTurnState(runtime);
  if (!manualState) {
    return null;
  }

  const activeEnemyId = manualState.activeEnemyId;
  const enemyIndex = runtime.enemies.findIndex((entry) => entry.id === activeEnemyId);
  if (enemyIndex < 0) {
    return null;
  }

  const actingEnemy = runtime.enemies[enemyIndex];
  if (actingEnemy.life <= 0) {
    return null;
  }

  const skill = findActingEnemySkill(actingEnemy, skillId);
  if (!skill) {
    return null;
  }

  const mods = runtime.enemyCombatMods[actingEnemy.id] ?? { damageBonus: 0, defenseBonus: 0 };
  let nextEnemies = runtime.enemies.map((entry) => ({ ...entry }));
  let nextAllies = runtime.allies.map((entry) => ({ ...entry }));
  const fxEvents: BattleActionFxEvent[] = [];
  let fxSeq = 0;
  const nextFxId = () => `fx-en-${battle.turn}-${activeEnemyId}-${++fxSeq}`;
  let narrative = '';

  if (isAllAlliesTargetSkill(skill)) {
    const aoe = applyEnemyAoeSkillToAllAllies(actingEnemy, skill, runtime.allies, mods);
    if (aoe.hits.length === 0) {
      return null;
    }
    nextEnemies[enemyIndex] = aoe.nextEnemy;
    nextAllies = aoe.nextAllies;
    const parts = aoe.hits.map((hit) => `${hit.targetName ?? '아군'} ${hit.damage}`);
    narrative = `[${skill.name}] ${actingEnemy.name} → 아군 전체 ( ${parts.join(', ')} ).`;
    fxEvents.push({
      id: nextFxId(),
      turnNumber: battle.turn,
      kind: 'skill',
      icon: skill.iconHint ?? '🌊',
      label: `${skill.name} · 아군 전체`,
      actorName: actingEnemy.name,
      actorSide: 'enemy',
      targetSide: 'ally',
      scope: 'aoe',
    });
    for (const hit of aoe.hits) {
      fxEvents.push({
        id: nextFxId(),
        turnNumber: battle.turn,
        kind: 'attack',
        icon: hit.icon ?? BATTLE_ACTION_FX_ICON.attack,
        label: hit.skillName,
        actorName: actingEnemy.name,
        actorSide: 'enemy',
        targetName: hit.targetName,
        targetSide: 'ally',
        amount: hit.damage,
        scope: 'single',
      });
    }
  } else {
    const targetId = allyTargetId ?? runtime.selectedAllyTargetId;
    const target = resolveAllyTarget(runtime.allies, targetId);
    if (!target) {
      return null;
    }

    const applied = applyEnemySkillToAllyTarget(actingEnemy, skill, target, mods);
    if (!applied.hit) {
      return null;
    }

    nextEnemies[enemyIndex] = applied.nextEnemy;
    nextAllies = nextAllies.map((entry) =>
      entry.id === target.id ? applied.nextTarget : entry,
    );

    narrative = `[${applied.hit.skillName}] ${applied.hit.actorName} → ${target.name} ${applied.hit.damage} 피해.`;
    fxEvents.push({
      id: nextFxId(),
      turnNumber: battle.turn,
      kind: 'attack',
      icon: applied.hit.icon ?? BATTLE_ACTION_FX_ICON.attack,
      label: applied.hit.skillName,
      actorName: applied.hit.actorName,
      actorSide: 'enemy',
      targetName: target.name,
      targetSide: 'ally',
      amount: applied.hit.damage,
      scope: 'single',
    });
  }

  const targetId = runtime.selectedAllyTargetId;
  const nextPending = manualState.pending.filter((id) => id !== activeEnemyId);
  const outcome = resolveCombatOutcome(nextEnemies, nextAllies);

  if (outcome === 'ongoing' && nextPending.length > 0) {
    return {
      runtime: {
        ...runtime,
        phase: 'enemy_turn',
        enemies: nextEnemies,
        allies: nextAllies,
        manualPendingEnemyIds: nextPending,
        activeEnemyId: nextPending[0],
        selectedAllyTargetId: targetId ?? runtime.selectedAllyTargetId,
        currentNarrative: narrative,
      },
      battle: {
        ...battle,
        logs: [...battle.logs, { id: nextLogId(), message: narrative }],
      },
      character,
      logEntries: [{ id: nextLogId(), message: narrative }],
      fxEvents,
    };
  }

  if (outcome !== 'ongoing') {
    return finalizeEnemyPhase({
      character,
      battle,
      runtime,
      nextAllies,
      nextEnemies,
      narrative: appendOutcomeNarrative(narrative, outcome),
      nextLogId,
      fxEvents,
    });
  }

  return finalizeEnemyPhase({
    character,
    battle,
    runtime,
    nextAllies,
    nextEnemies,
    narrative,
    nextLogId,
    fxEvents,
  });
}

export { beginEnemyTurnRuntime, initManualEnemyTurnQueue };
