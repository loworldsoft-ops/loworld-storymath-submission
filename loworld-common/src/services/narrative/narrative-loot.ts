import type { ClashResult, ReaderSlot, StoryEpisode, StoryPack } from './narrative.model';
import { evaluateCondition } from './narrative-bind';
import { computeStats, grantTrait, slotSeed } from './narrative-state';
import { resolveTuning } from './narrative-tuning';
import { seededRandom, stableHash } from './narrative-util';

/**
 * 전리품: 화를 마치고 그 구역에 흩어진 것 하나를 줍는다.
 * 무게는 기연(fortune)이 희귀한 것 쪽으로 기울인다: 무게 × (1 + 기본보다 높은 기연 × lootBonus.<단계>).
 * 모든 능력치는 바탕(baseStat)에서 시작하므로, 바탕을 넘는 만큼만 운으로 친다.
 * 무작위는 슬롯의 씨앗에서 나온다. 같은 독자가 같은 화를 마치면 늘 같은 것을 줍는다.
 */
export function rollLoot(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode, clash: ClashResult | null): string[] {
  const spec = episode.loot;
  const table = spec ? (pack.loot ?? []).find((entry) => entry.id === spec.table) : null;
  if (!spec || !table) return [];
  const tuning = resolveTuning(pack.tuning) as unknown as Record<string, number>;
  const fortune = Math.max(0, computeStats(slot, pack).fortune - tuning['baseStat']);
  const context = { slot, pack, episode, clash, catharsis: 0, axis: episode.contest?.axis ?? 'might', afterClash: true } as const;
  const weighted = table.entries
    .filter((entry) => !!pack.traits[entry.id] && evaluateCondition(entry.when, context))
    .map((entry) => {
      const bonus = tuning[`lootBonus.${pack.traits[entry.id]?.rarity ?? ''}`] ?? 0;
      return { id: entry.id, weight: entry.weight * (1 + fortune * bonus) };
    });
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return [];
  const picked: string[] = [];
  for (let index = 0; index < spec.count; index += 1) {
    const roll = seededRandom(stableHash(`${slotSeed(slot)}:${episode.id}:loot:${index}`))() * total;
    let acc = 0;
    const hit = weighted.find((entry) => (acc += entry.weight) > roll) ?? weighted[weighted.length - 1];
    picked.push(hit.id);
  }
  return picked;
}

/** 주운 것을 준다. 구슬은 수가 늘고, 이미 가진 장비는 다시 주지 않는다(grantTrait가 막는다) */
export function grantLoot(slot: ReaderSlot, pack: StoryPack, ids: readonly string[]): ReaderSlot {
  return ids.reduce((current, id) => grantTrait(current, pack, id), slot);
}
