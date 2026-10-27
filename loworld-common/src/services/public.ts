export { LwClipboard } from './services/lw-clipboard.service';
export { LW_FRAME_APP_DEFAULTS, LW_FRAME_DEFAULT_SETTINGS, LW_FRAME_SETTING_ITEMS, LwFrameSettingsStore, type LwFrameSettings } from './settings/lw-frame-settings';
export { LW_APPEARANCE_APP_DEFAULTS, type LwAppearanceDefaults } from './theme/lw-appearance.model';
export { LwFrameDirective } from './settings/lw-frame.directive';
export { NOTE_REPOSITORY, type NoteRepositoryPort } from './ports/document-repository.token';
export { CALENDAR_REPOSITORY, type CalendarRepositoryPort } from './ports/schedule-repository.token';
export { CalendarDbService } from './data/showcase-schedule.service';
export { ShowcaseDbService } from './data/showcase-directory.service';

export type { BookshelfBookItem } from './models/story-reader.model';
export { READER_BOOKSHELF_CATALOG } from './data/reader-bookshelf-catalog.data';
export { READER_CATALOG_PORT, type ReaderCatalogPort } from './ports/reader-catalog.port';
export { READER_SLOT_PORT, type ReaderSlotPort } from './ports/reader-slot.port';
export type { ReaderSavedStage, ReaderSavedEntry, ReaderSavedState } from './models/reader-slot.model';

export {
  STORY_CONTENT_PORT,
  LW_CONTENT_BASE_URL,
  type StoryContentPort,
  type StoryContentHandle,
  type StoryContentManifest,
  type StoryContentRef,
} from './ports/story-content.port';
export { HttpStoryContentRepository } from './adapters/http-story-content.repository';
export {
  toContentStoryItemAssetPath,
  resolveStoryItemIconMediaUrl,
  resolveSocketableIconUrl,
} from './models/story-item-icon.utils';
export {
  toContentStoryMonsterAssetPath,
  resolveStoryMonsterIconMediaUrl,
} from './models/story-monster-icon.utils';
export {
  toContentStorySkillAssetPath,
  resolveStorySkillIconMediaUrl,
} from './models/story-skill-icon.utils';
export {
  toContentStoryPartyAssetPath,
  resolveStoryPartyIconMediaUrl,
} from './models/story-party-icon.utils';

export {
  type ReaderEquipmentSlot,
  READER_EQUIPMENT_SLOTS,
  type ReaderEquipKind,
  EQUIP_KIND_SLOTS,
  type StoryShop,
  type CompanionEvent,
} from './narrative/narrative.model';
export {
  activeTraits,
} from './narrative/narrative-state';
export {
  equipItem,
  unequipItem,
  autoEquip,
  equippedSlotOf,
  isActiveTrait,
  statTotal,
} from './narrative/narrative-loadout';
export {
  type ShopResult,
  currentZoneId,
  shopInZone,
  silverOf,
  sellPrice,
  canSell,
  buyItem,
  sellItem,
  silverReward,
} from './narrative/narrative-shop';
export {
  preludeSilverLine,
  preludeCompanionLines,
} from './narrative/narrative-flow';
export {
  settleCompanions,
} from './narrative/narrative-companion';
export {
  type CodexGroupId,
  type CodexState,
  type CodexEntry,
  type CodexGroup,
  type CodexBook,
} from './narrative/narrative.model';
export {
  buildCodex,
} from './narrative/narrative-codex';
export {
  type CodexCardVm,
  type CodexCardPropLine,
  type CodexCardRequirementChip,
  type CodexCardRarity,
} from './models/codex-card.model';

// ── W9: 말투 표, 대화 장면, 공명, 구슬, 전리품, 사건 줄기 ──
export {
  type StoryVoiceRule,
  type StoryMoodRule,
  type StoryTalk,
  type StoryVerse,
  type StoryLootEntry,
  type StoryLootTable,
  type StoryRealm,
  type StoryArc,
  type StoryCard,
} from './narrative/narrative.model';
export { type SpeechInput, alignmentBand } from './narrative/narrative-voice';
export {
  type ResonanceLevel,
  resonanceOf,
  resonanceDistance,
  personDisposition,
  scaleByResonance,
  tieKey,
  tieOf,
} from './narrative/narrative-resonance';
export {
  type BeadFailure,
  type BeadResult,
  type VerseProgress,
  isBead,
  beadCount,
  grantBead,
  absorbBead,
  fuseBeads,
  socketsOf,
  verseOfItem,
  completedVerses,
  verseProgress,
  realmOf,
  realmIndex,
  nextRealm,
  beadStats,
} from './narrative/narrative-beads';
export { socketBead, contestOverride } from './narrative/narrative-state';
export { rollLoot, grantLoot } from './narrative/narrative-loot';
export { type ArcProgress, arcProgress } from './narrative/narrative-flow';
export {
  type BeatUnit,
  type LineGroup,
  type LineVariant,
  beatUnits,
  pickTalk,
  applyTalkEffects,
} from './narrative/narrative-bind';
export { BrowserSpeechAdapter, LW_SPEECH_PORT, type LwSpeakOptions, type LwSpeechPort } from './ports/speech.port';
export { NativeSpeechAdapter } from './ports/native-speech.adapter';
export { nativeHasAction } from './ports/native-bridge';
export {
  LW_SPEECH_AUTO,
  LW_SPEECH_ENGINE_PORT,
  type LwSpeechEngineChoice,
  type LwSpeechEngineOption,
  type LwSpeechEnginePort,
  type LwSpeechKind,
  NativeSpeechEngineAdapter,
  NoSpeechEngineChoice,
} from './ports/speech-engine.port';

