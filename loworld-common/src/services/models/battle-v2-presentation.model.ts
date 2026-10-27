import { BattleSkill, BattleTurnEntry, BattleReward } from './battle.model';

/** 전투 HUD 뷰 모델 (플레이어 + 적 HP/MP 바) */
export interface BattleHudVm {
  playerName: string;
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  enemyName: string | null;
  enemyLevel: number | null;
  enemyHp: number | null;
  enemyMaxHp: number | null;
  turnNumber: number;
  phaseLabel: string;
  phaseTone: 'neutral' | 'danger' | 'success' | 'warning';
}

/** 스킬 슬롯 뷰 모델 */
export interface BattleSkillSlotVm {
  skill: BattleSkill;
  usable: boolean;
  reason?: string;   // 사용 불가 사유 (마나 부족, 쿨다운 등)
}

/** 턴 타임라인 아이템 뷰 모델 */
export interface BattleTimelineItemVm {
  turnNumber: number;
  playerSkillName: string;
  playerDamage?: number;
  isCritical?: boolean;
  enemySkillName?: string;
  enemyDamage?: number;
  resultNarrative: string;
  tone: 'neutral' | 'danger' | 'success';
}

/** 전투 결과 화면 뷰 모델 */
export interface BattleResultVm {
  outcome: 'victory' | 'defeat';
  title: string;
  summary: string;
  rewards: BattleReward[];
  expGained?: number;
  goldGained?: number;
}

/** 전투 액션 이펙트 종류 — 공격/치료/방어(버프)/약화(디버프)/마법 스킬 */
export type BattleActionFxKind = 'attack' | 'heal' | 'defend' | 'buff' | 'debuff' | 'skill';

/** 액션 종류 → 대표 아이콘(이모지) */
export const BATTLE_ACTION_FX_ICON: Record<BattleActionFxKind, string> = {
  attack: '⚔️',
  heal: '💚',
  defend: '🛡️',
  buff: '🛡️',
  debuff: '💀',
  skill: '✨',
};

/**
 * 한 턴 내에서 발생한 개별 행동(플레이어 스킬 · 적 반격 · 아군 AI 공격 등)을
 * 아이콘 + 애니메이션으로 순차 재생하기 위한 이펙트 이벤트.
 */
export interface BattleActionFxEvent {
  id: string;
  turnNumber: number;
  kind: BattleActionFxKind;
  /** 표시용 아이콘(이모지) — 기본은 kind별 BATTLE_ACTION_FX_ICON */
  icon: string;
  /** 스킬명·행동명 (예: "강타", "반격") */
  label: string;
  actorName: string;
  actorSide: 'ally' | 'enemy';
  targetName?: string;
  targetSide: 'ally' | 'enemy';
  /** 피해량 또는 회복량 (없으면 숫자 미표시) */
  amount?: number;
  isCritical?: boolean;
  /** 광역 연출 — 보드 전체 하이라이트용 */
  scope?: 'single' | 'aoe';
}
