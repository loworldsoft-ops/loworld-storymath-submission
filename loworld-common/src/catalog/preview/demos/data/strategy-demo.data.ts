import type { PlanWbsNode } from '../../../../services/models/strategy.model';

export const STRATEGY_DEMO_WBS: readonly PlanWbsNode[] = [
  {
    id: 'wbs-demo-phase-1',
    title: 'Phase 1: 기반 시스템 구축',
    nodeKind: 'phase',
    status: 'done',
    children: [
      {
        id: 'wbs-demo-epic-core',
        title: 'Core 아키텍처 재정비',
        nodeKind: 'epic',
        status: 'done',
        epicBrief: '공통 컴포넌트 라이브러리 및 독립 패키지 체계 구성',
        children: [
          {
            id: 'wbs-demo-feat-workbench',
            title: 'lw-workbench 통합 프레임워크',
            nodeKind: 'feature',
            status: 'done',
            spec: {
              id: 'spec-demo-workbench',
              title: 'lw-workbench 반응형 레이아웃 명세',
              summary: '데스크톱 3-pane 및 모바일 단일 뷰포트를 일관되게 지원하는 공통 워크벤치 프레임워크',
              scopeIn: ['Desktop/Mobile 적응형 렌더링', 'Titlebar / Nav / Content 슬롯'],
              acceptanceCriteria: ['브라우저 리사이징 시 끊김 없는 뷰 전환', 'verify-app 통과'],
              specStatus: 'approved',
              priority: 'must',
            },
          },
        ],
      },
    ],
  },
];

export const PLAN_DEMO_WBS = STRATEGY_DEMO_WBS;
