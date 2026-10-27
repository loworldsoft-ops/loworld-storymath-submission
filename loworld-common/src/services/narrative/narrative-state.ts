import { STAT_AXES, type ClashResult, type CombinationProgress, type ReaderEquipmentSlot, type ReaderRomanceState, type ReaderSlot, type StatAxis, type StoryCastMember, type StoryEffects, type StoryEmotion, type StoryEpisode, type StoryPack, type StoryRegard, type StoryRelation, type StorySituation, type StoryStance, type StoryTrait } from './narrative.model';
import { autoEquip, equipItem, isActiveTrait } from './narrative-loadout';
import { resolveTuning, type NarrativeTuning } from './narrative-tuning';
import { clamp, stableHash, stableOrder } from './narrative-util';
import { resolveEmotion, resolveSpeech } from './narrative-voice';
import { absorbBead, beadStats, grantBead, placeBead, type BeadResult } from './narrative-beads';
import { addTies } from './narrative-resonance';

// ── 슬롯 ──────────────────────────────────────────────────────────────

/** 새 캐릭터 슬롯. 전생의 갈래가 시작 속성을 정한다. */
export function createReaderSlot(pack: StoryPack, slotId: string, originId: string, name: string, seed: string = slotId): ReaderSlot {
  const origin = pack.origins.find((entry) => entry.id === originId) ?? pack.origins[0];
  const tuning = resolveTuning(pack.tuning);
  let slot: ReaderSlot = {
    id: slotId,
    seed,
    packId: pack.id,
    name: name.trim() || pack.protagonist.defaultName,
    originId: origin.id,
    traitIds: [],
    bonds: {},
    grudges: { ...pack.startGrudges },
    flags: [],
    shownPower: tuning.baseStat,
    witnessed: {},
    history: [],
    alignment: 0,
    equipment: {},
    party: [],
    silver: tuning.silverStart,
  };
  for (const traitId of [...pack.startTraits, ...origin.traits]) {
    slot = grantTrait(slot, pack, traitId);
  }
  return slot;
}

/** 슬롯의 씨앗. 예전에 저장된 슬롯에는 없으므로 id로 대신한다. */
export function slotSeed(slot: ReaderSlot): string {
  return slot.seed ?? slot.id;
}

export function ownedTraits(slot: ReaderSlot, pack: StoryPack): StoryTrait[] {
  return slot.traitIds.map((id) => pack.traits[id]).filter((trait): trait is StoryTrait => !!trait);
}

export function activeTraits(slot: ReaderSlot, pack: StoryPack): StoryTrait[] {
  return ownedTraits(slot, pack).filter((trait) => isActiveTrait(slot, trait));
}

/** 속성을 준다. 이미 가졌으면 그대로다. 속성에 딸린 유대 변화도 적용한다. */
export function grantTrait(slot: ReaderSlot, pack: StoryPack, traitId: string): ReaderSlot {
  const trait = pack.traits[traitId];
  // 구슬은 여러 개를 가질 수 있다. 수를 센다.
  if (trait?.kind === 'bead') return grantBead(slot, pack, traitId);
  if (!trait || slot.traitIds.includes(traitId)) return slot;
  let next: ReaderSlot = { ...slot, traitIds: [...slot.traitIds, traitId] };
  if (trait.bonds) {
    next = applyEffects(next, pack, { bond: trait.bonds });
  }
  if (typeof trait.alignment === 'number') {
    const alignedFlag = `aligned:${traitId}`;
    if (!next.flags.includes(alignedFlag)) {
      next = applyEffects(next, pack, { alignment: trait.alignment, flag: [alignedFlag] });
    }
  }
  if (trait.kind === 'item' && trait.equip) {
    next = autoEquip(next, pack, traitId);
  }
  return next;
}

