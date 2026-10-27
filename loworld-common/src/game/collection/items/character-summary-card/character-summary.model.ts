import { Character, CharacterPersonality, type Chapter100Progress } from '../../../../services/models/character.model';
import { CharacterClass } from '../../../../services/models/character-base.model';
import { EquippedPersonalityState, PersonalityResonanceBonus } from '../../../../services/models/personality-codex.model';
import { RpgMercenaryStateVm } from '../../../../services/models/rpg-mercenary.model';
import { resolveRpgMercenaryClassPresentation } from '../../../../services/utils/rpg-mercenary.util';
import { EQUIPMENT_SLOT_ORDER, EquipmentSlotKey, EquipmentSlots, getEquipmentSlotLabel } from '../../../../services/models/equipment.model';
import { Item, ItemRarity } from '../../../../services/models/item.model';
import { calculateCombatantCombatPower, calculateItemCombatPower } from '../../../../services/utils/combat-power.util';
import { calculateRequiredExpForLevel, calculateExpProgressPercent } from '../../../../services/engines/character-progression.engine';
import { getSkillDefinition, SKILL_DISCIPLINE_LABELS } from '../../../../services/data/skill-catalog.data';
import { getSkillRealm } from '../../../../services/engines/skill-training.engine';
import { buildSkillCombatDisplayVm, SkillCombatDisplayVm } from '../../../../services/utils/skill-combat.util';
import { resolveRpgSkillEntry } from '../../../../services/engines/rpg-skill-allocation.engine';
import { RPG_SKILL_BY_ID } from '../../../../services/data/rpg-skill-loader.util';
import { RPG_CHARACTER_CLASS_LABELS } from '../../../../services/utils/character-class-labels.util';
import { SkillType } from '../../../../services/models/rpg-skill.model';
import { toStoryPartyAssetId, toStoryPartyIconName } from '../../../../services/models/story-party-icon.utils';
import { StoryPartyEntry } from '../../../../services/models/story-sidebar.model';
import { allyGroupLabel, resolvePartyGroup } from '../../../../services/utils/battle-roster-cluster.util';
import { resolveStoryBattlePortraitIconName } from '../../../../services/models/story-monster-icon.utils';
import { resolveStoryPartyMemberDefaultClass } from '../../../../services/utils/story-party-class.util';
import { resolveProtagonistBuild } from '../../../../services/utils/protagonist-build.util';
import { resolveProtagonistClassId } from '../../../../services/utils/protagonist-class.util';
import { createEmptyEquipmentSlots } from '../../../../services/utils/battle-equipment.util';
import { findRpgLoreCharacter } from '../../../../services/data/rpg-lore-character-loader.util';
import { resolveRpgHeroIllustrationUrl } from '../../../../services/utils/rpg-hero-illustration.util';
import { type LoreCharacterEntry } from '../../../../services/models/rpg-lore-character.model';
import type { MonsterSummaryVm } from '../monster-summary-card/monster-summary.model';

const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  physical: '물리',
  magic: '마법',
  support: '보조',
};

/** 캐릭터 카드 "장비" 섹션에 노출할 착용 중인 아이템 1개 — 상세 모달에서 쓸 전체 `Item`과 이 아이템의 전투력 기여도를 함께 담는다. */
export interface CharacterSummaryEquippedItemVm {
  slot: EquipmentSlotKey;
  slotLabel: string;
  itemId: string;
  name: string;
  rarity: ItemRarity;
  /** 상세 모달(속성/설명) 렌더링용 원본 아이템. */
  item: Item;
  /** 이 아이템 1개가 종합 전투력에 기여하는 값 — `calculateItemCombatPower(item)`. */
  combatPower: number;
}

/** 캐릭터 카드 "스킬" 섹션에 노출할 보유 스킬 1개 — 카탈로그(`SkillDefinition`) 이름·아이콘·설명·전투 적용 정보를 미리 조회해 담는다. */
export interface CharacterSummarySkillVm {
  skillId: string;
  name: string;
  iconHint: string;
  level: number;
  realmId: string;
  realmLabel: string;
  description: string;
  disciplineLabel: string;
  typeLabel: string;
  /** 전투 적용 프로필(대상·위력·효과)이 있는 스킬만 채워진다. */
  combat?: SkillCombatDisplayVm;
}

/** 캐릭터 카드 "전투력" 배지 클릭 시 보여줄 상세 분해 — 레벨 기여분 + 아이템별 기여분의 합. */
export interface CharacterSummaryCombatPowerItemContributionVm {
  slotLabel: string;
  name: string;
  rarity: ItemRarity;
  power: number;
}

export interface CharacterSummaryCombatPowerBreakdownVm {
  total: number;
  level: number;
  /** 레벨 기여분 = `level * 100`. */
  levelValue: number;
  items: CharacterSummaryCombatPowerItemContributionVm[];
}

/** 캐릭터 카드 "전투 경험" 섹션 — 전투 결과 기록(`battleResultHistory`)을 집계한 값. 집계 가능한 이력이 없으면 카드에 이 섹션 자체가 렌더링되지 않는다. */
export interface CharacterSummaryCombatExperienceVm {
  battlesFought: number;
  victories: number;
  defeats: number;
  /** 0~100 정수 승률 */
  winRate: number;
  totalExpGained: number;
}

/** ISP: 캐릭터 기본 신원 및 비주얼 인터페이스 */
export interface CharacterSummaryIdentity {
  id: string;
  name: string;
  class: CharacterClass;
  /** 직업 대신 노출할 커스텀 역할/칭호 라벨 (예: 고뇌의 여제, 대사제, 호라드림 현자, 정의의 대천사 등) */
  customClassLabel?: string;
  /** 스토리 주인공 등 역할 뱃지 — 예: `주인공` */
  roleBadge?: string;
  /** lw-icon `name` — novel-party 초상 (예: `novel-party:party-wanderer`) */
  iconName: string;
  /** 고화질 일러스트 / 커스텀 초상화 URL */
  avatarUrl?: string;
}

