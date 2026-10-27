import { READER_EQUIPMENT_SLOTS, STAT_AXES, type BoundEpisode, type ClashResult, type CompanionEvent, type EpisodeRecord, type PreludeLine, type ReaderSlot, type StatAxis, type StoryEpisode, type StoryPack, type StoryTrait } from './narrative.model';
import { bindEpisode, emotionLabel, tierLabel } from './narrative-bind';
import { withJosa } from './narrative-util';
import { resolveTuning } from './narrative-tuning';
import { applyWitness, bondOf, computeStats, drawCandidates, evaluateCombinations, grantTrait, memberRelation, settleGrudge } from './narrative-state';
import { silverReward } from './narrative-shop';
import { settleCompanions } from './narrative-companion';
import { grantLoot, rollLoot } from './narrative-loot';

export interface ArcProgress {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly read: number;
  readonly total: number;
}

/** 사건 줄기마다 읽은 화 / 모든 화. 한 화도 읽지 않은 줄기도 넣는다(메뉴가 "아직"으로 보인다) */
export function arcProgress(slot: ReaderSlot, pack: StoryPack): ArcProgress[] {
  const read = new Set(slot.history.map((record) => record.episodeId));
  return (pack.arcs ?? []).map((arc) => {
    const ids = pack.episodeOrder.filter((id) => pack.episodes[id]?.arc === arc.id);
    return { id: arc.id, name: arc.name, summary: arc.summary, read: ids.filter((id) => read.has(id)).length, total: ids.length };
  });
}

/**
 * 겨루기 앞의 장면이 쓸 "보기 전의 눈". 팩의 tuning.preClashWitness가 1일 때만 쓴다.
 * PoC 1(wuxia-1)은 엮기 전에 본 힘을 고친 값으로 겨루기 앞의 말까지 골랐다. 그 글을 바꾸지 않으려고 기본은 끈다(W9).
 */
function seenBefore(slot: ReaderSlot, pack: StoryPack, clash: ClashResult | null): { witnessed: Readonly<Record<string, number>>; shownPower: number } | null {
  if (!clash || resolveTuning(pack.tuning).preClashWitness !== 1) return null;
  return { witnessed: slot.witnessed, shownPower: slot.shownPower };
}

/** 다음에 읽을 화. 다 읽었으면 null. */
export function nextEpisodeId(slot: ReaderSlot, pack: StoryPack): string | null {
  const read = new Set(slot.history.map((record) => record.episodeId));
  return pack.episodeOrder.find((id) => !read.has(id)) ?? null;
}

/** 화를 연다: 고를 카드 셋. */
export function openEpisode(slot: ReaderSlot, pack: StoryPack, episodeId: string): { episode: StoryEpisode; candidates: StoryTrait[] } | null {
  const episode = pack.episodes[episodeId];
  return episode ? { episode, candidates: drawCandidates(slot, episode, pack) } : null;
}

export function applyDraw(slot: ReaderSlot, pack: StoryPack, traitId: string | null): ReaderSlot {
  return traitId ? grantTrait(slot, pack, traitId) : slot;
}

function label(pack: StoryPack, key: string, fallback: string): string {
  return pack.glossary[key] ?? fallback;
}

/** 화를 여는 과정 ②: 뽑은 카드로 달라진 것. 실제 값을 한 줄씩 낸다. */
export function preludeChangeLines(before: ReaderSlot, after: ReaderSlot, pack: StoryPack): PreludeLine[] {
  const lines: PreludeLine[] = [];
  const beforeStats = computeStats(before, pack);
  const afterStats = computeStats(after, pack);
  for (const axis of STAT_AXES) {
    if (beforeStats[axis] !== afterStats[axis]) {
      lines.push({ step: 'change', text: `${label(pack, `stat.${axis}`, axis)} ${beforeStats[axis]} → ${afterStats[axis]}` });
    }
  }
  const newCards = after.traitIds.filter((id) => !before.traitIds.includes(id)).map((id) => pack.traits[id]).filter((trait) => trait?.kind === 'personality');
  for (const card of newCards) {
    lines.push({ step: 'change', text: `${label(pack, 'kind.personality', '성품')}: ${withJosa(card.name, '이/가')} 더해졌다` });
  }
  for (const member of Object.values(pack.cast)) {
    const delta = bondOf(after, pack, member.id) - bondOf(before, pack, member.id);
    if (delta !== 0) lines.push({ step: 'change', text: `${withJosa(member.name, '과/와')}의 ${label(pack, 'kind.bond', '인연')}이 ${delta > 0 ? '깊어졌다' : '멀어졌다'}` });
  }
  const beforeCombos = new Map(evaluateCombinations(before, pack).map((entry) => [entry.id, entry]));
  for (const combo of evaluateCombinations(after, pack)) {
    const previous = beforeCombos.get(combo.id);
    if (combo.owned === 0 || (previous && previous.owned === combo.owned && previous.complete === combo.complete)) continue;
    lines.push({ step: 'change', text: combo.complete ? `${combo.name} 완성` : `${combo.name} ${combo.owned} / ${combo.required}` });
  }
  for (const slotKey of READER_EQUIPMENT_SLOTS) {
    const beforeItem = before.equipment?.[slotKey];
    const afterItem = after.equipment?.[slotKey];
    if (beforeItem !== afterItem) {
      const slotName = label(pack, 'slot.' + slotKey, slotKey);
      if (afterItem) {
        lines.push({ step: 'change', text: `${slotName}: ${pack.traits[afterItem]?.name ?? afterItem}` });
      } else {
        lines.push({ step: 'change', text: `${slotName}: 비었다` });
      }
    }
  }
  if (lines.length === 0) lines.push({ step: 'change', text: '달라진 것은 없다' });
  return lines;
}

