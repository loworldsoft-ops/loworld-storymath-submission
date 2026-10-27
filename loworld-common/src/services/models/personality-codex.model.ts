import type { CodexBaseTier } from './codex-base-tier.model';

export type PersonalityCategorySubTabId =
  | 'virtues_sins'
  | 'four_seven'
  | 'human_desires'
  | 'moral_alignment';

export type PersonalitySlotId = 'primary' | 'secondary' | 'innerDesire';

export interface PersonalityCodexEntry {
  id: string;
  name: string;
  title: string;
  category: PersonalityCategorySubTabId;
  subcategory: string;
  tier: 1 | 2 | 3;
  baseTier?: CodexBaseTier;
  requiredLevel?: number;
  icon: string;
  imageUrl?: string;
  motto: string;
  description: string;
  statBonus: Record<string, number>;
  dialogueUnlock: string;
  npcReaction: string;
  combatTrigger: string;
  suggestedSlots: PersonalitySlotId[];
}

export interface PersonalityCodexCategory {
  id: PersonalityCategorySubTabId;
  label: string;
  description: string;
  imageUrl?: string;
  entries: PersonalityCodexEntry[];
}

export interface EquippedPersonalityState {
  primary: string | null;
  secondary: string | null;
  innerDesire: string | null;
}

export interface PersonalityResonanceBonus {
  id: string;
  title: string;
  requiredEntryIds: string[];
  effectDescription: string;
  dialogueBonus: string;
  statBonus: Record<string, number>;
}
