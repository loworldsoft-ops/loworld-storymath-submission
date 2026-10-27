import type { NarrativeInspectorMercenaryChannelVm } from './rpg-mercenary.model';
import type { ShopCategory } from './shop.model';

/** D2 unified commerce channels — [d2r-unified-town-commerce-system-design.md] */
export type NarrativeInspectorCommerceChannelId =
  | 'trade_weapons'
  | 'trade_armor'
  | 'trade_general'
  | 'gamble'
  | 'hire_mercenary'
  | 'revive_mercenary';

export const NARRATIVE_INSPECTOR_SHOP_COMMERCE_CHANNEL_IDS = [
  'trade_weapons',
  'trade_armor',
  'trade_general',
  'gamble',
] as const satisfies readonly NarrativeInspectorCommerceChannelId[];

export const NARRATIVE_INSPECTOR_MERCENARY_COMMERCE_CHANNEL_IDS = [
  'hire_mercenary',
  'revive_mercenary',
] as const satisfies readonly NarrativeInspectorCommerceChannelId[];

export const NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_IDS = [
  ...NARRATIVE_INSPECTOR_SHOP_COMMERCE_CHANNEL_IDS,
  ...NARRATIVE_INSPECTOR_MERCENARY_COMMERCE_CHANNEL_IDS,
] as const satisfies readonly NarrativeInspectorCommerceChannelId[];

export const NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_LABELS: Record<
  NarrativeInspectorCommerceChannelId,
  string
> = {
  trade_weapons: '무기',
  trade_armor: '방어구',
  trade_general: '잡화',
  gamble: '도박',
  hire_mercenary: '용병',
  revive_mercenary: '부활',
};

/** Inspector 상점 탭 — shop 채널은 lw-commerce-panel, mercenary 채널은 mercenary body */
export interface NarrativeInspectorCommerceChannelVm {
  id: NarrativeInspectorCommerceChannelId;
  label: string;
  shopName: string;
  categories?: ShopCategory[];
  mercenary?: NarrativeInspectorMercenaryChannelVm;
  /** false면 탭·채널 바에서 숨김 */
  enabled?: boolean;
}

export function isMercenaryCommerceChannelId(
  id: NarrativeInspectorCommerceChannelId,
): boolean {
  return (NARRATIVE_INSPECTOR_MERCENARY_COMMERCE_CHANNEL_IDS as readonly string[]).includes(id);
}

export function isMercenaryCommerceChannel(
  channel: NarrativeInspectorCommerceChannelVm,
): boolean {
  return isMercenaryCommerceChannelId(channel.id) || channel.mercenary != null;
}

export function isShopCommerceChannel(
  channel: NarrativeInspectorCommerceChannelVm,
): boolean {
  return !isMercenaryCommerceChannel(channel);
}

export interface NarrativeInspectorCommerceVm {
  channels: NarrativeInspectorCommerceChannelVm[];
  playerGold: number;
  playerLevel: number;
  inventorySlots?: number;
  inventoryItemCount?: number;
}

export function resolveNarrativeInspectorCommerceChannel(
  channels: readonly NarrativeInspectorCommerceChannelVm[],
  activeChannelId: NarrativeInspectorCommerceChannelId | null | undefined,
): NarrativeInspectorCommerceChannelVm | null {
  const enabled = channels.filter((ch) => ch.enabled !== false);
  if (enabled.length === 0) {
    return null;
  }
  if (activeChannelId) {
    const match = enabled.find((ch) => ch.id === activeChannelId);
    if (match) {
      return match;
    }
  }
  return enabled[0] ?? null;
}

export function listEnabledNarrativeInspectorCommerceChannels(
  channels: readonly NarrativeInspectorCommerceChannelVm[],
): NarrativeInspectorCommerceChannelVm[] {
  return channels.filter((ch) => ch.enabled !== false);
}

/** 단일 카탈로그 → trade_general 채널 1개 (레거시 shopCategories 호환) */
export function buildNarrativeInspectorCommerceChannelFromCategories(
  categories: ShopCategory[],
  options?: {
    id?: NarrativeInspectorCommerceChannelId;
    label?: string;
    shopName?: string;
  },
): NarrativeInspectorCommerceChannelVm | null {
  if (!categories || categories.length === 0) {
    return null;
  }
  const id = options?.id ?? 'trade_general';
  return {
    id,
    label: options?.label ?? NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_LABELS[id],
    shopName: options?.shopName ?? '상점',
    categories,
  };
}

/** Inspector 상점 — 채널 데이터 없을 때 placeholder (탭·바 항상 노출용) */
export function buildDefaultNarrativeInspectorCommerceChannels(): NarrativeInspectorCommerceChannelVm[] {
  const placeholderCategory: ShopCategory = {
    id: 'commerce-placeholder',
    label: '준비 중',
    items: [],
  };

  return NARRATIVE_INSPECTOR_SHOP_COMMERCE_CHANNEL_IDS.map((id) => ({
    id,
    label: NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_LABELS[id],
    shopName: '상점',
    categories: [placeholderCategory],
  }));
}
