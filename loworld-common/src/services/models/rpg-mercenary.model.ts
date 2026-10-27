import type { RpgHeroGender } from '../utils/rpg-hero-illustration.util';
import type { EquipmentSlots } from './equipment.model';

/** D2R mercenary — [d2r-unified-town-commerce-system-design.md] §7 */
export type RpgMercenaryFamilyId =
  | 'rogue_scout'
  | 'desert_mercenary'
  | 'iron_wolf'
  | 'barbarian';

export type RpgMercenaryDifficultyGate = 'all' | 'nightmare_hell';

export interface RpgMercenaryVariantDefinition {
  id: string;
  familyId: RpgMercenaryFamilyId;
  labelKo: string;
  auraId: string;
  auraNameKo: string;
  auraDescriptionKo: string;
  difficultyGate: RpgMercenaryDifficultyGate;
}

export interface RpgMercenaryFamilyDefinition {
  id: RpgMercenaryFamilyId;
  labelKo: string;
  weaponTypeKo: string;
  defaultTownTier: number;
  namePool: readonly string[];
  /** `RPG_CLASS_ROSTER.key` — 캐릭터 선택 직업 SSOT */
  rpgClassKey: string;
  /** `resolveRpgHeroIllustrationUrl` 성별 */
  heroGender: RpgHeroGender;
}

export interface RpgMercenaryStateVm {
  familyId: RpgMercenaryFamilyId;
  variantId: string;
  name: string;
  hlvl: number;
  /** 현재 레벨에서의 경험치 */
  currentExp?: number;
  /** 다음 레벨에 도달하기 위한 목표 경험치 */
  nextLevelExp?: number;
  /** 0 ~ 100 백분율 진행도 */
  expProgressPercent?: number;
  auraNameKo: string;
  isDead: boolean;
  /** RPG_CLASS_ROSTER.key */
  rpgClassKey?: string;
  classLabelKo?: string;
  illustrationUrl?: string;
  /** 용병 착용 장비 */
  equipment?: EquipmentSlots;
  /** 용병 습득 스킬 목록 */
  skills?: import('./skill.model').CharacterSkill[];
  /** 현재 용병 주둔 위치 */
  currentLocation?: any;
}

export interface RpgMercenaryCandidateVm {
  id: string;
  familyId: RpgMercenaryFamilyId;
  variantId: string;
  name: string;
  familyLabel: string;
  /** D2 캐릭터 선택 직업명 (아마존, 성기사 …) */
  classLabelKo: string;
  classTitle: string;
  rpgClassKey: string;
  illustrationUrl: string;
  auraNameKo: string;
  auraDescriptionKo: string;
  weaponTypeKo: string;
  hireCost: number;
  level: number;
  enabled: boolean;
  disabledReason?: string;
}

export interface NarrativeInspectorMercenaryChannelVm {
  mode: 'hire' | 'revive';
  mercenaryUnlocked: boolean;
  playerGold: number;
  playerLevel: number;
  difficulty: 'normal' | 'nightmare' | 'hell';
  townTier: number;
  currentMercenary: RpgMercenaryStateVm | null;
  candidates: RpgMercenaryCandidateVm[];
  reviveCost?: number;
}

export type RpgMercenaryCommerceAction =
  | {
      type: 'hire';
      familyId: RpgMercenaryFamilyId;
      variantId: string;
      hireCost: number;
      name: string;
      replacePrevious?: boolean;
      previousMercenaryName?: string;
    }
  | { type: 'revive'; reviveCost: number }
  | { type: 'dismiss' };

