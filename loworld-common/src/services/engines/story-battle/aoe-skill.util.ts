import type { BattleSkill } from '../../models/battle.model';
import { createBasicAttackSkill } from './combatant.util';

export const STORY_AOE_ALL_ENEMIES_SKILL_ID = 'novel-skill-aoe-wave';
export const STORY_AOE_ALL_ALLIES_SKILL_ID = 'novel-skill-aoe-raid';

export type AoeTargetScope = 'all_enemies' | 'all_allies';

export function isAllEnemiesTargetSkill(skill: BattleSkill): boolean {
  return skill.targetType === 'all_enemies';
}

export function isAllAlliesTargetSkill(skill: BattleSkill): boolean {
  return skill.targetType === 'all_allies';
}

export function isAoeTargetSkill(skill: BattleSkill): boolean {
  return isAllEnemiesTargetSkill(skill) || isAllAlliesTargetSkill(skill);
}

export function createAoeBattleSkill(level: number, scope: AoeTargetScope): BattleSkill {
  const base = Math.max(4, Math.floor(level * 1.1));
  const spread = Math.max(2, Math.floor(level * 0.35));
  const isEnemySideTarget = scope === 'all_allies';

  return {
    id: isEnemySideTarget ? STORY_AOE_ALL_ALLIES_SKILL_ID : STORY_AOE_ALL_ENEMIES_SKILL_ID,
    name: isEnemySideTarget ? '광역 난사' : '광역 파동',
    description: isEnemySideTarget
      ? '아군 전체에게 파편을 퍼뜨려 피해를 입힙니다.'
      : '파동으로 적 전체에게 피해를 입힙니다.',
    manaCost: Math.max(6, Math.floor(level * 1.2)),
    cooldownTurns: 3,
    currentCooldown: 0,
    damageRange: [base, base + spread],
    type: 'magic',
    targetType: scope,
    iconHint: '🌊',
    affinity: 'wind',
  };
}

export function appendAoeSkillIfMissing(
  skills: BattleSkill[] | undefined,
  level: number,
  scope: AoeTargetScope,
): BattleSkill[] {
  const pool = skills?.length ? skills.map((entry) => ({ ...entry })) : [createBasicAttackSkill(level)];
  const aoeId = scope === 'all_allies' ? STORY_AOE_ALL_ALLIES_SKILL_ID : STORY_AOE_ALL_ENEMIES_SKILL_ID;
  const hasAoe = pool.some(
    (entry) =>
      entry.id === aoeId
      || entry.targetType === scope
      || (scope === 'all_enemies' && entry.targetType === 'all_enemies')
      || (scope === 'all_allies' && entry.targetType === 'all_allies'),
  );
  if (hasAoe) {
    return pool;
  }
  return [...pool, createAoeBattleSkill(level, scope)];
}

export function aoeScopeLabel(skill: BattleSkill): string {
  if (isAllEnemiesTargetSkill(skill)) {
    return '광역 · 적 전체';
  }
  if (isAllAlliesTargetSkill(skill)) {
    return '광역 · 아군 전체';
  }
  return '';
}
