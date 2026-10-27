import type { BattleEnemy, BattleSkill } from '../../models/battle.model';
import type { Character } from '../../models/character.model';
import type { BattleAllyCombatant } from '../../models/story-battle-runtime.model';

export const BASIC_ATTACK_SKILL_ID = 'novel-basic-attack';

/** 보유 스킬이 없거나 MP가 부족할 때 — MP 0 */
export function createBasicAttackSkill(level: number): BattleSkill {
  const base = Math.max(2, Math.floor(level * 1.5));
  return {
    id: BASIC_ATTACK_SKILL_ID,
    name: '기본 공격',
    description: '보유 스킬 없이 가하는 기본 타격 (MP 소모 없음)',
    manaCost: 0,
    cooldownTurns: 0,
    currentCooldown: 0,
    damageRange: [base, base + Math.max(1, Math.floor(level * 0.3))],
    type: 'physical',
    targetType: 'enemy',
    iconHint: '⚔️',
  };
}

export function aliveEnemies(enemies: BattleEnemy[]): BattleEnemy[] {
  return enemies.filter((entry) => entry.life > 0);
}

export function aliveAllies(allies: BattleAllyCombatant[]): BattleAllyCombatant[] {
  return allies.filter((entry) => entry.life > 0);
}

export function findPlayerControlledAlly(allies: BattleAllyCombatant[]): BattleAllyCombatant | null {
  const living = aliveAllies(allies);
  if (living.length === 0) {
    return null;
  }
  return living.find((entry) => entry.isPlayerControlled) ?? living[0];
}

/**
 * 현재 조종/액티브 아군이 전투 불능이면 생존 아군 중 선두(팀 순서)에게 주도권 이전.
 */
export function reconcilePartyLeadership(
  allies: BattleAllyCombatant[],
  activeAllyId: string,
): {
  allies: BattleAllyCombatant[];
  activeAllyId: string;
  lead: BattleAllyCombatant | null;
  leadershipChanged: boolean;
} {
  const living = aliveAllies(allies);
  if (living.length === 0) {
    return { allies, activeAllyId, lead: null, leadershipChanged: false };
  }

  const activeAlive = living.find((entry) => entry.id === activeAllyId);
  const leadEntry = activeAlive ?? living.find((entry) => entry.isPlayerControlled) ?? living[0];
  const leadId = leadEntry.id;
  const leadershipChanged = leadId !== activeAllyId;

  const remapped = allies.map((entry) => ({
    ...entry,
    isPlayerControlled: entry.id === leadId,
  }));

  const lead = remapped.find((entry) => entry.id === leadId) ?? null;
  return { allies: remapped, activeAllyId: leadId, lead, leadershipChanged };
}

export function resolveTargetEnemy(
  enemies: BattleEnemy[],
  selectedTargetId: string | null,
): BattleEnemy | null {
  const alive = aliveEnemies(enemies);
  if (alive.length === 0) {
    return null;
  }
  if (selectedTargetId) {
    const targeted = alive.find((entry) => entry.id === selectedTargetId);
    if (targeted) {
      return targeted;
    }
  }
  return alive[0];
}

export interface PlayerVitals {
  allyId: string;
  life: number;
  mana: number;
  maxLife: number;
  maxMana: number;
  damageBonus: number;
  damageReduction: number;
  playerName: string;
}

/** 현재 턴에 행동 중인 아군 HP/MP/이름 */
export function resolveActingAllyVitals(
  character: Character,
  allies: BattleAllyCombatant[],
  activeAllyId: string,
): PlayerVitals {
  const ally = allies.find((entry) => entry.id === activeAllyId) ?? findPlayerControlledAlly(allies);
  if (!ally) {
    return resolvePlayerVitals(character, allies, activeAllyId);
  }

  return {
    allyId: ally.id,
    life: ally.life,
    mana: ally.isPlayerControlled ? character.stats.mana : ally.mana,
    maxLife: ally.maxLife,
    maxMana: ally.maxMana,
    damageBonus: ally.damageBonus,
    damageReduction: ally.damageReduction,
    playerName: ally.name,
  };
}

/** 전투 중 플레이어 HP/방어 — runtime.allies[isPlayerControlled]를 단일 소스로 사용 */
export function resolvePlayerVitals(
  character: Character,
  allies: BattleAllyCombatant[],
  activeAllyId: string,
): PlayerVitals {
  const playerAlly = findPlayerControlledAlly(allies);
  const allyId = playerAlly?.id ?? activeAllyId;

  return {
    allyId,
    life: playerAlly?.life ?? character.stats.life,
    mana: character.stats.mana,
    maxLife: playerAlly?.maxLife ?? character.stats.maxLife,
    maxMana: playerAlly?.maxMana ?? character.stats.maxMana,
    damageBonus: playerAlly?.damageBonus ?? 0,
    damageReduction: playerAlly?.damageReduction ?? 0,
    playerName: playerAlly?.name ?? character.name,
  };
}

export function syncPlayerAllyHp(
  allies: BattleAllyCombatant[],
  playerAllyId: string,
  life: number,
  mana: number,
): BattleAllyCombatant[] {
  return allies.map((entry) =>
    entry.id === playerAllyId ? { ...entry, life, mana } : entry,
  );
}
