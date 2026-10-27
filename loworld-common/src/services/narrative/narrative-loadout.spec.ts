import { describe, expect, it } from 'vitest';
import type { ReaderSlot, StoryPack, StoryTrait } from './narrative.model';
import { autoEquip, equipItem, equippedSlotOf, isActiveTrait, statTotal, unequipItem } from './narrative-loadout';
import { applyEffects, computeStats, createReaderSlot, drawCandidates, grantTrait, protagonistRelation, resolveSpeech } from './narrative-state';
import { fillTokens } from './narrative-bind';
// @ts-expect-error - pack-compiler is .mjs
import { defaultVoiceTables } from '../../../conventions/content/pack-compiler.mjs';

/** 손으로 만든 팩도 팩 도구가 넣는 기본 말투 표를 갖게 한다 */
const VOICE = defaultVoiceTables() as Pick<StoryPack, 'voice' | 'moods'>;

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
    trait({ id: 'sword-art', kind: 'art', stats: { might: 8 }, tags: ['검'] }),
    trait({ id: 'fist-art', kind: 'art', stats: { might: 8 }, tags: ['권'] }),
    trait({ id: 'kind', kind: 'personality', alignment: 10 }),
    trait({ id: 'proud', kind: 'personality', alignment: -10 }),
  ];
  return {
    id: 'test', title: 'test', genre: 'test', version: 1, protagonist: { defaultName: '갑' },
    origins: [{ id: 'o', name: 'o', summary: '', stats: {}, traits: [], phrases: {} }],
    startTraits: ['broom'], startGrudges: {}, glossary: {}, traits: Object.fromEntries(traits.map((t) => [t.id, t])),
    cast: {
      targetWeak: { id: 'targetWeak', name: '약자', role: '', nature: [], stats: { might: 1 }, bond: 0, want: '', line: '', weakness: '', selfCall: '', calls: {}, habit: '', zone: '' },
      targetEqual: { id: 'targetEqual', name: '동등', role: '', nature: [], stats: { might: 10 }, bond: 0, want: '', line: '', weakness: '', selfCall: '', calls: {}, habit: '', zone: '' },
    },
    combinations: [], speech: [], episodeOrder: [], episodes: {}, interludes: {}, gainScenes: {}, zones: [], tuning: {},
    ...VOICE,
    ...over,
  };
}