/** 화를 여는 과정 ③: 이번 화에 나오는 사람들이 주인공을 어떻게 대하는가. */
export function preludePeopleLines(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode): PreludeLine[] {
  const axis: StatAxis = episode.contest?.axis ?? 'might';
  const party = slot.party ?? [];
  const activeCompanions = (episode.companions ?? []).filter((id) => party.includes(id));
  const people = Array.from(new Set([...episode.cast, ...activeCompanions]));
  return people
    .map((memberId) => {
      const member = pack.cast[memberId];
      if (!member) return null;
      const relation = memberRelation(slot, pack, memberId, axis, 'none');
      const met = slot.witnessed[memberId] !== undefined || slot.bonds[memberId] !== undefined || member.bond !== 0;
      const who = withJosa(member.name, '은/는');
      const distant = relation.stance === 'hostile' || relation.stance === 'cold';
      let text: string;
      if (!met) text = `${who} 그대를 모른다`;
      else if (relation.stance === 'trusting') text = `${who} 그대를 믿는다`;
      else if (relation.stance === 'warm') text = `${who} 그대를 아낀다`;
      else if (relation.regard === 'down') text = distant ? `${who} 그대를 얕본다` : `${who} 그대를 대수롭지 않게 본다`;
      else if (relation.regard === 'up') text = `${who} 그대를 경계한다`;
      else text = `${who} 그대를 가늠한다`;
      if (relation.emotion !== 'calm') text += `. ${withJosa(emotionLabel(relation.emotion, pack), '이/가')} 인다`;
      return { step: 'people', text } as PreludeLine;
    })
    .filter((line): line is PreludeLine => line !== null);
}

export function preludeClashLine(clash: ClashResult, pack: StoryPack): PreludeLine {
  const opponent = pack.cast[clash.opponentId]?.name ?? clash.opponentId;
  const how = clash.axis === 'wit' ? '말로' : `${clash.rounds}합 만에`;
  const text = clash.outcome === 'victory'
    ? `${withJosa(opponent, '을/를')} ${how} 눌렀다 — ${tierLabel(clash.tier, pack)}`
    : `${opponent}에게 ${how} 밀렸다`;
  return { step: 'clash', text };
}

export function preludeBoundLine(bound: BoundEpisode): PreludeLine {
  return { step: 'bound', text: `이번 화의 자리 ${bound.totalCount}곳 중 ${bound.personalCount}곳이 그대의 것이다` };
}

export function preludeSilverLine(silver: number, pack: StoryPack): PreludeLine {
  const currency = label(pack, 'currency', '돈');
  const unit = label(pack, 'currency.unit', '');
  const amountStr = unit ? `${silver}${unit}` : `${silver}`;
  const text = `${currency} ${withJosa(amountStr, '을/를')} 얻었다`;
  return { step: 'change', text };
}

export function preludeCompanionLines(events: readonly CompanionEvent[], pack: StoryPack): PreludeLine[] {
  return events.map((event) => {
    const member = pack.cast[event.memberId];
    const name = member?.name ?? event.memberId;
    let text: string;
    if (event.kind === 'warn') {
      const template = pack.glossary['companion.warn'];
      if (template) {
        text = template.replace(/\{\{\s*이름\s*\}\}/g, name);
      } else {
        text = `${withJosa(name, '이/가')} 그대의 길을 근심한다`;
      }
    } else {
      const template = pack.glossary['companion.leave'];
      if (template) {
        text = template.replace(/\{\{\s*이름\s*\}\}/g, name);
      } else {
        text = `${withJosa(name, '이/가')} 곁을 떠났다`;
      }
    }
    return { step: 'change', text };
  });
}

export interface CompleteEpisodeInput {
  /** 카드를 뽑은 뒤의 슬롯 */
  readonly slot: ReaderSlot;
  readonly pack: StoryPack;
  readonly episode: StoryEpisode;
  readonly candidateIds: readonly string[];
  readonly drawnTraitId: string | null;
  readonly clash: ClashResult | null;
}

