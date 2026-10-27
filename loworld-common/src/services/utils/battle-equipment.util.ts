import type { Item, ItemStat } from '../models/item.model';
import type { ShopItem } from '../models/shop.model';
import type { EquipmentSlotKey, EquipmentSlots } from '../models/equipment.model';
import { canEquipItemToSlot } from '../models/equipment.model';
import type { LwBattleLoadoutStatusVm } from '../models/story-battle-vm.model';
import { calculateCombatantCombatPower, calculateItemCombatPower } from './combat-power.util';

export { calculateItemCombatPower, calculateCombatantCombatPower };

export const BATTLE_LOADOUT_EQUIPMENT_SLOTS: EquipmentSlotKey[] = [
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

export interface StoryBattleEquipmentModifiers {
  playerDamageBonus: number;
  playerDamageReduction: number;
  enemyDamageBonus: number;
  enemyDefenseBonus: number;
}

const EMPTY_MODIFIERS: StoryBattleEquipmentModifiers = {
  playerDamageBonus: 0,
  playerDamageReduction: 0,
  enemyDamageBonus: 0,
  enemyDefenseBonus: 0,
};

function statValue(stats: ItemStat[] | undefined, labels: string[]): number {
  if (!stats?.length) {
    return 0;
  }
  return stats
    .filter((entry) => labels.some((label) => entry.label.includes(label)))
    .reduce((sum, entry) => sum + Number(entry.value), 0);
}

/** 착용 장비 스탯 → 전투 피해·방어 보정치 */
export function computeBattleEquipmentModifiers(
  equipment: EquipmentSlots | null | undefined,
): StoryBattleEquipmentModifiers {
  if (!equipment) {
    return { ...EMPTY_MODIFIERS };
  }

  let playerDamageBonus = 0;
  let playerDamageReduction = 0;
  let enemyDamageBonus = 0;
  let enemyDefenseBonus = 0;

  for (const item of Object.values(equipment)) {
    if (!item) {
      continue;
    }
    playerDamageBonus += statValue(item.stats, ['피해', '공격']);
    playerDamageReduction += statValue(item.stats, ['방어']);
    enemyDamageBonus += statValue(item.stats, ['피해', '공격']);
    enemyDefenseBonus += statValue(item.stats, ['방어', '활력']);
  }

  return {
    playerDamageBonus,
    playerDamageReduction: Math.floor(playerDamageReduction / 2),
    enemyDamageBonus,
    enemyDefenseBonus,
  };
}

export function formatLoadoutSummary(equipment: EquipmentSlots): string {
  const equipped = Object.values(equipment).filter((item): item is Item => !!item);
  if (equipped.length === 0) {
    return '기본 장비';
  }
  if (equipped.length <= 2) {
    return equipped.map((item) => item.name).join(', ');
  }
  return `${equipped.slice(0, 2).map((item) => item.name).join(', ')} 외 ${equipped.length - 2}`;
}

export interface BattleTeamPowerMemberSpec {
  id: string;
  name: string;
  level: number;
  equipment: EquipmentSlots | null | undefined;
}

/** 참전 멤버 목록 → 팀 종합 전투력 VM */
export function buildBattleTeamPowerVm(members: BattleTeamPowerMemberSpec[]): {
  teamLabel: string;
  memberCount: number;
  totalCombatPower: number;
  members: Array<{ id: string; name: string; combatPower: number }>;
  isMultiMember: boolean;
} {
  const memberRows = members.map((member) => ({
    id: member.id,
    name: member.name,
    combatPower: calculateCombatantCombatPower(member.level, member.equipment),
  }));
  const totalCombatPower = memberRows.reduce((sum, row) => sum + row.combatPower, 0);
  const teamLabel = memberRows.map((row) => row.name).join(', ') || '-';
  return {
    teamLabel,
    memberCount: memberRows.length,
    totalCombatPower,
    members: memberRows,
    isMultiMember: memberRows.length > 1,
  };
}

/** 주요 착용 장비(무기·갑옷) 한 줄 요약 */
export function formatKeyEquipmentLine(equipment: EquipmentSlots): string {
  const parts: string[] = [];
  if (equipment.weapon) {
    parts.push(`⚔️ ${equipment.weapon.name}`);
  }
  if (equipment.bodyArmor) {
    parts.push(`🛡️ ${equipment.bodyArmor.name}`);
  } else if (equipment.shield) {
    parts.push(`🛡️ ${equipment.shield.name}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '기본 장비';
}

export interface BattleSandboxLoadout {
  equipment: EquipmentSlots;
  bagItems: Item[];
}

export function createEmptyEquipmentSlots(): EquipmentSlots {
  return {
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
}

export function createUnrestrictedStarterBagItems(): Item[] {
  return [
    {
      id: 'starter-bag-sword-01',
      name: '초보자의 장검',
      type: 'weapon',
      rarity: 'normal',
      icon: 'weapon-sword-01',
      description: '부담없이 가볍고 예리한 기본 무기.',
      requiredLevel: 1,
      stats: [{ label: '공격력', value: 15 }],
    },
    {
      id: 'starter-bag-wand-01',
      name: '수정 지팡이',
      type: 'weapon',
      rarity: 'magic',
      icon: 'weapon-crystal-01',
      description: '마법 응집력이 높은 지팡이.',
      requiredLevel: 1,
      stats: [{ label: '마법 피해', value: 20 }, { label: '에너지', value: 5 }],
    },
    {
      id: 'starter-bag-cap-01',
      name: '가죽 두건',
      type: 'helmet',
      rarity: 'normal',
      icon: 'helmet-leather-01',
      description: '가볍게 머리를 보호해 주는 두건.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 12 }],
    },
    {
      id: 'starter-bag-shako-01',
      name: '할리퀸 관모 (샤코)',
      type: 'helmet',
      rarity: 'unique',
      icon: 'helmet-iron-01',
      description: '모든 스킬과 생명력을 대폭 증가시키는 관모.',
      requiredLevel: 1,
      stats: [{ label: '모든 스킬', value: 2 }, { label: '생명력', value: 35 }, { label: '방어력', value: 45 }],
    },
    {
      id: 'starter-bag-armor-01',
      name: '사슬 갑옷',
      type: 'armor',
      rarity: 'normal',
      icon: 'armor-cloth-01',
      description: '촘촘하고 견고한 쇠사슬 갑옷.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 25 }],
    },
    {
      id: 'starter-bag-armor-02',
      name: '수수께끼 룬갑옷',
      type: 'armor',
      rarity: 'unique',
      icon: 'armor-plate-01',
      description: '강력한 공간 이동 능력과 높은 방어 성능을 선사하는 룬갑옷.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 85 }, { label: '이동 속도', value: 15 }],
    },
    {
      id: 'starter-bag-shield-01',
      name: '목재 방패',
      type: 'shield',
      rarity: 'normal',
      icon: 'shield-round-01',
      description: '단단한 원목으로 제작된 방패.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 10 }, { label: '블록율', value: 25 }],
    },
    {
      id: 'starter-bag-shield-02',
      name: '모나크 방패',
      type: 'shield',
      rarity: 'unique',
      icon: 'shield-tower-01',
      description: '모든 저항과 방어력을 극대화해 주는 전설의 방패.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 65 }, { label: '모든 저항', value: 20 }],
    },
    {
      id: 'starter-bag-gloves-01',
      name: '가죽 장갑',
      type: 'gloves',
      rarity: 'normal',
      icon: 'gloves-leather-01',
      description: '손을 부드럽게 감싸주는 기본 장갑.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 8 }],
    },
    {
      id: 'starter-bag-gloves-02',
      name: '강철 가틀렛',
      type: 'gloves',
      rarity: 'rare',
      icon: 'gloves-plate-01',
      description: '공격 속도와 정밀도를 조율해 주는 강철 장갑.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 22 }, { label: '공격 속도', value: 10 }],
    },
    {
      id: 'starter-bag-belt-01',
      name: '가죽 띠',
      type: 'belt',
      rarity: 'normal',
      icon: 'belt-leather-01',
      description: '물약을 휴대할 수 있는 가벼운 벨트.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 6 }],
    },
    {
      id: 'starter-bag-belt-02',
      name: '청운 요대',
      type: 'belt',
      rarity: 'unique',
      icon: 'belt-plated-01',
      description: '마력 수용량을 확대해 주는 유니크 허리띠.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 38 }, { label: '마나 재생', value: 15 }],
    },
    {
      id: 'starter-bag-boots-01',
      name: '가죽 부츠',
      type: 'boots',
      rarity: 'normal',
      icon: 'boots-leather-01',
      description: '보행 감각이 유연한 신발.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 7 }],
    },
    {
      id: 'starter-bag-boots-02',
      name: '전투 장화',
      type: 'boots',
      rarity: 'rare',
      icon: 'boots-heavy-01',
      description: '기동성과 이동 속도를 높여주는 장화.',
      requiredLevel: 1,
      stats: [{ label: '방어력', value: 20 }, { label: '이동 속도', value: 20 }],
    },
    {
      id: 'starter-bag-ring-01',
      name: '조던의 반지',
      type: 'ring',
      rarity: 'unique',
      icon: 'ring-gem-01',
      description: '모든 스킬 레벨과 최대 마나를 대폭 보강하는 전설의 반지.',
      requiredLevel: 1,
      stats: [{ label: '모든 스킬', value: 1 }, { label: '최대 마나', value: 25 }],
    },
    {
      id: 'starter-bag-ring-02',
      name: '수호자의 반지',
      type: 'ring',
      rarity: 'magic',
      icon: 'ring-gold-01',
      description: '생명력과 활력을 보충해 주는 반환의 반지.',
      requiredLevel: 1,
      stats: [{ label: '생명력', value: 15 }],
    },
    {
      id: 'starter-bag-ring-03',
      name: '청동 반지',
      type: 'ring',
      rarity: 'normal',
      icon: 'ring-silver-01',
      description: '은은한 은빛과 단단한 체격감을 주는 지휘 반지.',
      requiredLevel: 1,
      stats: [{ label: '생명력', value: 10 }],
    },
    {
      id: 'starter-bag-ring-04',
      name: '은반지',
      type: 'ring',
      rarity: 'magic',
      icon: 'ring-silver-02',
      description: '능력치를 균형있게 보강하는 마력 서랑 반지.',
      requiredLevel: 1,
      stats: [{ label: '모든 능력치', value: 3 }],
    },
    {
      id: 'starter-bag-amulet-01',
      name: '마라의 칼레이도스코프',
      type: 'amulet',
      rarity: 'unique',
      icon: 'amulet-talisman-01',
      description: '모든 스킬과 올 레지스턴스를 대폭 강화해 주는 장엄한 목걸이.',
      requiredLevel: 1,
      stats: [{ label: '모든 스킬', value: 2 }, { label: '모든 저항', value: 25 }],
    },
    {
      id: 'starter-bag-amulet-02',
      name: '방랑자의 목걸이',
      type: 'amulet',
      rarity: 'rare',
      icon: 'amulet-pendant-01',
      description: '능력치 상승을 보조해 주는 주술 목걸이.',
      requiredLevel: 1,
      stats: [{ label: '모든 능력치', value: 5 }],
    },
  ];
}

export function ensureAllStarterBagItems(items: Item[] | null | undefined): Item[] {
  const current = items ?? [];
  const starters = createUnrestrictedStarterBagItems();
  const starterMap = new Map(starters.map((s) => [s.id, s]));

  const upgradedCurrent = current.map((item) => {
    const starterTemplate = starterMap.get(item.id);
    if (starterTemplate) {
      return {
        ...starterTemplate,
        ...item,
        icon: starterTemplate.icon,
      };
    }
    return item;
  });

  const currentIds = new Set(upgradedCurrent.map((item) => item.id));
  const missingStarters = starters.filter((starter) => !currentIds.has(starter.id));
  return [...upgradedCurrent, ...missingStarters];
}

export function createEmptyBattleLoadout(): BattleSandboxLoadout {
  return {
    equipment: createEmptyEquipmentSlots(),
    bagItems: ensureAllStarterBagItems([]),
  };
}

export function hasIncompleteLoadout(equipment: EquipmentSlots | null | undefined): boolean {
  if (!equipment) {
    return true;
  }
  return BATTLE_LOADOUT_EQUIPMENT_SLOTS.some((slot) => !equipment[slot]);
}

export function buildLoadoutStatusVm(
  id: string,
  loadouts: Record<string, BattleSandboxLoadout>,
): LwBattleLoadoutStatusVm {
  const loadout = loadouts[id] ?? createEmptyBattleLoadout();
  const equippedCount = BATTLE_LOADOUT_EQUIPMENT_SLOTS.filter(
    (slot) => !!loadout.equipment[slot],
  ).length;

  return {
    isComplete: !hasIncompleteLoadout(loadout.equipment),
    equippedCount,
    totalSlots: BATTLE_LOADOUT_EQUIPMENT_SLOTS.length,
    summary: formatLoadoutSummary(loadout.equipment),
  };
}

export function buildLoadoutStatusMap(
  ids: string[],
  loadouts: Record<string, BattleSandboxLoadout>,
): Record<string, LwBattleLoadoutStatusVm> {
  return Object.fromEntries(ids.map((id) => [id, buildLoadoutStatusVm(id, loadouts)]));
}

export function countIncompleteLoadouts(
  participantIds: string[],
  loadouts: Record<string, BattleSandboxLoadout>,
): number {
  return participantIds.filter((id) => {
    const loadout = loadouts[id] ?? createEmptyBattleLoadout();
    return hasIncompleteLoadout(loadout.equipment);
  }).length;
}

export function buildAutoEquippedLoadout(
  characterLevel: number,
  shopItems: ShopItem[],
  existing: BattleSandboxLoadout,
  options?: { combatantId?: string; bagSlotLimit?: number },
): BattleSandboxLoadout {
  const bagSlotLimit = options?.bagSlotLimit ?? 48;
  const idSuffix = options?.combatantId ?? 'solo';
  const newEquipment = { ...existing.equipment };
  const previousItems = Object.values(existing.equipment).filter((item): item is Item => !!item);

  for (const slot of BATTLE_LOADOUT_EQUIPMENT_SLOTS) {
    if (newEquipment[slot]) {
      continue;
    }

    const candidates = shopItems.filter((shopItem) => {
      const meetsLevel = (shopItem.requiredLevel ?? 1) <= characterLevel;
      return canEquipItemToSlot(shopItem.item, slot) && meetsLevel;
    });

    if (candidates.length === 0) {
      continue;
    }

    let bestShopItem = candidates[0];
    let bestScore = -1;
    for (const candidate of candidates) {
      const score = calculateItemCombatPower(candidate.item);
      if (score > bestScore) {
        bestScore = score;
        bestShopItem = candidate;
      }
    }

    const purchasedItem: Item = {
      ...bestShopItem.item,
      id: `${bestShopItem.item.id}-loadout-${idSuffix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      origin: '전투 테스트 자동 장착',
    };
    newEquipment[slot] = purchasedItem;
  }

  const newBagItems = [
    ...previousItems,
    ...existing.bagItems,
  ].filter((bagItem) => !Object.values(newEquipment).some((eqItem) => eqItem?.id === bagItem.id));

  return {
    equipment: newEquipment,
    bagItems: newBagItems.slice(0, bagSlotLimit),
  };
}
