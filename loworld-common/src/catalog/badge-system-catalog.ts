/**
 * LoworldUI Informational Badge Design System & Full Audit Catalog
 * 모노레포 전역(1,460개 정보성 배지/태그/칩 인스턴스) 전수조사 데이터 및 6대 스타일 분류 체계
 * 💡 디자인 정책: 'STEP 1' 단일 표준 스타일(Soft Pearl Slate Box, 4px Radius)로 100% 전면 통일
 */

import type { LwBadgeTone, LwBadgeVariant, LwBadgeSize } from '../services/tokens/global.tokens';

export interface BadgeAuditMetrics {
  totalCount: number;
  unmigratedRawCount: number;
  unifiedRate: number;
  styleFamiliesCount: number;
  variantsCount: number;
  sizesCount: number;
  tonesCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface BadgeSampleItem {
  id: string;
  name: string;
  description: string;
  tone: LwBadgeTone;
  variant: LwBadgeVariant;
  size: LwBadgeSize;
  pill?: boolean;
  icon?: string;
  trailingIcon?: string;
  content: string;
  htmlSnippet: string;
  useCase: string;
  realWorldLocation?: string;
}

export interface BadgeStyleFamily {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  countApprox: number;
  percentage: number;
  colorTone: string;
  items: BadgeSampleItem[];
}

export interface BadgeApiProp {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
  required?: boolean;
}

export const BADGE_AUDIT_METRICS: BadgeAuditMetrics = {
  totalCount: 1460,
  unmigratedRawCount: 0,
  unifiedRate: 100,
  styleFamiliesCount: 6,
  variantsCount: 1, // 단일 표준 통일
  sizesCount: 4,
  tonesCount: 1, // 단일 무채색 펄 슬레이트 통일
  appDistribution: [
    { app: 'showcase', label: 'Showcase Portal', count: 482, percentage: 33.0 },
    { app: 'wuxia', label: '무협 세계관 (Wuxia)', count: 326, percentage: 22.3 },
    { app: 'fantasy', label: '판타지 RPG (Fantasy)', count: 284, percentage: 19.5 },
    { app: 'mystery', label: '추리 스릴러 (Mystery)', count: 168, percentage: 11.5 },
    { app: 'sci-fi', label: 'SF 사이버펑크 (Sci-Fi)', count: 120, percentage: 8.2 },
    { app: 'core', label: '공통 프리미티브 & 패널', count: 80, percentage: 5.5 },
  ],
};

export const BADGE_STYLE_FAMILIES: BadgeStyleFamily[] = [
  {
    id: 'date-step',
    name: 'Date & Step Indicators',
    nameKo: '일자 · 단계 · 시각 지시자',
    icon: '📅',
    description: '공정 진행 순서, 단계 번호, 일자 및 타임스탬프를 직관적으로 전달하는 정보성 지시자',
    countApprox: 296,
    percentage: 20.3,
    colorTone: '#3b82f6',
    items: [
      {
        id: 'date-step-1',
        name: 'Step 1 단계 배지',
        description: '공정 첫 단계 명시 (표준 기본 스타일)',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '📅',
        content: 'STEP 1',
        htmlSnippet: '<lw-badge size="sm" icon="📅" label="STEP 1" />',
        useCase: '통합 로케이션 배너 헤더 공정 1단계 명시',
        realWorldLocation: 'collection/panels/unified-location-banner-panel/banner-header',
      },
      {
        id: 'date-step-2',
        name: '타임스탬프 배지',
        description: '작전 및 세션 진행 시간',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '🕒',
        content: '14:30 KST',
        htmlSnippet: '<lw-badge size="sm" icon="🕒" label="14:30 KST" />',
        useCase: '배너 헤더 실시간 타임스탬프 및 로그 기록 시각',
        realWorldLocation: 'collection/panels/unified-location-banner-panel/banner-header',
      },
      {
        id: 'date-step-3',
        name: 'Day 서사 일차 배지',
        description: '소설 시나리오 진행 일차',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '📜',
        content: 'DAY 03',
        htmlSnippet: '<lw-badge size="sm" icon="📜" label="DAY 03" />',
        useCase: '무협/판타지 챕터 진행 서사 일차 표기',
        realWorldLocation: 'domains/novel/narrative-engine',
      },
      {
        id: 'date-step-4',
        name: '스테이지 지시 배지',
        description: '전투 스테이지 및 구역 표기',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'STAGE 2-4',
        htmlSnippet: '<lw-badge size="xs" label="STAGE 2-4" />',
        useCase: '던전 탐험 스테이지 번호 표기',
        realWorldLocation: 'collection/cards/dungeon-stage-card',
      },
    ],
  },
  {
    id: 'status-progress',
    name: 'Status & Progress Indicators',
    nameKo: '상태 · 진행도 · 헬스체크 배지',
    icon: '⚡',
    description: '시스템 가동 상태, 엔티티 생존 여부, 성공/경고/위험 상태를 명확한 시각 톤으로 시그널링',
    countApprox: 384,
    percentage: 26.3,
    colorTone: '#10b981',
    items: [
      {
        id: 'status-active',
        name: '정상 가동 (Active)',
        description: '시스템 및 엔티티 활성 상태',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '●',
        content: '정상 운영 (Operational)',
        htmlSnippet: '<lw-badge size="sm" icon="●" label="정상 운영" />',
        useCase: '병원/시설 인프라 가동 상태 표시',
        realWorldLocation: 'collection/panels/unified-location-banner-panel',
      },
      {
        id: 'status-standby',
        name: '대기중 (Standby)',
        description: '작업 준비 대기 상태',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '▲',
        content: '대기중 (Standby)',
        htmlSnippet: '<lw-badge size="sm" icon="▲" label="대기중" />',
        useCase: '퀘스트 수락 대기 및 큐 상태',
        realWorldLocation: 'collection/items/quest-item',
      },
      {
        id: 'status-danger',
        name: '점검 / 위험 (Critical)',
        description: '장애 발생 또는 위험 상황',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '⚠️',
        content: '경고 상태 (Alert)',
        htmlSnippet: '<lw-badge size="sm" icon="⚠️" label="경고 상태" />',
        useCase: '시설 파괴/피습 경고 지시자',
        realWorldLocation: 'collection/panels/hospital-emergency-panel',
      },
      {
        id: 'status-syncing',
        name: '동기화 진행 (Syncing)',
        description: '실시간 데이터 싱크 진행률',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: '동기화 92%',
        htmlSnippet: '<lw-badge size="xs" label="동기화 92%" />',
        useCase: '서버 데이터 싱크 진행 상태',
        realWorldLocation: 'shared/sync-status-bar',
      },
      {
        id: 'status-page-indicator',
        name: 'macOS 페이지 인디케이터 배지 (Page Tab)',
        description: '데스크톱 및 모바일 서피스 탭 전환 지시자',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        pill: true,
        icon: '●',
        content: '자주 사용하는 앱',
        htmlSnippet: '<lw-badge size="sm" [pill]="true" icon="●" label="자주 사용하는 앱" />',
        useCase: 'macOS/iOS 서피스 페이지 인디케이터 탭 전환',
        realWorldLocation: 'shell/overview/overview-desktop-surface',
      },
    ],
  },
  {
    id: 'role-topic',
    name: 'Role & Topic Tags',
    nameKo: '역할 · 소속 문파 · 토픽 태그',
    icon: '🏷️',
    description: '캐릭터 역할군, 소속 문파, 콘텐츠 카테고리 태깅을 담당하는 의미론적 지시자',
    countApprox: 248,
    percentage: 17.0,
    colorTone: '#8b5cf6',
    items: [
      {
        id: 'role-clan',
        name: '문파 소속 태그',
        description: '무협 세계관 문파 표기',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '⚔️',
        content: '천룬문 직계 동문',
        htmlSnippet: '<lw-badge size="sm" icon="⚔️" label="천룬문 직계 동문" />',
        useCase: '캐릭터 배너 패널 문파 소속 명시',
        realWorldLocation: 'collection/panels/character-banner-panel',
      },
      {
        id: 'role-admin',
        name: '관리자 / 마스터 역할',
        description: '권한 수준 식별',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'SYSTEM ADMIN',
        htmlSnippet: '<lw-badge size="xs" label="SYSTEM ADMIN" />',
        useCase: '관리자 권한 계정 표기 배지',
        realWorldLocation: 'shell/overview/user-profile',
      },
      {
        id: 'topic-wuxia',
        name: '무협 서사 카테고리',
        description: '장르 토픽 태그',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: '정통 무협',
        htmlSnippet: '<lw-badge size="xs" label="정통 무협" />',
        useCase: '소설 챕터 라이브러리 장르 태그',
        realWorldLocation: 'domains/novel/novel-catalog',
      },
      {
        id: 'topic-rpg',
        name: '판타지 카테고리',
        description: '세계관 분류 태그',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: '다크 판타지',
        htmlSnippet: '<lw-badge size="xs" label="다크 판타지" />',
        useCase: '판타지 RPG 퀘스트 뷰 태그',
        realWorldLocation: 'domains/fantasy/quest-card',
      },
    ],
  },
  {
    id: 'level-stat',
    name: 'Level & Stat Badges',
    nameKo: '레벨 · 스탯 · 티어 지시자',
    icon: '📊',
    description: '캐릭터 레벨, 스탯 증가치, 아이템 티어, 성급 정보를 축약하여 보여주는 게이밍 메트릭',
    countApprox: 212,
    percentage: 14.5,
    colorTone: '#f59e0b',
    items: [
      {
        id: 'stat-level',
        name: '영웅 레벨 배지',
        description: '캐릭터 현재 레벨',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '★',
        content: 'Lv.99 만렙',
        htmlSnippet: '<lw-badge size="sm" icon="★" label="Lv.99 만렙" />',
        useCase: '영웅 세션 허브 레벨 지시자',
        realWorldLocation: 'collection/panels/character-banner-panel',
      },
      {
        id: 'stat-atk',
        name: '공격력 보정 스탯',
        description: '전투 능력치 추가치',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'ATK +1,450',
        htmlSnippet: '<lw-badge size="xs" label="ATK +1,450" />',
        useCase: '장비 상세 툴팁 및 인스펙터',
        realWorldLocation: 'collection/items/equipment-card',
      },
      {
        id: 'stat-exp',
        name: '경험치 게이지 배지',
        description: '현재 레벨 경험치 비율',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'EXP 84.6%',
        htmlSnippet: '<lw-badge size="xs" label="EXP 84.6%" />',
        useCase: '경험치 진행 바 옆 컴팩트 지시자',
        realWorldLocation: 'primitives/data-display/progress-bar',
      },
      {
        id: 'stat-rank',
        name: '신화 티어 랭크',
        description: '최상위 아이템 등급',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '👑',
        content: 'MYTHIC TIER',
        htmlSnippet: '<lw-badge size="sm" icon="👑" label="MYTHIC TIER" />',
        useCase: '무구 도감 신화 등급 배지',
        realWorldLocation: 'domains/wuxia/codex-card',
      },
    ],
  },
  {
    id: 'meta-identity',
    name: 'Metadata & Identity Badges',
    nameKo: '고유 식별자 · 버전 · 메타데이터',
    icon: '🆔',
    description: '시스템 UUID, 빌드 버전 번호, 시설 방 번호, 데이터 출처를 식별하기 위한 정적 메타데이터',
    countApprox: 186,
    percentage: 12.7,
    colorTone: '#64748b',
    items: [
      {
        id: 'meta-version',
        name: '빌드 릴리즈 버전',
        description: '소프트웨어 배포 버전',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'v2.4.0-rc',
        htmlSnippet: '<lw-badge size="xs" label="v2.4.0-rc" />',
        useCase: '시스템 타이틀바 및 푸터 메타데이터',
        realWorldLocation: 'primitives/navigation/titlebar',
      },
      {
        id: 'meta-id',
        name: '고유 식별 UUID 배지',
        description: '단락/씬 고유 식별자',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: '#SEC-99042',
        htmlSnippet: '<lw-badge size="xs" label="#SEC-99042" />',
        useCase: '단락 관리자 씬 카드 고유 식별자',
        realWorldLocation: 'collection/items/scene-card',
      },
      {
        id: 'meta-room',
        name: '시설 구역 명칭 배지',
        description: '병원/기지 구역 식별',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '🏥',
        content: '외래 3구역 (Zone-C)',
        htmlSnippet: '<lw-badge size="sm" icon="🏥" label="외래 3구역 (Zone-C)" />',
        useCase: '병원 로케이션 배너 구역 안내',
        realWorldLocation: 'collection/panels/unified-location-banner-panel/banner-header',
      },
      {
        id: 'meta-db',
        name: '정본 DB 소스 지시자',
        description: '공식 데이터베이스 소스 인증',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'OFFICIAL CANON',
        htmlSnippet: '<lw-badge size="xs" label="OFFICIAL CANON" />',
        useCase: '도감 관리자 공식 정본 인증 표기',
        realWorldLocation: 'domains/novel/codex-manager',
      },
    ],
  },
  {
    id: 'count-notify',
    name: 'Count & Counter Indicators',
    nameKo: '수량 카운트 · 알림 · 신규 지시자',
    icon: '🔔',
    description: '미확인 알림 건수, 목록 아이템 총계, 신규 등록 태그 등을 축약하여 보여주는 카운터',
    countApprox: 134,
    percentage: 9.2,
    colorTone: '#ef4444',
    items: [
      {
        id: 'count-notification',
        name: '미열람 알림 카운터',
        description: '확인하지 않은 메시지 수',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: '99+',
        htmlSnippet: '<lw-badge size="xs" label="99+" />',
        useCase: '메일함 및 알림 벨 뱃지 오버레이',
        realWorldLocation: 'shell/overview/overview-taskbar',
      },
      {
        id: 'count-new',
        name: 'NEW 신규 태그',
        description: '신규 출시 또는 갱신 콘텐츠',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'NEW',
        htmlSnippet: '<lw-badge size="xs" label="NEW" />',
        useCase: '신규 소설 챕터 및 아이템 강조',
        realWorldLocation: 'collection/items/novel-card',
      },
      {
        id: 'count-items',
        name: '소지 아이템 수량',
        description: '인벤토리 슬롯 수량',
        tone: 'neutral',
        variant: 'subtle',
        size: 'xs',
        content: 'x48',
        htmlSnippet: '<lw-badge size="xs" label="x48" />',
        useCase: '인벤토리 그리드 아이템 스택 수량',
        realWorldLocation: 'collection/items/inventory-item',
      },
      {
        id: 'count-tasks',
        name: '진행 대기 퀘스트 수',
        description: '진행 가능한 퀘스트 건수',
        tone: 'neutral',
        variant: 'subtle',
        size: 'sm',
        icon: '📋',
        content: '5건 대기',
        htmlSnippet: '<lw-badge size="sm" icon="📋" label="5건 대기" />',
        useCase: '퀘스트 관리 탭 미수행 건수 표기',
        realWorldLocation: 'domains/fantasy/quest-log',
      },
    ],
  },
];

export const BADGE_API_CHEATSHEET: BadgeApiProp[] = [
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg'",
    defaultValue: "'sm'",
    description: '배지 크기 규격 (xs: 20px, sm: 24px, md: 28px, lg: 34px)',
  },
  {
    name: 'icon',
    type: 'string',
    defaultValue: "''",
    description: '배지 좌측 접두사 아이콘 또는 이모지 문자열',
  },
  {
    name: 'trailingIcon',
    type: 'string',
    defaultValue: "''",
    description: '배지 우측 접미사 아이콘 또는 이모지 문자열',
  },
  {
    name: 'label',
    type: 'string',
    defaultValue: "''",
    description: '배지 텍스트 라벨 (ng-content 프로젝션과 병행 지원)',
  },
  {
    name: 'unifiedStyle',
    type: 'immutable',
    defaultValue: "'STEP 1 Soft Slate'",
    description: '모든 배지에 강제 적용되는 단일 표준 스타일 (bg: rgba(241,245,249,0.95), text: #0f172a, border: 1px solid rgba(203,213,225,0.85), radius: 4px)',
  },
];
