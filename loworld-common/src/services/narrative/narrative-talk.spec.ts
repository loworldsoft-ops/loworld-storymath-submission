/**
 * W9 2~3장: 대사 줄(`@화자[말투]:`), 대화 장면(`[[talk:…]]`), 대화 → 인연과 공명, 동료끼리의 관계.
 * 고정 팩 `__fixtures__/w9-mini`를 쓴다.
 */
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import type { BoundEpisode, ClashResult, ReaderSlot, StoryPack } from './narrative.model';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import { bindEpisode, beatUnits } from './narrative-bind';
import { createReaderSlot } from './narrative-state';
import { completeEpisode } from './narrative-flow';
import { resonanceOf, tieOf } from './narrative-resonance';

const pack: StoryPack = enrichPackWithPersonalityCards(compilePack(join(process.cwd(), 'loworld-common/src/services/narrative/__fixtures__/w9-mini')).pack as StoryPack);

const victory: ClashResult = { episodeId: 'ep1', opponentId: 'rival', axis: 'might', outcome: 'victory', tier: 'advantage', rounds: 2, finisherTraitId: null, usedTraitIds: [], untouched: false, auto: true };

function bind(slot: ReaderSlot, episodeId: string, clash: ClashResult | null = null): { bound: BoundEpisode; slot: ReaderSlot } {
  return bindEpisode({ slot, pack, episode: pack.episodes[episodeId], clash, catharsis: 0, drawnTraitId: null });
}

const texts = (bound: BoundEpisode) => bound.paragraphs.map((paragraph) => paragraph.text);
const traceIds = (bound: BoundEpisode) => bound.paragraphs.flatMap((paragraph) => paragraph.traces.map((trace) => trace.choiceId));
const silentIds = (bound: BoundEpisode) => (bound.silent ?? []).map((trace) => trace.choiceId);

describe('W9 대사 줄의 무리', () => {
  it('같은 화자의 줄이 이어지면 한 무리이고, [ ] 줄이 있으면 갈래다', () => {
    const units = beatUnits('앞 문단.\n\n@a[tease]: 하나\n@a: 둘\n\n@b: 셋\n\n@b: 넷\n\n뒤 문단.');
    expect(units.map((unit) => unit.kind)).toEqual(['text', 'lines', 'lines', 'text']);
    const [, first, second] = units;
    expect(first.kind === 'lines' && first.group).toMatchObject({ id: '@a.0', speaker: 'a', branching: true });
    expect(second.kind === 'lines' && second.group).toMatchObject({ id: '@b.1', speaker: 'b', branching: false });
    expect(second.kind === 'lines' && second.group.variants.length).toBe(2);
  });

  it('@주인공(상대): 말투가 향하는 사람을 줄마다 적는다. 상대가 바뀌면 다른 무리다', () => {
    const units = beatUnits('@protagonist(friend)[tease]: 하나\n@protagonist(friend): 둘\n@protagonist(rival): 셋');
    expect(units.map((unit) => unit.kind === 'lines' && [unit.group.toward, unit.group.variants.length])).toEqual([['friend', 2], ['rival', 1]]);
  });

  it('문단 번호는 빈 문단까지 센다 (PoC 1의 대사 고르기 자리와 같다)', () => {
    const units = beatUnits('하나\n\n\n\n@a: 둘');
    expect(units[1].index).toBe(1);
  });
});

describe('W9 대화 장면 고르기', () => {
  it('인연이 호의면 좁은 장면(조건이 있는 것)을 고른다. 말투에 맞는 줄이 나온다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep1', victory);
    expect(texts(bound)).toContain('따뜻한 밥이 있었다.');
    expect(texts(bound)).toContain('“또 늦었네.”'); // 벗: 측은지심 + 호의 → 놀림
    expect(texts(bound)).toContain('“미안.”'); // 주인공: 놀림은 [mock]에 없다 → 대체 줄
    expect(texts(bound)).not.toContain('식은 밥이 있었다.');
    expect(traceIds(bound)).toContain('talk:talk.meal-warm');
    expect(traceIds(bound)).toContain('talk:talk.meal-warm#L0@friend.0.0');
    expect(traceIds(bound)).toContain('talk:talk.meal-warm#L0@protagonist.1.1');
  });

  it('대화 장면의 첫 문단에 까닭이 붙는다: 조건과 공명', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep1', victory);
    const trace = bound.paragraphs.flatMap((paragraph) => paragraph.traces).find((entry) => entry.choiceId === 'talk:talk.meal-warm');
    expect(trace?.reason).toContain('벗의 태도가 호의·신뢰');
    expect(trace?.reason).toContain('벗과 성품이 맞아서');
  });

  it('인연이 낮으면 넓은 장면이 나온다', () => {
    const slot = { ...createReaderSlot(pack, 's', 'warm', '갑', 'seed-1'), bonds: { friend: 0 } };
    const { bound, slot: after } = bind(slot, 'ep1', victory);
    expect(texts(bound)).toContain('식은 밥이 있었다.');
    expect(traceIds(bound)).toContain('talk:talk.meal-any');
    // 멀어지는 값 -4는 공명이면 × 0.5 → -2
    expect(after.bonds['friend']).toBe(-2);
  });

  it('주인공의 말투 갈래: 오만 카드면 조롱 줄', () => {
    const slot = createReaderSlot(pack, 's', 'cold', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep1', victory);
    expect(texts(bound)).toContain('“늦은 게 대수냐.”');
  });

  it('주인공의 말투는 줄에 적은 상대를 향한다', () => {
    // 1화의 겨루기 상대는 맞수(냉담)다. 상대를 적지 않은 줄은 맞수를 향하고, (friend)를 적은 줄은 벗과의 태도(호의)로 고른다.
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep1', victory);
    expect(texts(bound)).toContain('“놀린다.”');
    expect(texts(bound)).toContain('“맞수에게 그냥.”');
  });

  it('갈래가 없는 무리는 모든 줄이 나온다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep1', victory);
    expect(texts(bound)).toEqual(expect.arrayContaining(['“괜찮아?”', '“정말?”']));
  });
});

