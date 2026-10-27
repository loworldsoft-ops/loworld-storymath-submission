import type { AffinityType } from './affinity.model';

export interface BattleLogEntry {
  id: string;
  message: string;
  emphasis?: 'normal' | 'critical' | 'loot';
}

/** 버프/디버프 지속 효과 — 전투원(아군·적)에게 부여되어 남은 턴 동안 피해 계산에 반영됨 */
export type BattleStatusEffectKind = 'buff' | 'debuff';

export interface BattleStatusEffect {
  /** 부여한 스킬 id — 동일 스킬 재시전 시 갱신(upsert) 판별용 */
  id: string;
  kind: BattleStatusEffectKind;
  icon: string;
  label: string;
  remainingTurns: number;
  /** 아군 버프 — 받는 피해 감소 % */
  damageReductionPct?: number;
  /** 아군 버프 — 가하는 피해 증가 % */
  damageBonusPct?: number;
  /** 적 디버프 — 적이 가하는 피해 감소 % */
  weakenDamagePct?: number;
  /** 적 디버프 — 적이 받는 피해 증가 % */
  vulnerabilityPct?: number;
}

/** 스킬 정의 */
export interface BattleSkill {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldownTurns: number;
  currentCooldown: number;
  damageRange: [min: number, max: number];
  type: 'physical' | 'magic' | 'heal' | 'buff' | 'debuff';
  targetType: 'enemy' | 'self' | 'party' | 'all_enemies' | 'all_allies';
  iconHint?: string;   // 아이콘 힌트 (UI에서 매핑)
  /** 스킬 원소 — 상성 배율 계산에 사용 */
  affinity?: AffinityType;
  /** buff/debuff 스킬이 부여하는 상태 효과 정의 (없으면 엔진 기본값 사용) */
  statusEffect?: Pick<
    BattleStatusEffect,
    'label' | 'icon' | 'damageReductionPct' | 'damageBonusPct' | 'weakenDamagePct' | 'vulnerabilityPct'
  > & {
    durationTurns: number;
  };
}

export interface BattleEnemy {
  id: string;
  name: string;
  level: number;
  life: number;
  maxLife: number;
  /** 현재 MP — 보유 스킬 사용 시 manaCost 차감 */
  mana?: number;
  maxMana?: number;
  /** 전투 중 쿨다운·MP와 함께 갱신되는 스킬 목록 (없으면 기본 공격만) */
  skills?: BattleSkill[];
  statusEffects?: BattleStatusEffect[];
  /** 방어 원소 — 스킬 상성 피해 계산 */
  affinity?: AffinityType;
  /** 균열 무리 대장·엘리트 등 UI 강조 (전투 로직 SSOT 아님) */
  isElite?: boolean;
  /** 대균열 등급 뱃지 */
  riftRank?: 'normal' | 'veteran' | 'elite' | 'pack_leader' | 'rift_guardian';
  /** 몬ster-icons SSOT id (예: rift-wretch) */
  portraitMonsterId?: string;
  /** 도감 캐릭터/몬스터 랭크 */
  rank?: import('./story-sidebar.model').CharacterRank;
  badge?: string;
  strongTraits?: import('./story-sidebar.model').CharacterStrongTrait[];
  immunities?: import('./story-sidebar.model').CharacterImmunity[];
  icon?: string;
}

export interface BattleState {
  phase: 'idle' | 'engaged' | 'victory';
  turn: number;
  enemy: BattleEnemy | null;
  logs: BattleLogEntry[];
}

/** 턴 타임라인 엔트리 (양측 행동 기록) */
export interface BattleTurnEntry {
  turnNumber: number;
  playerAction: {
    skillId: string;
    skillName: string;
    damage?: number;
    healed?: number;
    isCritical?: boolean;
  };
  enemyAction?: {
    skillName: string;
    damage?: number;
    isCritical?: boolean;
  };
  resultNarrative: string;   // 턴 결과 서사 텍스트
}

/** 전투 보상 */
export interface BattleReward {
  id: string;
  type: 'item' | 'gold' | 'exp';
  label: string;
  value: number | string;
  claimed: boolean;
}

/** 확장 전투 상태 (기존 BattleState 필드 포함) */
export interface BattleStateV2 {
  // 기존 필드 (하위 호환)
  phase: 'idle' | 'preparing' | 'engaged' | 'player_turn' | 'enemy_turn' | 'animating' | 'victory' | 'defeat';
  turn: number;
  enemy: BattleEnemy | null;
  logs: BattleLogEntry[];

  // 확장 필드
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  skills: BattleSkill[];
  timeline: BattleTurnEntry[];
  rewards: BattleReward[];
  battleId: string;
}