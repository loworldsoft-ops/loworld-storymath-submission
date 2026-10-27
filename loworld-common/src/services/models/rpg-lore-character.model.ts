import type { CharacterClass } from './character-base.model';
import type { EquipmentSlotKey } from './equipment.model';
import type { ItemRarity } from './item.model';

export type RpgCreatureType = 'demon' | 'undead' | 'human' | 'angel' | 'ancient' | 'beast';

export interface RpgLoreCharacterEquippedItem {
  slot: EquipmentSlotKey;
  slotLabel: string;
  itemId: string;
  name: string;
  rarity: ItemRarity;
  combatPower: number;
}

export interface RpgLoreCharacterSkill {
  skillId: string;
  name: string;
  iconHint: string;
  level: number;
  realmId: string;
  realmLabel: string;
  description: string;
  disciplineLabel: string;
  typeLabel?: string;
  power?: number;
}

export interface LoreCharacterEntry {
  id: string;
  name: string;
  englishName: string;
  aliases: readonly string[];
  act: 1 | 2 | 3 | 4 | 5;
  roleBadge: string;
  customClassLabel?: string;
  class: CharacterClass;
  creatureType: RpgCreatureType;
  creatureTypeBadge: string;
  area: string;
  immunities: readonly string[];
  strongTraits: readonly string[];
  rpgMonsterId?: string;
  level: number;
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
  defense: number;
  combatPower: number;
  iconName: string;
  personality: {
    type: string;
    tags: string[];
    description: string;
  };
  equippedItems: RpgLoreCharacterEquippedItem[];
  skills: RpgLoreCharacterSkill[];
}
