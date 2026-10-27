/**
 * LoworldUI Responsive Grid Design System & Full Audit Catalog
 * 모노레포 전역(114개 Grid 및 인라인 Flex 레이아웃 인스턴스) 전수조사 데이터 및 프리셋/거버넌스 체계
 */

import type { LwGridGap, LwGridAlign, LwGridJustify } from '../ui/layout/grid/grid.types';

export interface GridAuditMetrics {
  totalCount: number;
  inlineHardcodedCount: number;
  blowoutRiskCount: number;
  migratedStandardCount: number;
  complianceRate: number;
  presetsCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface GridPresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  defaultCols: string | number;
  colsSm: string | number;
  colsMd?: string | number;
  colsLg?: string | number;
  gap: LwGridGap;
  countApprox: number;
  percentage: number;
  bestPractice: string;
  codeSnippet: string;
}

export interface GridCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  pattern: 'card-grid' | 'inspector-chapters' | 'stat-metrics' | 'scene-list' | 'inventory-tiles';
  currentImpl: 'inline-grid' | 'inline-flex' | 'lw-grid';
  isStandard: boolean;
  status: 'compliant' | 'needs-migration' | 'blowout-risk';
  recommendation: string;
}

export const GRID_AUDIT_METRICS: GridAuditMetrics = {
  totalCount: 114,
  inlineHardcodedCount: 88,
  blowoutRiskCount: 22,
  migratedStandardCount: 4,
  complianceRate: 3.5,
  presetsCount: 4,
  appDistribution: [
    { app: 'novel', label: 'Novel & 데이터셋 인스펙터/씬 그리드', count: 42, percentage: 36.8 },
    { app: 'showcase', label: 'Showcase 포털 & 모드 선택 카드 그리드', count: 32, percentage: 28.1 },
    { app: 'rpg', label: 'D2R 캐릭터/인벤토리/도감 그리드', count: 24, percentage: 21.0 },
    { app: 'primitives', label: 'Layout & 컨테이너 쿼리 프리미티브', count: 16, percentage: 14.1 },
  ],
};

export const GRID_PRESETS_CATALOG: GridPresetDefinition[] = [
  {
    id: 'dataset-inspector-chapters',
    name: 'Dataset Inspector Chapters Grid',
    nameKo: '데이터셋 인스펙터 챕터 카드 그리드',
    icon: '📑',
    description: '모바일 360px 환경에서 강제 1열 단일 스택을 유지하며, 데스크톱(>=961px)에서는 2열로 확장되어 단락 서사와 씬을 조망하는 반응형 그리드 프리셋입니다.',
    defaultCols: 1,
    colsSm: 1,
    colsLg: 2,
    gap: 'sm',
    countApprox: 18,
    percentage: 15.8,
    bestPractice: '하드코딩된 display: flex; flex-direction: column을 배제하고 [cols]="1" [colsLg]="2" gap="sm"을 적용하여 뷰포트에 유려하게 대응하세요.',
    codeSnippet: `<lw-grid
  class="novel-dataset-inspector__chapters-grid"
  [cols]="1"
  [colsLg]="2"
  gap="sm">
  @for (ch of dVm.chapters; track ch.id) {
    <div class="novel-dataset-inspector__chapter-card">...</div>
  }
</lw-grid>`,
  },
  {
    id: 'mode-card-selection',
    name: 'Mode Card Selection Grid',
    nameKo: '플레이 모드 카드 선택 그리드',
    icon: '🃏',
    description: '모바일에서는 100% 가로폭을 차지하는 1열 카드 형태로 아이콘과 텍스트를 여유롭게 렌더링하고, 태블릿 2열, 데스크톱 3열로 자동 팽창하는 프리셋입니다.',
    defaultCols: 1,
    colsSm: 1,
    colsMd: 2,
    colsLg: 3,
    gap: 'md',
    countApprox: 34,
    percentage: 29.8,
    bestPractice: 'grid-template-columns: repeat(2, 1fr)을 모바일에서 직접 쓰지 말고 lw-grid [cols]="1" [colsMd]="2" [colsLg]="3"을 사용하여 2열 찌그러짐을 방어하세요.',
    codeSnippet: `<lw-grid
  class="mode-cards-grid"
  [cols]="1"
  [colsSm]="1"
  [colsMd]="2"
  [colsLg]="3"
  gap="md">
  @for (desc of playModeDescriptions; track desc.id) {
    <lw-card class="mode-card">...</lw-card>
  }
</lw-grid>`,
  },
  {
    id: 'stat-blocks-metrics',
    name: 'Stat Blocks & Metrics Grid',
    nameKo: '도감 지표 및 통계 블록 그리드',
    icon: '📊',
    description: '도감 체계 요약이나 스코어보드처럼 소형 지표 카드를 최소 너비 기준(minmax)으로 자동 래핑하며, 모바일 폭 미달 시 1열/2열로 자동 안전 수렴합니다.',
    defaultCols: 1,
    colsSm: 2,
    colsMd: 4,
    gap: 'sm',
    countApprox: 26,
    percentage: 22.8,
    bestPractice: 'minItemWidth="180px" 또는 [colsSm]="2" [colsMd]="4"를 결합하여 모바일에서도 짤림 없이 2열 격자로 균등 배치하세요.',
    codeSnippet: `<lw-grid
  class="novel-dataset-inspector__codex-summary"
  [cols]="1"
  [colsSm]="2"
  [colsMd]="4"
  gap="sm">
  <div class="codex-stat-block">...</div>
</lw-grid>`,
  },
  {
    id: 'characters-cast-grid',
    name: 'Characters & Cast Auto-fit Grid',
    nameKo: '등장인물 & 캐스트 카드 그리드',
    icon: '👥',
    description: '인물 카드, 용병 프로필 등 다수의 엔티티 카드를 화면 폭에 맞춰 최소 폭(minItemWidth) 안전망을 거쳐 가변 배치하는 그리드 프리셋입니다.',
    defaultCols: 1,
    colsSm: 1,
    colsMd: 2,
    colsLg: 3,
    gap: 'sm',
    countApprox: 36,
    percentage: 31.6,
    bestPractice: 'repeat(auto-fill, minmax(220px, 1fr))의 Minmax blowout을 lw-grid의 내부 min(100%, minItemWidth) 방어 장치로 대체하세요.',
    codeSnippet: `<lw-grid
  class="novel-dataset-inspector__characters-grid"
  [cols]="1"
  [colsSm]="1"
  [colsMd]="2"
  [colsLg]="3"
  gap="sm">
  @for (ch of dVm.characters; track ch.name) {
    <div class="novel-dataset-inspector__char-card">...</div>
  }
</lw-grid>`,
  },
];

