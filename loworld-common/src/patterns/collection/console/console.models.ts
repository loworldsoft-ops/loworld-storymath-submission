/**
 * LLMOps Foundry 도메인 모델.
 * 상태 값은 코드(영문)로 두고, 화면 표시는 `*_LABELS` 맵으로 분리한다.
 */

export type ConsoleTabId =
  | 'dashboard'
  | 'credentials'
  | 'spaces'
  | 'data-library'
  | 'pii-masking'
  | 'rag'
  | 'prompts'
  | 'playground'
  | 'chatbot-hub'
  | 'workflow'
  | 'organization'
  | 'usage'
  | 'external-connections'
  | 'notices';

export const CONSOLE_TAB_IDS: readonly ConsoleTabId[] = [
  'dashboard',
  'credentials',
  'spaces',
  'data-library',
  'pii-masking',
  'rag',
  'prompts',
  'playground',
  'chatbot-hub',
  'workflow',
  'organization',
  'usage',
  'external-connections',
  'notices',
];

export type ConsoleTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

// ── 모델 ──
export type ModelProvider = 'OpenAI' | 'AWS Bedrock' | 'Custom';
export type ModelType = 'LLM' | 'VLM' | 'Embedding' | 'Reranker' | 'Parser';
export type KeyStatus = 'registered' | 'none';
export type ModelScope = 'workspace' | 'ragops' | 'playground';

export const MODEL_SCOPES: readonly ModelScope[] = ['workspace', 'ragops', 'playground'];

export const MODEL_SCOPE_LABELS: Readonly<Record<ModelScope, string>> = {
  workspace: '워크스페이스 (Workflow)',
  ragops: 'RAGOps 파이프라인',
  playground: '플레이그라운드 (Playground)',
};

export const MODEL_TYPE_TONES: Readonly<Record<ModelType, ConsoleTone>> = {
  VLM: 'primary',
  LLM: 'info',
  Embedding: 'success',
  Reranker: 'warning',
  Parser: 'neutral',
};

export const MODEL_PROVIDERS: readonly ModelProvider[] = ['OpenAI', 'AWS Bedrock', 'Custom'];
export const MODEL_TYPES: readonly ModelType[] = ['LLM', 'VLM', 'Embedding', 'Reranker', 'Parser'];

export interface ModelDeprecation {
  readonly end: string;
  readonly note: string;
}

export interface ConsoleModel {
  readonly idx: number;
  readonly provider: ModelProvider;
  readonly name: string;
  readonly id: string;
  readonly type: ModelType;
  readonly key: KeyStatus;
  readonly keyName: string | null;
  readonly enabled: boolean;
  readonly deprecated: ModelDeprecation | null;
  readonly ctx: number;
  readonly maxOut: number;
  readonly scope: readonly ModelScope[];
  /** [입력, 출력] $/1M tokens */
  readonly price: readonly [number, number];
  readonly temperature?: number;
  readonly topP?: number;
  readonly maxTokens?: number;
}

export interface ModelParamSettings {
  readonly idx: number;
  readonly temperature: number;
  readonly topP: number;
  readonly maxTokens: number;
}

export interface ModelKeyRegistrationPayload {
  readonly provider: ModelProvider;
  readonly keyName: string;
  readonly apiKey: string;
  readonly description: string;
}

export interface ModelUsageRef {
  readonly kind: 'workflow' | 'pipeline';
  readonly name: string;
  readonly owner: string;
}

/** 변경 이력 공통 행 (모델, 워크스페이스, 라이브러리, 조직) */
export interface ConsoleChangeLog {
  readonly id: string;
  readonly type: string;
  readonly target: string;
  readonly tag: string;
  readonly detail: string;
  readonly group: string;
  readonly by: string;
  readonly at: string;
}

// ── 그룹 / 사용자 ──
export type ConsoleGroupRole = 'admin' | 'member';

export const CONSOLE_GROUP_ROLE_LABELS: Readonly<Record<ConsoleGroupRole, string>> = {
  admin: '그룹관리자',
  member: '그룹원',
};

export interface ConsoleGroup {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly count: number;
  readonly role: ConsoleGroupRole;
  readonly parent?: string;
}

export interface ConsoleUser {
  readonly name: string;
  readonly email: string;
  readonly roleLabel: string;
}

// ── 워크스페이스 ──
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';
export type WorkspaceShare = 'shared' | 'private';

