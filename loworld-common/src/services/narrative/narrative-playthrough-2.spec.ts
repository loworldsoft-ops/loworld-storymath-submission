/**
 * W9 PoC 2 통독 시험 — 「청운잡역기」(wuxia-2) 24화.
 * PoC 1의 R1~R6(narrative-playthrough.spec.ts)을 따르고, 패턴 검사(__testing__/pattern.ts)를 더한다.
 * 가상 독자는 메뉴 쓰는 법(구슬 흡수·박기·합치기, 상점)과 씨앗이 다르다. 씨앗은 넓게 훑은 결과에서 골랐다(PROGRESS W9).
 * 콘텐츠 저장소가 없으면 건너뛴다.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import type { ClashResult, ReaderSlot, StoryBeat, StoryEpisode, StoryPack } from './narrative.model';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import { autoPickCandidate, createReaderSlot, socketBead } from './narrative-state';
import { applyDraw, arcProgress, beginInterlude, completeEpisode, completeInterlude, nextEpisodeId, openEpisode } from './narrative-flow';
import { autoMightClash, bestWitMove, createMightClash, finishMightClash, resolveWitContest } from './narrative-clash';
import { absorbBead, fuseBeads, realmOf } from './narrative-beads';
import { buyItem, currentZoneId, sellItem, shopInZone, canSell } from './narrative-shop';
import { beatUnits } from './narrative-bind';
import { buildCodex } from './narrative-codex';
import { measureBound, summarize, wasRewarded, type EpisodePattern } from './__testing__/pattern';

const contentDir = join(process.cwd(), 'loworld-content-wuxia/packs/wuxia-2');

// ── 메뉴 쓰는 법 ─────────────────────────────────────────────────────────

interface MenuLog {
  bought: string[];
  sold: string[];
  absorbed: string[];
  fused: string[];
  socketed: string[];
}
type Menu = (slot: ReaderSlot, pack: StoryPack, log: MenuLog) => ReaderSlot;

const absorbAll: Menu = (slot, pack, log) => {
  let next = slot;
  for (const [id, count] of Object.entries(next.beads ?? {})) {
    if (id === 'bead.seojin') continue;
    for (let i = 0; i < count; i += 1) {
      const result = absorbBead(next, pack, id);
      if (result.ok) { next = result.slot; log.absorbed.push(id); }
    }
  }
  return next;
};
const absorbSeojin: Menu = (slot, pack, log) => {
  const result = absorbBead(slot, pack, 'bead.seojin');
  if (!result.ok) return slot;
  log.absorbed.push('bead.seojin');
  return result.slot;
};
const fuseAll: Menu = (slot, pack, log) => {
  let next = slot;
  for (let round = 0; round < 6; round += 1) for (const id of Object.keys(next.beads ?? {})) {
    const result = fuseBeads(next, pack, id);
    if (result.ok) { next = result.slot; log.fused.push(id); }
  }
  return next;
};
const buy = (...ids: string[]): Menu => (slot, pack, log) => {
  const shop = shopInZone(pack, currentZoneId(slot, pack));
  if (!shop) return slot;
  let next = slot;
  for (const id of ids) {
    if (!shop.items.includes(id)) continue;
    const result = buyItem(next, pack, shop.id, id);
    if (result.ok) { next = result.slot; log.bought.push(`${shop.id}:${id}`); }
  }
  return next;
};
const sellSpare: Menu = (slot, pack, log) => {
  let next = slot;
  for (const id of [...next.traitIds]) {
    const trait = pack.traits[id];
    if (trait?.kind !== 'item' || !trait.equip || Object.values(next.equipment ?? {}).includes(id) || (trait.sockets ?? 0) > 0) continue;
    if (!canSell(next, pack, id)) continue;
    const result = sellItem(next, pack, id);
    if (result.ok) { next = result.slot; log.sold.push(id); }
  }
  return next;
};
/** 구결 하나를 노린다: 맞는 장비의 다음 혈에 다음 글자를 박는다 */
const aim = (verseId: string): Menu => (slot, pack, log) => {
  const verse = (pack.verses ?? []).find((entry) => entry.id === verseId);
  if (!verse) return slot;
  let next = slot;
  for (const itemId of next.traitIds) {
    const item = pack.traits[itemId];
    if (!item || item.kind !== 'item' || (item.sockets ?? 0) !== verse.beads.length || !item.equip || !verse.equip.includes(item.equip)) continue;
    if (verse.tags.length && !verse.tags.some((tag) => item.tags.includes(tag))) continue;
    for (let guard = 0; guard < 4; guard += 1) {
      const set = next.sockets?.[itemId] ?? [];
      if (set.length >= verse.beads.length || set.some((bead, index) => bead !== verse.beads[index])) break;
      const result = socketBead(next, pack, itemId, verse.beads[set.length]);
      if (!result.ok) break;
      next = result.slot;
      log.socketed.push(`${itemId}:${verse.beads[set.length - 0]}`);
    }
  }
  return next;
};

