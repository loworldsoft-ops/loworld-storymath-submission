import { ItemIconId, ITEM_ICON_IDS } from './item-icon.model';
import { Item, ItemType } from './item.model';

const ITEM_ICON_ID_SET = new Set<string>(ITEM_ICON_IDS);

const ITEM_ICON_ALIASES: Record<string, ItemIconId> = {
  glove: 'gloves',
  gloves: 'gloves',
  belt: 'belt',
  ring: 'ring',
  shield: 'shield',
  sword: 'sword',
  'crystal-sword': 'crystal-sword',
  armor: 'armor',
  helmet: 'helmet',
  boots: 'boots',
  bow: 'bow',
  dagger: 'dagger',
  amulet: 'amulet',
  quest: 'quest-scroll',
  'quest-scroll': 'quest-scroll',
};

export function isItemIconId(value: string | null | undefined): value is ItemIconId {
  return !!value && ITEM_ICON_ID_SET.has(value);
}

const DEFAULT_ITEM_ICON_MAP: Record<string, ItemIconId> = {
  weapon: 'sword',
  armor: 'armor',
  bodyArmor: 'armor',
  helmet: 'helmet',
  shield: 'shield',
  boots: 'boots',
  gloves: 'gloves',
  belt: 'belt',
  ring: 'ring',
  ringLeft: 'ring',
  ringRight: 'ring',
  amulet: 'amulet',
  quest: 'quest-scroll',
  skill_scroll: 'quest-scroll',
};

export function getDefaultItemIconId(type: ItemType): ItemIconId {
  return DEFAULT_ITEM_ICON_MAP[type as string] ?? 'sword';
}

export function resolveItemIconId(item: Pick<Item, 'type' | 'icon'>): ItemIconId {
  const icon = item.icon;

  if (isItemIconId(icon)) {
    return icon;
  }

  if (icon) {
    const alias = ITEM_ICON_ALIASES[icon];
    if (alias) {
      return alias;
    }
  }

  return getDefaultItemIconId(item.type);
}