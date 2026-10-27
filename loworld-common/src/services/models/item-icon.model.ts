export const ITEM_ICON_IDS = [
  'sword',
  'crystal-sword',
  'dagger',
  'bow',
  'shield',
  'armor',
  'helmet',
  'boots',
  'gloves',
  'belt',
  'ring',
  'amulet',
  'quest-scroll',
] as const;

export type ItemIconId = (typeof ITEM_ICON_IDS)[number];