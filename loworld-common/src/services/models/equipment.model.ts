import { Item, ItemType } from './item.model';

export type EquipmentSlotKey =
  | 'weapon'
  | 'helmet'
  | 'bodyArmor'
  | 'shield'
  | 'gloves'
  | 'belt'
  | 'boots'
  | 'ringLeft'
  | 'ringRight'
  | 'amulet';

export type EquipmentSlots = Record<EquipmentSlotKey, Item | null> & {
  weapon2?: Item | null;
  shield2?: Item | null;
};

export interface EquipmentSlotMeta {
  slot: EquipmentSlotKey;
  label: string;
  shortLabel: string;
  boardArea: string;
  acceptedTypes: readonly ItemType[];
}

export const EQUIPMENT_SLOT_META: Record<EquipmentSlotKey, EquipmentSlotMeta> = {
  weapon: {
    slot: 'weapon',
    label: '무기',
    shortLabel: '무',
    boardArea: 'weapon',
    acceptedTypes: ['weapon'],
  },
  helmet: {
    slot: 'helmet',
    label: '투구',
    shortLabel: '투',
    boardArea: 'helmet',
    acceptedTypes: ['helmet'],
  },
  bodyArmor: {
    slot: 'bodyArmor',
    label: '갑옷',
    shortLabel: '갑',
    boardArea: 'bodyArmor',
    acceptedTypes: ['armor'],
  },
  shield: {
    slot: 'shield',
    label: '방패',
    shortLabel: '방',
    boardArea: 'shield',
    acceptedTypes: ['shield'],
  },
  gloves: {
    slot: 'gloves',
    label: '장갑',
    shortLabel: '장',
    boardArea: 'gloves',
    acceptedTypes: ['gloves'],
  },
  belt: {
    slot: 'belt',
    label: '벨트',
    shortLabel: '벨',
    boardArea: 'belt',
    acceptedTypes: ['belt'],
  },
  boots: {
    slot: 'boots',
    label: '신발',
    shortLabel: '신',
    boardArea: 'boots',
    acceptedTypes: ['boots'],
  },
  ringLeft: {
    slot: 'ringLeft',
    label: '반지 L',
    shortLabel: '좌',
    boardArea: 'ringLeft',
    acceptedTypes: ['ring'],
  },
  ringRight: {
    slot: 'ringRight',
    label: '반지 R',
    shortLabel: '우',
    boardArea: 'ringRight',
    acceptedTypes: ['ring'],
  },
  amulet: {
    slot: 'amulet',
    label: '목걸이',
    shortLabel: '목',
    boardArea: 'amulet',
    acceptedTypes: ['amulet'],
  },
};

export const EQUIPMENT_SLOT_ORDER: EquipmentSlotKey[] = [
  'weapon',
  'helmet',
  'bodyArmor',
  'shield',
  'gloves',
  'belt',
  'boots',
  'ringLeft',
  'ringRight',
  'amulet',
];

export const DEFAULT_EQUIPMENT_SLOTS: EquipmentSlots = {
  weapon: null,
  helmet: null,
  bodyArmor: null,
  shield: null,
  gloves: null,
  belt: null,
  boots: null,
  ringLeft: null,
  ringRight: null,
  amulet: null,
};

export function getEquipmentSlotMeta(slot: EquipmentSlotKey): EquipmentSlotMeta {
  return EQUIPMENT_SLOT_META[slot];
}

export function getEquipmentSlotLabel(slot: EquipmentSlotKey): string {
  return EQUIPMENT_SLOT_META[slot].label;
}

export function canEquipItemToSlot(item: Pick<Item, 'type'> | null | undefined, slot: EquipmentSlotKey): boolean {
  if (!item) {
    return false;
  }
  return true;
}

export function getCompatibleEquipmentSlots(item: Pick<Item, 'type'> | null | undefined): EquipmentSlotKey[] {
  if (!item) {
    return [];
  }

  return [...EQUIPMENT_SLOT_ORDER];
}

export function getPreferredEquipmentSlot(
  item: Pick<Item, 'type'>,
  equipment: EquipmentSlots,
): EquipmentSlotKey | null {
  const compatibleSlots = getCompatibleEquipmentSlots(item);
  if (compatibleSlots.length === 0) {
    return 'weapon';
  }

  return compatibleSlots.find((slot) => equipment[slot] === null) ?? compatibleSlots[0] ?? 'weapon';
}