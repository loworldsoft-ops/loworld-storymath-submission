import {
  EQUIP_KIND_SLOTS,
  type ReaderEquipmentSlot,
  type ReaderSlot,
  type StoryPack,
  type StoryTrait,
} from './narrative.model';
import { socketsOf, verseOfItem } from './narrative-beads';

/** 능력치 합 = stats의 모든 값의 합 */
export function statTotal(trait: StoryTrait): number {
  return Object.values(trait.stats ?? {}).reduce((sum, val) => sum + (val ?? 0), 0);
}

/** 이 장비를 입었을 때 더해지는 능력치 합: 장비 + 박힌 구슬 + 완성된 구결. 자동 착용이 비교한다 */
export function equippedTotal(slot: ReaderSlot, pack: StoryPack, trait: StoryTrait): number {
  const beads = socketsOf(slot, trait.id).reduce((sum, id) => sum + (pack.traits[id] ? statTotal(pack.traits[id]) : 0), 0);
  const verse = verseOfItem(slot, pack, trait.id);
  const verseTotal = verse ? Object.values(verse.stats).reduce((sum, val) => sum + (val ?? 0), 0) : 0;
  return statTotal(trait) + beads + verseTotal;
}

/** 이 속성이 힘과 본문 토큰에 쓰이는가. 입는 아이템은 입었을 때만 쓰인다 */
export function isActiveTrait(slot: ReaderSlot, trait: StoryTrait): boolean {
  // 구슬은 가진 것만으로는 힘이 되지 않는다. 흡수하거나 박아야 한다(narrative-beads의 beadStats).
  if (trait.kind === 'bead') return false;
  if (trait.kind === 'item' && trait.equip) {
    return Object.values(slot.equipment ?? {}).includes(trait.id);
  }
  return true;
}

/** 입은 아이템 id → 칸. 같은 아이템이 두 칸에 있지 않다 */
export function equippedSlotOf(slot: ReaderSlot, traitId: string): ReaderEquipmentSlot | null {
  if (!slot.equipment) return null;
  for (const [s, id] of Object.entries(slot.equipment) as [ReaderEquipmentSlot, string | undefined][]) {
    if (id === traitId) return s;
  }
  return null;
}

/**
 * 입힌다. 가지지 않았거나, 입을 수 없거나, 그 칸에 맞지 않으면 그대로 돌려준다.
 * target이 없으면: 그 종류의 칸 중 빈 첫 칸, 모두 찼으면 첫 칸.
 * 이미 다른 칸에 입고 있으면 그 칸에서 벗기고 옮긴다.
 */
export function equipItem(slot: ReaderSlot, pack: StoryPack, traitId: string, target?: ReaderEquipmentSlot): ReaderSlot {
  if (!slot.traitIds.includes(traitId)) return slot;
  const trait = pack.traits[traitId];
  if (!trait || trait.kind !== 'item' || !trait.equip) return slot;

  const allowedSlots = EQUIP_KIND_SLOTS[trait.equip];
  if (!allowedSlots || allowedSlots.length === 0) return slot;

  let destSlot: ReaderEquipmentSlot;
  if (target) {
    if (!allowedSlots.includes(target)) return slot;
    destSlot = target;
  } else {
    const emptySlot = allowedSlots.find((s) => !slot.equipment?.[s]);
    destSlot = emptySlot ?? allowedSlots[0];
  }

  const currentSlot = equippedSlotOf(slot, traitId);
  if (currentSlot === destSlot) return slot;

  const nextEquipment: Partial<Record<ReaderEquipmentSlot, string>> = { ...(slot.equipment ?? {}) };
  if (currentSlot) {
    delete nextEquipment[currentSlot];
  }
  nextEquipment[destSlot] = traitId;
  return { ...slot, equipment: nextEquipment };
}

export function unequipItem(slot: ReaderSlot, target: ReaderEquipmentSlot): ReaderSlot {
  if (!slot.equipment || !slot.equipment[target]) return slot;
  const nextEquipment: Partial<Record<ReaderEquipmentSlot, string>> = { ...slot.equipment };
  delete nextEquipment[target];
  return { ...slot, equipment: nextEquipment };
}

/** 얻었을 때의 자동 착용(P4). 빈 칸이 있으면 거기에, 없으면 능력치 합이 가장 작은 칸의 것보다 크면 바꾼다. 같거나 작으면 그대로 */
export function autoEquip(slot: ReaderSlot, pack: StoryPack, traitId: string): ReaderSlot {
  if (!slot.traitIds.includes(traitId)) return slot;
  const trait = pack.traits[traitId];
  if (!trait || trait.kind !== 'item' || !trait.equip) return slot;

  const allowedSlots = EQUIP_KIND_SLOTS[trait.equip];
  if (!allowedSlots || allowedSlots.length === 0) return slot;

  const emptySlot = allowedSlots.find((s) => !slot.equipment?.[s]);
  if (emptySlot) {
    return equipItem(slot, pack, traitId, emptySlot);
  }

  // 박힌 구슬과 구결까지 센다. 구슬을 박아 둔 장비를 맨몸의 새 장비가 밀어내지 않게.
  let minSlot: ReaderEquipmentSlot = allowedSlots[0];
  const firstItem = pack.traits[slot.equipment![allowedSlots[0]]!];
  let minTotal = firstItem ? equippedTotal(slot, pack, firstItem) : 0;

  for (let i = 1; i < allowedSlots.length; i++) {
    const s = allowedSlots[i];
    const item = pack.traits[slot.equipment![s]!];
    const total = item ? equippedTotal(slot, pack, item) : 0;
    if (total < minTotal) {
      minTotal = total;
      minSlot = s;
    }
  }

  const newTotal = statTotal(trait);
  if (newTotal > minTotal) {
    return equipItem(slot, pack, traitId, minSlot);
  }
  return slot;
}
