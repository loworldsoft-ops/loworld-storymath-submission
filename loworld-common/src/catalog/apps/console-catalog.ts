import { ComponentMeta } from '../../services/models/os.types';

export const CONSOLE_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-console-shell',
    name: 'ConsoleShell',
    selector: 'lw-console-shell',
    domain: 'common',
    category: 'layout',
    description: 'LLMOps 콘솔 셸. 좌측 사이드바와 본문 뷰포트.',
    usedIn: [{ app: 'loworld-llmops', role: '앱 셸', feature: '내비게이션', direct: true }],
    inputs: [
      { name: 'activeTab', type: "FoundryTabId" },
      { name: 'currentGroup', type: "FoundryGroup" },
      { name: 'user', type: "FoundryUser" },
      { name: 'collapsed', type: "boolean" }
    ],
    outputs: [
      { name: 'selectTab', type: "FoundryTabId" },
      { name: 'selectGroup', type: "string" },
      { name: 'openProfile', type: "void" }
    ],
  },
  {
    id: 'lw-console-page',
    name: 'ConsolePage',
    selector: 'lw-console-page',
    domain: 'common',
    category: 'layout',
    description: '화면 공통 레이아웃. 제목 줄, 도구 줄, 스크롤 본문.',
    usedIn: [{ app: 'loworld-llmops', role: '화면 레이아웃', feature: '페이지 골격', direct: true }],
    inputs: [
      { name: 'title', type: "string" },
      { name: 'subtitle', type: "string" },
      { name: 'icon', type: "string" },
      { name: 'flush', type: "boolean" }
    ],
    outputs: [],
  },
  {
    id: 'lw-console-change-log',
    name: 'ConsoleChangeLog',
    selector: 'lw-console-change-log',
    domain: 'common',
    category: 'view',
    description: '변경 이력 표. 권한이 없으면 안내를 표시.',
    usedIn: [{ app: 'loworld-llmops', role: '변경 이력', feature: '감사 로그', direct: true }],
    inputs: [
      { name: 'logs', type: "FoundryChangeLog[]" },
      { name: 'permitted', type: "boolean" }
    ],
    outputs: [],
  },
  {
    id: 'lw-console-profile-modal',
    name: 'ConsoleProfileModal',
    selector: 'lw-console-profile-modal',
    domain: 'common',
    category: 'popups',
    description: '사용자 설정 모달. 프로필, 보안, 환경 설정.',
    usedIn: [{ app: 'loworld-llmops', role: '사용자 설정', feature: '프로필', direct: true }],
    inputs: [
      { name: 'open', type: "boolean" },
      { name: 'user', type: "FoundryUser" },
      { name: 'theme', type: "'light' | 'dark' | 'system'" }
    ],
    outputs: [
      { name: 'close', type: "void" },
      { name: 'themeChange', type: "FoundryThemeChoice" }
    ],
  },
  {
    id: 'lw-pipeline-stepper',
    name: 'PipelineStepper',
    selector: 'lw-pipeline-stepper',
    domain: 'common',
    category: 'view',
    description: '파이프라인 단계 진행 표시.',
    usedIn: [{ app: 'loworld-llmops', role: 'RAG', feature: '진행 상태', direct: true }],
    inputs: [
      { name: 'steps', type: "LwPipelineStepItem[]" },
      { name: 'selectedStepId', type: "string | null" }
    ],
    outputs: [
      { name: 'stepSelect', type: "LwPipelineStepItem" }
    ],
  },
  {
    id: 'lw-prompt-diff-viewer',
    name: 'PromptDiffViewer',
    selector: 'lw-prompt-diff-viewer',
    domain: 'common',
    category: 'view',
    description: '두 텍스트의 단어 단위 차이 표시.',
    usedIn: [{ app: 'loworld-llmops', role: '프롬프트 라이브러리', feature: '버전 비교', direct: true }],
    inputs: [
      { name: 'oldText', type: "string" },
      { name: 'newText', type: "string" }
    ],
    outputs: [],
  },
  {
    id: 'lw-workflow-canvas',
    name: 'WorkflowCanvas',
    selector: 'lw-workflow-canvas',
    domain: 'common',
    category: 'view',
    description: '워크플로우 캔버스. 이동, 확대, 블록 드래그, 포트 연결, 화면 맞춤.',
    usedIn: [{ app: 'loworld-llmops', role: '워크플로우', feature: '캔버스', direct: true }],
    inputs: [
      { name: 'nodes', type: "LwWorkflowNode[]" },
      { name: 'edges', type: "LwWorkflowEdge[]" },
      { name: 'selectedNodeId', type: "string | null" }
    ],
    outputs: [
      { name: 'nodePositionChange', type: "{ id; position }" },
      { name: 'connect', type: "LwWorkflowConnection" }
    ],
  },
  {
    id: 'lw-workflow-node',
    name: 'WorkflowNode',
    selector: 'lw-workflow-node',
    domain: 'common',
    category: 'view',
    description: '워크플로우 블록. 종류 표시, 상태, 입출력 포트.',
    usedIn: [{ app: 'loworld-llmops', role: '워크플로우', feature: '블록', direct: true }],
    inputs: [
      { name: 'node', type: "LwWorkflowNode" },
      { name: 'selected', type: "boolean" }
    ],
    outputs: [
      { name: 'select', type: "LwWorkflowNode" },
      { name: 'portSelect', type: "LwWorkflowPortEvent" }
    ],
  },
  {
    id: 'lw-rbac-permission-matrix',
    name: 'RbacPermissionMatrix',
    selector: 'lw-rbac-permission-matrix',
    domain: 'common',
    category: 'view',
    description: '역할별 권한 매트릭스.',
    usedIn: [{ app: 'loworld-llmops', role: '조직', feature: '권한', direct: true }],
    inputs: [
      { name: 'matrix', type: "RbacRoleMatrixRow[]" },
      { name: 'roles', type: "OrgRole[]" }
    ],
    outputs: [
      { name: 'togglePermission', type: "{ domain; role; value }" }
    ],
  },
  {
    id: 'lw-model-detail-drawer',
    name: 'ModelDetailDrawer',
    selector: 'lw-model-detail-drawer',
    domain: 'common',
    category: 'popups',
    description: '모델 상세 패널. 개요, 기본값 설정, 사용처.',
    usedIn: [{ app: 'loworld-llmops', role: '모델 상세', feature: '모델 거버넌스', direct: true }],
    inputs: [
      { name: 'model', type: "FoundryModel | null" },
      { name: 'activeTab', type: "ModelDrawerTab" },
      { name: 'usages', type: "ModelUsageRef[]" }
    ],
    outputs: [
      { name: 'saveSettings', type: "ModelParamSettings" },
      { name: 'closeDrawer', type: "void" }
    ],
  },
];

