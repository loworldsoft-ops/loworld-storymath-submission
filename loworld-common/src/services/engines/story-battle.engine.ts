import type { BattleReward, BattleSkill, BattleStateV2 } from '../models/battle.model';
import type { BattleHudVm, BattleResultVm, BattleSkillSlotVm } from '../models/battle-v2-presentation.model';
import type { BattleEnemy, BattleState as LegacyBattleState } from '../models/battle.model';
import type { Character } from '../models/character.model';
import type { EquipmentSlots } from '../models/equipment.model';
import type { StoryMonsterEntry, StoryPartyEntry } from '../models/story-sidebar.model';
import type { BattleAllyCombatantVm, LwBattleEncounterVm } from '../models/story-battle-vm.model';
import { resolveMonsterElementAffinity, resolvePartyMemberElementAffinity } from '../utils/battle-affinity.util';
import { cloneBattleSkills } from './story-battle/combatant-action.util';
import { appendAoeSkillIfMissing, createAoeBattleSkill } from './story-battle/aoe-skill.util';
import { computeBattleEquipmentModifiers } from '../utils/battle-equipment.util';

type BattleState = LegacyBattleState;

import type { BattleAllyCombatant, EnemyCombatMods, StoryBattleCombatModifiers, StoryBattleRuntime } from '../models/story-battle-runtime.model';
import { DEFAULT_BATTLE_DAMAGE_MULTIPLIER, normalizeBattleDamageMultiplier } from './story-battle/battle-damage-scale.util';
import { aliveEnemies, findPlayerControlledAlly, resolveActingAllyVitals, resolveTargetEnemy } from './story-battle/combatant.util';
import { resolveActingAllySkillList, resolveManualTurnState } from './story-battle/manual-turn.util';
import { resolveActingEnemySkillList, resolveManualEnemyTurnState } from './story-battle/manual-enemy-turn.util';
import { executeStoryBattleEnemyTurn, resolveEnemyTurnAuto } from './story-battle/enemy-turn-orchestrator';
import { normalizeBattleAllyForRuntime, normalizeBattleEnemyForRuntime } from './story-battle/combatant-normalize.util';
import { executeStoryBattleTurn, type StoryBattleSkillActionResult } from './story-battle/turn-orchestrator';

export type { BattleAllyCombatant, EnemyCombatMods, StoryBattleCombatModifiers, StoryBattleRuntime } from '../models/story-battle-runtime.model';

export type { StoryBattleSkillActionResult };

/** 자동 전투 턴 간격 (ms) */
export const AUTO_BATTLE_TURN_DELAY_MS = 850;

/** HP가 이 비율 이하이면 회복 스킬 우선 */
const AUTO_BATTLE_HEAL_HP_RATIO = 0.35;

const DEFAULT_NARRATIVE = '적과 대치했습니다. 스킬을 선택하세요.';

/** 몬스터 도감 엔트리 → BattleEnemy (레벨 기반 HP, 선택적 레벨·장비 오버라이드) */
export function monsterEntryToBattleEnemy(
  monster: Pick<StoryMonsterEntry, 'id' | 'name' | 'level' | 'creatureType' | 'summary' | 'area'> & { maxLife?: number; life?: number },
  levelOverride?: number,
  equipmentModifiers?: Pick<StoryBattleCombatModifiers, 'enemyDefenseBonus'>,
  battleSkills?: BattleSkill[],
): BattleEnemy {
  const level = levelOverride ?? monster.level;
  const defenseBonus = equipmentModifiers?.enemyDefenseBonus ?? 0;
  const customHp = monster.maxLife ?? monster.life;
  const baseHp = customHp ? Number(customHp) : Math.round(level * 12 + 18);
  const maxLife = Math.round(baseHp + defenseBonus * 2);
  const maxMana = Math.max(10, level * 6 + 20);
  const skills = appendAoeSkillIfMissing(
    battleSkills?.length ? cloneBattleSkills(battleSkills) : undefined,
    level,
    'all_allies',
  );
  return {
    id: monster.id,
    name: monster.name,
    level,
    life: maxLife,
    maxLife,
    mana: maxMana,
    maxMana,
    skills,
    affinity: resolveMonsterElementAffinity(monster),
  };
}

