import type { SkillCombatProfile, SkillEffectKind } from '../models/skill.model';
import { SKILL_LEVELS_PER_REALM, SKILL_REALM_STAGES } from '../models/skill.model';

export const SKILL_ABSOLUTE_MAX_LEVEL = SKILL_LEVELS_PER_REALM * SKILL_REALM_STAGES.length;

const EFFECT_KIND_LABELS: Record<SkillEffectKind, string> = {
  damage: '피해',
  heal: '치유',
  buff: '버프',
  debuff: '디버프',
  summon: '소환',
};

const TARGET_SCOPE_LABELS: Record<SkillCombatProfile['targetScope'], string> = {
  single: '단일',
  area: '광역',
  line: '직선',
  self: '본인',
};

const TARGET_SIDE_LABELS: Record<SkillCombatProfile['targetSide'], string> = {
  enemy: '적군',
  ally: '아군',
  self: '본인',
  all: '전체',
};

export function getGlobalSkillLevel(realmOrder: number, levelInRealm: number): number {
  return (realmOrder - 1) * SKILL_LEVELS_PER_REALM + levelInRealm;
}

export function calculateSkillPowerRange(
  profile: SkillCombatProfile,
  globalLevel: number,
): { min: number; max: number } | null {
  if (profile.baseMin == null || profile.baseMax == null || profile.powerPerLevel == null) {
    return null;
  }
  const bonus = (globalLevel - 1) * profile.powerPerLevel;
  return {
    min: Math.round(profile.baseMin + bonus),
    max: Math.round(profile.baseMax + bonus),
  };
}

export function formatSkillPowerRange(min: number, max: number): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

export function formatSkillPowerPerLevel(profile: SkillCombatProfile): string | null {
  if (profile.powerPerLevel == null) return null;
  const value = Number.isInteger(profile.powerPerLevel)
    ? `${profile.powerPerLevel}`
    : profile.powerPerLevel.toFixed(1);
  const unit = profile.effectKind === 'heal' ? '치유' : '피해';
  return `+${value}/Lv (${unit})`;
}

export function formatSkillEffectPotency(
  profile: SkillCombatProfile,
  globalLevel: number,
): string | null {
  if (!profile.effectPotencyLabel) return null;
  const base = profile.effectPotencyBase ?? 0;
  const bonus = profile.effectPotencyPerLevel
    ? (globalLevel - 1) * profile.effectPotencyPerLevel
    : 0;
  const total = Math.round(base + bonus);
  if (profile.effectPotencyPerLevel) {
    return `${profile.effectPotencyLabel} ${total} (+${profile.effectPotencyPerLevel}/Lv)`;
  }
  return `${profile.effectPotencyLabel} ${total}`;
}

export function formatSkillCombatSummary(profile: SkillCombatProfile): string {
  const effect = EFFECT_KIND_LABELS[profile.effectKind];
  const scope = TARGET_SCOPE_LABELS[profile.targetScope];
  const side = TARGET_SIDE_LABELS[profile.targetSide];
  return `${effect} · ${scope} · ${side}`;
}

export function formatSkillCombatTargetLine(profile: SkillCombatProfile): string {
  const scope = TARGET_SCOPE_LABELS[profile.targetScope];
  const side = TARGET_SIDE_LABELS[profile.targetSide];
  const effect = EFFECT_KIND_LABELS[profile.effectKind];

  if (profile.targetScope === 'self' && profile.targetSide === 'self') {
    return `${effect} · 시전자 본인`;
  }
  if (profile.effectKind === 'summon') {
    return `${effect} · 아군 소환`;
  }
  if (profile.targetScope === 'area' && profile.targetSide === 'enemy') {
    return `${effect} · 범위 내 적 전체`;
  }
  if (profile.targetScope === 'single' && profile.targetSide === 'enemy') {
    return `${effect} · 단일 적`;
  }
  if (profile.targetScope === 'single' && profile.targetSide === 'ally') {
    return `${effect} · 아군 1명`;
  }
  if (profile.targetScope === 'area' && profile.targetSide === 'ally') {
    return `${effect} · 아군 전체`;
  }
  if (profile.effectKind === 'heal') {
    return `${effect} · ${scope} · ${side}`;
  }
  return `${effect} · ${scope} · ${side}`;
}

export interface SkillCombatDisplayVm {
  summary: string;
  targetLine: string;
  applicationDetail: string;
  powerAtLevel1: string | null;
  powerAtCurrent: string | null;
  powerAtMax: string | null;
  powerPerLevelLabel: string | null;
  potencyAtCurrent: string | null;
  potencyAtMax: string | null;
  globalLevel: number;
  globalMaxLevel: number;
  realmMaxLevel: number;
}

export function buildSkillCombatDisplayVm(
  profile: SkillCombatProfile,
  options: {
    realmOrder?: number;
    levelInRealm?: number;
  } = {},
): SkillCombatDisplayVm {
  const realmOrder = options.realmOrder ?? 1;
  const levelInRealm = options.levelInRealm ?? 1;
  const globalLevel = getGlobalSkillLevel(realmOrder, levelInRealm);
  const globalMaxLevel = SKILL_ABSOLUTE_MAX_LEVEL;

  const powerAt1 = calculateSkillPowerRange(profile, 1);
  const powerAtCurrent = calculateSkillPowerRange(profile, globalLevel);
  const powerAtMax = calculateSkillPowerRange(profile, globalMaxLevel);

  const potencyAtCurrent = formatSkillEffectPotency(profile, globalLevel);
  const potencyAtMax = formatSkillEffectPotency(profile, globalMaxLevel);

  return {
    summary: formatSkillCombatSummary(profile),
    targetLine: formatSkillCombatTargetLine(profile),
    applicationDetail: profile.applicationDetail,
    powerAtLevel1: powerAt1 ? formatSkillPowerRange(powerAt1.min, powerAt1.max) : null,
    powerAtCurrent: powerAtCurrent ? formatSkillPowerRange(powerAtCurrent.min, powerAtCurrent.max) : null,
    powerAtMax: powerAtMax ? formatSkillPowerRange(powerAtMax.min, powerAtMax.max) : null,
    powerPerLevelLabel: formatSkillPowerPerLevel(profile),
    potencyAtCurrent,
    potencyAtMax,
    globalLevel,
    globalMaxLevel,
    realmMaxLevel: SKILL_LEVELS_PER_REALM,
  };
}
