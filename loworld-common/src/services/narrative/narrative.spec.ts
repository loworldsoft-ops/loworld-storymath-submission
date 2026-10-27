import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// 팩 도구는 Node 스크립트다. 실제 팩을 읽어 엔진을 검증한다.
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import { bindEpisode, evaluateCondition } from './narrative-bind';
import { autoMightClash, bestWitMove, createMightClash, finishMightClash, resolveWitContest } from './narrative-clash';
import {
  applyDraw,
  beginInterlude,
  completeEpisode,
  completeInterlude,
  nextEpisodeId,
  openEpisode,
  preludeChangeLines,
  preludePeopleLines,
} from './narrative-flow';
import {
  applyEffects,
  computeStats,
  contestPower,
  createReaderSlot,
  drawCandidates,
  evaluateCombinations,
  memberRelation,
  protagonistRelation,
} from './narrative-state';
import { stableHash, withJosa } from './narrative-util';
import type { ClashResult, ReaderSlot, StoryPack, StoryTrait } from './narrative.model';
import { enrichPackWithPersonalityCards } from './personality-bridge';

const packPath = join(process.cwd(), 'loworld-common/src/services/narrative/__fixtures__/wuxia-1');
const compiled = compilePack(packPath);
const pack: StoryPack = enrichPackWithPersonalityCards(compiled.pack as StoryPack);

function clashFor(slot: ReaderSlot, episodeId: string, attempt = 0): ClashResult | null {
  const episode = pack.episodes[episodeId];
  if (!episode.contest) return null;
  if (episode.contest.axis === 'wit') {
    return resolveWitContest(slot, pack, episode, bestWitMove(slot, pack, episode.contest.opponent), true);
  }
  const state = createMightClash(slot, pack, episode, attempt);
  return state ? finishMightClash(autoMightClash(state), pack, true) : null;
}

/** 모든 겨루기를 넘기며 끝까지 읽는다. `choose`가 카드를 고른다. */
function playThrough(originId: string, choose: (candidates: StoryTrait[]) => StoryTrait | undefined, slotId = 'slot-1') {
  let slot = createReaderSlot(pack, slotId, originId, '');
  const texts: string[] = [];
  const rematches: ClashResult[] = [];
  for (let guard = 0; guard < 10; guard += 1) {
    const episodeId = nextEpisodeId(slot, pack);
    if (!episodeId) break;
    const opened = openEpisode(slot, pack, episodeId)!;
    const drawn = choose(opened.candidates) ?? null;
    slot = applyDraw(slot, pack, drawn?.id ?? null);
    const clash = clashFor(slot, episodeId);
    const done = completeEpisode({ slot, pack, episode: opened.episode, candidateIds: opened.candidates.map((c) => c.id), drawnTraitId: drawn?.id ?? null, clash });
    slot = done.slot;
    texts.push(done.bound.paragraphs.map((p) => p.text).join('\n'));
    if (done.needsInterlude) {
      const begun = beginInterlude(slot, pack, opened.episode)!;
      const rematch = clashFor(begun.slot, episodeId, 1)!;
      rematches.push(rematch);
      const finished = completeInterlude({ slot: begun.slot, pack, episode: opened.episode, rematch })!;
      slot = finished.slot;
      texts.push(finished.bound.paragraphs.map((p) => p.text).join('\n'));
    }
  }
  return { slot, texts, rematches };
}

const pickArt = (candidates: StoryTrait[]) => candidates.find((c) => c.kind === 'art') ?? candidates[0];
const pickPersonality = (candidates: StoryTrait[]) => candidates.find((c) => c.kind === 'personality') ?? candidates[0];
const pickMemory = (candidates: StoryTrait[]) => candidates.find((c) => c.kind === 'memory') ?? candidates.find((c) => c.kind === 'art') ?? candidates[0];

