import type { CharacterClass } from '../models/character-base.model';
import type { StoryPartyEntry, PartyGroup } from '../models/story-sidebar.model';
import { inferCharacterClassFromRole } from './training-roster.util';

/** 파티 멤버 id → 추천 D2 직업. JSON `classId` 미지정 시 fallback SSOT. */
export const PARTY_MEMBER_DEFAULT_CLASS_BY_ID: Readonly<Record<string, CharacterClass>> = {
  // 스토리
  wanderer: 'warrior',
  akara: 'paladin',
  guard_cain: 'rogue',
  // 레거시·별칭
  'party-1': 'warrior',
  'party-2': 'paladin',
  'party-wanderer': 'warrior',
  'party-akara': 'paladin',
  'party-guard_cain': 'rogue',
  // 인간·연대기
  innkeeper: 'paladin',
  market_guard: 'warrior',
  south_gate_warden: 'warrior',
  blacksmith_hwang: 'warrior',
  herb_dealer: 'paladin',
  wandering_monk: 'paladin',
  courier_runner: 'rogue',
  militia_captain: 'warrior',
  village_elder: 'paladin',
  shop_keeper_lin: 'paladin',
  room_stowaway: 'rogue',
  dungeon_guide: 'rogue',
  inn_bard: 'paladin',
  village_scribe: 'paladin',
  blood_alley_witness: 'rogue',
  shrine_maiden: 'paladin',
  market_storyteller: 'paladin',
  // 엘프
  silvana: 'rogue',
  elf_scout: 'rogue',
  moon_archer: 'rogue',
  leaf_dancer: 'rogue',
  root_singer: 'paladin',
  thorn_ranger: 'rogue',
  star_watcher: 'sorceress',
  wind_whisper: 'sorceress',
  amber_huntress: 'rogue',
  elder_leaf: 'paladin',
  // 드루이드
  druid_guardian: 'warrior',
  moss_priest: 'paladin',
  fern_healer: 'paladin',
  river_shaman: 'sorceress',
  stone_keeper: 'warrior',
  bloom_caller: 'sorceress',
  rot_warden: 'warrior',
  vine_binder: 'sorceress',
  spore_sage: 'necromancer',
  oak_sentinel: 'warrior',
  // 무협
  'wuxia-party-mukhyang': 'warrior',
  'wuxia-party-baekyeon': 'paladin',
  'wuxia-party-namgung': 'rogue',
  'wuxia-party-seolyeong': 'warrior',
  'wuxia-party-dangso': 'rogue',
  'wuxia-party-soun': 'paladin',
  'wuxia-party-geum': 'paladin',
  'wuxia-party-yayuel': 'rogue',
  'wuxia-party-bing': 'sorceress',
  'wuxia-party-hyewun': 'warrior',
  // 판타지
  'fantasy-party-lilith': 'paladin',
  'fantasy-party-irene': 'sorceress',
  'fantasy-party-sera': 'paladin',
  'fantasy-party-elena': 'rogue',
  'fantasy-party-fiona': 'sorceress',
  'fantasy-party-freya': 'warrior',
  'fantasy-party-selene': 'rogue',
  'fantasy-party-aria': 'paladin',
  'fantasy-party-chloe': 'paladin',
  'fantasy-party-sylvia': 'necromancer',
  // 기타 데이터셋
  cyberpunk_k: 'warrior',
};

const GROUP_DEFAULT_CLASS: Readonly<Partial<Record<PartyGroup, CharacterClass>>> = {
  'wuxia': 'warrior',
  fantasy: 'sorceress',
  elf: 'rogue',
  druid: 'sorceress',
  chronicle: 'paladin',
  human: 'warrior',
};

function inferClassFromGroup(group?: PartyGroup): CharacterClass {
  if (group && GROUP_DEFAULT_CLASS[group]) {
    return GROUP_DEFAULT_CLASS[group]!;
  }
  return 'warrior';
}

/** 파티 멤버 추천 D2 직업 — classId → id 레지스트리 → role/group 휴리스틱. */
export function resolveStoryPartyMemberDefaultClass(
  member: Pick<StoryPartyEntry, 'id' | 'role' | 'group' | 'classId'>,
): CharacterClass {
  if (member.classId) {
    return member.classId;
  }
  const registered = PARTY_MEMBER_DEFAULT_CLASS_BY_ID[member.id];
  if (registered) {
    return registered;
  }
  const fromRole = inferCharacterClassFromRole(member.role);
  if (fromRole !== 'warrior' || /전위|방어|민병|호위|검|무/.test(member.role)) {
    return fromRole;
  }
  return inferClassFromGroup(member.group);
}
