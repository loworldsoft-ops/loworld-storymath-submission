import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import type { ReaderSlot, StoryEpisode, StoryPack, StoryTrait } from './narrative.model';
import { bindEpisode, describeCondition } from './narrative-bind';
import { completeInterlude, preludePeopleLines } from './narrative-flow';
import { createReaderSlot, grantTrait } from './narrative-state';
import { buyItem, sellItem } from './narrative-shop';

function makeTestPack(over: Partial<StoryPack> = {}): StoryPack {
  const trait = (t: Partial<StoryTrait> & { id: string }): StoryTrait =>
    ({ kind: 'item', name: t.id, rarity: 'common', description: '', stats: {}, tags: [], phrases: {}, source: 'draw', ...t }) as StoryTrait;

  const traits = [
    trait({ id: 'broom', equip: 'weapon', phrases: { 무기: '빗자루' }, source: 'start' }),
    trait({ id: 'item.x', name: '철검', equip: 'weapon', price: 40 }),
    trait({ id: 'item.beads', name: '염주', price: 20, alignment: 15 }),
    trait({ id: 'p_x', kind: 'personality', alignment: -10 }),
    trait({ id: 'mem.windfall', kind: 'memory', bane: { opponentId: 'opp', multiplier: 2 } }),
  ];

  return {
    id: 'test',
    title: 'test',
    genre: 'test',
    version: 1,
    protagonist: { defaultName: '갑' },
    origins: [{ id: 'o', name: 'o', summary: '', stats: {}, traits: [], phrases: {} }],
    startTraits: ['broom'],
    startGrudges: {},
    glossary: {},
    traits: Object.fromEntries(traits.map((t) => [t.id, t])),
    cast: {
      a: {
        id: 'a', name: '선배', role: 'ally', nature: [], stats: {}, bond: 10, want: '', line: '',
        weakness: '', selfCall: '', calls: {}, habit: '', zone: '',
      },
      b: {
        id: 'b', name: '서하', role: 'ally', nature: [], stats: {}, bond: 30, want: '', line: '',
        weakness: '', selfCall: '', calls: {}, habit: '', zone: '',
      },
      c: {
        id: 'c', name: '동료C', role: 'ally', nature: [], stats: {}, bond: 0, want: '', line: '',
        weakness: '', selfCall: '', calls: {}, habit: '', zone: '',
      },
      opp: {
        id: 'opp', name: '적수', role: 'rival', nature: [], stats: {}, bond: 0, want: '', line: '',
        weakness: '', selfCall: '', calls: {}, habit: '', zone: '',
      },
    },
    combinations: [],
    speech: [
      { id: 'sp1', situation: 'worry', speech: '', speaker: 'b', when: null, text: '…조심해.' },
      { id: 'sp2', situation: 'normal', speech: '', speaker: 'a', when: null, text: '잘 다녀와라.' },
    ],
    episodeOrder: ['e1'],
    episodes: {},
    interludes: {},
    gainScenes: {},
    zones: [{ id: 'z1', name: '구역1', description: '', x: 0, y: 0, adjacent: [] }],
    tuning: { alignmentStance: 30, silverStart: 100, sellRatio: 0.5 },
    shops: [
      { id: 's1', zone: 'z1', name: '잡화점', items: ['item.beads', 'item.x'] },
    ],
    ...over,
  };
}

