import { CharacterClass } from './character-base.model';
import { CharacterPersonality } from './character.model';

export type StorySidebarPanel = 'chronicle' | 'characterCodex' | 'monsters' | 'party' | 'codex' | 'personalityCodex' | 'skillCodex' | 'quest' | 'modes';

export type EquipmentCodexSubTabId =
  | 'bases'
  | 'uniques'
  | 'sets'
  | 'affixes'
  | 'runes'
  | 'runewords'
  | 'cube';

export type EquipmentCodexKind =
  | 'base_t1'
  | 'base_t2'
  | 'base_t3'
  | 'unique'
  | 'set_piece'
  | 'affix_prefix'
  | 'affix_suffix'
  | 'rune'
  | 'gem'
  | 'runeword'
  | 'cube_recipe';

export type ItemTooltipTone =
  | 'normal'
  | 'magic'
  | 'rare'
  | 'unique'
  | 'set'
  | 'gray'
  | 'req-ok'
  | 'req-fail';

export interface ItemTooltipLineVm {
  text: string;
  tone: ItemTooltipTone;
}

export interface ItemTooltipVm {
  title: string;
  titleTone: ItemTooltipTone;
  subtitle?: string;
  lines: ItemTooltipLineVm[];
}

/** 도감 장비 착용 조건 — 힘·민첩·활력·에너지 최소치 */
export type CodexStatKey = 'strength' | 'dexterity' | 'vitality' | 'energy';

export interface CodexStatRequirement {
  stat: CodexStatKey;
  min: number;
}

export interface EquipmentCodexRequirements {
  requiredLevel: number;
  /** 'all' = 모든 D2 직업 착용 가능 */
  allowedClasses: CharacterClass[] | 'all';
  minStats: CodexStatRequirement[];
}

export type EquipmentEligibility =
  | 'usable'
  | 'level_missing'
  | 'stats_missing'
  | 'class_restricted';

export interface EquipmentCodexEntry {
  id: string;
  label: string;
  runtimeId: string;
  family: string;
  previewUrl: string;
  tags?: string[];
  /** 미지정 시 family/tags 기반 자동 추론 */
  requirements?: EquipmentCodexRequirements;
  kind?: EquipmentCodexKind;
  registryRef?: string;
  iconEntryId?: string;
  codexSubTab?: EquipmentCodexSubTabId;
  tierGroupId?: string;
  tier?: 1 | 2 | 3;
  setId?: string;
  tooltip?: ItemTooltipVm;
  /** D2 베이스 최대 소켓 (Larzuk 기준) */
  maxSockets?: number;
  /** complete 룬워드 중 타입·소켓 수가 맞는 개수 */
  compatibleRunewordCount?: number;
  /** 인벤토리 지급 가능 (affix/rune/runeword 등은 false) */
  grantable?: boolean;
  dropHints?: string[];
}

export interface CodexOverlayAnchor {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface CodexSelectEvent {
  entryId: string;
  anchor: CodexOverlayAnchor;
}

export interface EquipmentCodexGroup {
  id: string;
  label: string;
  description?: string;
  entries: EquipmentCodexEntry[];
}

export interface EquipmentCodexCategory {
  id: string;
  label: string;
  targetCount: number;
  implementedCount: number;
  plannedCount: number;
  entries: EquipmentCodexEntry[];
  /** UI 섹션 (미지정 시 entries 단일 그룹으로 표시) */
  groups?: EquipmentCodexGroup[];
  planned?: string[];
}

export interface SkillCodexEntry {
  id: string;
  label: string;
  description: string;
  type: 'physical' | 'magic' | 'support';
  discipline: 'warrior' | 'sorceress' | 'archer' | 'necromancer' | 'paladin' | 'druid' | 'assassin';
  previewUrl: string;
  iconName: string;
  /** @deprecated fallback when previewUrl unavailable */
  iconHint?: string;
  /** D2R tree page (1–3) */
  rpgTreePage?: number;
  rpgReqlevel?: number;
  rpgKind?: string;
}

export interface SkillCodexCategory {
  id: string;
  label: string;
  targetCount: number;
  implementedCount: number;
  entries: SkillCodexEntry[];
}

export type CharacterRank = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'grandmaster';

export type CharacterImmunity = 'physical' | 'fire' | 'cold' | 'lightning' | 'poison' | 'magic';

export type CharacterStrongTrait =
  | 'extra_strong'
  | 'extra_fast'
  | 'stone_skin'
  | 'magic_resistant'
  | 'cursed'
  | 'aura_enchanted'
  | 'multishot'
  | 'teleportation';

export type MonsterCreatureType = 'undead' | 'demon' | 'beast' | 'elite' | 'wuxia' | 'fantasy';

export type MonsterThreatLevel = 'normal' | 'elite' | 'boss';

export interface StoryMonsterEntry {
  id: string;
  name: string;
  level: number;
  area: string;
  summary: string;
  badge?: string;
  creatureType?: MonsterCreatureType;
  /** 미지정 시 badge/level 기반 추론 */
  threatLevel?: MonsterThreatLevel;
  rosterSource?: 'story' | 'sandbox';
  rank?: CharacterRank;
  immunities?: CharacterImmunity[];
  strongTraits?: CharacterStrongTrait[];
  life?: number;
  maxLife?: number;
}

export type PartyGroup = 'human' | 'elf' | 'druid' | 'chronicle' | 'wuxia' | 'fantasy';

export type PartyRosterSource = 'story' | 'sandbox' | 'chronicle' | 'character';

export interface StoryPartyEntry {
  id: string;
  name: string;
  /** 전투 포지션 — 전위·지원·정찰 등 */
  role: string;
  /** D2-style class — 미지정 시 {@link resolveStoryPartyMemberDefaultClass} fallback */
  classId?: import('./character-base.model').CharacterClass;
  /** @deprecated classId 사용 */
  job?: string;
  level: number;
  summary: string;
  status?: 'active' | 'support' | 'missing';
  group?: PartyGroup;
  rosterSource?: PartyRosterSource;
  chronicleId?: string;
  personality?: CharacterPersonality;
  rank?: CharacterRank;
  immunities?: CharacterImmunity[];
  strongTraits?: CharacterStrongTrait[];
  avatarUrl?: string;
  gender?: import('./character-base.model').CharacterGender;
  currentExp?: number;
  nextLevelExp?: number;
  currentLocation?: any;
  chapter100Progress?: import('./character.model').Chapter100Progress;
}