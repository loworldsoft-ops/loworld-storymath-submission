import type {
  CodexBook,
  CodexEntry,
  CodexGroup,
  CodexGroupId,
  CodexState,
  ReaderSlot,
  StoryCastMember,
  StoryCombination,
  StoryPack,
  StoryTrait,
} from './narrative.model';
import { currentZoneId } from './narrative-shop';

function findFirstEpisodeIdForTrait(traitId: string, history: readonly ReaderSlot['history'][number][]): string | undefined {
  for (const record of history) {
    if (
      record.drawnTraitId === traitId ||
      record.rewardTraitId === traitId ||
      record.interlude?.windfallTraitId === traitId
    ) {
      return record.episodeId;
    }
  }
  return undefined;
}

/** 구슬을 처음 얻은 화: 보상, 전리품, 뽑기 중 처음 나온 곳 */
function findFirstBeadEpisode(traitId: string, history: readonly ReaderSlot['history'][number][]): string | undefined {
  return findFirstEpisodeIdForTrait(traitId, history) ?? history.find((record) => record.loot?.includes(traitId))?.episodeId;
}

function resolveCastOwnership(
  memberId: string,
  member: StoryCastMember,
  slot: ReaderSlot,
  pack: StoryPack,
): { state: CodexState; firstEpisodeId?: string } {
  for (const record of slot.history) {
    const ep = pack.episodes[record.episodeId];
    const inCast = ep?.cast?.includes(memberId) ?? false;
    const inClash =
      record.clash?.opponentId === memberId ||
      record.interlude?.rematch?.opponentId === memberId;
    const spoken = record.bound.paragraphs.some((p) => p.speakerName === member.name);

    if (inCast || inClash || spoken) {
      return { state: 'owned', firstEpisodeId: record.episodeId };
    }
  }

  if (slot.party?.includes(memberId)) {
    return { state: 'owned' };
  }

  return { state: 'unknown' };
}

/**
 * 팩과 슬롯을 받아 독자별 발견형 도감을 계산하는 순수 함수.
 * 슬롯이 null이면 모든 항목은 unknown이다.
 */
