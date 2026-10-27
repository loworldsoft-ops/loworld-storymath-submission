import type { CampaignActId } from '../models/rpg-campaign.model';
import { RPG_CLASS_ROSTER } from '../engines/rpg-character-attributes.engine';
import { RPG_MERCENARY_FAMILIES, RPG_MERCENARY_VARIANTS, findRpgMercenaryFamily } from '../data/rpg-mercenary-catalog.data';
import { resolveRpgHeroIllustrationUrl } from './rpg-hero-illustration.util';
import type { RpgMercenaryCandidateVm, RpgMercenaryDifficultyGate, RpgMercenaryFamilyId, RpgMercenaryStateVm, NarrativeInspectorMercenaryChannelVm } from '../models/rpg-mercenary.model';
import type { NarrativeInspectorCommerceChannelVm } from '../models/narrative-inspector-commerce.model';
import { NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_LABELS } from '../models/narrative-inspector-commerce.model';

/** D2R 패리티 — [d2r-unified-town-commerce-system-design.md] §7.3 */
export function reviveMercenaryCostGold(hlvl: number): number {
  return Math.min(Math.floor((hlvl * hlvl) / 2) * 15, 50_000);
}

/** Stub hire cost until d2-commerce.engine 연동 */
export function hireMercenaryCostGold(clvl: number): number {
  return Math.max(100, clvl * 25);
}

function actNumFromActId(actId: CampaignActId): number {
  return Number.parseInt(actId.replace('act', ''), 10);
}

function isVariantAvailable(
  gate: RpgMercenaryDifficultyGate,
  difficulty: 'normal' | 'nightmare' | 'hell',
): boolean {
  if (gate === 'all') {
    return true;
  }
  return difficulty === 'nightmare' || difficulty === 'hell';
}

export function resolveRpgMercenaryClassPresentation(familyId: RpgMercenaryFamilyId): {
  rpgClassKey: string;
  classLabelKo: string;
  classTitle: string;
  illustrationUrl: string;
} {
  const family = findRpgMercenaryFamily(familyId);
  const rpgClassKey = family?.rpgClassKey ?? 'paladin';
  const classDef = RPG_CLASS_ROSTER.find((entry) => entry.key === rpgClassKey);
  const gender = family?.heroGender ?? 'male';
  return {
    rpgClassKey,
    classLabelKo: classDef?.name ?? rpgClassKey,
    classTitle: classDef?.title ?? rpgClassKey,
    illustrationUrl: resolveRpgHeroIllustrationUrl(rpgClassKey, gender),
  };
}

function pickMercenaryName(familyId: RpgMercenaryFamilyId, variantId: string): string {
  const family = findRpgMercenaryFamily(familyId);
  if (!family || family.namePool.length === 0) {
    return '용병';
  }
  const hash = variantId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return family.namePool[hash % family.namePool.length] ?? family.namePool[0];
}

export function buildRpgMercenaryCandidates(input: {
  townTier: number;
  playerLevel: number;
  playerGold: number;
  difficulty: 'normal' | 'nightmare' | 'hell';
  mercenaryUnlocked: boolean;
  /** 퀘스트 보상 등 — 미지정 시 catalog 전 패밀리 (Act 무관) */
  preferredFamilyId?: RpgMercenaryFamilyId;
}): RpgMercenaryCandidateVm[] {
  const hireCost = hireMercenaryCostGold(input.playerLevel);
  const familyOrder = RPG_MERCENARY_FAMILIES.map((family) => family.id);

  const variants = RPG_MERCENARY_VARIANTS.filter((variant) => {
    if (input.preferredFamilyId && variant.familyId !== input.preferredFamilyId) {
      return false;
    }
    return isVariantAvailable(variant.difficultyGate, input.difficulty);
  }).sort((left, right) => {
    const leftFamilyIndex = familyOrder.indexOf(left.familyId);
    const rightFamilyIndex = familyOrder.indexOf(right.familyId);
    if (leftFamilyIndex !== rightFamilyIndex) {
      return leftFamilyIndex - rightFamilyIndex;
    }
    return left.id.localeCompare(right.id);
  });

  return variants.map((variant) => {
    const family = findRpgMercenaryFamily(variant.familyId)!;
    const classPresentation = resolveRpgMercenaryClassPresentation(variant.familyId);
    const name = pickMercenaryName(variant.familyId, variant.id);
    let enabled = input.mercenaryUnlocked;
    let disabledReason: string | undefined;

    if (!input.mercenaryUnlocked) {
      disabledReason = '용병 해금 필요 (Den of Evil 이후)';
      enabled = false;
    } else if (input.playerGold < hireCost) {
      disabledReason = `골드 부족 (필요: ${hireCost})`;
      enabled = false;
    }

    return {
      id: variant.id,
      familyId: variant.familyId,
      variantId: variant.id,
      name,
      familyLabel: family.labelKo,
      classLabelKo: classPresentation.classLabelKo,
      classTitle: classPresentation.classTitle,
      rpgClassKey: classPresentation.rpgClassKey,
      illustrationUrl: classPresentation.illustrationUrl,
      auraNameKo: variant.auraNameKo,
      auraDescriptionKo: variant.auraDescriptionKo,
      weaponTypeKo: family.weaponTypeKo,
      hireCost,
      level: input.playerLevel,
      enabled,
      disabledReason,
    };
  });
}