const POLICIES: Record<string, readonly Menu[]> = {
  none: [],
  good: [buy('item.prayer-beads', 'item.cotton-robe'), absorbAll],
  cruel: [buy('item.bloody-dagger'), absorbAll],
  insin: [buy('bead.in', 'item.prayer-beads'), aim('verse.insin'), fuseAll],
  manchiui: [buy('bead.man'), fuseAll, aim('verse.manchiui')],
  seojin: [absorbSeojin, absorbAll, buy('item.prayer-beads')],
  orphan: [absorbSeojin],
  amulet: [buy('bead.hui', 'item.prayer-beads'), fuseAll, aim('verse.huisin'), aim('verse.guin')],
  merchant: [buy('item.saber', 'item.cotton-robe', 'bead.gu', 'bead.in'), aim('verse.guin'), aim('verse.nodan'), sellSpare],
};

interface Persona {
  readonly id: string;
  readonly name: string;
  readonly policy: keyof typeof POLICIES;
  readonly originId: 'sword' | 'mind';
  readonly n: number;
  /** 24화 끝맺음 슬롯의 갈래 */
  readonly ending: string;
}

/** 씨앗은 `${policy}-${origin}-${n}`. 넓게 훑어 고른 값이다(PROGRESS W9) */
const PERSONAS: readonly Persona[] = [
  { id: 'V1', name: '협객', policy: 'good', originId: 'sword', n: 1, ending: '끝맺음.0' },
  { id: 'V2', name: '흑도', policy: 'cruel', originId: 'mind', n: 1, ending: '끝맺음.1' },
  { id: 'V3', name: '무심', policy: 'none', originId: 'sword', n: 6, ending: '끝맺음.else' },
  { id: 'V4', name: '장사꾼', policy: 'merchant', originId: 'sword', n: 25, ending: '끝맺음.0' },
  { id: 'V5', name: '마두', policy: 'cruel', originId: 'sword', n: 7, ending: '끝맺음.2' },
  { id: 'V6', name: '선비', policy: 'insin', originId: 'mind', n: 25, ending: '끝맺음.3' },
  { id: 'V7', name: '수집가', policy: 'manchiui', originId: 'sword', n: 1, ending: '끝맺음.4' },
  { id: 'V8', name: '누이', policy: 'seojin', originId: 'sword', n: 1, ending: '끝맺음.0' },
  { id: 'V9', name: '옥패', policy: 'amulet', originId: 'sword', n: 5, ending: '끝맺음.0' },
  { id: 'V10', name: '고아', policy: 'orphan', originId: 'mind', n: 1, ending: '끝맺음.4' },
];

// ── 통독 ─────────────────────────────────────────────────────────────────

interface Run {
  readonly slot: ReaderSlot;
  readonly log: MenuLog;
  readonly patterns: EpisodePattern[];
  readonly firstClash: Record<string, ClashResult | null>;
  readonly rematch: Record<string, ClashResult | null>;
  readonly companionEvents: string[];
  /** 화마다 시작할 때와 마칠 때(막간 전)의 동료 */
  readonly party: Record<string, { readonly start: readonly string[]; readonly end: readonly string[] }>;
}

function autoClash(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode, attempt: number): ClashResult | null {
  if (!episode.contest) return null;
  if (episode.contest.axis === 'wit') return resolveWitContest(slot, pack, episode, bestWitMove(slot, pack, episode.contest.opponent), true);
  const might = createMightClash(slot, pack, episode, attempt);
  return might ? finishMightClash(autoMightClash(might), pack, true) : null;
}