export function applyEffects(slot: ReaderSlot, pack: StoryPack, effects: StoryEffects | null | undefined): ReaderSlot {
  if (!effects) return slot;
  let next = slot;
  if (effects.bond) {
    const bonds = { ...next.bonds };
    for (const [memberId, delta] of Object.entries(effects.bond)) {
      bonds[memberId] = clamp(bondOf(next, pack, memberId) + delta, -100, 100);
    }
    next = { ...next, bonds };
  }
  if (effects.flag?.length) {
    next = { ...next, flags: [...new Set([...next.flags, ...effects.flag])] };
  }
  if (typeof effects.alignment === 'number') {
    next = { ...next, alignment: clamp((next.alignment ?? 0) + effects.alignment, -100, 100) };
  }
  if (effects.equip || effects.equipment) {
    const eq = { ...(effects.equip ?? {}), ...(effects.equipment ?? {}) };
    for (const [slotKey, traitId] of Object.entries(eq) as [ReaderEquipmentSlot, string][]) {
      if (!traitId) continue;
      if (!next.traitIds.includes(traitId)) {
        next = grantTrait(next, pack, traitId);
      }
      next = equipItem(next, pack, traitId, slotKey);
    }
  }
  const partyToAdd = effects.partyAdd ?? effects.party;
  if (partyToAdd?.length || effects.partyRemove?.length) {
    let party = [...(next.party ?? [])];
    if (partyToAdd) {
      party = [...new Set([...party, ...partyToAdd])];
    }
    if (effects.partyRemove) {
      party = party.filter((id) => !effects.partyRemove!.includes(id));
    }
    next = { ...next, party };
  }
  if (effects.romance) {
    let targetId: string | undefined;
    let stage: number | undefined;
    if ('targetId' in effects.romance && typeof (effects.romance as ReaderRomanceState).targetId === 'string') {
      targetId = (effects.romance as ReaderRomanceState).targetId;
      stage = Number((effects.romance as ReaderRomanceState).stage);
    } else {
      const [tId, st] = Object.entries(effects.romance)[0] ?? [];
      targetId = tId;
      stage = Number(st);
    }
    if (targetId && stage != null) {
      const tuning = resolveTuning(pack.tuning);
      const bond = bondOf(next, pack, targetId);
      const allowed = stage >= 2 && bond < tuning.romanceBond ? 1 : stage;
      const current = next.romance?.targetId === targetId ? next.romance.stage : 0;
      if (allowed > current) next = { ...next, romance: { targetId, stage: allowed } };
    }
  }
  for (const traitId of effects.grant ?? []) {
    next = grantTrait(next, pack, traitId);
  }
  if (effects.shown !== undefined && effects.shown > next.shownPower) {
    next = { ...next, shownPower: effects.shown };
  }
  if (effects.tie) next = addTies(next, effects.tie);
  for (const beadId of effects.absorb ?? []) {
    // 이야기가 흡수시키는 구슬은 가진 것이 없으면 먼저 쥐여 준다. 흡수 장면은 그 화의 본문이 쓴다.
    if ((next.beads?.[beadId] ?? 0) < 1) next = grantBead(next, pack, beadId);
    next = absorbBead(next, pack, beadId, { scene: false }).slot;
  }
  return next;
}

/** 구슬을 장비의 다음 빈 혈에 박는다. 구결이 완성되면 구결의 속성을 얻는다 */
export function socketBead(slot: ReaderSlot, pack: StoryPack, itemId: string, beadId: string): BeadResult {
  return placeBead(slot, pack, itemId, beadId, (current, traitId) => grantTrait(current, pack, traitId));
}

// ── 조합 ──────────────────────────────────────────────────────────────

export function evaluateCombinations(slot: ReaderSlot, pack: StoryPack): CombinationProgress[] {
  return pack.combinations.map((combination) => {
    const positions = combination.requires.map((traitId) => slot.traitIds.indexOf(traitId));
    const owned = positions.filter((position) => position >= 0).length;
    const allOwned = owned === combination.requires.length;
    const inOrder = positions.every((position, index) => index === 0 || position > positions[index - 1]);
    return {
      id: combination.id,
      name: combination.name,
      owned,
      required: combination.requires.length,
      complete: allOwned && (!combination.ordered || inOrder),
    };
  });
}

export function completedCombinationFlags(slot: ReaderSlot, pack: StoryPack): string[] {
  const complete = new Set(evaluateCombinations(slot, pack).filter((entry) => entry.complete).map((entry) => entry.id));
  return pack.combinations.filter((entry) => complete.has(entry.id)).flatMap((entry) => entry.flags);
}

// ── 힘 ────────────────────────────────────────────────────────────────