/** 샌드박스 등 — 파티원을 적 진영에 둘 때 아군과 동일 MP·HP 공식 */
export function createPartyMemberBattleEnemy(
  member: StoryPartyEntry,
  levelOverride: number | undefined,
  equipmentModifiers: Pick<StoryBattleCombatModifiers, 'enemyDamageBonus' | 'enemyDefenseBonus'>,
  battleSkills: BattleSkill[],
): BattleEnemy {
  const level = levelOverride ?? member.level;
  const memberAtLevel = { ...member, level };
  const allyLike = createAllyCombatant(
    memberAtLevel,
    false,
    {
      playerDamageBonus: equipmentModifiers.enemyDamageBonus ?? 0,
      playerDamageReduction: 0,
    },
    battleSkills,
  );
  return {
    id: allyLike.id,
    name: allyLike.name,
    level: allyLike.level,
    life: allyLike.maxLife,
    maxLife: allyLike.maxLife,
    mana: allyLike.maxMana,
    maxMana: allyLike.maxMana,
    skills: allyLike.skills,
    affinity: allyLike.elementAffinity,
  };
}

/** 파티 멤버 + 주인공 캐릭터로 전투 시작용 스탯 추정 */
export function applyPartyMemberToCharacter(
  character: Character,
  member: StoryPartyEntry,
): Character {
  if (character.name === member.name) {
    return {
      ...character,
      level: member.level,
      stats: {
        ...character.stats,
        life: character.stats.maxLife,
        mana: character.stats.maxMana,
      },
    };
  }

  const role = member.role.toLowerCase();
  const isMage = role.includes('마법') || role.includes('mage') || role.includes('지원');
  const isRogue = role.includes('도적') || role.includes('rogue') || role.includes('정찰');

  let maxLife = member.level * 14 + 30;
  let maxMana = member.level * 6 + 20;
  if (isMage) {
    maxLife = member.level * 8 + 24;
    maxMana = member.level * 14 + 40;
  } else if (isRogue) {
    maxLife = member.level * 10 + 28;
    maxMana = member.level * 8 + 24;
  }

  return {
    ...character,
    name: member.name,
    level: member.level,
    stats: {
      ...character.stats,
      life: maxLife,
      maxLife,
      mana: maxMana,
      maxMana,
    },
  };
}

export function estimateAllyStats(member: StoryPartyEntry): {
  maxLife: number;
  maxMana: number;
} {
  const role = member.role.toLowerCase();
  const isMage = role.includes('마법') || role.includes('mage') || role.includes('지원');
  const isRogue = role.includes('도적') || role.includes('rogue') || role.includes('정찰');

  let maxLife = member.level * 14 + 30;
  let maxMana = member.level * 6 + 20;
  if (isMage) {
    maxLife = member.level * 8 + 24;
    maxMana = member.level * 14 + 40;
  } else if (isRogue) {
    maxLife = member.level * 10 + 28;
    maxMana = member.level * 8 + 24;
  }

  return { maxLife, maxMana };
}

export function createAllyCombatant(
  member: StoryPartyEntry,
  isPlayerControlled: boolean,
  equipmentModifiers: Pick<StoryBattleCombatModifiers, 'playerDamageBonus' | 'playerDamageReduction'> = {
    playerDamageBonus: 0,
    playerDamageReduction: 0,
  },
  battleSkills?: BattleSkill[],
): BattleAllyCombatant {
  const { maxLife, maxMana } = estimateAllyStats(member);
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    level: member.level,
    life: maxLife,
    maxLife,
    mana: maxMana,
    maxMana,
    isPlayerControlled,
    skills: appendAoeSkillIfMissing(
      battleSkills?.length ? cloneBattleSkills(battleSkills) : undefined,
      member.level,
      'all_enemies',
    ),
    damageBonus: equipmentModifiers.playerDamageBonus,
    damageReduction: equipmentModifiers.playerDamageReduction,
    elementAffinity: resolvePartyMemberElementAffinity(member),
  };
}

