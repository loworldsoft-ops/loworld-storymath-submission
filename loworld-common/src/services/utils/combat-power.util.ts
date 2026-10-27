import type { EquipmentSlots } from '../models/equipment.model';
import type { Item } from '../models/item.model';

const ITEM_RARITY_COMBAT_POWER_BONUS: Record<Item['rarity'], number> = {
  normal: 10,
  magic: 30,
  rare: 70,
  unique: 150,
  set: 300,
};

/** 아이템 1개의 전투력 기여도 — 스탯 라벨별 가중치 + 희귀도 보너스. */
export function calculateItemCombatPower(item: Item): number {
  let power = 0;
  if (!item.stats) return 0;

  for (const stat of item.stats) {
    const val = Number(stat.value) || 0;
    const label = stat.label;
    if (label.includes('피해') || label.includes('공격')) {
      power += val * 10;
    } else if (label.includes('방어')) {
      power += val * 8;
    } else if (label.includes('힘')) {
      power += val * 12;
    } else if (label.includes('활력')) {
      power += val * 6;
    } else if (label.includes('에너지')) {
      power += val * 5;
    } else if (label.includes('마나')) {
      power += val * 4;
    } else {
      power += val * 5;
    }
  }

  power += ITEM_RARITY_COMBAT_POWER_BONUS[item.rarity] || 0;
  return Math.round(power);
}

/** 캐릭터 종합 전투력 = (레벨 × 100) + 장착 중인 모든 아이템의 전투력 합. */
export function calculateCombatantCombatPower(
  level: number,
  equipment: EquipmentSlots | null | undefined,
): number {
  let power = level * 100;
  if (!equipment) {
    return power;
  }
  for (const item of Object.values(equipment)) {
    if (item) {
      power += calculateItemCombatPower(item);
    }
  }
  return power;
}