/** 축의 값 = (바탕 + 갈래 + 가진 속성) × 완성한 조합의 배율 */
export function computeStats(slot: ReaderSlot, pack: StoryPack): Record<StatAxis, number> {
  const tuning = resolveTuning(pack.tuning);
  const origin = pack.origins.find((entry) => entry.id === slot.originId);
  const complete = new Set(evaluateCombinations(slot, pack).filter((entry) => entry.complete).map((entry) => entry.id));
  const traits = ownedTraits(slot, pack);
  const beads = beadStats(slot, pack);
  const result = {} as Record<StatAxis, number>;
  for (const axis of STAT_AXES) {
    let value = tuning.baseStat + (origin?.stats[axis] ?? 0) + beads[axis];
    for (const trait of traits) {
      if (isActiveTrait(slot, trait)) value += trait.stats[axis] ?? 0;
    }
    for (const combination of pack.combinations) {
      if (complete.has(combination.id)) value *= combination.multiplier[axis] ?? 1;
    }
    result[axis] = Math.round(value);
  }
  return result;
}

/**
 * 이 상대와 겨룰 때의 힘. 그 상대에게 듣는 기연이 있으면 배율을 곱한다.
 * `opponentOverride`는 그 화의 겨루기가 덮어쓴 상대의 힘(contest.power)이다.
 */
export function contestPower(slot: ReaderSlot, pack: StoryPack, axis: StatAxis, opponentId: string, opponentOverride?: number): number {
  const tuning = resolveTuning(pack.tuning);
  let power = computeStats(slot, pack)[axis];
  const opponent = pack.cast[opponentId];
  for (const trait of ownedTraits(slot, pack)) {
    if (trait.bane?.opponentId !== opponentId) continue;
    // 말로 겨뤄 얻은 기연은 칼로 겨룰 때 듣지 않는다(축을 적은 기연만. PoC 1의 기연은 축이 없다)
    if (trait.bane.axis && trait.bane.axis !== axis) continue;
    // 기연은 갚을 수 있게 해 준다: 배율을 곱하되, 적어도 상대의 힘 × windfallFloor는 된다.
    const floor = opponent ? (opponentOverride ?? memberPower(opponent, axis, tuning)) * tuning.windfallFloor : 0;
    power = Math.max(power * trait.bane.multiplier, floor);
  }
  return Math.round(power);
}

export function memberPower(member: StoryCastMember, axis: StatAxis, tuning: NarrativeTuning): number {
  return member.stats[axis] ?? tuning.baseStat;
}

/** 이 화의 겨루기가 덮어쓴 상대의 힘. 겨루는 축이 같을 때만 쓴다 */
export function contestOverride(episode: StoryEpisode | null | undefined, memberId: string, axis: StatAxis): number | undefined {
  const contest = episode?.contest;
  return contest && contest.opponent === memberId && contest.axis === axis && typeof contest.power === 'number' ? contest.power : undefined;
}

// ── 성품 ──────────────────────────────────────────────────────────────

export interface Disposition {
  readonly cardIds: readonly string[];
  readonly x: number;
  readonly y: number;
  /** 1: 친밀·동경, 2: 적대·동경, 3: 적대·지배, 4: 친밀·지배. 카드가 없으면 0 */
  readonly quadrant: 0 | 1 | 2 | 3 | 4;
}

/** 주인공의 성품 = 가진 성품 카드의 좌표 평균 */
export function computeDisposition(slot: ReaderSlot, pack: StoryPack): Disposition {
  const cards = ownedTraits(slot, pack).filter((trait) => trait.kind === 'personality');
  if (cards.length === 0) return { cardIds: [], x: 0, y: 0, quadrant: 0 };
  const x = Math.round(cards.reduce((sum, card) => sum + (card.x ?? 0), 0) / cards.length);
  const y = Math.round(cards.reduce((sum, card) => sum + (card.y ?? 0), 0) / cards.length);
  const quadrant = x >= 0 ? (y >= 0 ? 1 : 4) : y >= 0 ? 2 : 3;
  return { cardIds: cards.map((card) => card.id), x, y, quadrant };
}

// ── 태도, 눈높이, 감정, 말투 ───────────────────────────────────────────

export function bondOf(slot: ReaderSlot, pack: StoryPack, memberId: string): number {
  return slot.bonds[memberId] ?? pack.cast[memberId]?.bond ?? 0;
}