describe('팩 wuxia-1', () => {
  it('검사에 걸리는 문제가 없다', () => {
    expect(compiled.problems).toEqual([]);
  });

  it('성품 카드의 이름과 좌표를 기존 카드 데이터에서 채운다', () => {
    expect(pack.traits['p_courage'].name).not.toBe('');
    expect(typeof pack.traits['p_pride'].x).toBe('number');
  });
});

describe('바탕 함수', () => {
  it('같은 글은 같은 수가 된다', () => {
    expect(stableHash('slot-1:ep001')).toBe(stableHash('slot-1:ep001'));
    expect(stableHash('slot-1:ep001')).not.toBe(stableHash('slot-2:ep001'));
  });

  it('받침에 맞는 조사를 붙인다', () => {
    expect(withJosa('철검', '을/를')).toBe('철검을');
    expect(withJosa('빗자루', '을/를')).toBe('빗자루를');
    expect(withJosa('철검', '으로/로')).toBe('철검으로');
    expect(withJosa('빗자루', '으로/로')).toBe('빗자루로');
    expect(withJosa('유운', '이/가')).toBe('유운이');
  });
});

describe('슬롯과 힘', () => {
  it('전생의 갈래가 시작 능력치와 시작 카드를 정한다', () => {
    const sword = createReaderSlot(pack, 's', 'sword', '');
    const mind = createReaderSlot(pack, 'm', 'mind', '');
    expect(sword.name).toBe(pack.protagonist.defaultName);
    expect(computeStats(sword, pack)).toMatchObject({ might: 30, wit: 10 });
    expect(computeStats(mind, pack)).toMatchObject({ might: 10, wit: 30 });
    expect(sword.traitIds).toEqual(['item.broom', 'mem.sword-path', 'p_courage']);
    expect(sword.grudges['baek-mugyeol']).toBe(100);
  });

  it('순서가 있는 조합은 얻은 순서가 맞아야 완성된다', () => {
    const base = createReaderSlot(pack, 's', 'sword', '');
    const inOrder = { ...base, traitIds: [...base.traitIds, 'art.cheongun-1', 'art.cheongun-2', 'art.cheongun-3'] };
    const outOfOrder = { ...base, traitIds: [...base.traitIds, 'art.cheongun-2', 'art.cheongun-1', 'art.cheongun-3'] };
    const two = { ...base, traitIds: [...base.traitIds, 'art.cheongun-1', 'art.cheongun-2'] };
    const combo = (slot: ReaderSlot) => evaluateCombinations(slot, pack).find((entry) => entry.id === 'combo.cheongun-three')!;
    expect(combo(inOrder).complete).toBe(true);
    expect(combo(outOfOrder).complete).toBe(false);
    expect(combo(two)).toMatchObject({ owned: 2, required: 3, complete: false });
    // 완성하면 배율이 곱해진다: (10 + 10 + 10 + 8 + 10 + 12) × 1.3
    expect(computeStats(inOrder, pack).might).toBe(78);
  });

  it('기연은 그 상대에게만 듣고, 적어도 갚을 수 있는 힘을 준다', () => {
    const mind = createReaderSlot(pack, 'm', 'mind', '');
    const withWindfall = { ...mind, traitIds: [...mind.traitIds, 'mem.gwak-ankle'] };
    expect(contestPower(mind, pack, 'might', 'gwak-du')).toBe(10);
    expect(contestPower(withWindfall, pack, 'might', 'gwak-du')).toBe(48);
    expect(contestPower(withWindfall, pack, 'might', 'ma-cheung')).toBe(10);
  });
});

