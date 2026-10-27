import type { BattleSkill } from '../../models/battle.model';
import type { BattleEnemy } from '../../models/battle.model';
import type { BattleAllyCombatant } from '../../models/story-battle-runtime.model';
import { appendAoeSkillIfMissing } from './aoe-skill.util';
import { cloneBattleSkills } from './combatant-action.util';

export function defaultCombatantMaxMana(level: number): number {
  return Math.max(10, level * 6 + 20);
}

/** 씬·레거시 BattleEnemy에 MP·스킬 풀 보장 (교전 시작 시 1회) */
export function normalizeBattleEnemyForRuntime(
  enemy: BattleEnemy,
  skillSeed?: BattleSkill[],
): BattleEnemy {
  const level = enemy.level;
  const maxMana = enemy.maxMana ?? defaultCombatantMaxMana(level);
  const mana = enemy.mana ?? maxMana;
  const skills = appendAoeSkillIfMissing(
    enemy.skills?.length
      ? cloneBattleSkills(enemy.skills)
      : skillSeed?.length
        ? cloneBattleSkills(skillSeed)
        : undefined,
    level,
    'all_allies',
  );

  return {
    ...enemy,
    maxMana,
    mana,
    skills,
  };
}

/** AI 아군·플레이어 동료 슬롯 — MP·스킬 풀 보장 */
export function normalizeBattleAllyForRuntime(ally: BattleAllyCombatant): BattleAllyCombatant {
  const maxLife = ally.maxLife > 0 ? ally.maxLife : Math.max(1, ally.level * 14 + 30);
  const life = ally.life > 0 ? ally.life : maxLife;
  const maxMana = ally.maxMana ?? defaultCombatantMaxMana(ally.level);
  const mana = ally.mana ?? maxMana;
  const skills = appendAoeSkillIfMissing(ally.skills, ally.level, 'all_enemies');

  return {
    ...ally,
    life,
    maxLife,
    maxMana,
    mana,
    skills,
  };
}