export function resolveStance(bond: number, tuning: NarrativeTuning): StoryStance {
  if (bond <= tuning.stanceHostile) return 'hostile';
  if (bond < tuning.stanceCold + 1) return 'cold';
  if (bond < tuning.stanceWarm) return 'neutral';
  if (bond < tuning.stanceTrusting) return 'warm';
  return 'trusting';
}

/** `ratio` = 바라보는 쪽이 어림한 (상대의 힘 ÷ 자기 힘). 작으면 내려다본다. */
export function resolveRegard(ratio: number, tuning: NarrativeTuning): StoryRegard {
  if (ratio < tuning.regardDown) return 'down';
  if (ratio > tuning.regardUp) return 'up';
  return 'level';
}

export function protagonistNature(slot: ReaderSlot, pack: StoryPack): string[] {
  return ownedTraits(slot, pack).filter((trait) => trait.kind === 'personality').map((trait) => trait.id);
}

/** 인물이 주인공을 대하는 상태. 눈높이는 실제 힘이 아니라 그 인물이 본 힘으로 정한다. */
export function memberRelation(slot: ReaderSlot, pack: StoryPack, memberId: string, axis: StatAxis, situation: StorySituation, powerOverride?: number): StoryRelation {
  const tuning = resolveTuning(pack.tuning);
  const member = pack.cast[memberId];
  const bond = bondOf(slot, pack, memberId);
  const stance = resolveStance(bond, tuning);
  const seen = Math.max(slot.shownPower, slot.witnessed[memberId] ?? 0);
  const regard = member ? resolveRegard(seen / Math.max(1, powerOverride ?? memberPower(member, axis, tuning)), tuning) : 'level';
  const nature = member?.nature ?? [];
  const emotion = resolveEmotion(pack, nature, situation, regard, bond);
  return { memberId, bond, stance, regard, emotion, speech: resolveSpeech(pack, { who: 'member', alignment: 0, nature, emotion, stance, regard }) };
}

/** 주인공이 인물을 대하는 상태. 주인공은 자기의 실제 힘을 안다. */
export function protagonistRelation(slot: ReaderSlot, pack: StoryPack, memberId: string, axis: StatAxis, situation: StorySituation, powerOverride?: number): StoryRelation {
  const tuning = resolveTuning(pack.tuning);
  const member = pack.cast[memberId];
  const bond = bondOf(slot, pack, memberId);
  const stance = resolveStance(bond, tuning);
  const mine = contestPower(slot, pack, axis, memberId, powerOverride);
  const regard = member ? resolveRegard((powerOverride ?? memberPower(member, axis, tuning)) / Math.max(1, mine), tuning) : 'level';
  const nature = protagonistNature(slot, pack);
  const emotion = resolveEmotion(pack, nature, situation, regard, bond);
  const speech = resolveSpeech(pack, { who: 'protagonist', alignment: slot.alignment ?? 0, nature, emotion, stance, regard });
  return { memberId, bond, stance, regard, emotion, speech };
}

// ── 겨루기의 뒤처리 ────────────────────────────────────────────────────

/** 원한 장부를 고친다. 눌렀을 때 터지는 통쾌함을 함께 낸다. */
export function settleGrudge(slot: ReaderSlot, pack: StoryPack, clash: ClashResult): { slot: ReaderSlot; catharsis: number } {
  const tuning = resolveTuning(pack.tuning);
  const current = slot.grudges[clash.opponentId] ?? 0;
  if (clash.outcome === 'defeat') {
    return { slot: { ...slot, grudges: { ...slot.grudges, [clash.opponentId]: current + tuning.grudgeOnDefeat } }, catharsis: 0 };
  }
  if (clash.tier === 'close') {
    return { slot: { ...slot, grudges: { ...slot.grudges, [clash.opponentId]: current + tuning.grudgeOnClose } }, catharsis: 0 };
  }
  const factor = clash.tier === 'overwhelm' ? tuning.catharsisOverwhelm : tuning.catharsisAdvantage;
  return { slot: { ...slot, grudges: { ...slot.grudges, [clash.opponentId]: 0 } }, catharsis: Math.round(current * factor) };
}

