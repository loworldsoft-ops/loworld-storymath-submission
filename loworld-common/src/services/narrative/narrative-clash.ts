import type { BattleSkill } from '../models/battle.model';
import type { BattleEnemy, BattleState } from '../models/battle.model';
import type { Character } from '../models/character.model';
import type { BattleProseEntry } from '../models/story-battle-vm.model';
import type { BattleAllyCombatant, StoryBattleRuntime } from '../models/story-battle-runtime.model';
import { createDefaultStoryBattleRuntime } from '../engines/story-battle.engine';
import { resolveEnemyTurnAuto } from '../engines/story-battle/enemy-turn-orchestrator';
import { executeStoryBattleTurn } from '../engines/story-battle/turn-orchestrator';
import type { ClashResult, ClashTier, ReaderSlot, StoryEpisode, StoryPack } from './narrative.model';
import { activeTraits, computeStats, contestOverride, contestPower, memberPower, ownedTraits, slotSeed } from './narrative-state';
import { resolveTuning } from './narrative-tuning';
import { seededRandom, stableHash } from './narrative-util';

const BASIC_SKILL_ID = 'clash-basic';
const PLAYER_ID = 'clash-protagonist';

/** 힘으로 겨룰 때 고를 수 있는 수 */
export interface MightMove {
  readonly skillId: string;
  /** 무공이면 그 속성의 id. 기본 공격이면 null */
  readonly traitId: string | null;
  readonly name: string;
  readonly description: string;
  readonly ready: boolean;
}

/** 힘 겨루기의 진행 상태. 기존 전투 엔진의 상태를 감싼다. */
export interface MightClashState {
  readonly episodeId: string;
  readonly opponentId: string;
  readonly seed: string;
  readonly round: number;
  readonly maxRounds: number;
  readonly finished: boolean;
  readonly usedTraitIds: readonly string[];
  readonly lastTraitId: string | null;
  readonly runtime: StoryBattleRuntime;
  readonly battle: BattleState;
  readonly character: Character;
  readonly logSeq: number;
}

/** 엔진이 쓰는 `Math.random`을 정해진 수열로 바꿔 놓고 `run`을 돌린다. 같은 씨앗이면 같은 결과다. */
function withSeededRandom<T>(seed: string, run: () => T): T {
  const original = Math.random;
  Math.random = seededRandom(stableHash(seed));
  try {
    return run();
  } finally {
    Math.random = original;
  }
}

function damageRange(power: number, min: number, max: number): [number, number] {
  return [Math.max(1, Math.round(power * min)), Math.max(2, Math.round(power * max))];
}

/**
 * 힘 겨루기를 시작한다. 서사의 힘을 기존 전투 엔진의 입력으로 바꾼다.
 * 주인공의 한 번의 피해는 힘에 비례하고, 가진 무공은 전투의 기술이 된다.
 */