export function createDefaultStoryBattleSkills(): BattleSkill[] {
  return [
    {
      id: 'novel-skill-slash',
      name: '일반 베기',
      description: '검으로 적을 가볍게 베어 8~14의 피해를 입힙니다.',
      manaCost: 0,
      cooldownTurns: 0,
      currentCooldown: 0,
      damageRange: [8, 14],
      type: 'physical',
      targetType: 'enemy',
    },
    {
      id: 'novel-skill-bash',
      name: '강타',
      description: '무겁게 내려쳐 16~24의 피해를 입힙니다.',
      manaCost: 8,
      cooldownTurns: 2,
      currentCooldown: 0,
      damageRange: [16, 24],
      type: 'physical',
      targetType: 'enemy',
    },
    {
      id: 'novel-skill-heal',
      name: '영적 회복',
      description: '마나를 사용해 체력을 12~18 회복합니다.',
      manaCost: 12,
      cooldownTurns: 3,
      currentCooldown: 0,
      damageRange: [-18, -12],
      type: 'heal',
      targetType: 'self',
    },
    {
      id: 'novel-skill-guard',
      name: '방어 태세',
      description: '3턴간 받는 피해를 35% 줄입니다.',
      manaCost: 6,
      cooldownTurns: 4,
      currentCooldown: 0,
      damageRange: [0, 0],
      type: 'buff',
      targetType: 'self',
      statusEffect: { label: '방어 태세', icon: '🛡️', durationTurns: 3, damageReductionPct: 35 },
    },
    {
      id: 'novel-skill-weaken',
      name: '약화의 저주',
      description: '3턴간 적이 주는 피해를 30% 줄이고, 받는 피해를 20% 늘립니다.',
      manaCost: 10,
      cooldownTurns: 4,
      currentCooldown: 0,
      damageRange: [0, 0],
      type: 'debuff',
      targetType: 'enemy',
      statusEffect: { label: '약화', icon: '💀', durationTurns: 3, weakenDamagePct: 30, vulnerabilityPct: 20 },
    },
    createAoeBattleSkill(5, 'all_enemies'),
  ];
}

export function createDefaultStoryBattleRewards(enemyNames: string[]): BattleReward[] {
  const label = enemyNames.length === 1 ? enemyNames[0] : `${enemyNames.length}마리`;
  const expValue = 20 + enemyNames.length * 20;
  const goldValue = 15 + enemyNames.length * 10;
  return [
    { id: 'novel-reward-exp', type: 'exp', label: '경험치', value: expValue, claimed: false },
    { id: 'novel-reward-gold', type: 'gold', label: '골드', value: goldValue, claimed: false },
    { id: 'novel-reward-loot', type: 'item', label: `${label} 전리품`, value: 'battle-loot', claimed: false },
  ];
}

export function createDefaultStoryBattleRuntime(
  allies: BattleAllyCombatant[],
  enemies: BattleEnemy[],
  enemyCombatMods: Record<string, EnemyCombatMods> = {},
  skills?: BattleSkill[],
  options?: {
    autoResolve?: boolean;
    equipmentSummary?: string;
    damageMultiplier?: number;
    startPhase?: 'engaged' | 'player_turn';
  },
): StoryBattleRuntime {
  const enemyNames = enemies.map((entry) => entry.name);
  const leadEnemy = enemies[0];
  const narrativeTarget = enemyNames.length === 1
    ? `${enemyNames[0]}와(과) 대치했습니다.`
    : `${enemyNames.join(', ')} ${enemies.length}마리와 대치했습니다.`;
  const battleSkills = skills?.length ? skills : createDefaultStoryBattleSkills();
  const gearHint = options?.equipmentSummary ? ` (${options.equipmentSummary})` : '';
  const openingNarrative = options?.autoResolve
    ? `${narrativeTarget}${gearHint} 착용 장비와 스킬로 자동 교전을 시작합니다.`
    : `${narrativeTarget} 스킬을 선택하세요.`;

  const startPhase = options?.startPhase ?? 'player_turn';

  return {
    phase: startPhase,
    skills: battleSkills,
    timeline: [],
    currentNarrative: openingNarrative,
    rewards: createDefaultStoryBattleRewards(enemyNames),
    allies: allies.map((entry) => normalizeBattleAllyForRuntime(entry)),
    enemies: enemies.map((entry) => normalizeBattleEnemyForRuntime(entry)),
    activeAllyId: allies.find((entry) => entry.isPlayerControlled)?.id ?? allies[0]?.id ?? '',
    selectedTargetId: leadEnemy?.id ?? null,
    enemyCombatMods,
    proseEntries: [],
    damageMultiplier: normalizeBattleDamageMultiplier(options?.damageMultiplier ?? DEFAULT_BATTLE_DAMAGE_MULTIPLIER),
  };
}

