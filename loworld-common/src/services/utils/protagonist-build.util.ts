import type { CharacterClass } from '../models/character-base.model';
import type { CharacterGender } from '../models/character-base.model';
import { getRpgCharacterClassLabel } from './character-class-labels.util';
import { toStoryPartyIconName } from '../models/story-party-icon.utils';

export type ProtagonistBuildId = `d2-${CharacterClass}-${CharacterGender}`;

export interface ProtagonistRpgBuild {
  id: ProtagonistBuildId;
  classId: CharacterClass;
  gender: CharacterGender;
  label: string;
  classLabel: string;
  genderLabel: string;
  portraitAssetId: string;
  defaultDisplayName: string;
}

export const PROTAGONIST_GENDER_LABELS: Record<CharacterGender, string> = {
  male: '남성',
  female: '여성',
};

export const PROTAGONIST_GENDER_EMOJI: Record<CharacterGender, string> = {
  male: '♂',
  female: '♀',
};

const PORTRAIT_ASSET_BY_BUILD: Record<ProtagonistBuildId, string> = {
  'd2-warrior-male': 'party-d2-warrior-male',
  'd2-warrior-female': 'party-d2-warrior-female',
  'd2-sorceress-male': 'party-d2-sorceress-male',
  'd2-sorceress-female': 'party-d2-sorceress-female',
  'd2-rogue-male': 'party-d2-rogue-male',
  'd2-rogue-female': 'party-d2-rogue-female',
  'd2-paladin-male': 'party-d2-paladin-male',
  'd2-paladin-female': 'party-d2-paladin-female',
  'd2-necromancer-male': 'party-d2-necromancer-male',
  'd2-necromancer-female': 'party-d2-necromancer-female',
  'd2-druid-male': 'party-d2-druid-male',
  'd2-druid-female': 'party-d2-druid-female',
  'd2-assassin-male': 'party-d2-assassin-male',
  'd2-assassin-female': 'party-d2-assassin-female',
};

const ALL_CLASSES: CharacterClass[] = [
  'warrior',
  'sorceress',
  'rogue',
  'paladin',
  'necromancer',
  'druid',
  'assassin',
];
const ALL_GENDERS: CharacterGender[] = ['male', 'female'];

export function buildProtagonistBuildId(
  classId: CharacterClass,
  gender: CharacterGender,
): ProtagonistBuildId {
  return `d2-${classId}-${gender}`;
}

export function isProtagonistBuildId(value: string | null | undefined): value is ProtagonistBuildId {
  return !!value && value.startsWith('d2-') && !!findProtagonistBuild(value);
}

export function findProtagonistBuild(
  buildId: string | null | undefined,
): ProtagonistRpgBuild | undefined {
  if (!buildId || !(buildId in PORTRAIT_ASSET_BY_BUILD)) {
    return undefined;
  }
  return buildProtagonistBuildFromParts(
    buildId as ProtagonistBuildId,
    PORTRAIT_ASSET_BY_BUILD[buildId as ProtagonistBuildId],
  );
}

export function resolveProtagonistBuild(
  classId: CharacterClass | null | undefined,
  gender: CharacterGender | null | undefined,
): ProtagonistRpgBuild | undefined {
  if (!classId || !gender) {
    return undefined;
  }
  return findProtagonistBuild(buildProtagonistBuildId(classId, gender));
}

export function listAllProtagonistRpgBuilds(): ProtagonistRpgBuild[] {
  return ALL_CLASSES.flatMap((classId) =>
    ALL_GENDERS.map((gender) =>
      findProtagonistBuild(buildProtagonistBuildId(classId, gender))!,
    ),
  );
}

export function buildProtagonistBuildPickerOptions(): Array<{
  id: ProtagonistBuildId;
  label: string;
  iconName: string;
  classLabel: string;
  genderLabel: string;
}> {
  return listAllProtagonistRpgBuilds().map((build) => ({
    id: build.id,
    label: build.label,
    iconName: toStoryPartyIconName(build.portraitAssetId),
    classLabel: build.classLabel,
    genderLabel: build.genderLabel,
  }));
}

function buildProtagonistBuildFromParts(
  id: ProtagonistBuildId,
  portraitAssetId: string,
): ProtagonistRpgBuild {
  const [, classId, gender] = id.split('-') as [string, CharacterClass, CharacterGender];
  const classLabel = getRpgCharacterClassLabel(classId);
  const genderLabel = PROTAGONIST_GENDER_LABELS[gender];
  return {
    id,
    classId,
    gender,
    classLabel,
    genderLabel,
    portraitAssetId,
    label: `${classLabel} · ${genderLabel}`,
    defaultDisplayName: `${classLabel}`,
  };
}