describe('뽑기', () => {
  it('같은 슬롯이 같은 화를 열면 같은 셋이 나오고, 조합의 다음 조각이 늘 후보에 있다', () => {
    const slot = createReaderSlot(pack, 'slot-1', 'sword', '');
    const first = drawCandidates(slot, pack.episodes['ep001'], pack).map((c) => c.id);
    expect(first).toHaveLength(3);
    expect(first).toEqual(drawCandidates(slot, pack.episodes['ep001'], pack).map((c) => c.id));
    expect(first).toContain('art.cheongun-1');
    const next = applyDraw(slot, pack, 'art.cheongun-1');
    expect(drawCandidates(next, pack.episodes['ep002'], pack).map((c) => c.id)).toContain('art.cheongun-2');
    // 3화에는 상대 갈래의 기억이 나온다. 자기 것은 이미 가졌다.
    expect(drawCandidates(slot, pack.episodes['ep003'], pack).map((c) => c.id)).toContain('mem.reading-eye');
  });
});

describe('인물의 태도와 말투', () => {
  it('곽두는 겨루기 전에는 얕보며 조롱하고, 주인공은 갈래의 본성대로 맞선다', () => {
    const slot = createReaderSlot(pack, 's', 'sword', '');
    expect(memberRelation(slot, pack, 'gwak-du', 'might', 'none')).toMatchObject({ stance: 'cold', regard: 'down', speech: 'mock' });
    expect(protagonistRelation(slot, pack, 'gwak-du', 'might', 'belittled').speech).toBe('resolve');
  });

  it('힘을 본 뒤에는 곽두의 눈높이와 말투가 달라진다', () => {
    const slot = { ...createReaderSlot(pack, 's', 'sword', ''), witnessed: { 'gwak-du': 48 } };
    expect(memberRelation(slot, pack, 'gwak-du', 'might', 'humbled')).toMatchObject({ regard: 'up', emotion: 'anger', speech: 'bluster' });
  });

  it('화를 여는 과정의 줄이 실제 값을 담는다', () => {
    const before = createReaderSlot(pack, 's', 'sword', '');
    const after = applyDraw(before, pack, 'art.cheongun-1');
    expect(preludeChangeLines(before, after, pack).map((line) => line.text)).toEqual(['무공 30 → 38', '청운삼식 1 / 3']);
    expect(preludePeopleLines(after, pack, pack.episodes['ep001']).map((line) => line.text)).toEqual(['곽두는 그대를 얕본다', '서하는 그대를 아낀다']);
  });
});

describe('겨루기', () => {
  it('넘기기는 같은 입력에 같은 결과를 낸다', () => {
    const slot = applyDraw(createReaderSlot(pack, 'slot-1', 'sword', ''), pack, 'art.cheongun-1');
    const first = clashFor(slot, 'ep001');
    expect(first).toEqual(clashFor(slot, 'ep001'));
    expect(first).toMatchObject({ axis: 'might', opponentId: 'gwak-du', auto: true });
  });

  it('말로 겨루면 수의 길이 이기고 검의 길은 진다', () => {
    expect(clashFor(createReaderSlot(pack, 'm', 'mind', ''), 'ep002')).toMatchObject({ outcome: 'victory', tier: 'overwhelm' });
    expect(clashFor(createReaderSlot(pack, 's', 'sword', ''), 'ep002')).toMatchObject({ outcome: 'defeat' });
  });
});