/** @deprecated 단일 적 호환 — createDefaultStoryBattleRuntime(allies, [enemy]) 사용 */
export function createLegacyStoryBattleRuntime(enemy?: BattleEnemy | null): StoryBattleRuntime {
  const placeholderAlly: BattleAllyCombatant = {
    id: 'player',
    name: '주인공',
    role: '전위',
    level: 1,
    life: 100,
    maxLife: 100,
    mana: 50,
    maxMana: 50,
    isPlayerControlled: true,
    damageBonus: 0,
    damageReduction: 0,
  };
  const enemies = enemy ? [enemy] : [];
  return createDefaultStoryBattleRuntime([placeholderAlly], enemies);
}

const BATTLE_PHASE_LABELS: Record<string, { label: string; tone: BattleHudVm['phaseTone'] }> = {
  idle: { label: '평화', tone: 'neutral' },
  preparing: { label: '준비', tone: 'neutral' },
  engaged: { label: '교전 준비', tone: 'neutral' },
  player_turn: { label: '아군 턴', tone: 'success' },
  enemy_turn: { label: '적군 턴', tone: 'warning' },
  animating: { label: '연출 중', tone: 'neutral' },
  victory: { label: '승리', tone: 'success' },
  defeat: { label: '패배', tone: 'danger' },
};

function phaseLabel(phase: BattleStateV2['phase']): { label: string; tone: BattleHudVm['phaseTone'] } {
  return BATTLE_PHASE_LABELS[phase] ?? { label: '교전', tone: 'neutral' };
}

function isSkillSlotPhaseActive(
  phase: BattleStateV2['phase'],
  requiredPhase: BattleStateV2['phase'],
): boolean {
  if (requiredPhase === 'player_turn') {
    return phase === 'player_turn' || phase === 'engaged';
  }
  return phase === requiredPhase;
}

function buildSkillSlots(
  skills: BattleSkill[],
  playerMp: number,
  phase: BattleStateV2['phase'],
  requiredPhase: BattleStateV2['phase'] = 'player_turn',
): BattleSkillSlotVm[] {
  return skills.map((skill) => {
    if (!isSkillSlotPhaseActive(phase, requiredPhase)) {
      return {
        skill,
        usable: false,
        reason: requiredPhase === 'enemy_turn' ? '적군 턴이 아닙니다' : '플레이어 턴이 아닙니다',
      };
    }
    if (playerMp < skill.manaCost) {
      return { skill, usable: false, reason: '마나 부족' };
    }
    if (skill.currentCooldown > 0) {
      return { skill, usable: false, reason: `쿨다운 ${skill.currentCooldown}턴` };
    }
    return { skill, usable: true };
  });
}

