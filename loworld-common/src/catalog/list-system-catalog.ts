/**
 * LoworldUI Universal List Design System & Full Audit Catalog
 * 모노레포 전역(17개 Table 및 1차원 데이터 리스트 인스턴스) 전수조사 데이터 및 프리셋/거버넌스 체계
 */

import type { LwListDensity, LwListVariant } from '../ui/list/list.types';

export interface ListAuditMetrics {
  totalCount: number;
  inlineHardcodedCount: number;
  migratedStandardCount: number;
  complianceRate: number;
  presetsCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface ListPresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  density: LwListDensity;
  variant: LwListVariant;
  countApprox: number;
  percentage: number;
  bestPractice: string;
  codeSnippet: string;
}

export interface ListCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  classification: 'Class A (1차원 리스트)' | 'Class B (2차원 매트릭스)' | 'Class C (그리드 데이터시트)';
  currentImpl: 'table.compact-component-table' | 'table.audit-breakdown-table' | 'table (inline)' | 'lw-list';
  isStandard: boolean;
  status: 'compliant' | 'needs-migration';
  recommendation: string;
}

export const LIST_AUDIT_METRICS: ListAuditMetrics = {
  totalCount: 17,
  inlineHardcodedCount: 15,
  migratedStandardCount: 2,
  complianceRate: 11.8,
  presetsCount: 3,
  appDistribution: [
    { app: 'showcase-overview', label: '컴포넌트 도감 & 아키텍처 오딧 리스트', count: 8, percentage: 47.1 },
    { app: 'primitives-demo', label: '디자인 시스템 토큰 & 프리셋 레퍼런스', count: 6, percentage: 35.3 },
    { app: 'data-grid', label: '데이터그리드 & 비교 매트릭스', count: 3, percentage: 17.6 },
  ],
};

export const LIST_PRESETS_CATALOG: ListPresetDefinition[] = [
  {
    id: 'compact-directory-list',
    name: 'Compact Component Directory List',
    nameKo: '44px 고밀도 컴포넌트 도감 디렉터리 리스트',
    icon: '📋',
    description: '수백 개의 컴포넌트를 한 화면에서 스크롤 압박 없이 스캔할 수 있도록 44px의 컴팩트한 행 높이와 [lwLeading] 아이콘, 명칭/설명 그리드, [lwMeta], [lwActions]를 정렬한 프리셋입니다.',
    density: 'compact',
    variant: 'bordered',
    countApprox: 2,
    percentage: 11.8,
    bestPractice: '<table class="compact-component-table"> 대신 <lw-list density="compact" variant="bordered">를 사용하여 모바일/데스크톱 대응과 슬롯 일원화를 달성하세요.',
    codeSnippet: `<lw-list density="compact" variant="bordered" [divided]="true" [hoverable]="true">
  <lw-list-header>
    <div class="list-col-grid">
      <span class="th-name">컴포넌트 명</span>
      <span class="th-desc">설명</span>
    </div>
    <div slot="meta" class="th-meta">메타데이터</div>
    <div slot="actions" class="th-action">액션</div>
  </lw-list-header>
  @for (comp of items; track comp.id) {
    <lw-list-item (click)="onSelect(comp)">
      <div slot="leading" class="comp-icon-box">📦</div>
      <div class="list-col-grid">
        <span class="comp-title">{{ comp.name }}</span>
        <span class="desc-text">{{ comp.description }}</span>
      </div>
      <div slot="meta" class="meta-tag-group">...</div>
      <div slot="actions" class="action-btn-group">...</div>
    </lw-list-item>
  }
</lw-list>`,
  },
  {
    id: 'audit-metric-breakdown-list',
    name: 'Audit Metric Breakdown List',
    nameKo: '바텀시트 실사용 오딧 및 메트릭 리스트',
    icon: '📊',
    description: '바텀시트나 모달 내부에서 컴포넌트별 직접 사용 횟수, 파일 경로, 상태 뱃지를 일관되게 정렬하는 고밀도 플랫 리스트 프리셋입니다.',
    density: 'compact',
    variant: 'flat',
    countApprox: 3,
    percentage: 17.6,
    bestPractice: '모달이나 바텀시트 안에서는 외곽선 없이 깨끗한 variant="flat" [divided]="true"를 조합하세요.',
    codeSnippet: `<lw-list density="compact" variant="flat" [divided]="true" [hoverable]="true">
  <lw-list-header>
    <div class="audit-col-grid">
      <span class="th-comp">Component</span>
      <span class="th-kind">Kind</span>
    </div>
    <div slot="meta" class="th-usage">Usage Count</div>
  </lw-list-header>
  @for (row of auditRows; track row.name) {
    <lw-list-item>
      <div slot="leading" class="audit-dot"></div>
      <div class="audit-col-grid">
        <span class="audit-name">{{ row.name }}</span>
        <span class="audit-kind">{{ row.kind }}</span>
      </div>
      <div slot="meta" class="audit-meta">
        <span class="count-badge">{{ row.count }}</span>
      </div>
    </lw-list-item>
  }
</lw-list>`,
  },
  {
    id: 'token-spec-list',
    name: 'Design Token & CheatSheet List',
    nameKo: '디자인 토큰 & 단축키 명세 리스트',
    icon: '🎨',
    description: '색상 토큰, 타이포그래피, 키보드 단축키 매핑 테이블을 모던한 카드/보더 스타일 리스트로 표현하는 프리셋입니다.',
    density: 'standard',
    variant: 'cards',
    countApprox: 8,
    percentage: 47.1,
    bestPractice: '행 간 간격을 두고 카드로 표현할 때는 variant="cards"를 사용해 시각적 계층을 강화하세요.',
    codeSnippet: `<lw-list density="standard" variant="cards" [hoverable]="true">
  @for (token of tokens; track token.name) {
    <lw-list-item>
      <div slot="leading" class="color-swatch" [style.background]="token.color"></div>
      <div class="token-info">
        <span class="token-name">{{ token.name }}</span>
        <span class="token-value">{{ token.hex }}</span>
      </div>
      <div slot="actions">
        <button lw-button size="sm" variant="ghost">복사</button>
      </div>
    </lw-list-item>
  }
</lw-list>`,
  },
];