export const WORKSPACE_ROLE_LABELS: Readonly<Record<WorkspaceRole, string>> = {
  owner: '오너',
  editor: '에디터',
  viewer: '뷰어',
};

export const WORKSPACE_ROLE_TONES: Readonly<Record<WorkspaceRole, ConsoleTone>> = {
  owner: 'primary',
  editor: 'success',
  viewer: 'neutral',
};

export const WORKSPACE_SHARE_LABELS: Readonly<Record<WorkspaceShare, string>> = {
  shared: '공유',
  private: '개인',
};

export interface ConsoleWorkspace {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly role: WorkspaceRole;
  readonly members: number;
  readonly workflows: number;
  readonly share: WorkspaceShare;
  readonly fav: boolean;
  readonly owner: string;
  /** 내가 속하지 않은(전체 탭에서만 보이는) 워크스페이스 */
  readonly external?: boolean;
  readonly updatedAt?: string;
}

export interface NewSpacePayload {
  readonly name: string;
  readonly desc: string;
  readonly share: WorkspaceShare;
}

// ── 데이터 라이브러리 ──
export interface DataLibraryFolderItem {
  readonly id: number;
  readonly name: string;
  readonly parent: number | null;
  readonly base?: boolean;
  readonly size: string;
  readonly date: string;
}

export interface DataLibraryFileItem {
  readonly id: string;
  readonly folder: number;
  readonly name: string;
  readonly size: string;
  readonly source: string;
  readonly dataset: string;
  readonly date: string;
  readonly by: string;
  readonly hasOrigin: boolean;
  readonly preview?: string;
}

export type DataLibrarySortKey = 'name' | 'size' | 'date';

// ── PII ──
export type PiiOwner = 'group' | 'global';

export interface PiiItem {
  readonly name: string;
  readonly regex: string;
  readonly enabled: boolean;
}

export interface PiiCategory {
  readonly cat: string;
  readonly owner: PiiOwner;
  readonly items: readonly PiiItem[];
}

export interface PiiPatternPayload {
  readonly category: string;
  /** 수정이면 기존 이름, 등록이면 null */
  readonly originalName: string | null;
  readonly name: string;
  readonly regex: string;
}

// ── RAG ──
export type RagSpaceStatus = 'ready' | 'indexing' | 'needs-setup';

export const RAG_STATUS_LABELS: Readonly<Record<RagSpaceStatus, string>> = {
  ready: '사용 가능',
  indexing: '인덱싱 중',
  'needs-setup': '설정 필요',
};

export const RAG_STATUS_TONES: Readonly<Record<RagSpaceStatus, ConsoleTone>> = {
  ready: 'success',
  indexing: 'info',
  'needs-setup': 'warning',
};

export interface RagSpace {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly status: RagSpaceStatus;
  readonly datasets: number;
  readonly chunks: number;
  readonly embedder: string;
  readonly owner: string;
  readonly updatedAt: string;
  readonly version: string;
}

export interface RagDataset {
  readonly id: string;
  readonly name: string;
  readonly files: number;
  readonly chunks: number;
  readonly status: 'indexed' | 'pending' | 'failed';
  readonly updatedAt: string;
}

export type RagNodeKind = 'start' | 'parser' | 'chunker' | 'embedder' | 'vectorstore';

export interface RagNodeField {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'number' | 'select';
  readonly value: string;
  readonly options?: readonly string[];
}

export interface RagPipelineNode {
  readonly id: string;
  readonly kind: RagNodeKind;
  readonly title: string;
  readonly summary: string;
  readonly fields: readonly RagNodeField[];
}

export interface RagRunLog {
  readonly id: string;
  readonly kind: 'index' | 'query';
  readonly title: string;
  readonly status: 'success' | 'failed' | 'running';
  readonly durationMs: number;
  readonly by: string;
  readonly at: string;
  readonly detail: string;
}

export interface RagApiKey {
  readonly id: string;
  readonly name: string;
  readonly masked: string;
  readonly createdAt: string;
}

export interface RagQueryHit {
  readonly chunkId: string;
  readonly document: string;
  readonly score: number;
  readonly text: string;
}

export interface NewRagPayload {
  readonly name: string;
  readonly desc: string;
  readonly embedder: string;
}

// ── 프롬프트 ──
export interface PromptVersion {
  readonly version: number;
  readonly body: string;
  readonly note: string;
  readonly by: string;
  readonly at: string;
}