function buildBattleResult(
  runtime: StoryBattleRuntime,
  primaryEnemy: BattleEnemy | null,
): BattleResultVm | null {
  if (runtime.phase !== 'victory' && runtime.phase !== 'defeat') {
    return null;
  }
  const outcome = runtime.phase === 'victory' ? 'victory' : 'defeat';
  const defeatedNames = runtime.enemies.filter((entry) => entry.life <= 0).map((entry) => entry.name);
  return {
    outcome,
    title: outcome === 'victory' ? '전투 승리' : '전투 패배',
    summary:
      runtime.currentNarrative ??
      (outcome === 'victory'
        ? defeatedNames.length === 1
          ? `${defeatedNames[0]}을(를) 쓰러뜨렸습니다.`
          : `${defeatedNames.length}마리의 적을 쓰러뜨렸습니다.`
        : '전투에서 쓰러졌습니다.'),
    rewards: runtime.rewards,
    expGained: outcome === 'victory' ? Number(runtime.rewards.find((r) => r.type === 'exp')?.value ?? 40) : undefined,
    goldGained: outcome === 'victory' ? Number(runtime.rewards.find((r) => r.type === 'gold')?.value ?? 25) : undefined,
  };
}

export function buildStoryBattleEncounterVm(
  character: Character,
  battle: BattleState,
  runtime: StoryBattleRuntime,
): LwBattleEncounterVm | null {
  const enemies = runtime.enemies.length > 0 ? runtime.enemies : battle.enemy ? [battle.enemy] : [];
  if (enemies.length === 0) {
    return null;
  }

  const primaryTarget = resolveTargetEnemy(enemies, runtime.selectedTargetId) ?? enemies[0];
  const manualState = resolveManualTurnState(runtime);
  const resolvedActiveAllyId = manualState?.activeAllyId ?? runtime.activeAllyId;
  const activeAlly = runtime.allies.find((entry) => entry.id === resolvedActiveAllyId)
    ?? runtime.allies.find((entry) => entry.id === runtime.activeAllyId)
    ?? runtime.allies.find((entry) => entry.isPlayerControlled)
    ?? runtime.allies[0];
  const isMultiParty = runtime.allies.length > 1 || enemies.length > 1;

  const { label, tone } = phaseLabel(runtime.phase);
  const playerControlled = findPlayerControlledAlly(runtime.allies);
  const actingVitals = resolveActingAllyVitals(character, runtime.allies, activeAlly?.id ?? resolvedActiveAllyId);
  const playerHp = playerControlled?.life ?? character.stats.life;
  const playerMaxHp = playerControlled?.maxLife ?? character.stats.maxLife;
  const playerMp = actingVitals.mana;
  const playerMaxMp = actingVitals.maxMana;
  const skillList = resolveActingAllySkillList(activeAlly, runtime.skills);
  const enemyManualState = resolveManualEnemyTurnState(runtime);
  const resolvedActiveEnemyId = enemyManualState?.activeEnemyId ?? runtime.activeEnemyId ?? primaryTarget.id;
  const activeEnemy = enemies.find((entry) => entry.id === resolvedActiveEnemyId) ?? primaryTarget;
  const enemySkillList = resolveActingEnemySkillList(activeEnemy);
  const enemyMana = activeEnemy.mana ?? 0;

  const skillSlots = runtime.phase === 'enemy_turn'
    ? buildSkillSlots(enemySkillList, enemyMana, runtime.phase, 'enemy_turn')
    : buildSkillSlots(skillList, playerMp, runtime.phase, 'player_turn');

  return {
    hud: {
      playerName: actingVitals.playerName,
      playerLevel: activeAlly?.level ?? character.level,
      playerHp,
      playerMaxHp,
      playerMp,
      playerMaxMp,
      enemyName: primaryTarget.name,
      enemyLevel: primaryTarget.level,
      enemyHp: primaryTarget.life,
      enemyMaxHp: primaryTarget.maxLife,
      turnNumber: battle.turn,
      phaseLabel: label,
      phaseTone: tone,
    },
    enemy: primaryTarget,
    enemies,
    allies: runtime.allies.map(({ damageBonus: _db, damageReduction: _dr, ...vm }) => vm),
    selectedTargetId: runtime.selectedTargetId,
    isMultiParty,
    proseEntries: runtime.proseEntries,
    skills: skillSlots,
    timeline: runtime.timeline,
    currentNarrative: runtime.currentNarrative ?? DEFAULT_NARRATIVE,
    result: buildBattleResult(runtime, primaryTarget),
    phase: runtime.phase,
    activeAllyId: resolvedActiveAllyId,
    manualPartyControl: runtime.manualPartyControl,
    manualPendingAllyIds: manualState?.pending ?? runtime.manualPendingAllyIds,
    manualEnemyControl: runtime.manualEnemyControl,
    manualPendingEnemyIds: enemyManualState?.pending ?? runtime.manualPendingEnemyIds,
    activeEnemyId: resolvedActiveEnemyId,
    selectedAllyTargetId: runtime.selectedAllyTargetId ?? null,
  };
}