/** 겨루기를 본 사람들이 어림하는 주인공의 힘을 고친다. 남이 보는 자리였으면 모두에게 알려진다. */
export function applyWitness(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode, clash: ClashResult): ReaderSlot {
  const tuning = resolveTuning(pack.tuning);
  const opponent = pack.cast[clash.opponentId];
  if (!opponent) return slot;
  const factor = clash.outcome === 'defeat'
    ? tuning.witnessDefeat
    : clash.tier === 'overwhelm' ? tuning.witnessOverwhelm : clash.tier === 'advantage' ? tuning.witnessAdvantage : tuning.witnessClose;
  const seen = Math.round((contestOverride(episode, opponent.id, clash.axis) ?? memberPower(opponent, clash.axis, tuning)) * factor);
  const witnessed = { ...slot.witnessed };
  for (const memberId of new Set([clash.opponentId, ...episode.cast])) {
    witnessed[memberId] = Math.max(witnessed[memberId] ?? 0, seen);
  }
  const shownPower = episode.contest?.public ? Math.max(slot.shownPower, seen) : slot.shownPower;
  return { ...slot, witnessed, shownPower };
}

// ── 뽑기 ──────────────────────────────────────────────────────────────

const DRAW_GROUPS: readonly (readonly string[])[] = [['art', 'item'], ['personality'], ['memory', 'bond', 'title']];

/**
 * 화를 열 때 고를 카드 셋. 같은 슬롯이 같은 화를 열면 늘 같은 셋이다.
 * 종류가 겹치지 않게 묶음마다 하나씩 먼저 뽑고, 모자라면 남은 것에서 채운다.
 */
export function drawCandidates(slot: ReaderSlot, episode: StoryEpisode, pack: StoryPack): StoryTrait[] {
  const owned = new Set(slot.traitIds);
  const eligible = Object.values(pack.traits).filter((trait) => {
    if (owned.has(trait.id) || episode.draw.exclude.includes(trait.id)) return false;
    if (trait.requires && !owned.has(trait.requires)) return false;
    if (episode.draw.include.includes(trait.id)) return true;
    if (trait.source !== 'draw') return false;
    return episode.draw.pools.length === 0 || episode.draw.pools.includes(trait.kind);
  });
  const seed = `${slotSeed(slot)}:${slot.originId}:${episode.id}:draw`;
  // 화가 `include`로 지정한 속성이 먼저 나온다(조합의 다음 조각이 늘 후보에 오르게). 나머지는 정해진 순서다.
  const hashed = stableOrder(eligible, seed, (trait) => trait.id);
  const included = episode.draw.include.map((id) => hashed.find((trait) => trait.id === id)).filter((trait): trait is StoryTrait => !!trait);
  const weapon = slot.equipment?.weapon ? pack.traits[slot.equipment.weapon] : undefined;
  const weaponTags = new Set(weapon?.tags ?? []);
  const affine = hashed.filter((t) => !included.includes(t) && t.kind === 'art' && t.tags.some((tag) => weaponTags.has(tag)));
  const ordered = [...included, ...affine, ...hashed.filter((t) => !included.includes(t) && !affine.includes(t))];
  const picked: StoryTrait[] = [];
  for (const group of DRAW_GROUPS) {
    const candidate = ordered.find((trait) => group.includes(trait.kind) && !picked.includes(trait));
    if (candidate) picked.push(candidate);
  }
  for (const trait of ordered) {
    if (picked.length >= 3) break;
    if (!picked.includes(trait)) picked.push(trait);
  }
  return picked.slice(0, 3);
}

/**
 * 후보 중 하나를 무작위로 뽑는다. 독자가 고르지 않는다.
 * 무작위는 캐릭터의 씨앗에서 나오므로, 같은 캐릭터가 같은 화를 열면 같은 카드가 뽑힌다.
 */
export function autoPickCandidate(slot: ReaderSlot, episode: StoryEpisode, candidates: readonly StoryTrait[]): StoryTrait | null {
  if (candidates.length === 0) return null;
  return candidates[stableHash(`${slotSeed(slot)}:${episode.id}:pick`) % candidates.length];
}

/** 화면에 쓸 태도·눈높이·감정의 이름 */
export function situationsForClash(clash: ClashResult | null): { protagonist: StorySituation; opponent: StorySituation } {
  if (!clash) return { protagonist: 'belittled', opponent: 'none' };
  return clash.outcome === 'victory'
    ? { protagonist: 'prevailed', opponent: 'humbled' }
    : { protagonist: 'humbled', opponent: 'prevailed' };
}

export type { StoryStance, StoryRegard, StoryEmotion };
export { resolveEmotion, resolveSpeech } from './narrative-voice';