/** ISP: 캐릭터 성장 레벨 및 경험치 인터페이스 */
export interface CharacterSummaryProgression {
  level: number;
  /** 현재 레벨에서의 누적 경험치 */
  currentExp: number;
  /** 다음 레벨에 도달하기 위한 목표 경험치 */
  nextLevelExp: number;
  /** 0 ~ 100 백분율 진행도 */
  expProgressPercent: number;
  /** 챕터 100 대서사시 모드 진행 상황 */
  chapter100Progress?: Chapter100Progress;
}

/** ISP: 캐릭터 전투 능력치 및 전투력 수치 인터페이스 */
export interface CharacterSummaryCombatStats {
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
  defense: number;
  /** 레벨 + 장착 장비 기준 종합 전투력 — `calculateCombatantCombatPower`와 동일 공식(배틀 패널과 수치 일치). */
  combatPower: number;
  /** `combatPower`를 레벨 기여분 + 아이템별 기여분으로 분해한 값 — 전투력 배지 클릭 시 상세 모달에서 사용. */
  combatPowerBreakdown: CharacterSummaryCombatPowerBreakdownVm;
}

/** ISP: 캐릭터 장비, 스킬 및 성격 장착 인터페이스 */
export interface CharacterSummaryLoadout {
  /** 착용 중인 장비만 노출(빈 슬롯 제외) — `character.equipment`로부터 계산. */
  equippedItems: CharacterSummaryEquippedItemVm[];
  /** 습득한 스킬 목록 — `character.skills`로부터 계산. */
  skills: CharacterSummarySkillVm[];
  personality?: CharacterPersonality;
  /** 장착된 성격 도감 3슬롯 상태 (primary, secondary, innerDesire) */
  equippedPersonalityState?: EquippedPersonalityState | null;
  /** 활성화된 성격 공명 보너스 */
  activePersonalityResonance?: PersonalityResonanceBonus | null;
}

/** ISP: D2R 원작 몬스터/종족 특성 및 상태 인터페이스 */
export interface CharacterSummaryRpgLoreAndStatus {
  dungeonKills?: {
    mobs: number;
    bosses: number;
    clears: number;
  };
  combatExperience?: CharacterSummaryCombatExperienceVm;
  /** D2R 종족 분류 (demon, undead, human, angel, ancient, beast) */
  creatureType?: 'demon' | 'undead' | 'human' | 'angel' | 'ancient' | 'beast' | string;
  /** 종족 뱃지 (예: 😈 4대 고위 악마, 👼 정의의 대천사, 💀 언데드 등) */
  creatureTypeBadge?: string;
  /** D2R 공식 서식지 / 출현 구역 (예: 수도원 지하 묘지 4층) */
  area?: string;
  /** D2R 원작 속성 면역 (예: ['poison', 'cold']) */
  immunities?: readonly string[];
  /** D2R 시그니처 특성 / 기술 태그 (예: ['poison_nova', 'holy_freeze']) */
  strongTraits?: readonly string[];
  /** D2R 원작 몬스터 고유 ID */
  rpgMonsterId?: string;
  /** 병원 입원 및 치료 필요 상태 */
  hospitalStatus?: 'admitted' | 'recovering' | 'healthy' | 'dead';
  /** 병원 입원 여부 (체력 0 또는 입원 중일 때 true) */
  isHospitalized?: boolean;
  /** 현재 체류 구역/위치 정보 (예: 📍 바위 들판, 📍 자매단 야영지) */
  currentLocation?: {
    zoneId?: string;
    title: string;
    subtitle?: string;
    actName?: string;
    isWaypoint?: boolean;
  } | string;
}

/** 캐릭터 요약 카드(lw-character-summary-card) 전용 통합 뷰 모델 (ISP 합성) */
export type CharacterSummaryVm = CharacterSummaryIdentity &
  CharacterSummaryProgression &
  CharacterSummaryCombatStats &
  CharacterSummaryLoadout &
  CharacterSummaryRpgLoreAndStatus;

export type CharacterSummaryPatch = Partial<Omit<CharacterSummaryVm, 'id'>>;

export interface CharacterSummaryFieldChangedPayload {
  characterId: string;
  patch: CharacterSummaryPatch;
}

export interface CharacterSummaryIdPayload {
  characterId: string;
}

export interface CharacterSummaryAddPayload {
  summary: CharacterSummaryVm;
}

export interface CharacterSummaryEquipSlotPayload {
  characterId: string;
  slot: EquipmentSlotKey;
  item?: Item | null;
}

export interface CharacterSummaryUnequipSlotPayload {
  characterId: string;
  slot: EquipmentSlotKey;
}

export interface CharacterSummaryEquipmentManagePayload {
  characterId: string;
  summary: CharacterSummaryVm;
}

export const CHARACTER_CLASS_LABELS: Record<CharacterClass, string> = RPG_CHARACTER_CLASS_LABELS;

export const CHARACTER_CLASS_OPTIONS: { value: CharacterClass; label: string }[] = (
  Object.entries(CHARACTER_CLASS_LABELS) as [CharacterClass, string][]
).map(([value, label]) => ({ value, label }));

export function getCharacterSummaryClassLabel(
  summary: Partial<Pick<CharacterSummaryVm, 'class' | 'customClassLabel' | 'roleBadge' | 'creatureType'>>,
): string {
  if (summary.customClassLabel?.trim()) {
    return summary.customClassLabel.trim();
  }
  if (summary.creatureType && summary.creatureType !== 'human') {
    if (summary.roleBadge?.trim()) {
      return summary.roleBadge.split('·')[0].trim();
    }
    const creatureLabels: Record<string, string> = {
      demon: '악마',
      undead: '언데드',
      angel: '대천사',
      ancient: '고대 수호자',
      beast: '야수',
    };
    return creatureLabels[summary.creatureType] ?? '미확인 개체';
  }
  if (summary.roleBadge?.trim()) {
    return summary.roleBadge.split('·')[0].trim();
  }
  if (summary.class && CHARACTER_CLASS_LABELS[summary.class]) {
    return CHARACTER_CLASS_LABELS[summary.class];
  }
  return '모험가';
}

