import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import type { StoryPack } from './narrative.model';
import { buildCodex } from './narrative-codex';
import { createReaderSlot, grantTrait } from './narrative-state';
import { applyDraw, completeEpisode, openEpisode } from './narrative-flow';
import { autoMightClash, createMightClash, finishMightClash } from './narrative-clash';

const packPath = join(process.cwd(), 'loworld-common/src/services/narrative/__fixtures__/wuxia-1');
const compiled = compilePack(packPath);
const pack: StoryPack = enrichPackWithPersonalityCards(compiled.pack as StoryPack);

describe('narrative-codex: buildCodex', () => {
  it('slot = null이면 모든 항목이 unknown이고 모든 분류의 known이 0이다', () => {
    const codex = buildCodex(pack, null);
    expect(codex.groups.length).toBeGreaterThan(0);
    for (const group of codex.groups) {
      expect(group.known).toBe(0);
      expect(group.total).toBe(group.entries.length);
      for (const entry of group.entries) {
        expect(entry.state).toBe('unknown');
        expect(entry.firstEpisodeId).toBeUndefined();
      }
    }
  });

  it('새 캐릭터(출신 sword): 출신의 속성과 startTraits가 owned이고 firstEpisodeId가 없다', () => {
    const slot = createReaderSlot(pack, 'slot-sword', 'sword', '이현');
    const codex = buildCodex(pack, slot);

    const origin = pack.origins.find((o) => o.id === 'sword')!;
    const startTraitIds = new Set([...origin.traits, ...pack.startTraits]);

    for (const traitId of startTraitIds) {
      const trait = pack.traits[traitId];
      if (!trait) continue;
      const group = codex.groups.find((g) => g.entries.some((e) => e.id === traitId));
      expect(group).toBeDefined();
      const entry = group!.entries.find((e) => e.id === traitId);
      expect(entry?.state).toBe('owned');
      expect(entry?.firstEpisodeId).toBeUndefined();
    }
  });

  it('1화를 마친 슬롯: 뽑기 후보 중 고르지 않은 것이 seen이고 1화 cast의 인물이 owned(firstEpisodeId === ep001)이다', () => {
    let slot = createReaderSlot(pack, 'slot-ep1', 'sword', '이현');
    const opened = openEpisode(slot, pack, 'ep001')!;
    expect(opened.candidates.length).toBeGreaterThan(1);

    // art.cheongun-1 같은 art/item 후보를 고르지 않고 다른 후보를 골라 seen 상태를 검증한다.
    const artCandidate = opened.candidates.find((c) => ['item', 'art', 'memory'].includes(pack.traits[c.id]?.kind ?? ''));
    expect(artCandidate).toBeDefined();
    const chosen = opened.candidates.find((c) => c.id !== artCandidate!.id) ?? opened.candidates[0];
    slot = applyDraw(slot, pack, chosen.id);

    const episode = pack.episodes['ep001'];
    const state = createMightClash(slot, pack, episode);
    const clash = state ? finishMightClash(autoMightClash(state), pack, true) : null;

    const done = completeEpisode({
      slot,
      pack,
      episode,
      candidateIds: opened.candidates.map((c) => c.id),
      drawnTraitId: chosen.id,
      clash,
    });
    slot = done.slot;

    const codex = buildCodex(pack, slot);

    // 고른 카드는 owned
    const chosenGroup = codex.groups.find((g) => g.entries.some((e) => e.id === chosen.id));
    const chosenEntry = chosenGroup?.entries.find((e) => e.id === chosen.id);
    expect(chosenEntry?.state).toBe('owned');

    // 고르지 않은 art 후보는 seen
    const artGroup = codex.groups.find((g) => g.entries.some((e) => e.id === artCandidate!.id));
    const artEntry = artGroup?.entries.find((e) => e.id === artCandidate!.id);
    expect(artEntry?.state).toBe('seen');

    // 1화 cast 인물은 owned, firstEpisodeId === 'ep001'
    const castGroup = codex.groups.find((g) => g.id === 'cast');
    expect(castGroup).toBeDefined();
    for (const castId of episode.cast) {
      const entry = castGroup!.entries.find((e) => e.id === castId);
      expect(entry?.state).toBe('owned');
      expect(entry?.firstEpisodeId).toBe('ep001');
    }
  });

  it('기연을 얻기 전에는 unknown, 얻은 뒤에는 owned이며 firstEpisodeId가 막간이 붙은 화이다', () => {
    let slot = createReaderSlot(pack, 'slot-windfall', 'sword', '이현');
    const windfallTraitId = 'mem.gwak-ankle'; // 1화의 windfall
    expect(pack.traits[windfallTraitId]?.kind).toBe('windfall');

    // 얻기 전
    const codexBefore = buildCodex(pack, slot);
    const memGroupBefore = codexBefore.groups.find((g) => g.id === 'memory');
    const entryBefore = memGroupBefore?.entries.find((e) => e.id === windfallTraitId);
    expect(entryBefore?.state).toBe('unknown');

    // 1화 후 interlude에서 기연을 얻었다고 가정한 슬롯
    const opened = openEpisode(slot, pack, 'ep001')!;
    const episode = pack.episodes['ep001'];
    const clash = finishMightClash(autoMightClash(createMightClash(slot, pack, episode)!), pack, true);
    const done = completeEpisode({
      slot,
      pack,
      episode,
      candidateIds: opened.candidates.map((c) => c.id),
      drawnTraitId: null,
      clash,
    });
    slot = done.slot;
    // windfall 부여 및 history의 interlude에 기록
    slot = grantTrait(slot, pack, windfallTraitId);
    const updatedHistory = slot.history.map((rec) =>
      rec.episodeId === 'ep001'
        ? {
            ...rec,
            interlude: {
              windfallTraitId,
              rematch: clash,
              bound: rec.bound,
            },
          }
        : rec,
    );
    slot = { ...slot, history: updatedHistory };

    // 얻은 뒤
    const codexAfter = buildCodex(pack, slot);
    const memGroupAfter = codexAfter.groups.find((g) => g.id === 'memory');
    const entryAfter = memGroupAfter?.entries.find((e) => e.id === windfallTraitId);
    expect(entryAfter?.state).toBe('owned');
    expect(entryAfter?.firstEpisodeId).toBe('ep001');
  });

  it('조합에 필요한 것 하나를 가지면 그 조합이 seen이다', () => {
    // 팩에서 2개 이상 필요한 조합 찾기
    const comb = pack.combinations.find((c) => c.requires.length >= 2)!;
    expect(comb).toBeDefined();

    let slot = createReaderSlot(pack, 'slot-comb', 'sword', '이현');
    // 필요한 첫 번째 속성만 부여
    slot = grantTrait(slot, pack, comb.requires[0]);

    const codex = buildCodex(pack, slot);
    const combGroup = codex.groups.find((g) => g.id === 'combination');
    expect(combGroup).toBeDefined();
    const entry = combGroup!.entries.find((e) => e.id === comb.id);
    expect(entry?.state).toBe('seen');

    // 모두 부여하면 owned
    for (const req of comb.requires.slice(1)) {
      slot = grantTrait(slot, pack, req);
    }
    const codexOwned = buildCodex(pack, slot);
    const entryOwned = codexOwned.groups.find((g) => g.id === 'combination')!.entries.find((e) => e.id === comb.id);
    expect(entryOwned?.state).toBe('owned');
  });

  it('일곱 분류 total의 합(cast, combination 제외)은 팩의 속성 수와 같고 누락이나 중복이 없다', () => {
    const codex = buildCodex(pack, null);
    const traitGroups = codex.groups.filter((g) => g.id !== 'cast' && g.id !== 'combination');

    const totalTraitsInGroups = traitGroups.reduce((acc, g) => acc + g.total, 0);
    const packTraitKeys = Object.keys(pack.traits);
    expect(totalTraitsInGroups).toBe(packTraitKeys.length);

    const gatheredIds = traitGroups.flatMap((g) => g.entries.map((e) => e.id));
    expect(new Set(gatheredIds).size).toBe(packTraitKeys.length);
    for (const key of packTraitKeys) {
      expect(gatheredIds).toContain(key);
    }
  });

  it('같은 입력 두 번이면 toEqual이다', () => {
    const slot = createReaderSlot(pack, 'slot-stable', 'sword', '이현');
    const codex1 = buildCodex(pack, slot);
    const codex2 = buildCodex(pack, slot);
    expect(codex1).toEqual(codex2);
  });
});