export const LIST_CENSUS_CATALOG: ListCensusItem[] = [
  {
    id: 'all-comp-main-table',
    title: '컴포넌트 도감 메인 테이블',
    location: 'projects/loworld-ui-showcase/.../all-components.component.html (L2317)',
    app: 'loworld-ui-showcase',
    classification: 'Class A (1차원 리스트)',
    currentImpl: 'lw-list',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-list density="compact" variant="bordered"로 전환 완료.',
  },
  {
    id: 'all-comp-bottomsheet-table',
    title: '상세 인스펙터 바텀시트 실사용 오딧 테이블',
    location: 'projects/loworld-ui-showcase/.../all-components.component.html (L2446)',
    app: 'loworld-ui-showcase',
    classification: 'Class A (1차원 리스트)',
    currentImpl: 'lw-list',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-list density="compact" variant="flat"으로 전환 완료.',
  },
  {
    id: 'palette-showcase-tokens',
    title: '컬러 팔레트 토큰 테이블',
    location: 'projects/loworld-ui-showcase/.../palette-showcase.component.html (L28)',
    app: 'loworld-ui-showcase',
    classification: 'Class A (1차원 리스트)',
    currentImpl: 'table (inline)',
    isStandard: false,
    status: 'needs-migration',
    recommendation: 'lw-list variant="cards" 및 lw-list-item으로 점진적 마이그레이션 권장.',
  },
  {
    id: 'theme-tokens-table',
    title: '테마 토큰 명세 테이블',
    location: 'projects/loworld-ui-showcase/.../theme-tokens-table.component.html (L1)',
    app: 'loworld-ui-showcase',
    classification: 'Class A (1차원 리스트)',
    currentImpl: 'table (inline)',
    isStandard: false,
    status: 'needs-migration',
    recommendation: 'lw-list density="compact" variant="bordered"로 교체 권장.',
  },
  {
    id: 'color-palette-table',
    title: '디자인 시스템 컬러 스와치 테이블',
    location: 'projects/loworld-ui-showcase/.../color-palette.component.html (L5)',
    app: 'loworld-ui-showcase',
    classification: 'Class A (1차원 리스트)',
    currentImpl: 'table (inline)',
    isStandard: false,
    status: 'needs-migration',
    recommendation: 'lw-list variant="bordered"로 교체 권장.',
  },
  {
    id: 'shortcuts-guide-table',
    title: '글로벌 키보드 단축키 안내 테이블',
    location: 'projects/loworld-ui-showcase/.../shortcuts-guide.component.html (L15)',
    app: 'loworld-ui-showcase',
    classification: 'Class A (1차원 리스트)',
    currentImpl: 'table (inline)',
    isStandard: false,
    status: 'needs-migration',
    recommendation: 'lw-list density="compact" variant="bordered" 적용 권장.',
  },
  {
    id: 'responsive-device-matrix',
    title: '디바이스 폼팩터 반응형 지원 매트릭스',
    location: 'projects/loworld-ui-showcase/.../all-components.component.html (L782)',
    app: 'loworld-ui-showcase',
    classification: 'Class B (2차원 매트릭스)',
    currentImpl: 'table (inline)',
    isStandard: false,
    status: 'compliant',
    recommendation: '2D 교차 매트릭스 테이블 구조 유지.',
  },
  {
    id: 'table-demo-grid',
    title: '엔터프라이즈 정렬/필터링 데이터 그리드',
    location: 'projects/loworld-ui-showcase/.../table-demo.component.html (L8)',
    app: 'loworld-ui-showcase',
    classification: 'Class C (그리드 데이터시트)',
    currentImpl: 'table (inline)',
    isStandard: false,
    status: 'compliant',
    recommendation: '고급 데이터시트 전용 프리미티브로 별도 유지.',
  },
];

export const LIST_API_CHEATSHEET = [
  { prop: 'density', type: "'compact' | 'standard' | 'spacious'", default: "'standard'", desc: '리스트 행의 높이와 패딩 (compact: 44px, standard: 56px, spacious: 72px)' },
  { prop: 'variant', type: "'default' | 'flat' | 'bordered' | 'cards'", default: "'default'", desc: '외곽선 및 배경 스타일 (테이블 대체 시 bordered 또는 flat 추천)' },
  { prop: 'divided', type: 'boolean', default: 'true', desc: '아이템 간 1px 구분선 렌더링 여부' },
  { prop: 'hoverable', type: 'boolean', default: 'true', desc: '마우스 호버 시 인터랙티브 하이라이트 배경 활성화 여부' },
  { prop: 'rounded', type: 'boolean', default: 'false', desc: '리스트 컨테이너 모서리 둥글기 처리 여부' },
  { prop: '[lwLeading]', type: 'Template Slot', default: '-', desc: '아이콘, 아바타, 체크박스 등 좌측 슬롯' },
  { prop: '[lwContent]', type: 'Template Slot', default: '-', desc: '주요 제목, 부제목, 본문 그리드 슬롯' },
  { prop: '[lwMeta]', type: 'Template Slot', default: '-', desc: '태그, 뱃지, 날짜, 카운트 등 메타데이터 슬롯' },
  { prop: '[lwActions]', type: 'Template Slot', default: '-', desc: '버튼, 메뉴 등 우측 상호작용 액션 슬롯' },
];
