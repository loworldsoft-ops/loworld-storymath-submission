import { ComponentMeta } from '../../services/models/os.types';

export const STRATEGY_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-wbs-tree',
    name: 'PlanWbsTree',
    selector: 'lw-wbs-tree',
    domain: 'plan',
    category: 'data',
    description: 'Plan WBS 계층 트리. 접기/펼치기·검색·노드 선택.',
    usedIn: [{ app: 'loworld-plan', role: 'WBS 트리', feature: '실행 분해', direct: true }],
    inputs: [
      { name: 'nodes', type: 'readonly PlanWbsNode[]' },
      { name: 'selectedId', type: 'string | null' },
      { name: 'showSearch', type: 'boolean' },
    ],
    outputs: [
      { name: 'nodeSelect', type: 'string' },
      { name: 'linkedProjectNavigate', type: 'string' },
    ],
  },
  {
    id: 'lw-strategy-spec-panel',
    name: 'PlanSpecPanel',
    selector: 'lw-strategy-spec-panel',
    domain: 'plan',
    category: 'data',
    description: 'WBS feature/deliverable 노드의 기능명세서 패널.',
    usedIn: [{ app: 'loworld-plan', role: '명세 패널', feature: '기능명세', direct: true }],
    inputs: [
      { name: 'node', type: 'PlanWbsNode | null' },
      { name: 'linkedPillarLabels', type: 'readonly { pillarLabel: string; itemTitle: string }[]' },
      { name: 'showWbsLink', type: 'boolean' },
    ],
    outputs: [
      { name: 'openInWbs', type: 'void' },
    ],
  },
];

export const PLAN_CATALOG = STRATEGY_CATALOG;
