import { describe, expect, it } from 'vitest';
import type { ReaderSlot, StoryPack, StoryTrait } from './narrative.model';
import {
  buyItem,
  canSell,
  currentZoneId,
  sellItem,
  sellPrice,
  shopInZone,
  silverOf,
  silverReward,
} from './narrative-shop';
import { createReaderSlot, grantTrait } from './narrative-state';
import { completeEpisode, preludeSilverLine } from './narrative-flow';

function makePack(over: Partial<StoryPack> = {}): StoryPack {
  const trait = (t: Partial<StoryTrait> & { id: string }): StoryTrait =>
    ({ kind: 'item', name: t.id, rarity: 'common', description: '', stats: {}, tags: [], phrases: {}, source: 'draw', ...t }) as StoryTrait;
  const traits = [
    trait({ id: 'broom', equip: 'weapon', phrases: { 무기: '빗자루' }, source: 'start' }),
    trait({ id: 'iron', equip: 'weapon', stats: { might: 5 }, tags: ['검'], phrases: { 무기: '철검' }, price: 40 }),
    trait({ id: 'steel', equip: 'weapon', stats: { might: 15 }, tags: ['검'], price: 120 }),
    trait({ id: 'hat', equip: 'helmet', stats: { guard: 3 }, price: 30, source: 'shop' }),
    trait({ id: 'ring-a', equip: 'ring', stats: { fortune: 2 }, price: 20 }),
    trait({ id: 'ring-b', equip: 'ring', stats: { fortune: 4 }, price: 20 }),
    trait({ id: 'ring-c', equip: 'ring', stats: { fortune: 1 }, price: 20 }),
    trait({ id: 'pill', stats: { guard: 5 }, price: 15 }),
    trait({ id: 'combo-part', kind: 'item', price: 20 }),
    trait({ id: 'sword-art', kind: 'art', stats: { might: 8 }, tags: ['검'] }),
    trait({ id: 'fist-art', kind: 'art', stats: { might: 8 }, tags: ['권'] }),
    trait({ id: 'kind', kind: 'personality', alignment: 10 }),
    trait({ id: 'proud', kind: 'personality', alignment: -10 }),
  ];
  return {
    id: 'test', title: 'test', genre: 'test', version: 1, protagonist: { defaultName: '갑' },
    origins: [{ id: 'o', name: 'o', summary: '', stats: {}, traits: [], phrases: {} }],
    startTraits: ['broom'], startGrudges: {}, glossary: {}, traits: Object.fromEntries(traits.map((t) => [t.id, t])),
    cast: {},
    combinations: [{ id: 'c1', name: '콤보', requires: ['combo-part'], ordered: false, multiplier: {}, flags: [] }],
    speech: [],
    episodeOrder: ['e1', 'e2'],
    episodes: {
      e1: { id: 'e1', title: 'e1', zone: 'z1', cast: [], slots: [], beats: [] } as any,
      e2: { id: 'e2', title: 'e2', zone: 'z2', cast: [], slots: [], beats: [] } as any,
    },
    interludes: {}, gainScenes: {},
    zones: [{ id: 'z1', name: '구역1' }, { id: 'z2', name: '구역2' }] as any,
    tuning: { silverStart: 30 },
    shops: [{ id: 's', zone: 'z1', name: '가게', items: ['hat', 'iron', 'pill'] }],
    ...over,
  };
}

describe('narrative-shop', () => {
  it('새 슬롯의 silver === 30', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    expect(slot.silver).toBe(30);
    expect(silverOf(slot)).toBe(30);
  });

  it('읽은 화가 없을 때 currentZoneId === z1(첫 화의 구역)', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    expect(currentZoneId(slot, pack)).toBe('z1');
    expect(shopInZone(pack, currentZoneId(slot, pack))?.id).toBe('s');
  });

  it('buyItem hat: ok, silver 0, hat을 가지고 helmet에 입었다', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    const result = buyItem(slot, pack, 's', 'hat');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.slot.silver).toBe(0);
      expect(result.slot.traitIds).toContain('hat');
      expect(result.slot.equipment?.helmet).toBe('hat');
    }
  });

  it('이어서 buyItem pill: poor, 슬롯 그대로', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    const buyHat = buyItem(slot, pack, 's', 'hat');
    expect(buyHat.ok).toBe(true);
    if (buyHat.ok) {
      slot = buyHat.slot;
      const buyPill = buyItem(slot, pack, 's', 'pill');
      expect(buyPill.ok).toBe(false);
      if (!buyPill.ok) {
        expect(buyPill.reason).toBe('poor');
        expect(buyPill.slot).toBe(slot);
      }
    }
  });

  it('iron을 가진 채 buyItem iron: owned', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    const result = buyItem(slot, pack, 's', 'iron');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('owned');
      expect(result.slot).toBe(slot);
    }
  });

  it('상점에 없는 steel: unknown', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    const result = buyItem(slot, pack, 's', 'steel');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unknown');
    }
  });

  it('sellItem iron, 입고 있던 상태: ok, weapon이 비고, silver +20', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    expect(slot.equipment?.weapon).toBe('iron');
    const prevSilver = silverOf(slot); // 30
    const result = sellItem(slot, pack, 'iron');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.slot.equipment?.weapon).toBeUndefined();
      expect(result.slot.traitIds).not.toContain('iron');
      expect(result.slot.silver).toBe(prevSilver + 20);
    }
  });

  it('sellItem broom(값 없음): locked', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    const result = sellItem(slot, pack, 'broom');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('locked');
      expect(result.slot).toBe(slot);
    }
  });

  it('조합의 조각인 아이템: canSell 거짓', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'combo-part');
    expect(canSell(slot, pack, 'combo-part')).toBe(false);
    const result = sellItem(slot, pack, 'combo-part');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('locked');
    }
  });

  it('silverReward: 겨루기 없음 / 압도 / 우세 / 접전 / 패배 | 10 / 30 / 22 / 16 / 10', () => {
    const pack = makePack();
    expect(silverReward(pack, null)).toBe(10);
    expect(silverReward(pack, { outcome: 'victory', tier: 'overwhelm' } as any)).toBe(30);
    expect(silverReward(pack, { outcome: 'victory', tier: 'advantage' } as any)).toBe(22);
    expect(silverReward(pack, { outcome: 'victory', tier: 'close' } as any)).toBe(16);
    expect(silverReward(pack, { outcome: 'defeat', tier: 'close' } as any)).toBe(10);
  });

  it('preludeSilverLine: 돈 단위를 바르게 붙인다', () => {
    const packWithUnit = makePack({ glossary: { currency: '은자', 'currency.unit': '냥' } });
    expect(preludeSilverLine(10, packWithUnit)).toEqual({
      step: 'change',
      text: '은자 10냥을 얻었다',
    });

    const packDefault = makePack();
    expect(preludeSilverLine(10, packDefault)).toEqual({
      step: 'change',
      text: '돈 10을 얻었다',
    });
  });

  it('completeEpisode: 화를 마치고 돈을 받고 기록에 남긴다', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    const result = completeEpisode({
      slot,
      pack,
      episode: pack.episodes['e1']!,
      candidateIds: [],
      drawnTraitId: null,
      clash: null,
    });
    expect(result.silver).toBe(10);
    expect(result.slot.silver).toBe(40);
    expect(result.slot.history[0]?.silver).toBe(10);
  });
});