/** Character.avatarIconId 또는 class+gender/id → lw-icon novel-party 이름. 좌측 사이드바 파티 카드와 동일 SSOT. */
export function resolveCharacterSummaryIconName(
  character: Pick<Character, 'id' | 'avatarIconId'> & Partial<Pick<Character, 'class' | 'gender'>>,
): string {
  const customAvatar = character.avatarIconId?.trim();
  if (customAvatar) {
    return toStoryPartyIconName(customAvatar);
  }
  if (character.class) {
    const classId = resolveProtagonistClassId(character.class, 'warrior');
    const gender = character.gender === 'female' ? 'female' : 'male';
    const build = resolveProtagonistBuild(classId, gender);
    if (build?.portraitAssetId) {
      return toStoryPartyIconName(build.portraitAssetId);
    }
  }
  const assetId = toStoryPartyAssetId(character.id);
  return toStoryPartyIconName(assetId);
}

/** `character.equipment`에서 착용 중인 슬롯만 골라 카드 표시용 목록으로 변환. */
export function buildEquippedItemSummaries(equipment: EquipmentSlots): CharacterSummaryEquippedItemVm[] {
  return EQUIPMENT_SLOT_ORDER.flatMap((slot) => {
    const item = equipment[slot];
    if (!item) return [];
    return [{
      slot,
      slotLabel: getEquipmentSlotLabel(slot),
      itemId: item.id,
      name: item.name,
      rarity: item.rarity,
      item,
      combatPower: calculateItemCombatPower(item),
    }];
  });
}

/** `character.skills`(보유 스킬 인스턴스)를 스킬 카탈로그와 조인해 카드 표시용 목록으로 변환. */
export function buildCharacterSkillSummaries(skills: Character['skills']): CharacterSummarySkillVm[] {
  if (!skills?.length) return [];
  return skills.flatMap((owned): CharacterSummarySkillVm[] => {
    if (owned.level <= 0) return [];

    const rpgEntry = resolveRpgSkillEntry(owned.skillId) ?? RPG_SKILL_BY_ID[owned.skillId];
    if (rpgEntry) {
      return [{
        skillId: owned.skillId,
        name: rpgEntry.nameKo || rpgEntry.rpgName,
        iconHint: rpgEntry.kind ?? '📜',
        level: owned.level,
        realmId: owned.realmId ?? 'beginner',
        realmLabel: `Lv ${owned.level}`,
        description: rpgEntry.descriptionKo || rpgEntry.rpgName,
        disciplineLabel: rpgEntry.discipline,
        typeLabel: rpgEntry.kind,
      }];
    }

    const definition = getSkillDefinition(owned.skillId);
    if (!definition) return [];
    const realm = getSkillRealm(owned.realmId);
    return [{
      skillId: owned.skillId,
      name: definition.name,
      iconHint: definition.iconHint ?? '📜',
      level: owned.level,
      realmId: realm.id,
      realmLabel: realm.label,
      description: definition.description,
      disciplineLabel: SKILL_DISCIPLINE_LABELS[definition.discipline] ?? definition.discipline,
      typeLabel: SKILL_TYPE_LABELS[definition.type] ?? definition.type,
      combat: definition.combat
        ? buildSkillCombatDisplayVm(definition.combat, { realmOrder: realm.order, levelInRealm: owned.level })
        : undefined,
    }];
  });
}

/** 전투력 배지 상세 모달용 — 레벨 기여분 + 장착 아이템별 기여분으로 분해. */
export function buildCombatPowerBreakdown(
  level: number,
  equippedItems: CharacterSummaryEquippedItemVm[],
): CharacterSummaryCombatPowerBreakdownVm {
  const levelValue = level * 100;
  const items = equippedItems.map((equipped) => ({
    slotLabel: equipped.slotLabel,
    name: equipped.name,
    rarity: equipped.rarity,
    power: equipped.combatPower,
  }));
  return {
    total: levelValue + items.reduce((sum, entry) => sum + entry.power, 0),
    level,
    levelValue,
    items,
  };
}

export function withCharacterSummaryRoleBadge(
  summary: CharacterSummaryVm,
  roleBadge: string | null | undefined,
): CharacterSummaryVm {
  if (!roleBadge) {
    return summary;
  }
  return { ...summary, roleBadge };
}

export function annotateProtagonistCharacterSummaries(
  summaries: CharacterSummaryVm[],
  protagonistId: string | null | undefined,
  roleBadge = '주인공',
): CharacterSummaryVm[] {
  if (!protagonistId) {
    return summaries;
  }
  return summaries.map((summary) =>
    summary.id === protagonistId ? withCharacterSummaryRoleBadge(summary, roleBadge) : summary,
  );
}

/** 도메인 Character → 카드 렌더링용 CharacterSummaryVm 변환. */
export function buildCharacterSummaryVm(character: Character): CharacterSummaryVm {
  const stats = character.stats ?? {
    life: 100,
    maxLife: 100,
    mana: 50,
    maxMana: 50,
    strength: 10,
    dexterity: 10,
    vitality: 10,
    energy: 10,
    defense: 0,
  };
  const equippedItems = buildEquippedItemSummaries(character.equipment);
  const currentExp = character.currentExp ?? 0;
  const nextLevelExp = character.nextLevelExp || calculateRequiredExpForLevel(character.level || 1);
  const expProgressPercent = calculateExpProgressPercent(currentExp, nextLevelExp);
  const isDead = stats.life <= 0;
  const isHospitalized = isDead || stats.life < stats.maxLife * 0.3;
  const hospitalStatus = isDead ? 'dead' : isHospitalized ? 'admitted' : 'healthy';

  return {
    id: character.id,
    name: character.name,
    class: character.class,
    level: character.level,
    currentExp,
    nextLevelExp,
    expProgressPercent,
    life: stats.life,
    maxLife: stats.maxLife,
    mana: stats.mana,
    maxMana: stats.maxMana,
    strength: stats.strength,
    dexterity: stats.dexterity,
    vitality: stats.vitality,
    energy: stats.energy,
    defense: stats.defense,
    combatPower: calculateCombatantCombatPower(character.level, character.equipment),
    combatPowerBreakdown: buildCombatPowerBreakdown(character.level, equippedItems),
    equippedItems,
    skills: buildCharacterSkillSummaries(character.skills),
    personality: character.personality,
    equippedPersonalityState: character.equippedPersonalityState || null,
    activePersonalityResonance: character.activePersonalityResonance || null,
    dungeonKills: character.dungeonKills,
    customClassLabel: character.customClassLabel,
    roleBadge: character.roleBadge,
    creatureType: character.creatureType,
    creatureTypeBadge: character.creatureTypeBadge,
    hospitalStatus,
    isHospitalized: isDead,
    iconName: resolveCharacterSummaryIconName(character),
    avatarUrl: character.avatarUrl || resolveRpgHeroIllustrationUrl(character.class, character.gender || 'male'),
    currentLocation: character.currentLocation,
    chapter100Progress: character.chapter100Progress,
  };
}

