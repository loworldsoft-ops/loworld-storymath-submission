import { ItemIconId } from './item-icon.model';

export type ItemRarity = 'normal' | 'magic' | 'rare' | 'unique' | 'set';

export type ItemType =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'shield'
  | 'boots'
  | 'gloves'
  | 'belt'
  | 'ring'
  | 'amulet'
  | 'quest'
  | 'skill_scroll'
  | 'rune'
  | 'gem'
  | 'material';

export interface ItemStat {
  label: string;
  value: number;
}

export type ItemSocketFill = 'empty' | 'rune' | 'gem';

/** 베이스 장비 소켓 1칸 (함에서 룬/보석 삽입) */
export interface ItemSocket {
  fill: ItemSocketFill;
  registryRef?: string;
  code?: string;
}

export interface NarrativeEffect {
  tone?: string;
  unlockedPaths?: string[];
  keywords?: string[];
}

export type PowerSlotCategory = 'weapon' | 'armor' | 'jewelry';

export interface NarrativePower {
  id: string;
  name: string;
  slotCategory: PowerSlotCategory;
  summary: string;
  icon?: string;
  narrativeEffect?: NarrativeEffect;
  battleModifiers?: Record<string, number>;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  flavorText?: string;
  icon?: ItemIconId | string;
  requiredLevel: number;
  stats: ItemStat[];
  narrativeEffect?: NarrativeEffect;
  /** unique/set — 카나이의 함 추출 */
  extractablePower?: NarrativePower;
  /** 조합 규칙 적용 이력 (rule id) */
  appliedCombinationIds?: string[];
  /** 아이템 획득처 (구매, 루팅, 도감 복제 등) */
  origin?: string;
  /** skill_scroll 타입일 때 연결되는 SkillDefinition.id */
  skillRefId?: string;
  /** item-registry base/rune id (창고 스택·소켓 삽입) */
  registryRef?: string;
  baseItemId?: string;
  /** 소켓 슬롯 (길이 = 최대 소켓) */
  sockets?: ItemSocket[];
  /** 룬워드 완성 여부 및 한글 명칭 */
  isRuneword?: boolean;
  runewordNameKo?: string;
  baseItemNameKo?: string;
}