describe('W7-3 엔진 검증 (narrative-skeleton)', () => {
  describe('동료 대사 및 슬롯 문단 처리 (S9, S10)', () => {
    const episodeWithCompanion: StoryEpisode = {
      id: 'e1',
      number: 1,
      title: '동료 시험 화',
      zone: 'z1',
      cast: ['a'],
      companions: ['b'],
      draw: { pools: [], exclude: [], include: [] },
      contest: null,
      reward: null,
      onDefeat: null,
      windfall: null,
      effects: null,
      beats: [
        {
          kind: 'setting',
          phase: '起',
          text: `배경 설명이다.

[[say:b:worry|…조심해.]]`,
          slots: {},
        },
      ],
    };

    it('화 companions: [b], party가 []이면 b의 문단이 없고 totalCount도 세지 않는다', () => {
      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공'); // party is []
      const { bound } = bindEpisode({
        slot,
        pack,
        episode: episodeWithCompanion,
        clash: null,
        catharsis: 0,
        drawnTraitId: null,
      });

      expect(bound.paragraphs.some((p) => p.speakerName === '서하')).toBe(false);
      // 배경 문단 1개만 있음
      expect(bound.paragraphs).toHaveLength(1);
      expect(bound.totalCount).toBe(0);
    });

    it('같은 화, party: [b]이면 b의 문단이 있고 totalCount가 1 늘어난다', () => {
      const pack = makeTestPack();
      let slot = createReaderSlot(pack, 's1', 'o', '주인공');
      slot = { ...slot, party: ['b'] };
      const { bound } = bindEpisode({
        slot,
        pack,
        episode: episodeWithCompanion,
        clash: null,
        catharsis: 0,
        drawnTraitId: null,
      });

      expect(bound.paragraphs.some((p) => p.speakerName === '서하')).toBe(true);
      expect(bound.totalCount).toBe(1);
    });

    it('앞 슬롯 갈래가 { party: [b] }를 주고 그 뒤에 b의 대사가 나오면 b의 문단이 나온다', () => {
      const episodeWithJoinSlot: StoryEpisode = {
        id: 'e1',
        number: 1,
        title: '합류 화',
        zone: 'z1',
        cast: ['a'],
        companions: ['b'],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        onDefeat: null,
        windfall: null,
        effects: null,
        beats: [
          {
            kind: 'setting',
            phase: '起',
            text: `[[합류]]

[[say:b:worry|…조심해.]]`,
            slots: {
              합류: {
                id: '합류',
                variants: [
                  { id: '합류.else', when: null, text: '서하가 동행한다.', effects: { party: ['b'] } },
                ],
              },
            },
          },
        ],
      };

      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공'); // party starts []
      const { bound, slot: nextSlot } = bindEpisode({
        slot,
        pack,
        episode: episodeWithJoinSlot,
        clash: null,
        catharsis: 0,
        drawnTraitId: null,
      });

      expect(nextSlot.party).toContain('b');
      expect(bound.paragraphs.some((p) => p.speakerName === '서하')).toBe(true);
    });

    it('companions에 없는 인물의 대사는 party와 상관없이 나온다', () => {
      const episodeWithNonCompanion: StoryEpisode = {
        id: 'e1',
        number: 1,
        title: '비동료 화',
        zone: 'z1',
        cast: ['a'],
        companions: ['b'],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        onDefeat: null,
        windfall: null,
        effects: null,
        beats: [
          {
            kind: 'setting',
            phase: '起',
            text: `[[say:a:normal|잘 다녀와라.]]`,
            slots: {},
          },
        ],
      };

      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공'); // party is []
      const { bound } = bindEpisode({
        slot,
        pack,
        episode: episodeWithNonCompanion,
        clash: null,
        catharsis: 0,
        drawnTraitId: null,
      });

      expect(bound.paragraphs.some((p) => p.speakerName === '선배')).toBe(true);
    });

    it('슬롯 갈래의 글이 빈 문자열이고 문단에 그 슬롯만 있으면 그 문단이 없다', () => {
      const episodeWithEmptySlot: StoryEpisode = {
        id: 'e1',
        number: 1,
        title: '빈 슬롯 화',
        zone: 'z1',
        cast: [],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        onDefeat: null,
        windfall: null,
        effects: null,
        beats: [
          {
            kind: 'setting',
            phase: '起',
            text: `첫째 문단이다.

[[빈슬롯]]

셋째 문단이다.`,
            slots: {
              빈슬롯: {
                id: '빈슬롯',
                variants: [
                  { id: '빈슬롯.else', when: null, text: '' },
                ],
              },
            },
          },
        ],
      };

      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공');
      const { bound } = bindEpisode({
        slot,
        pack,
        episode: episodeWithEmptySlot,
        clash: null,
        catharsis: 0,
        drawnTraitId: null,
      });

      expect(bound.paragraphs).toHaveLength(2);
      expect(bound.paragraphs[0].text).toBe('첫째 문단이다.');
      expect(bound.paragraphs[1].text).toBe('셋째 문단이다.');
    });
  });

  describe('preludePeopleLines 동행 인물 반영 (S9)', () => {
    it('cast: [a], companions: [b, c], party: [b] -> 인물 줄이 a, b 두 개', () => {
      const pack = makeTestPack();
      let slot = createReaderSlot(pack, 's1', 'o', '주인공');
      slot = { ...slot, party: ['b'] };
      const episode: StoryEpisode = {
        id: 'e1',
        number: 1,
        title: '화',
        zone: 'z1',
        cast: ['a'],
        companions: ['b', 'c'],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        onDefeat: null,
        windfall: null,
        effects: null,
        beats: [],
      };

      const lines = preludePeopleLines(slot, pack, episode);
      expect(lines).toHaveLength(2);
      expect(lines.some((l) => l.text.includes('선배'))).toBe(true);
      expect(lines.some((l) => l.text.includes('서하'))).toBe(true);
      expect(lines.some((l) => l.text.includes('동료C'))).toBe(false);
    });
  });

  describe('이유 설명 문구 (S11)', () => {
    const pack = makeTestPack();

    it('describeCondition(alignment(cruel)) -> 패도라서', () => {
      expect(describeCondition({ op: 'alignment', args: ['cruel'] }, pack)).toBe('패도라서');
      expect(describeCondition({ op: 'alignment', args: ['패도'] }, pack)).toBe('패도라서');
    });

    it('describeCondition(alignment(<, -15)) -> 성향이 -15보다 낮아서', () => {
      expect(describeCondition({ op: 'alignment', args: ['<', '-15'] }, pack)).toBe('성향이 -15보다 낮아서');
    });

    it('describeCondition(equipped(weapon, item.x)), item.x의 이름이 철검 -> 철검을 차고 있어서', () => {
      expect(describeCondition({ op: 'equipped', args: ['weapon', 'item.x'] }, pack)).toBe('철검을 차고 있어서');
      expect(describeCondition({ op: 'equipped', args: ['item.x'] }, pack)).toBe('철검을 차고 있어서');
    });

    it('describeCondition(party(b)), b의 이름이 서하 -> 서하와 함께라서', () => {
      expect(describeCondition({ op: 'party', args: ['b'] }, pack)).toBe('서하와 함께라서');
    });

    it('describeCondition(romance(b, 2)) -> 서하와 마음이 닿아서', () => {
      expect(describeCondition({ op: 'romance', args: ['b', '2'] }, pack)).toBe('서하와 마음이 닿아서');
      expect(describeCondition({ op: 'romance', args: ['b'] }, pack)).toBe('서하와 마음이 닿아서');
    });
  });

  describe('속성의 성향 1회 부여 (A2)', () => {
    it('성향 +15인 아이템을 산다 -> 판다 -> 다시 산다: 성향이 15에서 끝난다. flags에 aligned:<id>가 하나', () => {
      const pack = makeTestPack();
      let slot = createReaderSlot(pack, 's1', 'o', '주인공');
      expect(slot.alignment ?? 0).toBe(0);

      // 1. 산다
      const buy1 = buyItem(slot, pack, 's1', 'item.beads');
      expect(buy1.ok).toBe(true);
      slot = buy1.slot;
      expect(slot.alignment).toBe(15);
      expect(slot.flags.filter((f) => f === 'aligned:item.beads')).toHaveLength(1);

      // 2. 판다
      const sold = sellItem(slot, pack, 'item.beads');
      expect(sold.ok).toBe(true);
      slot = sold.slot;
      expect(slot.traitIds).not.toContain('item.beads');
      expect(slot.alignment).toBe(15);

      // 3. 다시 산다
      const buy2 = buyItem(slot, pack, 's1', 'item.beads');
      expect(buy2.ok).toBe(true);
      slot = buy2.slot;
      expect(slot.alignment).toBe(15);
      expect(slot.flags.filter((f) => f === 'aligned:item.beads')).toHaveLength(1);
    });

    it('p_x(성향 -10)를 grantTrait로 두 번 적용해도 성향은 -10이다', () => {
      const pack = makeTestPack();
      let slot = createReaderSlot(pack, 's1', 'o', '주인공');
      slot = grantTrait(slot, pack, 'p_x');
      expect(slot.alignment).toBe(-10);

      slot = grantTrait(slot, pack, 'p_x');
      expect(slot.alignment).toBe(-10);
      expect(slot.flags.filter((f) => f === 'aligned:p_x')).toHaveLength(1);
    });
  });

  describe('막간 틀의 companions 처리', () => {
    it('막간 틀에 companions: [b], completeInterlude: 엮을 때 b가 동행 중이 아니면 b의 대사가 빠진다', () => {
      const interludeTemplate: StoryEpisode = {
        id: 'common-memory',
        number: 0,
        title: '막간',
        zone: 'z1',
        cast: [],
        companions: ['b'],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        onDefeat: null,
        windfall: null,
        effects: null,
        beats: [
          {
            kind: 'insight',
            phase: '起',
            text: `막간의 기억이다.

[[say:b:worry|…조심해.]]`,
            slots: {},
          },
        ],
      };

      const baseEpisode: StoryEpisode = {
        id: 'e1',
        number: 1,
        title: '4화',
        zone: 'z1',
        cast: ['opp'],
        contest: { axis: 'might', opponent: 'opp', public: false },
        reward: null,
        onDefeat: 'common-memory',
        windfall: 'mem.windfall',
        effects: null,
        draw: { pools: [], exclude: [], include: [] },
        beats: [],
      };

      const pack = makeTestPack({
        interludes: { 'common-memory': interludeTemplate },
        episodes: { e1: baseEpisode },
      });

      let slot = createReaderSlot(pack, 's1', 'o', '주인공'); // party is []
      slot = { ...slot, traitIds: [...slot.traitIds, 'mem.windfall'] };
      const rematch = {
        opponentId: 'opp',
        axis: 'might' as const,
        rounds: 3,
        outcome: 'victory' as const,
        tier: 'advantage' as const,
        untouched: false,
        auto: false,
        finisherTraitId: null,
        scoreDiff: 10,
      };

      const result = completeInterlude({ slot, pack, episode: baseEpisode, rematch });
      expect(result).not.toBeNull();
      expect(result!.bound.paragraphs.some((p) => p.speakerName === '서하')).toBe(false);
      expect(result!.bound.paragraphs).toHaveLength(1);
    });
  });

  describe('W7.1-1 빈 갈래', () => {
    it('장면의 첫 문단이 [[빈]] 하나이고 else -> ∅: 그 장면에서 text === ""인 문단이 없다. bound.silent에 { place: "빈", choiceId: "빈.else" }가 있다', () => {
      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공');
      const episode: StoryEpisode = {
        id: 'e_first_empty',
        number: 1,
        title: '첫 문단 빈 갈래',
        zone: 'z1',
        cast: [],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        beats: [
          {
            id: 'b1',
            kind: 'setting',
            phase: '起',
            text: '[[빈]]\n\n둘째 문단이다.',
            slots: {
              빈: {
                id: '빈',
                variants: [{ id: '빈.else', when: null, text: '' }],
              },
            },
          },
        ],
      };
      const { bound } = bindEpisode({ slot, pack, episode, clash: null, catharsis: 0, drawnTraitId: null });
      expect(bound.paragraphs.some((p) => p.text === '')).toBe(false);
      expect(bound.paragraphs).toHaveLength(1);
      expect(bound.paragraphs[0].text).toBe('둘째 문단이다.');
      expect(bound.silent).toEqual([
        { place: '빈', choiceId: '빈.else', reason: '', text: '', alternative: null },
      ]);
    });

    it('문단 앞 [[빈]] 뒤에서 ∅가 골라짐: 문단 글자는 앞 뒤(공백 하나). 그 문단 traces에 빈이 없다. silent에 있다', () => {
      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공');
      const episode: StoryEpisode = {
        id: 'e_inline_empty',
        number: 1,
        title: '문단 내 빈 갈래',
        zone: 'z1',
        cast: [],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        beats: [
          {
            id: 'b1',
            kind: 'setting',
            phase: '起',
            text: '앞 [[빈]] 뒤',
            slots: {
              빈: {
                id: '빈',
                variants: [{ id: '빈.else', when: null, text: '' }],
              },
            },
          },
        ],
      };
      const { bound } = bindEpisode({ slot, pack, episode, clash: null, catharsis: 0, drawnTraitId: null });
      expect(bound.paragraphs).toHaveLength(1);
      expect(bound.paragraphs[0].text).toBe('앞 뒤');
      expect(bound.paragraphs[0].traces).toHaveLength(0);
      expect(bound.silent).toEqual([
        { place: '빈', choiceId: '빈.else', reason: '', text: '', alternative: null },
      ]);
    });

    it('∅ 갈래에 효과 { bond: { b: 5 } }: 효과가 적용된다', () => {
      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공');
      const episode: StoryEpisode = {
        id: 'e_effect_empty',
        number: 1,
        title: '효과 빈 갈래',
        zone: 'z1',
        cast: [],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        beats: [
          {
            id: 'b1',
            kind: 'setting',
            phase: '起',
            text: '[[빈]]',
            slots: {
              빈: {
                id: '빈',
                variants: [{ id: '빈.else', when: null, text: '', effects: { bond: { b: 5 } } }],
              },
            },
          },
        ],
      };
      const result = bindEpisode({ slot, pack, episode, clash: null, catharsis: 0, drawnTraitId: null });
      expect(result.slot.bonds?.b).toBe(35); // base 30 + 5
      expect(result.bound.silent).toBeDefined();
    });

    it('∅가 없는 화: bound.silent가 undefined', () => {
      const pack = makeTestPack();
      const slot = createReaderSlot(pack, 's1', 'o', '주인공');
      const episode: StoryEpisode = {
        id: 'e_no_empty',
        number: 1,
        title: '일반 화',
        zone: 'z1',
        cast: [],
        draw: { pools: [], exclude: [], include: [] },
        contest: null,
        reward: null,
        beats: [
          {
            id: 'b1',
            kind: 'setting',
            phase: '起',
            text: '본문만 있는 화다.',
            slots: {},
          },
        ],
      };
      const { bound } = bindEpisode({ slot, pack, episode, clash: null, catharsis: 0, drawnTraitId: null });
      expect(bound.silent).toBeUndefined();
    });

    it('실제 팩 6명 통독(아무 독자): 모든 기록의 bound.paragraphs와 interlude.bound.paragraphs에 text === ""인 문단이 0개', () => {
      const contentDir = join(process.cwd(), 'loworld-content-wuxia/packs/wuxia-1');
      if (existsSync(contentDir)) {
        const { pack: rawPack } = compilePack(contentDir);
        const pack = enrichPackWithPersonalityCards(rawPack);
        for (const ep of Object.values(pack.episodes)) {
          const slot = createReaderSlot(pack, 's1', 'sword', '이현');
          const { bound } = bindEpisode({ slot, pack, episode: ep, clash: null, catharsis: 0, drawnTraitId: null });
          expect(bound.paragraphs.some((p) => p.text === '')).toBe(false);
        }
        for (const il of Object.values(pack.interludes)) {
          const slot = createReaderSlot(pack, 's1', 'sword', '이현');
          const { bound } = bindEpisode({ slot, pack, episode: il, clash: null, catharsis: 0, drawnTraitId: null });
          expect(bound.paragraphs.some((p) => p.text === '')).toBe(false);
        }
      }
    });
  });
});