export function summariesFromCharacters(characters: Character[]): CharacterSummaryVm[] {
  return characters.map(buildCharacterSummaryVm);
}

export function buildCharacterSummaryVmFromPartyEntry(member: StoryPartyEntry): CharacterSummaryVm {
  const defaultClass = resolveStoryPartyMemberDefaultClass(member);
  const level = Math.max(1, member.level || 1);
  const currentExp = member.currentExp ?? 0;
  const nextLevelExp = member.nextLevelExp || calculateRequiredExpForLevel(level);
  const expProgressPercent = calculateExpProgressPercent(currentExp, nextLevelExp);
  return {
    id: member.id,
    name: member.name,
    class: defaultClass,
    level,
    currentExp,
    nextLevelExp,
    expProgressPercent,
    life: 100 + level * 10,
    maxLife: 100 + level * 10,
    mana: 50 + level * 5,
    maxMana: 50 + level * 5,
    strength: 10 + level * 2,
    dexterity: 10 + level * 2,
    vitality: 10 + level * 2,
    energy: 10 + level * 2,
    defense: 10 + level * 2,
    combatPower: calculateCombatantCombatPower(level, null),
    combatPowerBreakdown: buildCombatPowerBreakdown(level, []),
    equippedItems: [],
    skills: [],
    personality: {
      type: '동료',
      tags: [member.role, allyGroupLabel(resolvePartyGroup(member))],
      description: member.summary,
    },
    roleBadge: member.role,
    iconName: toStoryPartyIconName(member.id),
    avatarUrl: member.avatarUrl || resolveRpgHeroIllustrationUrl(defaultClass, member.gender || 'male'),
    currentLocation: member.currentLocation,
    chapter100Progress: member.chapter100Progress,
  };
}

export function buildEnrichedCharacterSummaryVmFromPartyEntry(params: {
  member: StoryPartyEntry;
  characterSummaries?: readonly CharacterSummaryVm[] | null;
  heroCharacter?: Character | null;
  currentMercenary?: RpgMercenaryStateVm | null;
}): CharacterSummaryVm {
  const { member, characterSummaries, heroCharacter, currentMercenary } = params;

  const fromCatalog = characterSummaries?.find(
    (s) => s.id === member.id || s.name === member.name
  );
  if (fromCatalog) {
    return {
      ...fromCatalog,
      roleBadge: member.role || fromCatalog.roleBadge,
    };
  }

  if (heroCharacter && (member.id === heroCharacter.id || member.id === 'hero' || member.role === '주인공')) {
    const heroSummary = buildCharacterSummaryVm(heroCharacter);
    return {
      ...heroSummary,
      id: member.id,
      roleBadge: member.role || heroSummary.roleBadge,
    };
  }

  if (currentMercenary && (member.id === 'mercenary' || member.role === '용병' || member.name === currentMercenary.name)) {
    const mercSummary = buildCharacterSummaryVmFromMercenary(currentMercenary);
    return {
      ...mercSummary,
      id: member.id,
      roleBadge: member.role || mercSummary.roleBadge,
    };
  }

  return buildCharacterSummaryVmFromPartyEntry(member);
}


export function createDefaultCharacterSummary(id?: string): CharacterSummaryVm {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : String(Date.now());
  const nextLevelExp = calculateRequiredExpForLevel(1);

  return {
    id: id ?? `char-${suffix}`,
    name: '새 캐릭터',
    class: 'warrior',
    level: 1,
    currentExp: 0,
    nextLevelExp,
    expProgressPercent: 0,
    life: 50,
    maxLife: 50,
    mana: 10,
    maxMana: 10,
    strength: 10,
    dexterity: 10,
    vitality: 10,
    energy: 10,
    defense: 10,
    combatPower: calculateCombatantCombatPower(1, null),
    combatPowerBreakdown: buildCombatPowerBreakdown(1, []),
    equippedItems: [],
    skills: [],
    dungeonKills: { mobs: 0, bosses: 0, clears: 0 },
    iconName: resolveCharacterSummaryIconName({ id: id ?? `char-${suffix}` }),
  };
}

export function patchCharacterSummary(
  summary: CharacterSummaryVm,
  patch: CharacterSummaryPatch,
): CharacterSummaryVm {
  return { ...summary, ...patch };
}