describe('narrative-loadout', () => {
  it('createReaderSlot 직후 equipment.weapon === broom', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    expect(slot.equipment?.weapon).toBe('broom');
  });

  it('grantTrait iron: weapon이 iron으로 바뀐다(0 < 5), computeStats might가 10 + 5 = 15', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    expect(slot.equipment?.weapon).toBe('iron');
    expect(computeStats(slot, pack).might).toBe(15);
  });

  it('이어서 unequipItem weapon: weapon이 없다, might 10, iron은 여전히 traitIds에 있다', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    slot = unequipItem(slot, 'weapon');
    expect(slot.equipment?.weapon).toBeUndefined();
    expect(computeStats(slot, pack).might).toBe(10);
    expect(slot.traitIds).toContain('iron');
  });

  it('pill을 얻는다: 입는 자리가 없으니 equipment는 그대로이고 guard는 +5', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    const eqBefore = { ...slot.equipment };
    slot = grantTrait(slot, pack, 'pill');
    expect(slot.equipment).toEqual(eqBefore);
    expect(computeStats(slot, pack).guard).toBe(15);
  });

  it('ring-a, ring-b를 얻는다: ring1=ring-a, ring2=ring-b', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'ring-a');
    slot = grantTrait(slot, pack, 'ring-b');
    expect(slot.equipment?.ring1).toBe('ring-a');
    expect(slot.equipment?.ring2).toBe('ring-b');
  });

  it('이어서 ring-c(1)를 얻는다: 그대로(1 < 2)', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'ring-a');
    slot = grantTrait(slot, pack, 'ring-b');
    slot = grantTrait(slot, pack, 'ring-c');
    expect(slot.equipment?.ring1).toBe('ring-a');
    expect(slot.equipment?.ring2).toBe('ring-b');
    expect(slot.traitIds).toContain('ring-c');
  });

  it('equipItem ring-c ring1: ring1=ring-c, ring-a는 벗겨져 가진 채로 남는다', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'ring-a');
    slot = grantTrait(slot, pack, 'ring-b');
    slot = grantTrait(slot, pack, 'ring-c');
    slot = equipItem(slot, pack, 'ring-c', 'ring1');
    expect(slot.equipment?.ring1).toBe('ring-c');
    expect(slot.equipment?.ring2).toBe('ring-b');
    expect(slot.traitIds).toContain('ring-a');
  });

  it('equipItem ring-b ring1: ring2에 있던 ring-b가 ring1로 옮겨지고 ring2는 빈다', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'ring-a');
    slot = grantTrait(slot, pack, 'ring-b');
    slot = equipItem(slot, pack, 'ring-b', 'ring1');
    expect(slot.equipment?.ring1).toBe('ring-b');
    expect(slot.equipment?.ring2).toBeUndefined();
  });

  it('가지지 않은 steel을 equipItem: 슬롯이 그대로다(같은 객체)', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    const next = equipItem(slot, pack, 'steel');
    expect(next).toBe(slot);
  });

  it('equipItem hat weapon: 그대로(칸이 맞지 않음)', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'hat');
    const before = slot;
    const next = equipItem(slot, pack, 'hat', 'weapon');
    expect(next).toBe(before);
  });

  it('applyEffects equipment weapon: steel, steel을 안 가진 상태: steel을 얻고 weapon이 steel', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = applyEffects(slot, pack, { equipment: { weapon: 'steel' } });
    expect(slot.traitIds).toContain('steel');
    expect(slot.equipment?.weapon).toBe('steel');
  });

  it('fillTokens {{무기}}, 철검을 벗고 빗자루를 입은 상태: 빗자루', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    // iron이 autoEquip되었으므로 weapon은 iron이다
    expect(slot.equipment?.weapon).toBe('iron');
    // 다시 broom을 입힌다
    slot = equipItem(slot, pack, 'broom', 'weapon');
    expect(slot.equipment?.weapon).toBe('broom');
    const filled = fillTokens('{{무기}}', { slot, pack });
    expect(filled).toBe('빗자루');
  });

  it('입력 슬롯은 바뀌지 않는다: 모든 함수에서 Object.freeze한 슬롯을 넘겨도 오류가 없다', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    slot = grantTrait(slot, pack, 'ring-a');

    const frozen = Object.freeze({
      ...slot,
      traitIds: Object.freeze([...slot.traitIds]),
      equipment: Object.freeze({ ...slot.equipment }),
    }) as ReaderSlot;

    expect(() => statTotal(pack.traits['iron']!)).not.toThrow();
    expect(() => isActiveTrait(frozen, pack.traits['iron']!)).not.toThrow();
    expect(() => equippedSlotOf(frozen, 'iron')).not.toThrow();
    expect(() => equipItem(frozen, pack, 'broom', 'weapon')).not.toThrow();
    expect(() => unequipItem(frozen, 'weapon')).not.toThrow();
    expect(() => autoEquip(frozen, pack, 'steel')).not.toThrow();
    expect(() => grantTrait(frozen, pack, 'pill')).not.toThrow();
    expect(() => applyEffects(frozen, pack, { equipment: { weapon: 'iron' } })).not.toThrow();
    expect(() => computeStats(frozen, pack)).not.toThrow();
  });

  it('kind를 얻는다 / proud를 얻는다: 성향 +10 / -10', () => {
    const pack = makePack();
    let slot1 = createReaderSlot(pack, 's1', 'o', '갑');
    slot1 = grantTrait(slot1, pack, 'kind');
    expect(slot1.alignment).toBe(10);

    let slot2 = createReaderSlot(pack, 's2', 'o', '갑');
    slot2 = grantTrait(slot2, pack, 'proud');
    expect(slot2.alignment).toBe(-10);
  });

  it('화의 draw가 art 풀이고 iron을 입었을 때 후보의 첫 무공이 sword-art', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = grantTrait(slot, pack, 'iron');
    expect(slot.equipment?.weapon).toBe('iron');
    const ep = { id: 'ep-test', draw: { pools: ['art'], include: [], exclude: [] } } as any;
    const candidates = drawCandidates(slot, ep, pack);
    expect(candidates[0]?.id).toBe('sword-art');
  });

  it('같은 화, broom을 입었을 때: 후보 순서에 장비 영향 없음', () => {
    const pack = makePack();
    const slotBroom = createReaderSlot(pack, 's1', 'o', '갑');
    expect(slotBroom.equipment?.weapon).toBe('broom');
    const slotNoWeapon = { ...slotBroom, equipment: {} };
    const ep = { id: 'ep-test', draw: { pools: ['art'], include: [], exclude: [] } } as any;
    const candidatesBroom = drawCandidates(slotBroom, ep, pack);
    const candidatesNoWeapon = drawCandidates(slotNoWeapon, ep, pack);
    expect(candidatesBroom.map((c) => c.id)).toEqual(candidatesNoWeapon.map((c) => c.id));
  });

  it('성향 -40, 상대를 내려다볼 때 protagonistRelation.speech === mock', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = { ...slot, alignment: -40 };
    const rel = protagonistRelation(slot, pack, 'targetWeak', 'might', 'none');
    expect(rel.regard).toBe('down');
    expect(rel.speech).toBe('mock');
  });

  it('성향 +40, 대등할 때 protagonistRelation.speech === resolve', () => {
    const pack = makePack();
    let slot = createReaderSlot(pack, 's1', 'o', '갑');
    slot = { ...slot, alignment: 40 };
    const rel = protagonistRelation(slot, pack, 'targetEqual', 'might', 'none');
    expect(rel.regard).toBe('level');
    expect(rel.speech).toBe('resolve');
  });

  it('성향 0: resolveSpeech와 결과가 같다', () => {
    const pack = makePack();
    const slot = createReaderSlot(pack, 's1', 'o', '갑');
    expect(slot.alignment).toBe(0);
    const rel = protagonistRelation(slot, pack, 'targetEqual', 'might', 'none');
    expect(rel.speech).toBe(resolveSpeech(pack, { who: 'member', alignment: 0, nature: [], emotion: rel.emotion, stance: rel.stance, regard: rel.regard }));
  });
});