export function applyStoryBattleEnemySkillAction(
  character: Character,
  battle: BattleState,
  runtime: StoryBattleRuntime,
  skillId: string,
  nextLogId: () => string,
  allyTargetId?: string | null,
): StoryBattleSkillActionResult | null {
  return executeStoryBattleEnemyTurn(
    character,
    battle,
    runtime,
    skillId,
    nextLogId,
    allyTargetId,
  );
}

export function applyStoryBattleSkillAction(
  character: Character,
  battle: BattleState,
  runtime: StoryBattleRuntime,
  skillId: string,
  nextLogId: () => string,
  equipmentModifiers: StoryBattleCombatModifiers = {
    playerDamageBonus: 0,
    playerDamageReduction: 0,
    enemyDamageBonus: 0,
    enemyDefenseBonus: 0,
  },
  targetEnemyId?: string | null,
): StoryBattleSkillActionResult | null {
  return executeStoryBattleTurn(
    character,
    battle,
    runtime,
    skillId,
    nextLogId,
    equipmentModifiers,
    targetEnemyId,
  );
}

function isHealSkill(skill: BattleSkill): boolean {
  return skill.type === 'heal' || skill.damageRange[0] < 0;
}

function skillAverageDamage(skill: BattleSkill): number {
  return (skill.damageRange[0] + skill.damageRange[1]) / 2;
}

function isSkillUsable(skill: BattleSkill, playerMp: number, phase: BattleStateV2['phase']): boolean {
  if (phase !== 'player_turn' && phase !== 'engaged') {
    return false;
  }
  if (playerMp < skill.manaCost) {
    return false;
  }
  if (skill.currentCooldown > 0) {
    return false;
  }
  return true;
}

/** 생존 적 중 HP%가 가장 낮은 적 ID */
export function pickAutoBattleTarget(enemies: BattleEnemy[]): string | null {
  const alive = aliveEnemies(enemies);
  if (alive.length === 0) {
    return null;
  }
  return alive
    .slice()
    .sort((a, b) => (a.life / Math.max(1, a.maxLife)) - (b.life / Math.max(1, b.maxLife)))[0].id;
}

export function pickAutoEnemySkill(runtime: StoryBattleRuntime): string | null {
  if (runtime.phase !== 'enemy_turn') {
    return null;
  }

  const state = resolveManualEnemyTurnState(runtime);
  if (!state) {
    return null;
  }

  const enemy = runtime.enemies.find((entry) => entry.id === state.activeEnemyId);
  if (!enemy || enemy.life <= 0) {
    return null;
  }

  const mana = enemy.mana ?? 0;
  const skills = resolveActingEnemySkillList(enemy);
  const usable = skills.filter(
    (skill) => skill.currentCooldown <= 0 && mana >= skill.manaCost,
  );
  if (usable.length === 0) {
    return resolveActingEnemySkillList(enemy)[0]?.id ?? null;
  }
  return usable.sort((a, b) => b.damageRange[1] - a.damageRange[1])[0].id;
}