export function createMightClash(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode, attempt = 0): MightClashState | null {
  const contest = episode.contest;
  const opponent = contest ? pack.cast[contest.opponent] : null;
  if (!contest || !opponent) return null;
  const tuning = resolveTuning(pack.tuning);
  const stats = computeStats(slot, pack);
  const override = contestOverride(episode, opponent.id, 'might');
  const power = contestPower(slot, pack, 'might', opponent.id, override);
  const traits = ownedTraits(slot, pack);
  const equippedWeaponId = slot.equipment?.weapon;
  const equippedWeaponName = equippedWeaponId ? pack.traits[equippedWeaponId]?.phrases?.['무기'] || pack.traits[equippedWeaponId]?.name : null;
  const weapon = equippedWeaponName ?? [...activeTraits(slot, pack)].reverse().find((trait) => trait.phrases['무기'])?.phrases['무기'] ?? '맨손';

  const skills: BattleSkill[] = [
    {
      id: BASIC_SKILL_ID,
      name: weapon,
      description: '기본 공격',
      manaCost: 0,
      cooldownTurns: 0,
      currentCooldown: 0,
      damageRange: damageRange(power, tuning.damageMin, tuning.damageMax),
      type: 'physical',
      targetType: 'enemy',
    } as BattleSkill,
    ...traits
      .filter((trait) => trait.kind === 'art' && (trait.stats.might ?? 0) > 0)
      .map((trait) => ({
        id: `clash-art:${trait.id}`,
        name: trait.name,
        description: trait.description,
        manaCost: 0,
        cooldownTurns: 1,
        currentCooldown: 0,
        damageRange: damageRange(power * tuning.artDamageBoost, tuning.damageMin, tuning.damageMax),
        type: 'physical',
        targetType: 'enemy',
      }) as BattleSkill),
  ];

  const life = tuning.lifeBase + stats.guard * tuning.lifePerGuard;
  const ally = {
    id: PLAYER_ID,
    name: slot.name,
    role: '',
    level: 1,
    life,
    maxLife: life,
    mana: 99,
    maxMana: 99,
    isPlayerControlled: true,
    damageBonus: 0,
    damageReduction: 0,
  } as BattleAllyCombatant;

  const opponentLife = tuning.lifeBase + memberPower(opponent, 'guard', tuning) * tuning.lifePerGuard;
  const enemy = { id: opponent.id, name: opponent.name, level: 1, life: opponentLife, maxLife: opponentLife } as BattleEnemy;
  // 엔진의 반격 피해 = 레벨 × 1.5(내림) + damageBonus. 레벨 1이면 1 + damageBonus다.
  const counter = Math.round((override ?? memberPower(opponent, 'might', tuning)) * (tuning.damageMin + tuning.damageMax) / 2);

  const character = {
    id: PLAYER_ID,
    name: slot.name,
    class: 'paladin',
    level: 1,
    equipment: {},
    inventory: { items: [], gold: 0 },
    stats: { life, maxLife: life, mana: 99, maxMana: 99, strength: 10, dexterity: 10, vitality: 10, energy: 10, defense: 0 },
  } as unknown as Character;

  const runtime = createDefaultStoryBattleRuntime(
    [ally],
    [enemy],
    { [enemy.id]: { damageBonus: Math.max(0, counter - 1), defenseBonus: 0 } },
    skills,
    { damageMultiplier: 1, startPhase: 'player_turn' },
  );

  return {
    episodeId: episode.id,
    opponentId: opponent.id,
    seed: `${slotSeed(slot)}:${episode.id}:might:${attempt}`,
    round: 0,
    maxRounds: tuning.mightRounds,
    finished: false,
    usedTraitIds: [],
    lastTraitId: null,
    runtime,
    battle: { phase: 'engaged', turn: 1, enemy, logs: [] } as BattleState,
    character,
    logSeq: 0,
  };
}

function traitIdOfSkill(skillId: string): string | null {
  return skillId.startsWith('clash-art:') ? skillId.slice('clash-art:'.length) : null;
}

export function mightClashMoves(state: MightClashState): MightMove[] {
  return state.runtime.skills.map((skill) => ({
    skillId: skill.id,
    traitId: traitIdOfSkill(skill.id),
    name: skill.name,
    description: skill.description,
    ready: skill.currentCooldown <= 0,
  }));
}

export function mightClashProse(state: MightClashState): BattleProseEntry[] {
  return state.runtime.proseEntries;
}

export function mightClashLife(state: MightClashState): { mine: number; mineMax: number; theirs: number; theirsMax: number } {
  const ally = state.runtime.allies[0];
  const enemy = state.runtime.enemies[0];
  return { mine: Math.max(0, ally?.life ?? 0), mineMax: ally?.maxLife ?? 1, theirs: Math.max(0, enemy?.life ?? 0), theirsMax: enemy?.maxLife ?? 1 };
}

/** 한 합을 겨룬다: 주인공의 수, 이어서 상대의 반격. */
export function stepMightClash(state: MightClashState, skillId: string): MightClashState {
  if (state.finished) return state;
  return withSeededRandom(`${state.seed}:${state.round}`, () => {
    let logSeq = state.logSeq;
    const nextLogId = (): string => `clash-log-${++logSeq}`;
    const played = executeStoryBattleTurn(state.character, state.battle, state.runtime, skillId, nextLogId, undefined, state.opponentId);
    if (!played) return state;
    let { runtime, battle, character } = played;
    let guard = 0;
    while (runtime.phase === 'enemy_turn' && guard < 4) {
      const answered = resolveEnemyTurnAuto(character, battle, runtime, nextLogId);
      if (!answered) break;
      ({ runtime, battle, character } = answered);
      guard += 1;
    }
    const traitId = traitIdOfSkill(skillId);
    const round = state.round + 1;
    const over = runtime.phase === 'victory' || runtime.phase === 'defeat' || round >= state.maxRounds;
    return {
      ...state,
      runtime,
      battle,
      character,
      logSeq,
      round,
      finished: over,
      lastTraitId: traitId,
      usedTraitIds: traitId && !state.usedTraitIds.includes(traitId) ? [...state.usedTraitIds, traitId] : state.usedTraitIds,
    };
  });
}

