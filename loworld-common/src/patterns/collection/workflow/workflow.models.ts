export type LwWorkflowNodeType = 'start' | 'llm' | 'condition' | 'tool' | 'rag' | 'output';

export interface LwWorkflowPort {
  readonly id: string;
  readonly label: string;
  readonly connected?: boolean;
}

export interface LwWorkflowNode {
  readonly id: string;
  readonly type: LwWorkflowNodeType;
  readonly title: string;
  readonly description?: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly status?: 'idle' | 'running' | 'success' | 'failed';
  readonly inputs: readonly LwWorkflowPort[];
  readonly outputs: readonly LwWorkflowPort[];
  /** 블록별 설정 값 (모델, 프롬프트, 조건식 등) */
  readonly config?: Readonly<Record<string, string>>;
}

export interface LwWorkflowEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly sourcePortId: string;
  readonly targetNodeId: string;
  readonly targetPortId: string;
  readonly animated?: boolean;
  readonly label?: string;
}

export interface LwWorkflowConnection {
  readonly sourceNodeId: string;
  readonly sourcePortId: string;
  readonly targetNodeId: string;
  readonly targetPortId: string;
}

export interface LwCanvasTransform {
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
}

export interface LwWorkflowConfigField {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'textarea' | 'number';
  readonly placeholder?: string;
}

export interface LwWorkflowNodeTheme {
  readonly label: string;
  readonly icon: string;
  readonly desc: string;
  readonly fields: readonly LwWorkflowConfigField[];
}

/** 블록 종류별 표시 정보와 설정 폼 정의. 새 블록은 여기에만 추가하면 된다. */
export const WORKFLOW_NODE_THEMES: Readonly<Record<LwWorkflowNodeType, LwWorkflowNodeTheme>> = {
  start: {
    label: 'Start',
    icon: 'play',
    desc: '워크플로우 시작점과 입력 형식',
    fields: [{ key: 'trigger', label: '트리거', type: 'text', placeholder: 'Webhook: POST /v1/...' }],
  },
  llm: {
    label: 'Agent',
    icon: 'bot',
    desc: 'LLM 호출 블록',
    fields: [
      { key: 'model', label: '모델', type: 'text', placeholder: 'gpt-5.4' },
      { key: 'temperature', label: 'Temperature', type: 'number' },
      { key: 'prompt', label: '시스템 프롬프트', type: 'textarea' },
    ],
  },
  rag: {
    label: 'Knowledge',
    icon: 'brain',
    desc: 'RAG Space 검색',
    fields: [
      { key: 'space', label: 'RAG Space', type: 'text' },
      { key: 'topK', label: 'Top K', type: 'number' },
    ],
  },
  tool: {
    label: 'API',
    icon: 'plug',
    desc: '외부 API 호출',
    fields: [
      { key: 'method', label: 'Method', type: 'text', placeholder: 'GET' },
      { key: 'url', label: 'URL', type: 'text' },
    ],
  },
  condition: {
    label: 'Condition',
    icon: 'git-branch',
    desc: '조건에 따라 분기',
    fields: [{ key: 'expression', label: '조건식', type: 'text', placeholder: 'score >= 75' }],
  },
  output: {
    label: 'Output',
    icon: 'check-circle',
    desc: '결과 반환 또는 전달',
    fields: [{ key: 'target', label: '전달 대상', type: 'text' }],
  },
};

export const WORKFLOW_NODE_TYPES = Object.keys(WORKFLOW_NODE_THEMES) as LwWorkflowNodeType[];

export interface LwWorkflowLogLine {
  readonly at: string;
  readonly level: 'info' | 'success' | 'error';
  readonly text: string;
}

export interface LwWorkflowRun {
  readonly id: string;
  readonly status: 'success' | 'failed';
  readonly durationMs: number;
  readonly by: string;
  readonly at: string;
  readonly lines: readonly LwWorkflowLogLine[];
}

export interface LwWorkflowVersion {
  readonly version: number;
  readonly note: string;
  readonly by: string;
  readonly at: string;
  readonly live: boolean;
}
