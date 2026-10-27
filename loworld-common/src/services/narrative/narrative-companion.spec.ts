import { describe, expect, it } from 'vitest';
import type { ReaderSlot, StoryPack, StoryTrait } from './narrative.model';
import { settleCompanions } from './narrative-companion';
import { applyEffects, createReaderSlot } from './narrative-state';
import { preludeCompanionLines } from './narrative-flow';

function makePack(over: Partial<StoryPack> = {}): StoryPack {
  const trait = (t: Partial<StoryTrait> & { id: string }): StoryTrait =>
    ({ kind: 'item', name: t.id, rarity: 'common', description: '', stats: {}, tags: [], phrases: {}, source: 'draw', ...t }) as StoryTrait;
  const traits = [
    trait({ id: 'broom', equip: 'weapon', phrases: { 무기: '빗자루' }, source: 'start' }),
  ];
  return {
    id: 'test', title: 'test', genre: 'test', version: 1, protagonist: { defaultName: '갑' },
    origins: [{ id: 'o', name: 'o', summary: '', stats: {}, traits: [], phrases: {} }],
    startTraits: ['broom'], startGrudges: {}, glossary: {}, traits: Object.fromEntries(traits.map((t) => [t.id, t])),
    cast: {
      mate: {
        id: 'mate',
        name: '동행인',
        role: '',
        nature: [],
        stats: {},
        bond: 50,
        want: '',
        line: '',
        weakness: '',
        selfCall: '',
        calls: {},
        habit: '',
        zone: '',
        lean: 'merciful',
      },
      neutralMate: {
        id: 'neutralMate',
        name: '무성향',
        role: '',
        nature: [],
        stats: {},
        bond: 50,
        want: '',
        line: '',
        weakness: '',
        selfCall: '',
        calls: {},
        habit: '',
        zone: '',
      },
    },
    combinations: [],
    speech: [],
    episodeOrder: [],
    episodes: {},
    interludes: {},
    gainScenes: {},
    zones: [],
    tuning: {},
    ...over,
  };
}

describe('narrative-companion', () => {
  describe('연애 문턱 (P13)', () => {
    it('인연 50에서 romance: { mate: 2 } 적용 시 단계 1로 제한된다', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      // pack.cast.mate의 bond는 50이다 (< 80)
      slot = applyEffects(slot, pack, { romance: { mate: 2 } });
      expect(slot.romance).toEqual({ targetId: 'mate', stage: 1 });
    });

    it('인연 80에서 romance: { mate: 2 } 적용 시 단계 2가 된다', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = applyEffects(slot, pack, { bond: { mate: 30 } }); // 50 + 30 = 80
      slot = applyEffects(slot, pack, { romance: { mate: 2 } });
      expect(slot.romance).toEqual({ targetId: 'mate', stage: 2 });
    });

    it('단계 2에서 romance: { mate: 1 } 적용 시 단계 2 그대로 유지된다', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = applyEffects(slot, pack, { bond: { mate: 30 } }); // 80
      slot = applyEffects(slot, pack, { romance: { mate: 2 } });
      expect(slot.romance?.stage).toBe(2);

      slot = applyEffects(slot, pack, { romance: { mate: 1 } });
      expect(slot.romance).toEqual({ targetId: 'mate', stage: 2 });
    });
  });

  describe('동료 경고 및 이탈 (P14)', () => {
    it('동행 중, 성향 -40: 이벤트 warn, 플래그 warned:mate, 여전히 동행', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = { ...slot, party: ['mate'], alignment: -40 };

      const { slot: next, events } = settleCompanions(slot, pack);
      expect(events).toEqual([{ memberId: 'mate', kind: 'warn' }]);
      expect(next.flags).toContain('warned:mate');
      expect(next.party).toContain('mate');
    });

    it('이어서 같은 상태로 한 번 더 settleCompanions 호출 시 이벤트 없음', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = { ...slot, party: ['mate'], alignment: -40 };

      const first = settleCompanions(slot, pack);
      const second = settleCompanions(first.slot, pack);
      expect(second.events).toEqual([]);
      expect(second.slot.party).toContain('mate');
    });

    it('성향 -70: 이벤트 leave, 동행에서 빠짐, left:mate 플래그, 연애 없음', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = {
        ...slot,
        party: ['mate'],
        alignment: -70,
        romance: { targetId: 'mate', stage: 2 },
      };

      const { slot: next, events } = settleCompanions(slot, pack);
      expect(events).toEqual([{ memberId: 'mate', kind: 'leave' }]);
      expect(next.party).not.toContain('mate');
      expect(next.flags).toContain('left:mate');
      expect(next.romance).toBeUndefined();
    });

    it('성향 +70(같은 쪽): 이벤트 없음', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = { ...slot, party: ['mate'], alignment: 70 };

      const { slot: next, events } = settleCompanions(slot, pack);
      expect(events).toEqual([]);
      expect(next.party).toContain('mate');
    });

    it('lean이 없는 인물: 무엇이든 이벤트 없음', () => {
      const pack = makePack();
      let slot = createReaderSlot(pack, 's1', 'o', '갑');
      slot = { ...slot, party: ['neutralMate'], alignment: -70 };

      const { slot: next, events } = settleCompanions(slot, pack);
      expect(events).toEqual([]);
      expect(next.party).toContain('neutralMate');
    });
  });

  describe('preludeCompanionLines', () => {
    it('경고와 이탈 문장을 바르게 만든다', () => {
      const pack = makePack();
      const lines = preludeCompanionLines(
        [
          { memberId: 'mate', kind: 'warn' },
          { memberId: 'mate', kind: 'leave' },
        ],
        pack,
      );
      expect(lines).toEqual([
        { step: 'change', text: '동행인이 그대의 길을 근심한다' },
        { step: 'change', text: '동행인이 곁을 떠났다' },
      ]);
    });

    it('용어집 템플릿이 있으면 적용한다', () => {
      const pack = makePack({
        glossary: {
          'companion.warn': '{{이름}}이 발걸음을 멈추고 돌아본다',
          'companion.leave': '{{이름}}이 말없이 등을 돌렸다',
        },
      });
      const lines = preludeCompanionLines(
        [
          { memberId: 'mate', kind: 'warn' },
          { memberId: 'mate', kind: 'leave' },
        ],
        pack,
      );
      expect(lines).toEqual([
        { step: 'change', text: '동행인이 발걸음을 멈추고 돌아본다' },
        { step: 'change', text: '동행인이 말없이 등을 돌렸다' },
      ]);
    });
  });
});
