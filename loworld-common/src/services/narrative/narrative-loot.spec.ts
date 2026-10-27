/**
 * W9 5~6장: 전리품(무게, 기연, 조건, 씨앗), 사건 줄기, 겨루기마다의 상대 힘.
 * 고정 팩 `__fixtures__/w9-mini`를 쓴다.
 */
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import type { ClashResult, ReaderSlot, StoryEpisode, StoryPack } from './narrative.model';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import { createReaderSlot, contestPower, memberPower } from './narrative-state';
import { arcProgress, completeEpisode } from './narrative-flow';
import { rollLoot } from './narrative-loot';
import { resolveWitContest } from './narrative-clash';
import { beadCount } from './narrative-beads';
import { resolveTuning } from './narrative-tuning';

const pack: StoryPack = enrichPackWithPersonalityCards(compilePack(join(process.cwd(), 'loworld-common/src/services/narrative/__fixtures__/w9-mini')).pack as StoryPack);
const clash = (outcome: 'victory' | 'defeat'): ClashResult => ({ episodeId: 'ep1', opponentId: 'rival', axis: 'might', outcome, tier: outcome === 'victory' ? 'advantage' : 'underdog', rounds: 2, finisherTraitId: null, usedTraitIds: [], untouched: false, auto: true });
const slotOf = (seed: string, origin = 'warm'): ReaderSlot => createReaderSlot(pack, seed, origin, '갑', seed);

function complete(slot: ReaderSlot, episodeId: string, result: ClashResult | null) {
  return completeEpisode({ slot, pack, episode: pack.episodes[episodeId], candidateIds: [], drawnTraitId: null, clash: result });
}

describe('W9 전리품', () => {
  it('이기면 표에서 하나를 줍고 기록에 남는다. 같은 씨앗이면 같은 것', () => {
    const first = complete(slotOf('A'), 'ep1', clash('victory'));
    const again = complete(slotOf('A'), 'ep1', clash('victory'));
    expect(first.loot).toHaveLength(1);
    expect(first.loot).toEqual(again.loot);
    expect(first.slot.history[0].loot).toEqual(first.loot);
    // 대화 장면의 grant(가의 구슬) + 보상(가의 구슬) + 전리품
    const ga = first.loot[0] === 'bead.ga' ? 3 : 2;
    expect(beadCount(first.slot, 'bead.ga')).toBe(ga);
  });

  it('지면 줍지 않는다', () => {
    const lost = complete(slotOf('A'), 'ep1', clash('defeat'));
    expect(lost.loot).toEqual([]);
    expect(lost.slot.history[0].loot).toBeUndefined();
  });

  it('겨루기가 없는 화는 줍는다. count만큼', () => {
    expect(complete(slotOf('A'), 'ep2', null).loot).toHaveLength(2);
  });

  it('씨앗이 다르면 다른 것도 줍는다', () => {
    const seen = new Set<string>();
    for (let index = 0; index < 60; index += 1) for (const id of rollLoot(slotOf(`S${index}`), pack, pack.episodes['ep1'], clash('victory'))) seen.add(id);
    expect([...seen].sort()).toEqual(['bead.da', 'bead.ga']);
  });

  it('조건이 맞는 줄만 무게에 든다: 패도면 나의 구슬이 많이 나온다', () => {
    let cruel = 0;
    for (let index = 0; index < 60; index += 1) {
      const slot = { ...slotOf(`S${index}`), alignment: -50 };
      cruel += rollLoot(slot, pack, pack.episodes['ep1'], clash('victory')).filter((id) => id === 'bead.na').length;
    }
    expect(cruel).toBeGreaterThan(40);
  });

  it('기연이 높으면 희귀한 것(rare)이 더 나온다', () => {
    const count = (fortune: number) => {
      let rare = 0;
      for (let index = 0; index < 300; index += 1) {
        const slot = { ...slotOf(`F${index}`), traitIds: [...slotOf(`F${index}`).traitIds] };
        const lucky: StoryPack = fortune ? { ...pack, origins: pack.origins.map((origin) => ({ ...origin, stats: { ...origin.stats, fortune } })) } : pack;
        rare += rollLoot(slot, lucky, lucky.episodes['ep1'], clash('victory')).filter((id) => id === 'bead.da').length;
      }
      return rare;
    };
    expect(count(20)).toBeGreaterThan(count(0) * 2);
  });
});

describe('W9 사건 줄기', () => {
  it('줄기마다 읽은 화 / 모든 화', () => {
    let slot = slotOf('A');
    expect(arcProgress(slot, pack)).toEqual([{ id: 'arc.trial', name: '시련', summary: '두 화에 걸친 일', read: 0, total: 2 }]);
    slot = complete(slot, 'ep1', clash('victory')).slot;
    expect(arcProgress(slot, pack)[0].read).toBe(1);
  });
});

describe('W9 겨루기마다의 상대 힘 (contest.power)', () => {
  it('말 겨루기는 덮어쓴 힘으로 잰다', () => {
    const episode: StoryEpisode = { ...pack.episodes['ep1'], contest: { axis: 'wit', opponent: 'rival', public: false } };
    const strong: StoryEpisode = { ...episode, contest: { ...episode.contest!, power: 500 } };
    const slot = slotOf('A');
    expect(resolveWitContest(slot, pack, episode, 'probe', true)?.outcome).toBe('victory');
    expect(resolveWitContest(slot, pack, strong, 'probe', true)?.outcome).toBe('defeat');
  });

  it('기연의 바닥값도 덮어쓴 힘을 쓴다', () => {
    const banePack: StoryPack = { ...pack, traits: { ...pack.traits, bane: { ...pack.traits['art.verse'], id: 'bane', kind: 'windfall', stats: {}, bane: { opponentId: 'rival', multiplier: 1 } } } };
    const slot = { ...slotOf('A'), traitIds: [...slotOf('A').traitIds, 'bane'] };
    const tuning = resolveTuning(banePack.tuning);
    expect(contestPower(slot, banePack, 'wit', 'rival')).toBe(Math.max(computeWit(slot, banePack), Math.round(memberPower(banePack.cast['rival'], 'wit', tuning) * tuning.windfallFloor)));
    expect(contestPower(slot, banePack, 'wit', 'rival', 300)).toBe(Math.round(300 * tuning.windfallFloor));
  });

  it('축을 적은 기연은 그 축으로 겨룰 때만 듣는다', () => {
    const bane = { ...pack.traits['art.verse'], id: 'bane', kind: 'windfall' as const, stats: {}, bane: { opponentId: 'rival', multiplier: 1, axis: 'wit' as const } };
    const banePack: StoryPack = { ...pack, traits: { ...pack.traits, bane } };
    const slot = { ...slotOf('A'), traitIds: [...slotOf('A').traitIds, 'bane'] };
    const plain = { ...slot, traitIds: slot.traitIds.filter((id) => id !== 'bane') };
    expect(contestPower(slot, banePack, 'wit', 'rival', 300)).toBe(Math.round(300 * resolveTuning(banePack.tuning).windfallFloor));
    expect(contestPower(slot, banePack, 'might', 'rival', 300)).toBe(contestPower(plain, banePack, 'might', 'rival', 300));
  });
});

function computeWit(slot: ReaderSlot, target: StoryPack): number {
  return contestPower({ ...slot, traitIds: slot.traitIds.filter((id) => id !== 'bane') }, target, 'wit', 'rival');
}
