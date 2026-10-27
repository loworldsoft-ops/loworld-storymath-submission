import type { CharacterStats } from './character.model';
import type { EquipmentSlotKey } from './equipment.model';
import type { Quest, QuestStatus } from './quest.model';

export type BondType = 'trust' | 'romance' | 'rivalry' | 'mentor';

export type BondTier =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close'
  | 'romantic'
  | 'soulbound';

export interface BondStat {
  npcId: string;
  affection: number;
  bondType: BondType;
  tier: BondTier;
}

export interface ReputationStat {
  factionId: string;
  value: number;
}

export interface NarrativeResistances {
  fire: number;
  cold: number;
  lightning: number;
  poison: number;
  physical: number;
}

export interface NarrativeBreakpoints {
  castSpeed: number;
  attackSpeed: number;
  hitRecovery: number;
}

export interface NarrativeDerivedStats {
  combatPower: number;
  carryWeight: number;
  luck: number;
  renown: number;
  magicFind: number;
  goldFind: number;
}

export interface NarrativeWorldState {
  vitals: CharacterStats;
  derived: NarrativeDerivedStats;
  resistances: NarrativeResistances;
  breakpoints: NarrativeBreakpoints;
  bonds: Record<string, BondStat>;
  reputations: Record<string, ReputationStat>;
  narrativeFlags: Record<string, boolean | number>;
  resources: {
    gold: number;
    ruby: number;
  };
}

export type StoryItemCondition =
  | { type: 'item_equipped'; itemId?: string; slot?: EquipmentSlotKey }
  | { type: 'item_owned'; itemId: string }
  | { type: 'stat_threshold'; stat: keyof CharacterStats; min: number };

export type NarrativeCondition =
  | StoryItemCondition
  | { type: 'bond_threshold'; npcId: string; minAffection: number; bondType?: BondType }
  | { type: 'reputation_threshold'; factionId: string; min: number }
  | { type: 'renown_threshold'; min: number }
  | { type: 'flag_set'; flagId: string; value?: boolean | number }
  | { type: 'quest_status'; questId: string; status: QuestStatus }
  | { type: 'combat_power'; min: number }
  | { type: 'magic_find'; min: number }
  | { type: 'resist_threshold'; element: keyof NarrativeResistances; min: number }
  | { type: 'set_equipped'; setId: string; minPieces: number }
  | { type: 'composite'; operator: 'and' | 'or'; conditions: NarrativeCondition[] };

export interface StateDeltaItemChange {
  action: 'add' | 'remove';
  itemId: string;
}

export interface StateDelta {
  stats?: Partial<CharacterStats>;
  gold?: number;
  ruby?: number;
  bondChanges?: { npcId: string; affection: number }[];
  reputationChanges?: { factionId: string; delta: number }[];
  flags?: { flagId: string; value: boolean | number }[];
  items?: StateDeltaItemChange[];
  renown?: number;
  magicFind?: number;
  resistances?: Partial<NarrativeResistances>;
}

export interface NarrativeEvaluationContext {
  worldState: NarrativeWorldState;
  /** 장비·인벤토리 조건 판정 */
  isItemEquipped: (itemId: string, slot?: EquipmentSlotKey) => boolean;
  hasAnyEquipped: (slot: EquipmentSlotKey) => boolean;
  hasItemOwned: (itemId: string) => boolean;
  /** 세트 피스 착용 수 (Phase 5 확장 — 기본 0) */
  equippedSetPieceCount?: (setId: string) => number;
  quests?: Quest[];
}

export const DEFAULT_NARRATIVE_RESISTANCES: NarrativeResistances = {
  fire: 0,
  cold: 0,
  lightning: 0,
  poison: 0,
  physical: 0,
};

export const DEFAULT_NARRATIVE_BREAKPOINTS: NarrativeBreakpoints = {
  castSpeed: 0,
  attackSpeed: 0,
  hitRecovery: 0,
};

export function createDefaultNarrativeWorldState(
  vitals: CharacterStats,
  overrides?: Partial<Pick<NarrativeWorldState, 'resources' | 'bonds' | 'reputations' | 'narrativeFlags'>>,
): NarrativeWorldState {
  return {
    vitals: { ...vitals },
    derived: {
      combatPower: 0,
      carryWeight: 0,
      luck: 0,
      renown: 0,
      magicFind: 0,
      goldFind: 0,
    },
    resistances: { ...DEFAULT_NARRATIVE_RESISTANCES },
    breakpoints: { ...DEFAULT_NARRATIVE_BREAKPOINTS },
    bonds: overrides?.bonds ?? {},
    reputations: overrides?.reputations ?? {},
    narrativeFlags: overrides?.narrativeFlags ?? {},
    resources: overrides?.resources ?? { gold: 0, ruby: 0 },
  };
}

/** renown 정수 → 표시용 Lv. (100 renown per level) */
export function renownToLevel(renown: number): number {
  return Math.max(1, Math.floor(renown / 100) + 1);
}

/** D2 MF diminishing returns */
export function effectiveMagicFind(rawMf: number): number {
  if (rawMf <= 0) {
    return 0;
  }
  return (rawMf * 100) / (rawMf + 100);
}