function seedOf(policy: string, origin: string, n: number): string {
  return `${policy}-${origin}-${n}`;
}

function playthrough(pack: StoryPack, policy: string, origin: string, n: number): Run {
  const seed = seedOf(policy, origin, n);
  const log: MenuLog = { bought: [], sold: [], absorbed: [], fused: [], socketed: [] };
  const patterns: EpisodePattern[] = [];
  const firstClash: Record<string, ClashResult | null> = {};
  const rematch: Record<string, ClashResult | null> = {};
  const companionEvents: string[] = [];
  const party: Run['party'] = {};
  let slot = createReaderSlot(pack, seed, origin, '이현', seed);
  for (let guard = 0; guard < 40; guard += 1) {
    if (slot.history.length > 0) for (const menu of POLICIES[policy]) slot = menu(slot, pack, log);
    const id = nextEpisodeId(slot, pack);
    if (!id) break;
    const opened = openEpisode(slot, pack, id);
    if (!opened) break;
    const before = slot;
    const picked = autoPickCandidate(slot, opened.episode, opened.candidates);
    const work = applyDraw(slot, pack, picked?.id ?? null);
    const clash = autoClash(work, pack, opened.episode, 0);
    firstClash[id] = clash;
    const done = completeEpisode({ slot: work, pack, episode: opened.episode, candidateIds: opened.candidates.map((c) => c.id), drawnTraitId: picked?.id ?? null, clash });
    party[id] = { start: work.party ?? [], end: done.slot.party ?? [] };
    slot = done.slot;
    companionEvents.push(...done.companionEvents.map((event) => `${id}:${event.kind}:${event.memberId}`));
    if (done.needsInterlude) {
      const begun = beginInterlude(slot, pack, opened.episode);
      if (!begun) throw new Error(`막간을 열지 못했다: ${seed} ${id}`);
      let again = autoClash(begun.slot, pack, opened.episode, 1);
      if (again?.outcome === 'defeat') again = autoClash(begun.slot, pack, opened.episode, 2);
      if (!again) throw new Error(`재대결이 없다: ${seed} ${id}`);
      rematch[id] = again;
      const finished = completeInterlude({ slot: begun.slot, pack, episode: opened.episode, rematch: again });
      if (finished) slot = finished.slot;
    }
    patterns.push({ episodeId: id, ...measureBound(done.bound), rewarded: wasRewarded(before, slot) });
  }
  return { slot, log, patterns, firstClash, rematch, companionEvents, party };
}

function endingOf(slot: ReaderSlot): string | null {
  const record = slot.history.find((entry) => entry.episodeId === 'ep024');
  return record?.bound.paragraphs.flatMap((paragraph) => paragraph.traces).find((trace) => trace.place === '끝맺음')?.choiceId ?? null;
}

// ── 도달 (R4) ────────────────────────────────────────────────────────────

/** 이 팩이 낼 수 있는 모든 갈래의 열쇠. 슬롯의 갈래, 말투 갈래가 있는 대사 줄, 대화 장면, 대화 장면 자리의 대체, 장면 */
function universe(pack: StoryPack): Set<string> {
  const keys = new Set<string>();
  const addBeats = (owner: string, beats: readonly StoryBeat[]) => {
    beats.forEach((beat, index) => {
      for (const slotDef of Object.values(beat.slots)) for (const variant of slotDef.variants) keys.add(`${owner}${variant.id}`);
      for (const unit of beatUnits(beat.text)) {
        // 말투 갈래 무리의 대체 줄(`[ ]` 없는 줄)은 안전망이다. 말투 표가 바뀌어도 대사가 끊기지 않게 둔다. 도달을 세지 않는다
        if (unit.kind === 'lines' && unit.group.branching) unit.group.variants.forEach((variant, variantIndex) => { if (variant.speeches) keys.add(`${owner}L${index}${unit.group.id}.${variantIndex}`); });
        if (unit.kind === 'text') {
          // 대체 문장을 적은 자리만 센다. 적지 않은 자리는 맞는 장면이 없으면 아무것도 나오지 않는다
          const talk = /^\[\[talk:([^\]:|]+)[^\]]*\|[^\]]*\]\]$/.exec(unit.source);
          if (talk && !owner.startsWith('talk:')) keys.add(`${owner}talk:${talk[1].trim()}:else`);
        }
      }
    });
  };
  for (const episode of Object.values(pack.episodes)) addBeats(`${episode.id}#`, episode.beats);
  for (const [id, interlude] of Object.entries(pack.interludes)) addBeats(`interlude:${id}#`, interlude.beats);
  for (const talk of pack.talks ?? []) {
    keys.add(`talk:${talk.id}`);
    addBeats(`talk:${talk.id}#`, [talk.beat]);
  }
  for (const [key, beat] of Object.entries(pack.scenes ?? {})) {
    keys.add(`scene:${key}`);
    addBeats(`scene:${key}#`, [beat]);
  }
  return keys;
}

