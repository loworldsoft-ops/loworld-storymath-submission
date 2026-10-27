/** 비즈니스 플랜 보드 축 식별자 */
export type PlanPillarKey = 'strategy' | 'revenue' | 'marketing' | 'schedule';

/** 플랜 항목 진행 상태 */
export type PlanItemStatus = 'todo' | 'doing' | 'done' | 'risk';

/** 6 BM + 횡단 Develop */
export type PlanBusinessModule =
  | 'story'
  | 'study'
  | 'marketing'
  | 'community'
  | 'apps'
  | 'domain'
  | 'develop';

/** 프로젝트 종류 */
export type PlanProjectKind = 'bm' | 'goal' | 'benchmark' | 'platform';

/** Phase (2026 로드맵) */
export type PlanPhaseId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

/** 프로젝트 목록 필터 */
export type PlanListFilter = 'all' | 'p1-focus' | 'bm-only' | 'goal-only' | 'benchmark-only';

/** 축 아래 구체 항목 */
export interface PlanItem {
  id: string;
  title: string;
  detail?: string;
  status: PlanItemStatus;
  /** 표시용 기한·분기 라벨 (예: Q2, 2026-06-01) */
  dueLabel?: string;
  itemKind?: 'task' | 'milestone' | 'risk' | 'kpi';
  milestoneRef?: string;
  docRef?: string;
  /** 연결 WBS 노드 (feature / deliverable) */
  wbsNodeId?: string;
}

/** WBS 노드 종류 */
export type PlanWbsNodeKind = 'phase' | 'epic' | 'feature' | 'task' | 'deliverable';

export type PlanSpecStatus = 'draft' | 'review' | 'approved';
export type PlanSpecPriority = 'must' | 'should' | 'could';

/** 기능명세서 (WBS feature / deliverable) */
export interface PlanFunctionalSpec {
  id: string;
  title: string;
  summary: string;
  scopeIn: readonly string[];
  scopeOut?: readonly string[];
  userStories?: readonly string[];
  acceptanceCriteria: readonly string[];
  dependencies?: readonly string[];
  uiRefs?: readonly string[];
  apiRefs?: readonly string[];
  dataRefs?: readonly string[];
  docRef?: string;
  priority?: PlanSpecPriority;
  specStatus?: PlanSpecStatus;
  version?: string;
}

export interface PlanWbsNode {
  id: string;
  title: string;
  nodeKind: PlanWbsNodeKind;
  status?: PlanItemStatus;
  dueLabel?: string;
  /** epic 전용 1~2문장 */
  epicBrief?: string;
  linkedItemIds?: readonly string[];
  /** bm phase 스텁 → Goal 프로젝트 전환 */
  linkedProjectId?: string;
  docRef?: string;
  spec?: PlanFunctionalSpec;
  children?: readonly PlanWbsNode[];
}

/** 전략·수익·마케팅·일정 등 한 축 */
export interface PlanPillar {
  id: PlanPillarKey;
  label: string;
  summary: string;
  items: readonly PlanItem[];
}

/** 플랜 이해용 설명 (개요 탭) */
export interface PlanProjectGuide {
  /** 한눈에 보는 요약 (2~4문장) */
  overview: string;
  /** 왜 이 사업·Goal을 하는지 */
  purpose?: string;
  /** 지금 확인할 포인트 */
  checkpoints?: readonly string[];
  /** 다른 BM·서비스와의 관계 */
  synergy?: string;
}

export interface PlanProjectMeta {
  kind: PlanProjectKind;
  bm?: PlanBusinessModule;
  goalId?: string;
  phase?: PlanPhaseId;
  benchmarks?: readonly string[];
  revenueHypothesis?: string;
  killCriteria?: string;
  codePaths?: readonly string[];
  parentGoalId?: string;
  /** Wave 2: 연결된 PlanProject id */
  linkedProjectIds?: readonly string[];
}

/** 단일 프로젝트(제품·사업·Goal 단위) */
export interface PlanProject {
  id: string;
  name: string;
  subtitle?: string;
  tags?: readonly string[];
  /** 전체 진척 감 (0–100, 선택) */
  healthPercent?: number;
  meta: PlanProjectMeta;
  /** 개요 탭에 표시할 이해용 설명 */
  guide?: PlanProjectGuide;
  pillars: readonly PlanPillar[];
  /** 없으면 WBS Chip 숨김 */
  wbs?: readonly PlanWbsNode[];
}