const EMPTY_EQUIPMENT = {
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

export function equippedItemSummariesToEquipmentSlots(
  equippedItems?: readonly CharacterSummaryEquippedItemVm[] | null,
  baseEquipment?: EquipmentSlots | null,
): EquipmentSlots {
  const slots: EquipmentSlots = {
    weapon: null,
    helmet: null,
    bodyArmor: null,
    shield: null,
    gloves: null,
    boots: null,
    belt: null,
    ringLeft: null,
    ringRight: null,
    amulet: null,
    ...baseEquipment,
  };
  if (Array.isArray(equippedItems)) {
    for (const eq of equippedItems) {
      if (eq?.slot && eq.slot in slots) {
        (slots as Record<string, Item | null>)[eq.slot] = eq.item ?? null;
      }
    }
  }
  return slots;
}

/** VM → Character (장비/인벤토리는 기존 객체 또는 equippedItems에서 복원). */
export function characterSummaryToCharacter(
  summary: CharacterSummaryVm,
  existingCharacter?: Character | null,
): Character {
  const equipment = equippedItemSummariesToEquipmentSlots(
    summary.equippedItems,
    existingCharacter?.equipment,
  );
  return {
    id: summary.id,
    name: summary.name,
    class: summary.class,
    level: summary.level,
    equipment,
    inventory: existingCharacter?.inventory ?? { items: [], gold: 0, maxSlots: 20 },
    stats: {
      life: summary.life,
      maxLife: summary.maxLife,
      mana: summary.mana,
      maxMana: summary.maxMana,
      strength: summary.strength,
      dexterity: summary.dexterity,
      vitality: summary.vitality,
      energy: summary.energy,
      defense: summary.defense,
    },
    personality: summary.personality,
    dungeonKills: summary.dungeonKills,
  };
}

/** 전투 아레나 아바타 클릭 시 런타임 vitals 전달용 (아군). */
export interface CharacterAvatarBattleAllySnapshot {
  id: string;
  name: string;
  level: number;
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  role?: string;
}

/** 전투 아레나 아바타 클릭 시 런타임 vitals 전달용 (적). */
export interface CharacterAvatarBattleEnemySnapshot {
  id: string;
  name: string;
  level: number;
  life: number;
  maxLife: number;
  mana?: number;
  maxMana?: number;
}

export interface CharacterAvatarSelectionPayload {
  characterId?: string;
  characterName?: string;
  name?: string;
  summary?: CharacterSummaryVm;
  member?: StoryPartyEntry;
  battleAlly?: CharacterAvatarBattleAllySnapshot;
  battleEnemy?: CharacterAvatarBattleEnemySnapshot;
}

function mergeRuntimeVitals(
  summary: CharacterSummaryVm,
  snapshot?: CharacterAvatarBattleAllySnapshot | CharacterAvatarBattleEnemySnapshot,
): CharacterSummaryVm {
  if (!snapshot) {
    return summary;
  }
  const maxMana = snapshot.maxMana ?? summary.maxMana;
  return clampCharacterSummaryValues({
    ...summary,
    life: snapshot.life,
    maxLife: snapshot.maxLife,
    mana: snapshot.mana ?? summary.mana,
    maxMana,
  });
}

export function buildCharacterSummaryVmFromMonsterSummary(monster: MonsterSummaryVm): CharacterSummaryVm {
  const nextLevelExp = calculateRequiredExpForLevel(monster.level);
  return {
    id: monster.id,
    name: monster.name,
    class: 'warrior',
    level: monster.level,
    currentExp: 0,
    nextLevelExp,
    expProgressPercent: 0,
    life: monster.life,
    maxLife: monster.maxLife,
    mana: 0,
    maxMana: 0,
    strength: 10 + monster.level * 2,
    dexterity: 10 + monster.level * 2,
    vitality: 10 + monster.level * 2,
    energy: 10 + monster.level * 2,
    defense: 10 + monster.level * 2,
    combatPower: monster.combatPower,
    combatPowerBreakdown: {
      total: monster.combatPowerBreakdown.total,
      level: monster.combatPowerBreakdown.level,
      levelValue: monster.combatPowerBreakdown.levelValue,
      items: [],
    },
    equippedItems: [],
    skills: monster.skills.map((skill, index) => ({
      skillId: `${monster.id}-skill-${index}`,
      name: skill.name,
      iconHint: skill.icon,
      level: monster.level,
      realmId: 'monster',
      realmLabel: '몬스터',
      description: skill.description,
      disciplineLabel: '전투',
      typeLabel: '특수',
    })),
    personality: monster.personality,
    roleBadge: monster.badge ?? monster.combatPowerBreakdown.typeLabel,
    iconName: resolveStoryBattlePortraitIconName(monster.id),
  };
}

export function buildCharacterSummaryVmFromBattleAllySnapshot(
  ally: CharacterAvatarBattleAllySnapshot,
): CharacterSummaryVm {
  const nextLevelExp = calculateRequiredExpForLevel(ally.level);
  return {
    id: ally.id,
    name: ally.name,
    class: 'warrior',
    level: ally.level,
    currentExp: 0,
    nextLevelExp,
    expProgressPercent: 0,
    life: ally.life,
    maxLife: ally.maxLife,
    mana: ally.mana,
    maxMana: ally.maxMana,
    strength: 10 + ally.level * 2,
    dexterity: 10 + ally.level * 2,
    vitality: 10 + ally.level * 2,
    energy: 10 + ally.level * 2,
    defense: 10 + ally.level * 2,
    combatPower: calculateCombatantCombatPower(ally.level, null),
    combatPowerBreakdown: buildCombatPowerBreakdown(ally.level, []),
    equippedItems: [],
    skills: [],
    personality: {
      type: '전투원',
      tags: ally.role ? [ally.role] : ['아군'],
      description: `${ally.name}의 현재 전투 상태입니다.`,
    },
    roleBadge: ally.role,
    iconName: resolveStoryBattlePortraitIconName(ally.id),
  };
}

export function buildCharacterSummaryVmFromBattleEnemySnapshot(
  enemy: CharacterAvatarBattleEnemySnapshot,
): CharacterSummaryVm {
  const maxMana = enemy.maxMana ?? Math.max(10, enemy.level * 6 + 20);
  const mana = enemy.mana ?? maxMana;
  const nextLevelExp = calculateRequiredExpForLevel(enemy.level);
  return {
    id: enemy.id,
    name: enemy.name,
    class: 'warrior',
    level: enemy.level,
    currentExp: 0,
    nextLevelExp,
    expProgressPercent: 0,
    life: enemy.life,
    maxLife: enemy.maxLife,
    mana,
    maxMana,
    strength: 10 + enemy.level * 2,
    dexterity: 10 + enemy.level * 2,
    vitality: 10 + enemy.level * 2,
    energy: 10 + enemy.level * 2,
    defense: 10 + enemy.level * 2,
    combatPower: calculateCombatantCombatPower(enemy.level, null),
    combatPowerBreakdown: buildCombatPowerBreakdown(enemy.level, []),
    equippedItems: [],
    skills: [],
    personality: {
      type: '적대',
      tags: ['적'],
      description: `${enemy.name}의 현재 전투 상태입니다.`,
    },
    iconName: resolveStoryBattlePortraitIconName(enemy.id),
  };
}

export function buildCharacterSummaryVmFromMercenary(mercenary: RpgMercenaryStateVm): CharacterSummaryVm {
  const level = Math.max(1, mercenary.hlvl);
  const classPres = resolveRpgMercenaryClassPresentation(mercenary.familyId);
  const rpgClassKey = mercenary.rpgClassKey ?? classPres.rpgClassKey;
  const charClass = resolveProtagonistClassId(rpgClassKey, 'warrior');
  const avatarUrl = mercenary.illustrationUrl ?? classPres.illustrationUrl;

  const equippedItems = buildEquippedItemSummaries(mercenary.equipment ?? createEmptyEquipmentSlots());
  const combatPowerBreakdown = buildCombatPowerBreakdown(level, equippedItems);
  const currentExp = mercenary.currentExp ?? 0;
  const nextLevelExp = mercenary.nextLevelExp || calculateRequiredExpForLevel(level);
  const expProgressPercent = calculateExpProgressPercent(currentExp, nextLevelExp);

  const maxLife = 100 + level * 8;
  const life = mercenary.isDead ? 0 : maxLife;
  const isHospitalized = mercenary.isDead;
  const hospitalStatus = mercenary.isDead ? 'dead' : 'healthy';

  return {
    id: 'mercenary',
    name: mercenary.name,
    class: charClass,
    level,
    currentExp,
    nextLevelExp,
    expProgressPercent,
    life,
    maxLife,
    mana: 30 + level * 3,
    maxMana: 30 + level * 3,
    strength: 10 + level * 2,
    dexterity: 10 + level * 2,
    vitality: 10 + level * 2,
    energy: 10 + level * 2,
    defense: 10 + level * 2,
    combatPower: combatPowerBreakdown.total,
    combatPowerBreakdown,
    equippedItems,
    skills: buildCharacterSkillSummaries(mercenary.skills ?? []),
    personality: {
      type: '용병',
      tags: ['동료', mercenary.auraNameKo],
      description: `${mercenary.classLabelKo ?? classPres.classLabelKo} (오라: ${mercenary.auraNameKo})`,
    },
    roleBadge: '용병',
    hospitalStatus,
    isHospitalized,
    iconName: 'novel-party:party-wanderer',
    avatarUrl,
    currentLocation: mercenary.currentLocation,
  };
}

/** `RpgMercenaryStateVm`을 D2 스킬 트리 및 수련 지원용 `Character` 객체로 변환한다. */
export function buildCharacterFromMercenary(mercenary: RpgMercenaryStateVm): Character {
  const level = Math.max(1, mercenary.hlvl);
  const classPres = resolveRpgMercenaryClassPresentation(mercenary.familyId);
  const rpgClassKey = mercenary.rpgClassKey ?? classPres.rpgClassKey;
  const charClass = resolveProtagonistClassId(rpgClassKey, 'warrior');

  return {
    id: 'mercenary',
    name: mercenary.name,
    class: charClass,
    level,
    equipment: mercenary.equipment ?? createEmptyEquipmentSlots(),
    inventory: { items: [], gold: 0, maxSlots: 40 },
    stats: {
      life: 100 + level * 8,
      maxLife: 100 + level * 8,
      mana: 30 + level * 3,
      maxMana: 30 + level * 3,
      strength: 10 + level * 2,
      dexterity: 10 + level * 2,
      vitality: 10 + level * 2,
      energy: 10 + level * 2,
      defense: 10 + level * 2,
    },
    skills: mercenary.skills ?? [],
    personality: {
      type: '용병',
      tags: ['동료', mercenary.auraNameKo],
      description: `${mercenary.classLabelKo ?? classPres.classLabelKo} (오라: ${mercenary.auraNameKo})`,
    },
  };
}

/** `CHARACTER_AVATAR_SELECTED` 및 서사 인물 링크 클릭 페이로드를 캐릭터 상세 모달/바텀시트용 VM으로 해석한다. */
export function resolveCharacterSummaryForAvatarSelection(params: {
  payload: CharacterAvatarSelectionPayload | undefined;
  characterSummaries?: readonly CharacterSummaryVm[] | null;
  partyEntries?: readonly StoryPartyEntry[] | null;
  monsterSummaries?: readonly MonsterSummaryVm[] | null;
  heroCharacter?: Character | null;
}): CharacterSummaryVm | null {
  const { payload, characterSummaries, partyEntries, monsterSummaries, heroCharacter } = params;
  if (!payload) {
    return null;
  }

  const runtimeSnapshot = payload.battleAlly ?? payload.battleEnemy;

  if (payload.summary) {
    return mergeRuntimeVitals(payload.summary, runtimeSnapshot);
  }

  const characterId = payload.characterId;
  const characterName = payload.characterName || payload.name || payload.member?.name;

  if (!characterId && !characterName) {
    if (payload.member) {
      return mergeRuntimeVitals(buildCharacterSummaryVmFromPartyEntry(payload.member), runtimeSnapshot);
    }
    return null;
  }

  const matchesKey = (id?: string | null, name?: string | null) => {
    if (!id && !name) return false;
    if (characterId && (id === characterId || name === characterId)) return true;
    if (characterName && (id === characterName || name === characterName)) return true;
    return false;
  };

  const fromCatalog = characterSummaries?.find((entry) => matchesKey(entry.id, entry.name));
  if (fromCatalog) {
    return mergeRuntimeVitals(fromCatalog, runtimeSnapshot);
  }

  if (heroCharacter && (matchesKey(heroCharacter.id, heroCharacter.name) || characterId === 'hero')) {
    return mergeRuntimeVitals(buildCharacterSummaryVm(heroCharacter), runtimeSnapshot);
  }

  const partyMember = partyEntries?.find((entry) => matchesKey(entry.id, entry.name));
  if (partyMember) {
    return mergeRuntimeVitals(buildCharacterSummaryVmFromPartyEntry(partyMember), runtimeSnapshot);
  }

  const monster = monsterSummaries?.find((entry) => matchesKey(entry.id, entry.name));
  if (monster) {
    return mergeRuntimeVitals(buildCharacterSummaryVmFromMonsterSummary(monster), runtimeSnapshot);
  }

  if (payload.battleAlly && matchesKey(payload.battleAlly.id, payload.battleAlly.name)) {
    return buildCharacterSummaryVmFromBattleAllySnapshot(payload.battleAlly);
  }
  if (payload.battleEnemy && matchesKey(payload.battleEnemy.id, payload.battleEnemy.name)) {
    return buildCharacterSummaryVmFromBattleEnemySnapshot(payload.battleEnemy);
  }

  if (payload.member) {
    return mergeRuntimeVitals(buildCharacterSummaryVmFromPartyEntry(payload.member), runtimeSnapshot);
  }

  // D2 Lore 캐릭터 도감(42명 전수 조사 카탈로그) 우선 검색
  const loreEntry = findRpgLoreCharacter(characterId) ?? findRpgLoreCharacter(characterName);
  if (loreEntry) {
    return mergeRuntimeVitals(buildCharacterSummaryVmFromLoreCodex(loreEntry), runtimeSnapshot);
  }

  // 매칭되지 않는 서사 NPC/인물/주인공의 경우 적절한 기본 요약본 동적 생성
  const effectiveName = characterName || characterId || '등장인물';
  const effectiveId = characterId || `char-${effectiveName}`;
  return buildFallbackCharacterSummary(effectiveId, effectiveName);
}

export function normalizeLoreCodexIconName(iconName: string): string {
  if (!iconName) return 'novel-party:party-wanderer';
  if (iconName.includes(':')) return iconName;
  if (iconName.startsWith('monster-') || iconName.startsWith('novel-monster-')) {
    return `novel-monster:${iconName.replace(/^novel-monster-/, 'monster-')}`;
  }
  if (iconName.startsWith('party-') || iconName.startsWith('novel-party-')) {
    return `novel-party:${iconName.replace(/^novel-party-/, 'party-')}`;
  }
  return iconName;
}

/** D2 Lore 캐릭터 도감 항목을 완전한 CharacterSummaryVm으로 변환 */
export function buildCharacterSummaryVmFromLoreCodex(lore: LoreCharacterEntry): CharacterSummaryVm {
  const breakdownItems = lore.equippedItems.map((eq) => ({
    slotLabel: eq.slotLabel,
    name: eq.name,
    power: eq.combatPower,
    rarity: eq.rarity,
  }));

  return {
    id: lore.id,
    name: lore.name,
    class: lore.class,
    customClassLabel: lore.customClassLabel,
    level: lore.level,
    currentExp: 0,
    nextLevelExp: calculateRequiredExpForLevel(lore.level),
    expProgressPercent: 0,
    life: lore.life,
    maxLife: lore.maxLife,
    mana: lore.mana,
    maxMana: lore.maxMana,
    strength: lore.strength,
    dexterity: lore.dexterity,
    vitality: lore.vitality,
    energy: lore.energy,
    defense: lore.defense,
    combatPower: lore.combatPower,
    combatPowerBreakdown: {
      level: lore.level,
      levelValue: lore.level * 100,
      items: breakdownItems,
      total: lore.combatPower,
    },
    equippedItems: lore.equippedItems.map((eq) => ({
      slot: eq.slot,
      slotLabel: eq.slotLabel,
      itemId: eq.itemId,
      name: eq.name,
      rarity: eq.rarity,
      combatPower: eq.combatPower,
      item: {
        id: eq.itemId,
        name: eq.name,
        type: 'weapon',
        rarity: eq.rarity,
        slot: eq.slot,
        level: lore.level,
        requiredLevel: lore.level,
        description: `${eq.slotLabel}: ${eq.name}`,
        stats: [],
      },
    })),
    skills: lore.skills.map((sk) => ({
      skillId: sk.skillId,
      name: sk.name,
      iconHint: sk.iconHint,
      level: sk.level,
      realmId: sk.realmId,
      realmLabel: sk.realmLabel,
      description: sk.description,
      disciplineLabel: sk.disciplineLabel,
      typeLabel: sk.typeLabel || '기술',
    })),
    personality: {
      type: lore.personality.type,
      tags: [...lore.personality.tags],
      description: lore.personality.description,
    },
    roleBadge: lore.roleBadge,
    creatureType: lore.creatureType,
    creatureTypeBadge: lore.creatureTypeBadge,
    area: lore.area,
    immunities: lore.immunities,
    strongTraits: lore.strongTraits,
    rpgMonsterId: lore.rpgMonsterId,
    currentLocation: lore.area ? { title: lore.area, subtitle: `Act ${lore.act}` } : undefined,
    iconName: normalizeLoreCodexIconName(lore.iconName),
  };
}

/** 서사 등장인물 또는 임의의 이름/ID에 대한 기본 캐릭터 서머리 뷰모델 생성 */
export function buildFallbackCharacterSummary(id: string, name: string): CharacterSummaryVm {
  const fromLore = findRpgLoreCharacter(id) ?? findRpgLoreCharacter(name);
  if (fromLore) {
    return buildCharacterSummaryVmFromLoreCodex(fromLore);
  }

  const isMonsterOrBoss = ['안다리엘', '두리엘', '메피스토', '디아블로', '바알', '이주얼', '라다먼트', '헤파스토', '쉔크', '니흘라탁', '피의 까마귀', '카운테스'].some(
    (b) => name.includes(b) || id.includes(b),
  );
  const isNpc = ['아카라', '카샤', '데커드 케인', '케인', '찰시', '메시프', '드로그난', '아트마', '오르무스', '알코어', '티리엘', '라르주크', '안야', '말라', '콸케크'].some(
    (n) => name.includes(n) || id.includes(n),
  );

  const level = isMonsterOrBoss ? 25 : isNpc ? 20 : 10;
  const roleBadge = isMonsterOrBoss ? '보스' : isNpc ? '주요 NPC' : '동료';
  const roleType = isMonsterOrBoss ? '적' : isNpc ? 'NPC' : '동료';
  const customClassLabel = isMonsterOrBoss ? '악마 보스' : isNpc ? '주요 NPC' : undefined;
  const creatureType = isMonsterOrBoss ? 'demon' : isNpc ? 'human' : undefined;

  return {
    id,
    name,
    class: isMonsterOrBoss ? 'necromancer' : isNpc ? 'sorceress' : 'warrior',
    customClassLabel,
    creatureType,
    level,
    currentExp: 0,
    nextLevelExp: calculateRequiredExpForLevel(level),
    expProgressPercent: 0,
    life: 150 + level * 20,
    maxLife: 150 + level * 20,
    mana: 80 + level * 10,
    maxMana: 80 + level * 10,
    strength: 15 + level * 2,
    dexterity: 15 + level * 2,
    vitality: 15 + level * 2,
    energy: 15 + level * 2,
    defense: 20 + level * 3,
    combatPower: calculateCombatantCombatPower(level, null),
    combatPowerBreakdown: buildCombatPowerBreakdown(level, []),
    equippedItems: [],
    skills: [],
    personality: {
      type: roleType,
      tags: [roleBadge, '스토리'],
      description: `${name}의 상세 정보 및 서사 프로필입니다.`,
    },
    roleBadge,
    iconName: resolveCharacterSummaryIconName({ id }),
  };
}

export function clampCharacterSummaryValues(summary: CharacterSummaryVm): CharacterSummaryVm {
  const level = Math.max(1, summary.level);
  const maxLife = Math.max(1, summary.maxLife);
  const maxMana = Math.max(0, summary.maxMana);
  const clampedLife = Math.max(0, Math.min(maxLife, summary.life));
  const isDead = clampedLife <= 0;
  const isHospitalized = summary.isHospitalized || isDead;
  const hospitalStatus = isDead ? 'dead' : isHospitalized ? 'admitted' : (summary.hospitalStatus ?? 'healthy');

  return {
    ...summary,
    level,
    maxLife,
    maxMana,
    life: clampedLife,
    mana: Math.max(0, Math.min(maxMana, summary.mana)),
    strength: Math.max(0, summary.strength),
    dexterity: Math.max(0, summary.dexterity),
    vitality: Math.max(0, summary.vitality),
    energy: Math.max(0, summary.energy),
    defense: Math.max(0, summary.defense),
    isHospitalized,
    hospitalStatus,
  };
}

export type CharacterCategoryFilter = 'all' | 'party' | 'npc' | 'boss';

/** 캐릭터 요약 뷰모델의 카테고리(파티/NPC/보스) 판별 헬퍼 */
export function resolveCharacterCategory(summary: CharacterSummaryVm): 'party' | 'npc' | 'boss' {
  if (!summary) {
    return 'npc';
  }

  // 1. 파티 (주인공 및 고용된 용병)
  if (
    summary.id === 'mercenary' ||
    summary.personality?.type === '용병' ||
    summary.roleBadge === '주인공' ||
    summary.roleBadge === '용병' ||
    summary.id === 'wanderer' ||
    summary.id.startsWith('hero') ||
    summary.id.startsWith('d2-slot')
  ) {
    return 'party';
  }

  // 2. 보스 및 적대자 (악마, 언데드, 야수, 보스 칭호)
  if (
    summary.creatureType === 'demon' ||
    summary.creatureType === 'undead' ||
    summary.creatureType === 'beast' ||
    summary.roleBadge === '보스' ||
    summary.roleBadge === '우두머리' ||
    summary.roleBadge === '슈퍼 유니크' ||
    summary.customClassLabel?.includes('악마') ||
    summary.customClassLabel?.includes('여제') ||
    summary.customClassLabel?.includes('여왕') ||
    summary.customClassLabel?.includes('군주') ||
    summary.customClassLabel?.includes('대공')
  ) {
    return 'boss';
  }

  // 3. 주요 성역 NPC 및 조력자
  return 'npc';
}

const CATEGORY_SORT_PRIORITY: Record<string, number> = {
  party: 1,
  npc: 2,
  boss: 3,
};

/** 캐릭터 요약 목록을 분류 우선순위(1: 🛡️ 파티 -> 2: 📜 NPC -> 3: 😈 보스) 및 역할에 맞게 정렬 */
export function sortCharacterSummariesByCategory(summaries: readonly CharacterSummaryVm[]): CharacterSummaryVm[] {
  return [...summaries].sort((a, b) => {
    const catA = resolveCharacterCategory(a);
    const catB = resolveCharacterCategory(b);
    const priorityDelta = (CATEGORY_SORT_PRIORITY[catA] ?? 99) - (CATEGORY_SORT_PRIORITY[catB] ?? 99);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    // 파티 내부 정렬: 주인공 우선 -> 용병
    if (catA === 'party') {
      const isHeroA = a.roleBadge === '주인공' || a.id === 'wanderer' || a.id.startsWith('hero') || a.id.startsWith('d2-slot');
      const isHeroB = b.roleBadge === '주인공' || b.id === 'wanderer' || b.id.startsWith('hero') || b.id.startsWith('d2-slot');
      if (isHeroA && !isHeroB) return -1;
      if (!isHeroA && isHeroB) return 1;
    }

    // 보스 내부 정렬: 레벨 순
    if (catA === 'boss') {
      return (b.level ?? 0) - (a.level ?? 0);
    }

    // NPC 내부 정렬: 레벨 순
    return (b.level ?? 0) - (a.level ?? 0);
  });
}


