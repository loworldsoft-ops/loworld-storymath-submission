import type {
  ClashResult,
  ReaderSlot,
  StoryPack,
  StoryShop,
  StoryTrait,
} from './narrative.model';
import { equippedSlotOf, unequipItem } from './narrative-loadout';
import { grantTrait } from './narrative-state';
import { resolveTuning } from './narrative-tuning';

export type ShopResult =
  | { readonly slot: ReaderSlot; readonly ok: true }
  | { readonly slot: ReaderSlot; readonly ok: false; readonly reason: 'unknown' | 'owned' | 'poor' | 'locked' };

/** 독자가 지금 있는 구역: 마지막으로 읽은 화의 구역. 읽은 화가 없으면 첫 화의 구역 */
export function currentZoneId(slot: ReaderSlot, pack: StoryPack): string | null {
  if (slot.history.length > 0) {
    const lastRecord = slot.history[slot.history.length - 1];
    const ep = pack.episodes[lastRecord.episodeId];
    if (ep?.zone) return ep.zone;
  }
  const firstId = pack.episodeOrder[0];
  const firstEp = firstId ? pack.episodes[firstId] : null;
  return firstEp?.zone ?? null;
}

export function shopInZone(pack: StoryPack, zoneId: string | null): StoryShop | null {
  if (!zoneId || !pack.shops) return null;
  return pack.shops.find((s) => s.zone === zoneId) ?? null;
}

export function silverOf(slot: ReaderSlot): number {
  return slot.silver ?? 0;
}

export function sellPrice(pack: StoryPack, trait: StoryTrait): number {
  if (trait.price == null) return 0;
  const tuning = resolveTuning(pack.tuning);
  return Math.floor(trait.price * tuning.sellRatio);
}

/** P8의 규칙 */
export function canSell(slot: ReaderSlot, pack: StoryPack, traitId: string): boolean {
  if (!slot.traitIds.includes(traitId)) return false;
  const trait = pack.traits[traitId];
  if (!trait || trait.kind !== 'item') return false;
  if (trait.price == null) return false;
  if (pack.combinations.some((c) => c.requires.includes(traitId))) return false;
  if (Object.values(pack.traits).some((t) => t.requires === traitId)) return false;
  return true;
}

/** 상점에 있고, 값이 있고, 가지지 않았고, 돈이 되면 산다. 산 것은 grantTrait로 얻는다(자동 착용이 따라온다) */
export function buyItem(slot: ReaderSlot, pack: StoryPack, shopId: string, traitId: string): ShopResult {
  const shop = pack.shops?.find((s) => s.id === shopId);
  if (!shop || !shop.items.includes(traitId)) {
    return { slot, ok: false, reason: 'unknown' };
  }
  const trait = pack.traits[traitId];
  if (!trait || trait.price == null) {
    return { slot, ok: false, reason: 'unknown' };
  }
  // 구슬은 몇 번이고 산다. 수가 는다.
  if (slot.traitIds.includes(traitId) && trait.kind !== 'bead') {
    return { slot, ok: false, reason: 'owned' };
  }
  const currentSilver = silverOf(slot);
  if (currentSilver < trait.price) {
    return { slot, ok: false, reason: 'poor' };
  }
  const nextSlot: ReaderSlot = { ...slot, silver: currentSilver - trait.price };
  const granted = grantTrait(nextSlot, pack, traitId);
  return { slot: granted, ok: true };
}

/** 입고 있으면 벗기고, traitIds에서 빼고, 파는 값을 더한다. canSell이 거짓이면 'locked' */
export function sellItem(slot: ReaderSlot, pack: StoryPack, traitId: string): ShopResult {
  if (!canSell(slot, pack, traitId)) {
    return { slot, ok: false, reason: 'locked' };
  }
  const trait = pack.traits[traitId];
  const price = sellPrice(pack, trait);

  const equippedSlot = equippedSlotOf(slot, traitId);
  let next = slot;
  if (equippedSlot) {
    next = unequipItem(next, equippedSlot);
  }
  next = {
    ...next,
    traitIds: next.traitIds.filter((id) => id !== traitId),
    silver: silverOf(next) + price,
  };
  return { slot: next, ok: true };
}

/** 화를 마치고 받는 돈(P6). 겨루기가 없으면 silverBase만 받는다 */
export function silverReward(pack: StoryPack, clash: ClashResult | null): number {
  const tuning = resolveTuning(pack.tuning);
  if (!clash) return tuning.silverBase;
  if (clash.outcome !== 'victory') return tuning.silverBase;
  if (clash.tier === 'overwhelm') return tuning.silverBase + tuning.silverOverwhelm;
  if (clash.tier === 'advantage') return tuning.silverBase + tuning.silverAdvantage;
  if (clash.tier === 'close') return tuning.silverBase + tuning.silverClose;
  return tuning.silverBase;
}
