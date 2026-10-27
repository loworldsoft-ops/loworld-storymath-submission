import type { BattleEnemy, BattleStatusEffect } from './battle.model';
import type { BattleStateV2 } from './battle.model';
import type { BattleSkill } from './battle.model';
import type { BattleActionFxEvent, BattleHudVm, BattleResultVm, BattleSkillSlotVm, BattleTimelineItemVm } from './battle-v2-presentation.model';

/** battle-setup 카드 — 로드아웃 완료 상태 */
export interface LwBattleLoadoutStatusVm {
  isComplete: boolean;
  equippedCount: number;
  totalSlots: number;
  summary: string;
}

/** 참전 팀 전투력 — 멤버 1인 */
export interface LwBattleTeamPowerMemberVm {
  id: string;
  name: string;
  combatPower: number;
}

/** 참전 팀 종합 전투력 요약 */
export interface LwBattleTeamPowerVm {
  teamLabel: string;
  memberCount: number;
  totalCombatPower: number;
  members: LwBattleTeamPowerMemberVm[];
  isMultiMember: boolean;
}

/** 전투 prose — 화자 측 */
export type BattleProseSpeakerSide = 'ally' | 'enemy' | 'narrator';

/** 전투 prose — 한 줄 (지문·대화·시스템) */
export interface BattleProseEntry {
  id: string;
  turnNumber: number;
  kind: 'narration' | 'dialogue' | 'system';
  text: string;
  speakerName?: string;
  speakerSide?: BattleProseSpeakerSide;
  tone?: 'neutral' | 'danger' | 'success';
}

/** 샌드박스 다인 전투 — 아군 전투원 스냅샷 */
export interface BattleAllyCombatantVm {
  id: string;
  name: string;
  role: string;
  level: number;
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  isPlayerControlled: boolean;
  statusEffects?: BattleStatusEffect[];
  /** 전투 중 MP·쿨다운과 함께 갱신되는 보유 스킬 (없으면 기본 공격만) */
  skills?: BattleSkill[];
}

/** 소설 내부에 내장될 전투 아레나 최소 상태 뷰 모델 */
export interface LwBattleEncounterVm {
  hud: BattleHudVm;
  enemy: BattleEnemy | null;
  enemies?: BattleEnemy[];
  allies?: BattleAllyCombatantVm[];
  selectedTargetId?: string | null;
  isMultiParty?: boolean;
  allyTeamPower?: LwBattleTeamPowerVm;
  enemyTeamPower?: LwBattleTeamPowerVm;
  proseEntries?: BattleProseEntry[];
  actionFx?: BattleActionFxEvent[];
  skills: BattleSkillSlotVm[];
  timeline: BattleTimelineItemVm[];
  currentNarrative: string | null;
  result: BattleResultVm | null;
  phase: BattleStateV2['phase'] | 'idle';
  activeAllyId?: string | null;
  manualPartyControl?: boolean;
  manualPendingAllyIds?: string[];
  manualEnemyControl?: boolean;
  manualPendingEnemyIds?: string[];
  activeEnemyId?: string | null;
  selectedAllyTargetId?: string | null;
}

/** 전체모드 우측 패널 — 간단 전투 요약 VM */
export interface LwBattleSummaryInspectorVm {
  phase: 'idle' | 'fighting' | 'victory' | 'defeat';
  turnNumber: number;
  phaseLabel: string;
  allyName: string;
  enemyName: string;
  allyCombatPower: number;
  enemyCombatPower: number;
  keyEquipmentLine: string;
  hud: BattleHudVm | null;
  enemy: BattleEnemy | null;
  latestEvent?: string | null;
  autoStatus?: string | null;
  allyTeamPower?: LwBattleTeamPowerVm | null;
  enemyTeamPower?: LwBattleTeamPowerVm | null;
}

export type BattleInspectorTabVariant = 'arena' | 'matchup' | 'summary';

/** read-only 장착 1슬롯 */
export interface LwBattleMatchupGearEntry {
  slotLabel: string;
  item: import('./item.model').Item;
}

/** read-only 장착 장비 묶음 */
export interface LwBattleMatchupCombatantGear {
  combatPower: number;
  equipmentSummary: string;
  entries: LwBattleMatchupGearEntry[];
}

/** 인스pector — 팀 로스터 1인 */
export interface LwBattleMatchupTeamMemberVm {
  id: string;
  name: string;
  roleOrThreat?: string;
  level: number;
  summary?: string;
  gear: LwBattleMatchupCombatantGear;
  life?: number;
  maxLife?: number;
}

/** 인스pector 전투 탭 — 아군·적군 read-only 대결 정보 */
export interface LwBattleMatchupInspectorVm {
  phase: 'setup' | 'fighting';
  isMultiParty: boolean;
  allyTeam: LwBattleMatchupTeamMemberVm[];
  enemyTeam: LwBattleMatchupTeamMemberVm[];
  allyTeamPower: LwBattleTeamPowerVm;
  enemyTeamPower: LwBattleTeamPowerVm;
  allyName: string;
  allyRole: string;
  allyLevel: number;
  allySummary: string;
  allyGear: LwBattleMatchupCombatantGear;
  enemyName: string;
  enemyLevel: number;
  enemySummary: string;
  enemyThreat?: string;
  enemyScaledHp: number;
  enemyGear: LwBattleMatchupCombatantGear;
  hud: import('./battle-v2-presentation.model').BattleHudVm | null;
  enemy: import('./battle.model').BattleEnemy | null;
  enemies?: import('./battle.model').BattleEnemy[];
}