function reached(pack: StoryPack, slot: ReaderSlot, into: Set<string>): void {
  const keyOf = (owner: string, choiceId: string) => (choiceId.startsWith('talk:talk.') || choiceId.startsWith('scene:') ? choiceId : `${owner}${choiceId}`);
  for (const record of slot.history) {
    const all = [...record.bound.paragraphs.flatMap((paragraph) => paragraph.traces), ...(record.bound.silent ?? [])];
    for (const trace of all) into.add(keyOf(`${record.episodeId}#`, trace.choiceId));
    if (record.interlude) {
      const template = pack.episodes[record.episodeId]?.onDefeat ?? '';
      const inner = [...record.interlude.bound.paragraphs.flatMap((paragraph) => paragraph.traces), ...(record.interlude.bound.silent ?? [])];
      for (const trace of inner) into.add(keyOf(`interlude:${template}#`, trace.choiceId));
    }
  }
}

type UnreachedKind = 'rematch-loss' | 'structure' | 'coverage';

/** 말투 갈래가 있는 대사 줄 중 닿아야 하는 몫. 잰 값(PROGRESS W9)보다 조금 낮게 둔다 */
const LINE_REACH = 0.7;

/** 300번 훑기로도 닿지 않는 갈래와 그 까닭. 늘어나면 시험이 실패한다. 줄이면 여기서 지운다 */
const UNREACHED_OK: Record<string, { kind: UnreachedKind; why: string }> = {
  'interlude:memory#갚음.else': { kind: 'rematch-loss', why: '막간의 재대결은 기연의 바닥값(상대 힘 × 1.6)과 두 번의 기회로 지지 않는다' },
  'interlude:memory#빛.else': { kind: 'rematch-loss', why: '빛 슬롯의 else는 재대결에서 졌을 때다. 재대결은 지지 않는다' },
};

// ── 시험 ─────────────────────────────────────────────────────────────────