describe('바인딩', () => {
  const win: ClashResult = { episodeId: 'ep001', opponentId: 'gwak-du', axis: 'might', outcome: 'victory', tier: 'advantage', rounds: 3, finisherTraitId: null, usedTraitIds: [], untouched: false, auto: true };

  it('같은 입력은 같은 본문이고, 갈래가 다르면 본문이 다르다', () => {
    const bind = (originId: string) => {
      const slot = createReaderSlot(pack, 'slot-1', originId, '');
      return bindEpisode({ slot, pack, episode: pack.episodes['ep001'], clash: win, catharsis: 0, drawnTraitId: null }).bound;
    };
    const sword = bind('sword');
    expect(sword).toEqual(bind('sword'));
    const swordText = sword.paragraphs.map((p) => p.text).join('\n');
    const mindText = bind('mind').paragraphs.map((p) => p.text).join('\n');
    expect(swordText).not.toBe(mindText);
    expect(swordText).toContain('검이 아니라 빗자루');
    expect(mindText).toContain('붓이 아니라 빗자루');
    expect(swordText).toContain('“사형. 그 검, 손목이 죽어 있습니다.”');
    expect(swordText).not.toMatch(/\[\[|\{\{/);
    expect(sword.personalCount).toBeGreaterThan(0);
  });

  it('무공 카드를 뽑으면 화가 그 무공을 얻는 장면으로 시작한다', () => {
    const slot = applyDraw(createReaderSlot(pack, 'slot-1', 'sword', ''), pack, 'art.cheongun-1');
    const { bound } = bindEpisode({ slot, pack, episode: pack.episodes['ep001'], clash: win, catharsis: 0, drawnTraitId: 'art.cheongun-1' });
    expect(bound.paragraphs[0].beatKind).toBe('setting');
    expect(bound.paragraphs.find((p) => p.beatKind !== 'setting')!.beatKind).toBe('insight');
    expect(bound.paragraphs.map((p) => p.text).join('\n')).toContain('되찾았다');
  });

  it('고른 문장마다 까닭과 다른 독자의 문장을 남긴다', () => {
    const slot = createReaderSlot(pack, 'slot-1', 'sword', '');
    const { bound } = bindEpisode({ slot, pack, episode: pack.episodes['ep001'], clash: win, catharsis: 0, drawnTraitId: null });
    const trace = bound.paragraphs.flatMap((p) => p.traces).find((entry) => entry.place === '쥔것')!;
    expect(trace.reason).toBe('검의 길');
    expect(trace.alternative).toBe('붓이 아니라 빗자루');
  });
});

describe('끝까지 읽기', () => {
  const runs = [
    { name: '검의 길, 무공만', originId: 'sword', choose: pickArt },
    { name: '검의 길, 성품만', originId: 'sword', choose: pickPersonality },
    { name: '수의 길, 무공만', originId: 'mind', choose: pickArt },
    { name: '수의 길, 성품만', originId: 'mind', choose: pickPersonality },
    { name: '검의 길, 기억 먼저', originId: 'sword', choose: pickMemory },
  ];

  it.each(runs)('$name: 세 편을 다 읽고, 진 겨루기는 막간에서 반드시 갚는다', ({ originId, choose }) => {
    const { slot, texts, rematches } = playThrough(originId, choose);
    expect(slot.history.map((record) => record.episodeId)).toEqual(['ep001', 'ep002', 'ep003']);
    expect(nextEpisodeId(slot, pack)).toBeNull();
    for (const rematch of rematches) expect(rematch.outcome).toBe('victory');
    for (const record of slot.history) {
      // 이겼거나 갚았으면 그 화의 보상을 받았다.
      expect(record.rewardTraitId).not.toBeNull();
    }
    expect(texts.join('\n')).not.toMatch(/\[\[|\{\{|undefined|NaN/);
  });

  it('같은 선택은 같은 소설이 되고, 갈래가 다르면 다른 소설이 된다', () => {
    const a = playThrough('sword', pickArt).texts.join('\n');
    expect(a).toBe(playThrough('sword', pickArt).texts.join('\n'));
    expect(a).not.toBe(playThrough('mind', pickArt).texts.join('\n'));
    expect(a).not.toBe(playThrough('sword', pickPersonality).texts.join('\n'));
  });

  it('무공을 순서대로 모으면 3화에서 청운삼식이 완성되어 다른 문장이 나온다', () => {
    const { slot, texts } = playThrough('sword', pickArt);
    expect(evaluateCombinations(slot, pack).find((entry) => entry.id === 'combo.cheongun-three')!.complete).toBe(true);
    expect(texts.join('\n')).toContain('운기. 유운. 그리고 단운.');
  });

  it('한 번에 다 이긴 독자가 지고 갚은 독자보다 약하지 않다', () => {
    const strong = playThrough('sword', pickArt).slot;
    const weak = playThrough('sword', pickPersonality).slot;
    expect(computeStats(strong, pack).might).toBeGreaterThanOrEqual(computeStats(weak, pack).might);
  });
});

describe('성향, 장비, 동료, 연애 조건 및 효과', () => {
  it('applyEffects로 성향, 장비, 동료, 연애가 올바르게 갱신된다', () => {
    let slot = createReaderSlot(pack, 'slot-align', 'sword', '주인공');
    expect(slot.alignment).toBe(0);
    expect(slot.party).toEqual([]);

    slot = applyEffects(slot, pack, {
      alignment: -40,
      equip: { weapon: 'item.iron-sword', armor: 'armor.leather' },
      partyAdd: ['seo-ha', 'elder-eom'],
      romance: { targetId: 'seo-ha', stage: 2 },
    });

    expect(slot.alignment).toBe(-40);
    // W6 P5: 가지지 않은 것은 먼저 얻는다. 고정 팩의 철검에는 입는 자리(equip)가 없어 입지 못하고, 없는 속성은 얻지도 입지도 못한다.
    expect(slot.traitIds).toContain('item.iron-sword');
    expect(slot.equipment?.weapon).toBeUndefined();
    expect(slot.equipment?.armor).toBeUndefined();
    expect(slot.party).toEqual(['seo-ha', 'elder-eom']);
    // W6 P13: 인연이 80에 못 미치면 연애는 1단계까지만 오른다.
    expect(slot.romance).toEqual({ targetId: 'seo-ha', stage: 1 });

    // 동료 제거 및 성향 가산
    slot = applyEffects(slot, pack, {
      alignment: 15,
      partyRemove: ['elder-eom'],
    });

    expect(slot.alignment).toBe(-25);
    expect(slot.party).toEqual(['seo-ha']);
  });

  it('evaluateCondition: alignment 조건(cruel, merciful, neutral 및 비교식)을 올바르게 판정한다', () => {
    const cruelSlot = { ...createReaderSlot(pack, 's1', 'sword', ''), alignment: -50 };
    const mercifulSlot = { ...createReaderSlot(pack, 's2', 'sword', ''), alignment: 60 };
    const neutralSlot = { ...createReaderSlot(pack, 's3', 'sword', ''), alignment: 5 };

    const ctx = (slot: ReaderSlot) => ({
      slot,
      pack,
      episode: pack.episodes['ep001'],
      clash: null,
      catharsis: 0,
      axis: 'might' as const,
      afterClash: false,
    });

    // cruel / 패도
    expect(evaluateCondition({ op: 'alignment', args: ['cruel'] }, ctx(cruelSlot))).toBe(true);
    expect(evaluateCondition({ op: 'alignment', args: ['cruel'] }, ctx(mercifulSlot))).toBe(false);

    // merciful / 왕도
    expect(evaluateCondition({ op: 'alignment', args: ['merciful'] }, ctx(mercifulSlot))).toBe(true);
    expect(evaluateCondition({ op: 'alignment', args: ['merciful'] }, ctx(cruelSlot))).toBe(false);

    // neutral / 중도
    expect(evaluateCondition({ op: 'alignment', args: ['neutral'] }, ctx(neutralSlot))).toBe(true);
    expect(evaluateCondition({ op: 'alignment', args: ['neutral'] }, ctx(cruelSlot))).toBe(false);

    // 비교 연산자 (<, >)
    expect(evaluateCondition({ op: 'alignment', args: ['<', '-30'] }, ctx(cruelSlot))).toBe(true);
    expect(evaluateCondition({ op: 'alignment', args: ['>', '50'] }, ctx(mercifulSlot))).toBe(true);
  });

  it('evaluateCondition: equipped, party, romance 조건을 올바르게 판정한다', () => {
    const slot = {
      ...createReaderSlot(pack, 's4', 'sword', ''),
      equipment: { weapon: 'item.iron-sword', ring1: 'ring.jade' },
      party: ['seo-ha'],
      romance: { targetId: 'seo-ha', stage: 2 },
    };

    const ctx = {
      slot,
      pack,
      episode: pack.episodes['ep001'],
      clash: null,
      catharsis: 0,
      axis: 'might' as const,
      afterClash: false,
    };

    // equipped
    expect(evaluateCondition({ op: 'equipped', args: ['weapon', 'item.iron-sword'] }, ctx)).toBe(true);
    expect(evaluateCondition({ op: 'equipped', args: ['weapon', 'item.rusty-sword'] }, ctx)).toBe(false);
    expect(evaluateCondition({ op: 'equipped', args: ['item.iron-sword'] }, ctx)).toBe(true);

    // party
    expect(evaluateCondition({ op: 'party', args: ['seo-ha'] }, ctx)).toBe(true);
    expect(evaluateCondition({ op: 'party', args: ['ma-cheung'] }, ctx)).toBe(false);

    // romance
    expect(evaluateCondition({ op: 'romance', args: ['seo-ha'] }, ctx)).toBe(true);
    expect(evaluateCondition({ op: 'romance', args: ['seo-ha', '2'] }, ctx)).toBe(true);
    expect(evaluateCondition({ op: 'romance', args: ['seo-ha', '3'] }, ctx)).toBe(false);
    expect(evaluateCondition({ op: 'romance', args: ['ma-cheung'] }, ctx)).toBe(false);
  });

  it('PoC 4화 서사 팩을 컴파일하고 4화의 성향·장비·동료·연애 서사를 바인딩한다', () => {
    const contentPackPath = join(process.cwd(), 'loworld-content-wuxia/packs/wuxia-1');
    const { pack: livePack, problems } = compilePack(contentPackPath);
    expect(problems).toHaveLength(0);
    const enriched = enrichPackWithPersonalityCards(livePack as StoryPack);
    expect(enriched.episodes['ep004']).toBeDefined();
    expect(enriched.episodes['ep004'].title).toBe('혈투의 잔향');

    // 승리 겨루기 결과
    const winClash: ClashResult = {
      outcome: 'victory',
      rounds: 3,
      finisher: 'strike',
      tier: 'overwhelm',
      untouched: true,
      log: [],
    };

    // 1) 자비(merciful) 분기 슬롯 검증
    let mercifulSlot = createReaderSlot(enriched, 'slot-poc', 'sword', '');
    mercifulSlot = applyEffects(mercifulSlot, enriched, {
      alignment: 40,
      equipment: { weapon: 'item.steel-sword' },
      party: ['seo-ha'],
      romance: { 'seo-ha': 1 },
    });

    const mercifulBound = bindEpisode({
      slot: mercifulSlot,
      pack: enriched,
      episode: enriched.episodes['ep004'],
      clash: winClash,
      catharsis: 50,
      drawnTraitId: null,
    });

    const mercifulText = mercifulBound.bound.paragraphs.map((p) => p.text).join('\n');
    expect(mercifulText).toContain('호흡이 세 합을 넘기지 못합니다');
    expect(mercifulText).toContain('붉은 비단 댕기');
    expect(mercifulText).toContain('더 이상 혼자가 아니었다');

    // 2) 냉혹(cruel) 분기 슬롯 검증
    let cruelSlot = createReaderSlot(enriched, 'slot-poc2', 'sword', '');
    cruelSlot = applyEffects(cruelSlot, enriched, {
      alignment: -40,
      equipment: { weapon: 'item.steel-sword' },
      party: ['seo-ha'],
    });

    const cruelBound = bindEpisode({
      slot: cruelSlot,
      pack: enriched,
      episode: enriched.episodes['ep004'],
      clash: winClash,
      catharsis: 50,
      drawnTraitId: null,
    });

    const cruelText = cruelBound.bound.paragraphs.map((p) => p.text).join('\n');
    expect(cruelText).toContain('구둣발로 짓밟았다');
    expect(cruelText).toContain('나만은 네 곁을 떠나지 않을게');
  });
});