describe('W9 겨루기 앞의 눈 (tuning.preClashWitness)', () => {
  it('켜면 겨루기 앞의 말은 겨루기를 보기 전의 눈높이로 고른다. 끄면 PoC 1처럼 본 뒤의 값이다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const on: StoryPack = { ...pack, tuning: { ...pack.tuning, preClashWitness: 1 } };
    const run = (target: StoryPack) => completeEpisode({ slot, pack: target, episode: target.episodes['ep1'], candidateIds: [], drawnTraitId: null, clash: victory }).bound;
    // 맞수(힘 20)는 처음에 주인공을 내려다본다(본 힘 10). 이긴 뒤에는 27로 고쳐져 올려다본다.
    expect(texts(run(on))).toContain('“덤벼라.”');
    expect(texts(run(pack))).toContain('“와라.”');
  });
});

describe('W9 대화 → 인연 (공명)', () => {
  it('공명이면 가까워지는 값 × 1.5, 장면의 grant로 구슬을 얻는다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    expect(resonanceOf(slot, pack, 'friend')).toBe('resonant');
    const { slot: after, bound } = bind(slot, 'ep1', victory);
    expect(after.bonds['friend']).toBe(30 + 15);
    expect(after.beads?.['bead.ga']).toBe(1);
    expect(texts(bound)).toContain('벗이 웃었다.');
  });

  it('어긋나면 × 0.5, 슬롯도 공명으로 갈린다', () => {
    const slot = createReaderSlot(pack, 's', 'cold', '갑', 'seed-1');
    expect(resonanceOf(slot, pack, 'friend')).toBe('dissonant');
    const { slot: after, bound } = bind(slot, 'ep1', victory);
    expect(after.bonds['friend']).toBe(30 + 5);
    expect(texts(bound)).toContain('벗은 말없이 밥을 내밀었다.');
  });
});

describe('W9 동료와 대화 장면, 동료끼리의 관계', () => {
  it('동료 칸의 인물이 동행 중이 아니면 장면을 고르지 않고 그 줄도 빠진다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep2');
    expect(silentIds(bound)).toContain('talk:banter:else');
    expect(texts(bound)).not.toContain('“남이 말한다.”');
  });

  it('동행 중이면 장면이 나오고, 장면에 없는 인물의 줄은 빠지고, 동료끼리의 인연이 움직인다', () => {
    const slot = { ...createReaderSlot(pack, 's', 'warm', '갑', 'seed-1'), party: ['other'] };
    const { bound, slot: after } = bind(slot, 'ep2');
    expect(traceIds(bound)).toContain('talk:talk.banter');
    expect(texts(bound)).toEqual(expect.arrayContaining(['“너는 왜 그래.”', '“내 마음이다.”', '“남이 말한다.”']));
    expect(texts(bound)).not.toContain('“이 줄은 나오지 않는다.”');
    expect(resonanceOf(after, pack, 'friend', 'other')).toBe('neutral');
    expect(tieOf(after, 'friend', 'other')).toBe(10);
  });

  it('맞는 장면이 없으면 대체 문장이 나온다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    const { bound } = bind(slot, 'ep2');
    expect(texts(bound)).toContain('아무 일도 없었다.');
    expect(traceIds(bound)).toContain('talk:nothing:else');
  });

  it('조건 tie, bond로 문장을 고른다', () => {
    const base = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    expect(texts(bind({ ...base, ties: { 'friend+other': 10 } }, 'ep3').bound)).toContain('둘이 웃었다.');
    expect(texts(bind({ ...base, bonds: { friend: 40 } }, 'ep3').bound)).toContain('벗이 가까웠다.');
    expect(texts(bind(base, 'ep3').bound)).toContain('그냥 하루였다.');
    expect(texts(bind(createReaderSlot(pack, 's', 'cold', '갑', 'seed-1'), 'ep3').bound)).toContain('벗이 멀게 느껴졌다.');
  });

  it('같은 독자는 늘 같은 글을 읽는다', () => {
    const slot = createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');
    expect(JSON.stringify(bind(slot, 'ep1', victory))).toBe(JSON.stringify(bind(slot, 'ep1', victory)));
  });
});