describe.skipIf(!existsSync(contentDir))('PoC 2 통독 시험 (W9, wuxia-2)', () => {
  const compiled = compilePack(contentDir);
  const pack = enrichPackWithPersonalityCards(compiled.pack as StoryPack);
  const runs = PERSONAS.map((persona) => ({ persona, run: playthrough(pack, persona.policy, persona.originId, persona.n) }));
  const SWEEP = 31;
  const sweep = PERSONAS.flatMap((persona) => Array.from({ length: SWEEP }, (_, index) => playthrough(pack, persona.policy, persona.originId, index + 101)));

  if (process.env['POC2_REPORT']) {
    const lines: string[] = [];
    for (const { persona, run } of runs) {
      lines.push(`# ${persona.id} ${endingOf(run.slot)} rematch:${Object.keys(run.rematch).join(',')}`);
      for (const pattern of run.patterns) if (pattern.ratio < 0.4 || !pattern.rewarded || pattern.clashChars > 300) lines.push(`  ${pattern.episodeId} ratio ${pattern.ratio.toFixed(2)} chars ${pattern.chars} clash ${pattern.clashChars} rewarded ${pattern.rewarded}`);
    }
    const rematchEps = new Set(sweep.flatMap((run) => Object.keys(run.rematch)));
    lines.push(`sweep rematch: ${[...rematchEps].sort().join(',')}`);
    const low = sweep.map((run) => summarize(run.patterns).avgRatio).sort();
    lines.push(`sweep avg ratio min ${low[0]?.toFixed(3)} p10 ${low[Math.floor(low.length / 10)]?.toFixed(3)}`);
    const perEp: Record<string, number[]> = {};
    for (const run of sweep) for (const pattern of run.patterns) (perEp[pattern.episodeId] ??= []).push(pattern.ratio);
    for (const [id, values] of Object.entries(perEp)) lines.push(`  ${id} min ${Math.min(...values).toFixed(2)} avg ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}`);
    writeFileSync(process.env['POC2_REPORT'], lines.join('\n'));
  }

  it('팩 도구의 문제가 없다', () => {
    expect(compiled.problems).toEqual([]);
  });

  describe('R1: 수렴', () => {
    it.each(runs)('$persona.id ($persona.name) 24화를 완독하고, 23화는 지고 막간에서 이긴다', ({ run }) => {
      expect(run.slot.history).toHaveLength(24);
      expect(run.firstClash['ep023']?.outcome).toBe('defeat');
      expect(run.rematch['ep023']?.outcome).toBe('victory');
      expect(run.slot.traitIds).toContain('bead.gwi');
    });

    it('훑기 310번 모두 완독하고 23화 재대결을 이긴다', () => {
      for (const run of sweep) {
        expect(run.slot.history).toHaveLength(24);
        expect(run.firstClash['ep023']?.outcome).toBe('defeat');
        expect(run.rematch['ep023']?.outcome).toBe('victory');
      }
    });
  });

  describe('R2: 결말', () => {
    it.each(runs)('$persona.id ($persona.name) → $persona.ending', ({ persona, run }) => {
      expect(endingOf(run.slot)).toBe(persona.ending);
    });

    it('결말 여섯이 모두 나온다', () => {
      const endings = new Set(runs.map(({ run }) => endingOf(run.slot)));
      expect([...endings].sort()).toEqual(['끝맺음.0', '끝맺음.1', '끝맺음.2', '끝맺음.3', '끝맺음.4', '끝맺음.else']);
    });
  });

  describe('R3: 기능 지도 (bible/plot.md 7장)', () => {
    const all = [...runs.map(({ run }) => run), ...sweep];
    const traceIds = (run: Run) => run.slot.history.flatMap((record) => [...record.bound.paragraphs.flatMap((p) => p.traces), ...(record.bound.silent ?? []), ...(record.interlude ? record.interlude.bound.paragraphs.flatMap((p) => p.traces) : [])]);
    const anyRun = (pred: (run: Run) => boolean) => all.some(pred);

    it('대화 장면이 모든 화에 있고, 대화 장면이 인연과 동료 사이를 움직인다', () => {
      for (const { run } of runs) expect(summarize(run.patterns).withoutTalk).toEqual([]);
      expect(anyRun((run) => Object.values(run.slot.ties ?? {}).some((value) => value > 0))).toBe(true);
    });

    it('공명과 어긋남이 모두 "이렇게 쓰인 이유"에 나온다', () => {
      const reasons = all.flatMap((run) => traceIds(run).map((trace) => trace.reason));
      expect(reasons.some((reason) => reason.includes('성품이 맞아서'))).toBe(true);
      expect(reasons.some((reason) => reason.includes('성품이 어긋나서'))).toBe(true);
    });

    it('새 말투 넷(놀림, 다정, 퉁명, 능청)이 대사 줄에 나온다', () => {
      const reasons = all.flatMap((run) => traceIds(run).map((trace) => trace.reason));
      for (const label of ['놀림', '다정', '퉁명', '능청']) expect(reasons.some((reason) => reason.endsWith(`말투: ${label}`))).toBe(true);
    });

    it('구슬: 겨루기·대화·전리품으로 얻고, 흡수하고, 합치고, 박고, 상점에서 산다', () => {
      expect(anyRun((run) => run.slot.history.some((record) => record.rewardTraitId?.startsWith('bead.')))).toBe(true);
      expect(anyRun((run) => run.slot.history.some((record) => (record.loot ?? []).some((id) => id.startsWith('bead.'))))).toBe(true);
      expect(anyRun((run) => run.log.absorbed.length > 0)).toBe(true);
      expect(anyRun((run) => run.log.fused.length > 0)).toBe(true);
      expect(anyRun((run) => run.log.socketed.length > 0)).toBe(true);
      expect(anyRun((run) => run.log.bought.some((entry) => entry.startsWith('shop.glass-alley:bead.')))).toBe(true);
      expect(anyRun((run) => run.slot.history.some((record) => (record.loot ?? []).some((id) => ['mid', 'high'].includes(pack.traits[id]?.rarity ?? ''))))).toBe(true);
    });

    it('구결 다섯이 각각 누군가에게서 완성된다', () => {
      for (const verse of ['insin', 'nodan', 'huisin', 'guin', 'manchiui']) expect(anyRun((run) => run.slot.flags.includes(`verse:verse.${verse}`))).toBe(true);
    });

    it('경지 넷과 흡수 장면, 구결 장면, 경지 장면이 나온다', () => {
      const realms = new Set(all.map((run) => realmOf(run.slot, pack)?.id));
      expect(realms.has('realm.third')).toBe(true);
      expect(realms.has('realm.peak')).toBe(true);
      const scenes = all.flatMap((run) => traceIds(run).map((trace) => trace.choiceId)).filter((id) => id.startsWith('scene:') && !id.includes('#'));
      for (const prefix of ['scene:absorb.', 'scene:realm.realm.second', 'scene:realm.realm.first', 'scene:realm.realm.peak', 'scene:verse.']) expect(scenes.some((id) => id.startsWith(prefix))).toBe(true);
    });

    it('동료 셋이 합류하고, 서하가 경고 뒤 떠나는 독자가 있다', () => {
      for (const member of ['seo-ha', 'sa-doyeon', 'ma-cheung']) expect(anyRun((run) => (run.slot.party ?? []).includes(member) || run.slot.flags.includes(`left:${member}`))).toBe(true);
      expect(anyRun((run) => run.companionEvents.some((event) => event.endsWith(':warn:seo-ha')))).toBe(true);
      expect(anyRun((run) => run.slot.flags.includes('left:seo-ha'))).toBe(true);
    });

    it('연애: 서하와 사도연 모두 3단계에 닿는 독자가 있다', () => {
      expect(anyRun((run) => run.slot.romance?.targetId === 'seo-ha' && run.slot.romance.stage === 3)).toBe(true);
      expect(anyRun((run) => run.slot.romance?.targetId === 'sa-doyeon' && run.slot.romance.stage === 3)).toBe(true);
    });

    it('막간이 1·3·4·8·9·11·14·23화에서 열린다', () => {
      for (const id of ['ep001', 'ep003', 'ep004', 'ep008', 'ep009', 'ep011', 'ep014', 'ep023']) expect(anyRun((run) => !!run.rematch[id])).toBe(true);
    });

    it('일상 화 일곱은 겨루기가 없다', () => {
      for (const { run } of runs) for (const id of ['ep002', 'ep005', 'ep013', 'ep016', 'ep020', 'ep021', 'ep024']) expect(run.slot.history.find((record) => record.episodeId === id)?.clash).toBeNull();
    });

    it('사건 줄기 셋을 끝까지 읽는다', () => {
      for (const { run } of runs) for (const arc of arcProgress(run.slot, pack)) expect(arc.read).toBe(arc.total);
    });

    it('처분이 성향 셋으로 갈린다 (곽두와 진 총관)', () => {
      for (const flag of ['gwak-redeemed', 'gwak-held', 'gwak-owes', 'slew-jin', 'spared-jin', 'bound-jin', 'told-seojin', 'returned-seojin', 'gwak-caught']) expect(anyRun((run) => run.slot.flags.includes(flag))).toBe(true);
    });

    it('상점에서 사고판다', () => {
      expect(anyRun((run) => run.log.bought.length > 0)).toBe(true);
      expect(anyRun((run) => run.log.sold.length > 0)).toBe(true);
    });

    it('도감에 구슬과 구결 분류가 있다', () => {
      const codex = buildCodex(pack, runs[0].run.slot);
      expect(codex.groups.map((group) => group.id)).toEqual(expect.arrayContaining(['bead', 'verse']));
    });
  });

  describe('패턴 검사 (bible/style.md 2장)', () => {
    it.each(runs)('$persona.id ($persona.name): 대사 50% 이상, 한 화도 35% 아래가 없다, 겨루기는 300자 이내, 보상 없는 화가 없다', ({ run }) => {
      const summary = summarize(run.patterns);
      expect(summary.avgRatio).toBeGreaterThanOrEqual(0.5);
      expect(summary.minRatio).toBeGreaterThanOrEqual(0.35);
      expect(summary.maxClashChars).toBeLessThanOrEqual(300);
      expect(summary.withoutReward).toEqual([]);
    });

    it('훑기에서도 1막 평균 대사 비율이 50%를 넘는다', () => {
      for (const run of sweep) expect(summarize(run.patterns).avgRatio).toBeGreaterThanOrEqual(0.5);
    });

    it('이름 있는 인물은 모두 한 번 이상 말한다', () => {
      const spoken = new Set([...runs.map(({ run }) => run), ...sweep].flatMap((run) => run.patterns.flatMap((pattern) => pattern.speakers)));
      for (const member of Object.values(pack.cast)) expect(spoken.has(member.name)).toBe(true);
    });
  });

  describe('R4: 도달', () => {
    const universeKeys = universe(pack);
    const got = new Set<string>();
    for (const run of [...runs.map(({ run }) => run), ...sweep]) reached(pack, run.slot, got);
    const isLine = (key: string) => /#L\d+@/.test(key);
    const unreached = [...universeKeys].filter((key) => !got.has(key)).sort();
    const lines = [...universeKeys].filter(isLine);
    const unreachedLines = unreached.filter(isLine);
    if (process.env['POC2_UNREACHED']) writeFileSync(process.env['POC2_UNREACHED'], unreached.join('\n'));

    it('슬롯의 갈래, 대화 장면, 장면, 대체 문장 중 닿지 않는 것은 예외 목록과 같다', () => {
      expect(unreached.filter((key) => !isLine(key))).toEqual(Object.keys(UNREACHED_OK).sort());
    });

    // 대사 줄의 말투 갈래는 독자의 성품 카드·성향·인연이 모두 맞아야 나와서 수가 많다. 하나씩 예외로 적지 않고 도달률로 본다.
    // 닿지 않는 줄의 목록은 POC2_UNREACHED로 뽑아 작가가 본다(PROGRESS W9)
    if (process.env['POC2_REPORT']) writeFileSync(`${process.env['POC2_REPORT']}.lines`, `${lines.length} ${unreachedLines.length} ${(1 - unreachedLines.length / lines.length).toFixed(3)}`);
    it(`말투 갈래가 있는 대사 줄의 ${LINE_REACH * 100}% 이상에 닿는다`, () => {
      expect(1 - unreachedLines.length / lines.length).toBeGreaterThanOrEqual(LINE_REACH);
    });

    it('예외 목록의 까닭이 비어 있지 않다', () => {
      for (const entry of Object.values(UNREACHED_OK)) expect(entry.why.length).toBeGreaterThan(0);
    });
  });

  describe('R5: 결정성', () => {
    it.each(runs)('$persona.id 다시 읽어도 같다', ({ persona, run }) => {
      expect(JSON.stringify(playthrough(pack, persona.policy, persona.originId, persona.n).slot)).toBe(JSON.stringify(run.slot));
    });
  });

  describe('R6: 동행하지 않는 동료는 말하지 않는다', () => {
    it('그 화의 동료 칸에 있고 화의 처음과 끝에 동행하지 않은 인물은 그 화에서 말하지 않는다', () => {
      for (const run of [...runs.map(({ run }) => run), ...sweep]) {
        for (const record of run.slot.history) {
          const episode = pack.episodes[record.episodeId];
          const at = run.party[record.episodeId];
          for (const memberId of episode?.companions ?? []) {
            if (at.start.includes(memberId) || at.end.includes(memberId) || episode.cast.includes(memberId)) continue;
            const name = pack.cast[memberId]?.name;
            expect(record.bound.paragraphs.some((p) => p.speakerName === name), `${record.episodeId}: ${name}`).toBe(false);
          }
        }
      }
    });
  });
});