export interface BuildRpgMercenaryCommerceChannelsInput {
  actId: CampaignActId;
  npcNameKo: string;
  mercenaryUnlocked: boolean;
  playerGold: number;
  playerLevel: number;
  difficulty?: 'normal' | 'nightmare' | 'hell';
  currentMercenary?: RpgMercenaryStateVm | null;
}

/** Inspector commerce bar — hire/revive mercenary 채널 VM */
export function buildRpgMercenaryCommerceChannels(
  input: BuildRpgMercenaryCommerceChannelsInput,
): NarrativeInspectorCommerceChannelVm[] {
  const townTier = actNumFromActId(input.actId);
  const difficulty = input.difficulty ?? 'normal';
  const mercenary = input.currentMercenary ?? null;
  const channels: NarrativeInspectorCommerceChannelVm[] = [];

  // Act4 — hire disabled (Tyrael revive only)
  if (townTier !== 4 && input.mercenaryUnlocked) {
    const hireData: NarrativeInspectorMercenaryChannelVm = {
      mode: 'hire',
      mercenaryUnlocked: input.mercenaryUnlocked,
      playerGold: input.playerGold,
      playerLevel: input.playerLevel,
      difficulty,
      townTier,
      currentMercenary: mercenary,
      candidates: buildRpgMercenaryCandidates({
        townTier,
        playerLevel: input.playerLevel,
        playerGold: input.playerGold,
        difficulty,
        mercenaryUnlocked: input.mercenaryUnlocked,
      }),
    };

    channels.push({
      id: 'hire_mercenary',
      label: NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_LABELS.hire_mercenary,
      shopName: input.npcNameKo,
      mercenary: hireData,
      enabled: input.mercenaryUnlocked,
    });
  }

  const showRevive =
    mercenary != null && (mercenary.isDead || townTier === 4 || input.mercenaryUnlocked);

  if (showRevive && mercenary?.isDead) {
    const reviveCost = reviveMercenaryCostGold(mercenary.hlvl);
    channels.push({
      id: 'revive_mercenary',
      label: NARRATIVE_INSPECTOR_COMMERCE_CHANNEL_LABELS.revive_mercenary,
      shopName: input.npcNameKo,
      mercenary: {
        mode: 'revive',
        mercenaryUnlocked: input.mercenaryUnlocked,
        playerGold: input.playerGold,
        playerLevel: input.playerLevel,
        difficulty,
        townTier,
        currentMercenary: mercenary,
        candidates: [],
        reviveCost,
      },
      enabled: true,
    });
  }

  return channels;
}

/** Kashya / Greiz / Asheara / Qual-Kehk / Tyrael — act별 NPC 이름 */
export function resolveRpgMercenaryNpcNameKo(actId: CampaignActId): string {
  const map: Record<CampaignActId, string> = {
    act1: 'Kashya',
    act2: 'Greiz',
    act3: 'Asheara',
    act4: 'Tyrael',
    act5: 'Qual-Kehk',
  };
  return map[actId];
}
