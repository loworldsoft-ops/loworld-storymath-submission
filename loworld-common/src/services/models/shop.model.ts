import { Item } from './item.model';

/** 상점에 진열된 아이템 (기존 Item을 래핑하여 가격·재고 정보를 추가) */
export interface ShopItem {
  item: Item;
  price: number;
  stock: number | 'unlimited';
  discountRate?: number;
  requiredLevel?: number;
  soldOut?: boolean;
}

/** 상점 카테고리 */
export interface ShopCategory {
  id: string;
  label: string;
  icon?: string;
  items: ShopItem[];
}

/** 장바구니 항목 */
export interface ShopCartEntry {
  shopItem: ShopItem;
  quantity: number;
}

/** 구매 실패 사유 */
export type ShopPurchaseFailReason =
  | 'insufficient-gold'
  | 'insufficient-level'
  | 'inventory-full'
  | 'out-of-stock'
  | 'already-owned-unique';

/** 구매 조건을 검증한다 (순수 함수). null이면 구매 가능. */
export function validateShopPurchase(
  shopItem: ShopItem,
  playerGold: number,
  playerLevel: number,
  inventoryItemCount: number,
  maxSlots: number,
  ownedItemIds: readonly string[],
): ShopPurchaseFailReason | null {
  const effectivePrice = getShopEffectivePrice(shopItem);

  if (playerGold < effectivePrice) return 'insufficient-gold';
  if (shopItem.requiredLevel && playerLevel < shopItem.requiredLevel) return 'insufficient-level';
  if (inventoryItemCount >= maxSlots) return 'inventory-full';
  if (shopItem.stock !== 'unlimited' && shopItem.stock <= 0) return 'out-of-stock';
  if (shopItem.item.rarity === 'unique' && ownedItemIds.includes(shopItem.item.id))
    return 'already-owned-unique';

  return null;
}

/** 할인 적용 후 실제 가격을 계산한다. */
export function getShopEffectivePrice(shopItem: ShopItem): number {
  const discount = shopItem.discountRate ?? 0;
  return Math.floor(shopItem.price * (1 - discount));
}

/** 구매 실패 사유를 한국어 레이블로 반환한다. */
export function getShopFailReasonLabel(reason: ShopPurchaseFailReason): string {
  switch (reason) {
    case 'insufficient-gold':
      return '골드가 부족합니다';
    case 'insufficient-level':
      return '레벨이 부족합니다';
    case 'inventory-full':
      return '가방이 가득 찼습니다';
    case 'out-of-stock':
      return '품절된 상품입니다';
    case 'already-owned-unique':
      return '이미 보유 중인 유니크 아이템입니다';
  }
}