/** 넘기기: 쓸 수 있는 수 중 가장 센 것을 골라 끝까지 겨룬다. */
export function autoMightClash(state: MightClashState): MightClashState {
  let current = state;
  let guard = 0;
  while (!current.finished && guard < 20) {
    const ready = current.runtime.skills.filter((skill) => skill.currentCooldown <= 0);
    const best = [...ready].sort((a, b) => b.damageRange[1] - a.damageRange[1])[0] ?? current.runtime.skills[0];
    if (!best) break;
    const next = stepMightClash(current, best.id);
    if (next === current) break;
    current = next;
    guard += 1;
  }
  return current.finished ? current : { ...current, finished: true };
}

export function finishMightClash(state: MightClashState, pack: StoryPack, auto: boolean): ClashResult {
  const tuning = resolveTuning(pack.tuning);
  const life = mightClashLife(state);
  const mineRatio = life.mine / Math.max(1, life.mineMax);
  const theirsRatio = life.theirs / Math.max(1, life.theirsMax);
  const victory = state.runtime.phase === 'victory' || (state.runtime.phase !== 'defeat' && life.mine > 0 && mineRatio >= theirsRatio);
  const tier: ClashTier = !victory
    ? 'underdog'
    : mineRatio >= tuning.overwhelmLife ? 'overwhelm' : mineRatio >= tuning.advantageLife ? 'advantage' : 'close';
  return {
    episodeId: state.episodeId,
    opponentId: state.opponentId,
    axis: 'might',
    outcome: victory ? 'victory' : 'defeat',
    tier,
    rounds: Math.max(1, state.round),
    finisherTraitId: victory ? state.lastTraitId : null,
    usedTraitIds: state.usedTraitIds,
    untouched: life.mine >= life.mineMax,
    auto,
  };
}

// ── 말로 겨루기 ────────────────────────────────────────────────────────

export type WitMove = 'strike' | 'probe' | 'yield';
export const WIT_MOVES: readonly WitMove[] = ['strike', 'probe', 'yield'];

/** 상대의 약점을 아는 속성. 그 상대에게 듣는 기연이거나, 꿰뚫는 힘을 주는 기억이다. */
export function knownWeaknessTrait(slot: ReaderSlot, pack: StoryPack, opponentId: string): string | null {
  const traits = [...ownedTraits(slot, pack)].reverse();
  const bane = traits.find((trait) => trait.bane?.opponentId === opponentId && (!trait.bane.axis || trait.bane.axis === 'wit'));
  if (bane) return bane.id;
  return traits.find((trait) => trait.kind === 'memory' && (trait.stats.wit ?? 0) > 0)?.id ?? null;
}

export function witMoveScore(slot: ReaderSlot, pack: StoryPack, opponentId: string, move: WitMove, opponentOverride?: number): number {
  const tuning = resolveTuning(pack.tuning);
  const wit = contestPower(slot, pack, 'wit', opponentId, opponentOverride);
  const knows = knownWeaknessTrait(slot, pack, opponentId) !== null && !!pack.cast[opponentId]?.weakness;
  const factor = move === 'strike' ? (knows ? tuning.witStrikeKnown : tuning.witStrikeBlind) : move === 'probe' ? tuning.witProbe : tuning.witYield;
  return wit * factor;
}

export function bestWitMove(slot: ReaderSlot, pack: StoryPack, opponentId: string): WitMove {
  return [...WIT_MOVES].sort((a, b) => witMoveScore(slot, pack, opponentId, b) - witMoveScore(slot, pack, opponentId, a))[0];
}

export function resolveWitContest(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode, move: WitMove, auto: boolean): ClashResult | null {
  const opponent = episode.contest ? pack.cast[episode.contest.opponent] : null;
  if (!opponent) return null;
  const tuning = resolveTuning(pack.tuning);
  const override = contestOverride(episode, opponent.id, 'wit');
  const ratio = witMoveScore(slot, pack, opponent.id, move, override) / Math.max(1, override ?? memberPower(opponent, 'wit', tuning));
  const victory = ratio >= tuning.witWin;
  const tier: ClashTier = ratio >= tuning.witOverwhelm ? 'overwhelm' : victory ? 'advantage' : ratio >= tuning.witClose ? 'close' : 'underdog';
  const known = move === 'strike' ? knownWeaknessTrait(slot, pack, opponent.id) : null;
  return {
    episodeId: episode.id,
    opponentId: opponent.id,
    axis: 'wit',
    outcome: victory ? 'victory' : 'defeat',
    tier,
    rounds: 1,
    finisherTraitId: victory ? known : null,
    usedTraitIds: known ? [known] : [],
    untouched: victory,
    auto,
  };
}