export const GRID_CENSUS_CATALOG: GridCensusItem[] = [
  {
    id: 'grid-census-01',
    title: '소설 데이터셋 인스펙터 챕터 카드 목록',
    location: 'novel-showcase.component.html #794',
    app: 'loworld-novel',
    pattern: 'inspector-chapters',
    currentImpl: 'lw-grid',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-grid [cols]="1" [colsLg]="2" gap="sm" 적용 완료. 모바일 1열 보장.',
  },
  {
    id: 'grid-census-02',
    title: '소설 데이터셋 인스펙터 씬 타이틀 바 (Flex Overflow 방어)',
    location: 'novel-showcase.component.scss #945 (.scene-title-row)',
    app: 'loworld-novel',
    pattern: 'scene-list',
    currentImpl: 'inline-flex',
    isStandard: true,
    status: 'compliant',
    recommendation: 'flex-wrap 및 min-width: 0 보호 메커니즘 적용하여 360px 모바일 붕괴 원천 차단.',
  },
  {
    id: 'grid-census-03',
    title: '소설 데이터셋 인스펙터 등장인물 그리드',
    location: 'novel-showcase.component.html #839',
    app: 'loworld-novel',
    pattern: 'card-grid',
    currentImpl: 'lw-grid',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-grid [cols]="1" [colsSm]="1" [colsMd]="2" [colsLg]="3" gap="sm" 적용 완료.',
  },
  {
    id: 'grid-census-04',
    title: '소설 데이터셋 인스펙터 도감 체계 요약 그리드',
    location: 'novel-showcase.component.html #858',
    app: 'loworld-novel',
    pattern: 'stat-metrics',
    currentImpl: 'lw-grid',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-grid [cols]="1" [colsSm]="2" [colsMd]="4" gap="sm" 적용 완료.',
  },
  {
    id: 'grid-census-05',
    title: '플레이 모드 선택 카드 그리드 (모바일 2열 찌그러짐 해소)',
    location: 'novel-showcase.component.html #937 (.mode-cards-grid)',
    app: 'loworld-showcase',
    pattern: 'card-grid',
    currentImpl: 'lw-grid',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-grid [cols]="1" [colsSm]="1" [colsMd]="2" [colsLg]="3" gap="md" 적용 완료.',
  },
  {
    id: 'grid-census-06',
    title: 'D2R 캐릭터 호감도 인스펙터 바디 타일',
    location: 'character-affinity-panel.component.scss',
    app: 'loworld-novel',
    pattern: 'inventory-tiles',
    currentImpl: 'inline-grid',
    isStandard: false,
    status: 'blowout-risk',
    recommendation: 'repeat(auto-fit, minmax(130px, 1fr)) 인라인 코드를 lw-grid minItemWidth="130px"로 전환 권장.',
  },
  {
    id: 'grid-census-07',
    title: '호라드릭 큐브 합성 인벤토리 슬롯 그리드',
    location: 'artifice-cube-panel.component.scss',
    app: 'loworld-novel',
    pattern: 'inventory-tiles',
    currentImpl: 'inline-grid',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '고정 3x4 그리드 슬롯을 lw-grid [cols]="4" gap="xs"로 규격화 권장.',
  },
  {
    id: 'grid-census-08',
    title: 'All Components 대시보드 메트릭 스코어보드',
    location: 'all-components.component.html (.factory-scoreboard-bar)',
    app: 'loworld-showcase',
    pattern: 'stat-metrics',
    currentImpl: 'inline-flex',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '가로 flex-wrap 형태를 lw-grid [colsSm]="2" [colsMd]="4" [colsLg]="6" gap="sm"으로 마이그레이션 권장.',
  },
];