/** 전투 자동 전투 — 착용 장비·스킬 기반 다음 행동 ID */
export function pickAutoBattleSkill(
  character: Character,
  runtime: StoryBattleRuntime,
  equipment?: EquipmentSlots | null,
): string | null {
  if (runtime.phase === 'victory' || runtime.phase === 'defeat' || runtime.phase === 'enemy_turn' || runtime.phase === 'idle') {
    return null;
  }

  const playerAlly = findPlayerControlledAlly(runtime.allies);
  const playerLife = playerAlly?.life ?? character.stats.life;
  const playerMaxLife = playerAlly?.maxLife ?? character.stats.maxLife;
  const playerMp = playerAlly?.mana ?? character.stats.mana ?? 0;
  const hpRatio = playerLife / Math.max(1, playerMaxLife);
  const usable = runtime.skills.filter((skill) => isSkillUsable(skill, playerMp, runtime.phase));

  if (usable.length === 0) {
    return runtime.skills.length > 0 ? runtime.skills[0].id : null;
  }

  const heals = usable.filter(isHealSkill);
  if (hpRatio <= AUTO_BATTLE_HEAL_HP_RATIO && heals.length > 0) {
    return heals.sort((a, b) => skillAverageDamage(a) - skillAverageDamage(b))[0].id;
  }

  const targetEnemy = resolveTargetEnemy(runtime.enemies, runtime.selectedTargetId);
  const debuffs = usable.filter((skill) => skill.type === 'debuff');
  if (targetEnemy && debuffs.length > 0) {
    const alreadyDebuffed = debuffs.some((skill) =>
      (targetEnemy.statusEffects ?? []).some((fx) => fx.id === skill.id),
    );
    if (!alreadyDebuffed) {
      return debuffs[0].id;
    }
  }

  const activeAlly = runtime.allies.find((entry) => entry.id === runtime.activeAllyId);
  const buffs = usable.filter((skill) => skill.type === 'buff');
  if (buffs.length > 0 && hpRatio <= 0.75) {
    const alreadyBuffed = buffs.some((skill) =>
      (activeAlly?.statusEffects ?? []).some((fx) => fx.id === skill.id),
    );
    if (!alreadyBuffed) {
      return buffs[0].id;
    }
  }

  const attacks = usable.filter((skill) => !isHealSkill(skill) && skill.type !== 'buff' && skill.type !== 'debuff' && skill.damageRange[1] > 0);
  if (attacks.length > 0) {
    const weaponBonus = equipment ? computeBattleEquipmentModifiers(equipment).playerDamageBonus : 0;
    return attacks.sort((a, b) => {
      const aScore = skillAverageDamage(a) + (a.type === 'physical' ? weaponBonus * 0.5 : 0);
      const bScore = skillAverageDamage(b) + (b.type === 'physical' ? weaponBonus * 0.5 : 0);
      return bScore - aScore;
    })[0].id;
  }

  return usable[0].id;
}

export { BATTLE_DAMAGE_MULTIPLIER_OPTIONS, DEFAULT_BATTLE_DAMAGE_MULTIPLIER, normalizeBattleDamageMultiplier, scaleOutgoingBattleDamage } from './story-battle/battle-damage-scale.util';
export { shouldProjectBattleEncounter, isBattleRuntimeConcluded, isBattleRuntimeInProgress, resolvePrimaryBattleEnemy } from './story-battle/combat-session.util';
export { aliveEnemies } from './story-battle/combatant.util';
export { resolveCombatOutcome } from './story-battle/combat-outcome.resolver';
export { findPlayerControlledAlly, resolvePlayerVitals, resolveActingAllyVitals } from './story-battle/combatant.util';
export { applyManualPartyControlToRuntime, beginStoryBattleEngagement, ensureManualPartyControlWhenAutoOff, initManualPartyTurnQueue, isStoryBattlePlayerActionPhase, normalizeRuntimeForPlayerAction } from './story-battle/manual-turn.util';
export { syncManualEnemyControlWithParty } from './story-battle/manual-enemy-turn.util';
export { resolveEnemyTurnAuto } from './story-battle/enemy-turn-orchestrator';
export { aoeScopeLabel, isAoeTargetSkill, isAllEnemiesTargetSkill } from './story-battle/aoe-skill.util';
export { defaultCombatantMaxMana, normalizeBattleAllyForRuntime, normalizeBattleEnemyForRuntime } from './story-battle/combatant-normalize.util';