export function buildCodex(pack: StoryPack, slot: ReaderSlot | null): CodexBook {
  const ownedTraitIds = new Set(slot?.traitIds ?? []);
  const seenCandidateIds = new Set<string>();
  const seenShopItemIds = new Set<string>();

  if (slot) {
    for (const record of slot.history) {
      for (const cid of record.candidateIds) {
        seenCandidateIds.add(cid);
      }
    }

    const visitedZones = new Set<string>();
    for (const record of slot.history) {
      const z = pack.episodes[record.episodeId]?.zone ?? record.bound?.zone;
      if (z) visitedZones.add(z);
    }
    const curZ = currentZoneId(slot, pack);
    if (curZ) visitedZones.add(curZ);

    if (pack.shops) {
      for (const shop of pack.shops) {
        if (visitedZones.has(shop.zone)) {
          for (const itemId of shop.items) {
            seenShopItemIds.add(itemId);
          }
        }
      }
    }
  }

  const traitsList = Object.values(pack.traits);

  // 1. item
  const itemEntries: CodexEntry[] = traitsList
    .filter((t) => t.kind === 'item')
    .map((trait) => {
      if (!slot) {
        return { id: trait.id, group: 'item', state: 'unknown' };
      }
      const owned = ownedTraitIds.has(trait.id);
      if (owned) {
        const firstEpisodeId = findFirstEpisodeIdForTrait(trait.id, slot.history);
        return { id: trait.id, group: 'item', state: 'owned', firstEpisodeId };
      }
      const seen = seenCandidateIds.has(trait.id) || seenShopItemIds.has(trait.id);
      return { id: trait.id, group: 'item', state: seen ? 'seen' : 'unknown' };
    });

  // 2. art
  const artEntries: CodexEntry[] = traitsList
    .filter((t) => t.kind === 'art')
    .map((trait) => {
      if (!slot) {
        return { id: trait.id, group: 'art', state: 'unknown' };
      }
      const owned = ownedTraitIds.has(trait.id);
      if (owned) {
        const firstEpisodeId = findFirstEpisodeIdForTrait(trait.id, slot.history);
        return { id: trait.id, group: 'art', state: 'owned', firstEpisodeId };
      }
      const seen = seenCandidateIds.has(trait.id);
      return { id: trait.id, group: 'art', state: seen ? 'seen' : 'unknown' };
    });

  // 3. memory (memory + windfall)
  const memoryEntries: CodexEntry[] = traitsList
    .filter((t) => t.kind === 'memory' || t.kind === 'windfall')
    .map((trait) => {
      if (!slot) {
        return { id: trait.id, group: 'memory', state: 'unknown' };
      }
      const owned = ownedTraitIds.has(trait.id);
      if (owned) {
        const firstEpisodeId = findFirstEpisodeIdForTrait(trait.id, slot.history);
        return { id: trait.id, group: 'memory', state: 'owned', firstEpisodeId };
      }
      // 기연(windfall)은 seen이 없다.
      const seen = trait.kind === 'memory' && seenCandidateIds.has(trait.id);
      return { id: trait.id, group: 'memory', state: seen ? 'seen' : 'unknown' };
    });

  // 4. cast
  const castEntries: CodexEntry[] = Object.keys(pack.cast).map((castId) => {
    const member = pack.cast[castId];
    if (!slot || !member) {
      return { id: castId, group: 'cast', state: 'unknown' };
    }
    const resolved = resolveCastOwnership(castId, member, slot, pack);
    return {
      id: castId,
      group: 'cast',
      state: resolved.state,
      firstEpisodeId: resolved.firstEpisodeId,
    };
  });

  // 5. personality
  const personalityEntries: CodexEntry[] = traitsList
    .filter((t) => t.kind === 'personality')
    .map((trait) => {
      if (!slot) {
        return { id: trait.id, group: 'personality', state: 'unknown' };
      }
      const owned = ownedTraitIds.has(trait.id);
      if (owned) {
        const firstEpisodeId = findFirstEpisodeIdForTrait(trait.id, slot.history);
        return { id: trait.id, group: 'personality', state: 'owned', firstEpisodeId };
      }
      return { id: trait.id, group: 'personality', state: 'unknown' };
    });

  // 6. combination
  const combinationEntries: CodexEntry[] = pack.combinations.map((comb) => {
    if (!slot) {
      return { id: comb.id, group: 'combination', state: 'unknown' };
    }
    const allOwned = comb.requires.every((id) => ownedTraitIds.has(id));
    if (allOwned) {
      return { id: comb.id, group: 'combination', state: 'owned' };
    }
    const someOwned = comb.requires.some((id) => ownedTraitIds.has(id));
    return { id: comb.id, group: 'combination', state: someOwned ? 'seen' : 'unknown' };
  });

  // W9. bead: 얻은 적이 있으면 owned, 들른 구역의 상점에 있으면 seen
  const beadEntries: CodexEntry[] = traitsList
    .filter((t) => t.kind === 'bead')
    .map((trait) => {
      if (!slot) return { id: trait.id, group: 'bead', state: 'unknown' };
      if (ownedTraitIds.has(trait.id)) {
        return { id: trait.id, group: 'bead', state: 'owned', firstEpisodeId: findFirstBeadEpisode(trait.id, slot.history) };
      }
      return { id: trait.id, group: 'bead', state: seenShopItemIds.has(trait.id) ? 'seen' : 'unknown' };
    });

  // W9. verse: 한 번이라도 완성했으면 owned, 그 구결의 구슬을 하나라도 얻었으면 seen
  const verseEntries: CodexEntry[] = (pack.verses ?? []).map((verse) => {
    if (!slot) return { id: verse.id, group: 'verse', state: 'unknown' };
    if (slot.flags.includes(`verse:${verse.id}`)) return { id: verse.id, group: 'verse', state: 'owned' };
    return { id: verse.id, group: 'verse', state: verse.beads.some((id) => ownedTraitIds.has(id)) ? 'seen' : 'unknown' };
  });

  // 7. other (title, material, bond)
  const otherEntries: CodexEntry[] = traitsList
    .filter((t) => t.kind === 'title' || t.kind === 'material' || t.kind === 'bond')
    .map((trait) => {
      if (!slot) {
        return { id: trait.id, group: 'other', state: 'unknown' };
      }
      const owned = ownedTraitIds.has(trait.id);
      if (owned) {
        const firstEpisodeId = findFirstEpisodeIdForTrait(trait.id, slot.history);
        return { id: trait.id, group: 'other', state: 'owned', firstEpisodeId };
      }
      return { id: trait.id, group: 'other', state: 'unknown' };
    });

  const allGroups: { id: CodexGroupId; entries: readonly CodexEntry[] }[] = [
    { id: 'item', entries: itemEntries },
    { id: 'art', entries: artEntries },
    { id: 'memory', entries: memoryEntries },
    { id: 'cast', entries: castEntries },
    { id: 'personality', entries: personalityEntries },
    { id: 'combination', entries: combinationEntries },
    { id: 'bead', entries: beadEntries },
    { id: 'verse', entries: verseEntries },
    { id: 'other', entries: otherEntries },
  ];

  const groups: CodexGroup[] = allGroups
    .filter((g) => g.entries.length > 0)
    .map((g) => {
      const known = g.entries.filter((e) => e.state === 'owned' || e.state === 'seen').length;
      return {
        id: g.id,
        entries: g.entries,
        known,
        total: g.entries.length,
      };
    });

  return { groups };
}