export interface CompleteEpisodeResult {
  readonly slot: ReaderSlot;
  readonly bound: BoundEpisode;
  readonly catharsis: number;
  readonly rewardTraitId: string | null;
  /** 졌고, 갚을 막간이 있다 */
  readonly needsInterlude: boolean;
  readonly silver: number;
  readonly companionEvents: readonly CompanionEvent[];
  /** 주운 전리품. 졌으면 막간의 재대결을 이긴 뒤에 줍는다 */
  readonly loot: readonly string[];
}

/** 겨루기가 끝난 뒤: 원한과 눈높이를 고치고, 본문을 엮고, 이겼으면 보상을 주고, 기록을 남긴다. */
export function completeEpisode(input: CompleteEpisodeInput): CompleteEpisodeResult {
  const { pack, episode, clash, drawnTraitId, candidateIds } = input;
  let slot = input.slot;
  let catharsis = 0;
  const before = seenBefore(input.slot, pack, clash);
  if (clash) {
    const settled = settleGrudge(slot, pack, clash);
    slot = applyWitness(settled.slot, pack, episode, clash);
    catharsis = settled.catharsis;
  }
  const { bound, slot: boundSlot } = bindEpisode({ slot, pack, episode, clash, catharsis, drawnTraitId, before });
  slot = boundSlot;

  const won = !clash || clash.outcome === 'victory';
  const rewardTraitId = won && episode.reward && (!slot.traitIds.includes(episode.reward) || pack.traits[episode.reward]?.kind === 'bead') ? episode.reward : null;
  if (rewardTraitId) slot = grantTrait(slot, pack, rewardTraitId);
  const loot = won ? rollLoot(slot, pack, episode, clash) : [];
  slot = grantLoot(slot, pack, loot);

  const silver = silverReward(pack, clash);
  slot = { ...slot, silver: (slot.silver ?? 0) + silver };

  const { slot: companionSlot, events: companionEvents } = settleCompanions(slot, pack);
  slot = companionSlot;

  const record: EpisodeRecord = {
    episodeId: episode.id,
    packVersion: pack.version,
    candidateIds,
    drawnTraitId,
    clash,
    rewardTraitId,
    bound,
    interlude: null,
    silver,
    ...(loot.length > 0 ? { loot } : {}),
  };
  slot = { ...slot, history: [...slot.history, record] };
  return { slot, bound, catharsis, rewardTraitId, needsInterlude: !won && !!episode.windfall && !!pack.traits[episode.windfall], silver, companionEvents, loot };
}

/** 막간을 연다: 그 상대에게 듣는 기연을 얻는다. */
export function beginInterlude(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode): { slot: ReaderSlot; windfall: StoryTrait } | null {
  const windfall = episode.windfall ? pack.traits[episode.windfall] : null;
  if (!windfall) return null;
  return { slot: grantTrait(slot, pack, windfall.id), windfall };
}

export interface CompleteInterludeResult {
  readonly slot: ReaderSlot;
  readonly bound: BoundEpisode;
  readonly catharsis: number;
  readonly rewardTraitId: string | null;
  readonly loot: readonly string[];
}

/** 다시 겨뤄 갚은 뒤: 막간의 본문을 엮고, 원래의 보상을 주고, 기록에 덧붙인다. */
export function completeInterlude(input: { slot: ReaderSlot; pack: StoryPack; episode: StoryEpisode; rematch: ClashResult }): CompleteInterludeResult | null {
  const { pack, episode, rematch } = input;
  const template = pack.interludes[episode.onDefeat ?? ''] ?? Object.values(pack.interludes)[0];
  if (!template || !episode.windfall) return null;
  const before = seenBefore(input.slot, pack, rematch);
  const settled = settleGrudge(input.slot, pack, rematch);
  let slot = applyWitness(settled.slot, pack, episode, rematch);
  const interlude: StoryEpisode = {
    ...template,
    id: `${episode.id}:interlude`,
    number: 0,
    cast: episode.cast,
    contest: episode.contest,
    zone: template.zone || episode.zone,
  };
  const { bound, slot: boundSlot } = bindEpisode({ slot, pack, episode: interlude, clash: rematch, catharsis: settled.catharsis, drawnTraitId: null, before });
  slot = boundSlot;

  const rewardTraitId = rematch.outcome === 'victory' && episode.reward && (!slot.traitIds.includes(episode.reward) || pack.traits[episode.reward]?.kind === 'bead') ? episode.reward : null;
  if (rewardTraitId) slot = grantTrait(slot, pack, rewardTraitId);
  const loot = rematch.outcome === 'victory' ? rollLoot(slot, pack, episode, rematch) : [];
  slot = grantLoot(slot, pack, loot);

  const history = slot.history.map((record, index) =>
    index === slot.history.length - 1 && record.episodeId === episode.id
      ? { ...record, rewardTraitId: record.rewardTraitId ?? rewardTraitId, interlude: { windfallTraitId: episode.windfall as string, rematch, bound }, ...(loot.length > 0 ? { loot: [...(record.loot ?? []), ...loot] } : {}) }
      : record,
  );
  return { slot: { ...slot, history }, bound, catharsis: settled.catharsis, rewardTraitId, loot };
}