export interface PromptEntry {
  readonly name: string;
  readonly desc: string;
  readonly scope: 'group' | 'private';
  readonly tags: readonly string[];
  readonly versions: readonly PromptVersion[];
  readonly usedIn: readonly string[];
  readonly updatedAt: string;
}

export interface NewPromptPayload {
  readonly name: string;
  readonly desc: string;
  readonly body: string;
}

export interface NewPromptVersionPayload {
  readonly name: string;
  readonly body: string;
  readonly note: string;
}

// ── 플레이그라운드 ──
export type PlaygroundRole = 'system' | 'user' | 'assistant';

export interface PlaygroundMessage {
  readonly role: PlaygroundRole;
  readonly content: string;
}

export interface PlaygroundWindow {
  readonly id: string;
  readonly modelId: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly messages: readonly PlaygroundMessage[];
  readonly output: string;
  readonly isRunning: boolean;
  readonly latencyMs: number;
  readonly tokenCount: number;
  readonly isJsonView: boolean;
  readonly showParams: boolean;
}

// ── 대시보드 / 공지 ──
export interface ConsoleNoticeItem {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly date: string;
  readonly views: number;
  readonly scope: string;
  readonly body: string;
  readonly summary: string;
  readonly read: boolean;
  readonly category: 'system' | 'model' | 'security' | 'update' | 'maintenance';
}

export interface ConsoleKpiMetric {
  readonly id: string;
  readonly title: string;
  readonly value: string;
  readonly changeRate: string;
  readonly trend: 'up' | 'down' | 'neutral';
  readonly icon: string;
  readonly description: string;
}

// ── 챗봇 허브 ──
export interface ChatbotAgent {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly model: string;
  readonly category: string;
  readonly desc: string;
  readonly fav: boolean;
}

export interface ChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'assistant' | 'system';
  readonly text: string;
  readonly timestamp: string;
  readonly streaming?: boolean;
}

export interface ChatThread {
  readonly id: string;
  readonly title: string;
  readonly agentId: string;
  readonly pinned: boolean;
  readonly messages: readonly ChatMessage[];
}

// ── 조직 ──
export type OrgRoleId = 'owner' | 'admin' | 'manager' | 'member';

export interface OrgRole {
  readonly id: OrgRoleId;
  readonly name: string;
  readonly desc: string;
  readonly tone: ConsoleTone;
}

export interface OrgMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: OrgRoleId;
  readonly groupId: string;
  readonly status: 'active' | 'invited';
  readonly joinedAt: string;
}

export interface RbacRoleMatrixRow {
  readonly domain: string;
  readonly domainLabel: string;
  readonly owner: boolean;
  readonly admin: boolean;
  readonly manager: boolean;
  readonly member: boolean;
}

export interface InviteMemberPayload {
  readonly email: string;
  readonly name: string;
  readonly role: OrgRoleId;
}

// ── 사용량 ──
export type UsageViewKey =
  | 'overview'
  | 'by-provider'
  | 'by-model'
  | 'by-user'
  | 'by-credential'
  | 'by-workspace'
  | 'by-ragops'
  | 'by-playground';

export type UsagePeriod = '24h' | '7d' | '30d' | 'month';

export interface UsageRow {
  readonly id: string;
  readonly label: string;
  readonly sub: string;
  readonly calls: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly share: number;
  readonly children?: readonly UsageRow[];
}

// ── 외부 연결 ──
export type ConnectionCategory = 'VectorDB' | 'SearchEngine' | 'Storage' | 'ModelHub';
export type ConnectionStatus = 'connected' | 'error' | 'disabled';

export const CONNECTION_STATUS_LABELS: Readonly<Record<ConnectionStatus, string>> = {
  connected: '연결됨',
  error: '오류',
  disabled: '비활성',
};

export const CONNECTION_STATUS_TONES: Readonly<Record<ConnectionStatus, ConsoleTone>> = {
  connected: 'success',
  error: 'danger',
  disabled: 'neutral',
};

export interface ExternalConnectionItem {
  readonly id: string;
  readonly name: string;
  readonly category: ConnectionCategory;
  readonly endpoint: string;
  readonly status: ConnectionStatus;
  readonly latencyMs: number;
  readonly lastSync: string;
  readonly desc: string;
}

export interface ConnectionPayload {
  /** 수정이면 대상 id, 신규면 null */
  readonly id: string | null;
  readonly name: string;
  readonly category: ConnectionCategory;
  readonly endpoint: string;
  readonly desc: string;
}


