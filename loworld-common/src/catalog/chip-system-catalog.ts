/**
 * LoworldUI Chip Design System & Full Audit Catalog
 * 모노레포 전역(153개 칩/필 인스턴스) 전수조사 데이터 및 5대 베리언트/4대 프리셋 체계
 */

import type { LwChipVariant } from '../ui/data-display/chip/chip.component';

export interface ChipAuditMetrics {
  totalCount: number;
  buttonAsChipCount: number;
  rawMarkupCount: number;
  migratedStandardCount: number;
  complianceRate: number;
  variantsCount: number;
  presetsCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface ChipPresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  variant: LwChipVariant;
  description: string;
  countApprox: number;
  percentage: number;
  colorTone: string;
  bestPractice: string;
  codeSnippet: string;
}

export interface ChipCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  pattern: 'theme-skin' | 'filter' | 'action' | 'status-tag' | 'standard';
  currentImpl: 'lw-button' | 'button' | 'span' | 'div' | 'lw-chip';
  isStandard: boolean;
  status: 'compliant' | 'needs-migration' | 'raw-markup';
  recommendation: string;
}

export const CHIP_AUDIT_METRICS: ChipAuditMetrics = {
  totalCount: 153,
  buttonAsChipCount: 106,
  rawMarkupCount: 41,
  migratedStandardCount: 6,
  complianceRate: 3.9,
  variantsCount: 5,
  presetsCount: 4,
  appDistribution: [
    { app: 'showcase', label: 'Showcase 테마 & 컨트롤 뷰어', count: 48, percentage: 31.4 },
    { app: 'novel', label: 'Novel & 캐릭터 사이드바', count: 42, percentage: 27.5 },
    { app: 'collection', label: 'Collection 필터 & 데이터셋 패널', count: 35, percentage: 22.9 },
    { app: 'rpg', label: 'D2R & 퀘스트 보드', count: 18, percentage: 11.8 },
    { app: 'primitives', label: 'Core Primitives 컴포넌트', count: 10, percentage: 6.5 },
  ],
};

export const CHIP_PRESETS_CATALOG: ChipPresetDefinition[] = [
  {
    id: 'theme-skin-selector',
    name: 'Theme & Skin Selector Chip',
    nameKo: '테마 & 스킨 셀렉터 칩',
    icon: '🎨',
    variant: 'choice',
    description: '컬러 닷(Accent Dot)과 테마 라벨, 활성 상태 체크마크(✓)를 결합하여 단일 테마나 뷰어 스킨을 선택하는 상호작용 칩입니다.',
    countApprox: 20,
    percentage: 13.1,
    colorTone: '#0284c7',
    bestPractice: '버튼에 폰트 사이즈와 패딩을 오버라이드하지 말고, colorDot 인풋과 selected 상태를 갖는 lw-chip(variant="choice")을 사용하세요.',
    codeSnippet: `<lw-chip
  variant="choice"
  [selected]="activeSkin() === skin.id"
  [colorDot]="skin.accentColor"
  (select)="setSkin(skin.id)">
  {{ skin.name }}
</lw-chip>`,
  },
  {
    id: 'multi-filter-category',
    name: 'Multi-Select Filter & Category Chip',
    nameKo: '다중 필터 & 카테고리 선택 칩',
    icon: '🔍',
    variant: 'filter',
    description: '데이터셋, 도메인, 장르 및 속성을 토글하며 필터링하는 칩으로, 선택 시 배경색이 반전되며 체크 아이콘이 부드럽게 노출됩니다.',
    countApprox: 78,
    percentage: 51.0,
    colorTone: '#2563eb',
    bestPractice: '체크박스 대신 가로 스크롤형 필터 바를 구성할 때 활용하며, 다중 선택 배열 상태와 연동하여 toggleFilter()를 호출합니다.',
    codeSnippet: `<lw-chip
  variant="filter"
  [selected]="selectedFilters.has(tag)"
  (select)="toggleFilter(tag)">
  {{ tag }}
</lw-chip>`,
  },
  {
    id: 'removable-tag-input',
    name: 'Removable Keyword & Tag Chip',
    nameKo: '삭제 가능한 키워드 태그 칩',
    icon: '🏷️',
    variant: 'input',
    description: '사용자가 입력한 검색어, 태그, 선택된 복수 항목을 표시하고 우측 X 버튼을 눌러 개별 제거할 수 있는 인풋 칩입니다.',
    countApprox: 14,
    percentage: 9.2,
    colorTone: '#8b5cf6',
    bestPractice: 'removable="true" 및 (remove) 이벤트를 연결하여 리스트에서 아이템을 삭제하고, X 버튼의 stopPropagation 처리를 컴포넌트에 위임합니다.',
    codeSnippet: `<lw-chip
  variant="input"
  [removable]="true"
  (remove)="removeTag(tag)">
  #{{ tag.name }}
</lw-chip>`,
  },
  {
    id: 'status-metric-indicator',
    name: 'Status & Metric Indicator Chip',
    nameKo: '상태 & 메트릭 인디케이터 칩',
    icon: '⚡',
    variant: 'status',
    description: 'LIVE 방송 상태, HUD 장착 여부, 캐릭터 성격 및 전투 티어 등 실시간 상태 정보를 캡슐화하여 전달하는 정적/인포 칩입니다.',
    countApprox: 41,
    percentage: 26.8,
    colorTone: '#10b981',
    bestPractice: '클릭 인터랙션이 없는 상태 표시는 clickable="false"를 적용하여 시맨틱한 태그로 사용하고 불필요한 포커스/호버 효과를 억제합니다.',
    codeSnippet: `<lw-chip
  variant="status"
  [clickable]="false"
  [colorDot]="status.color">
  {{ status.label }}
</lw-chip>`,
  },
];

export const CHIP_CENSUS_CATALOG: ChipCensusItem[] = [
  {
    id: 'chip-census-001',
    title: 'Showcase 오른쪽 패널 테마 스킨 전환 칩',
    location: 'projects/loworld-ui-showcase/src/app/library/all-components/all-components.component.html:3452',
    app: 'showcase',
    pattern: 'theme-skin',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: 'lw-button 클래스 오버라이드 제거 후 <lw-chip variant="choice" [colorDot]="skin.accentColor">로 교체',
  },
  {
    id: 'chip-census-002',
    title: 'Showcase 상단 빠른 테마 스킨 전환 칩',
    location: 'projects/loworld-ui-showcase/src/app/library/all-components/all-components.component.html:3609',
    app: 'showcase',
    pattern: 'theme-skin',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: 'lw-button 대신 <lw-chip variant="choice">로 표준화하여 버튼 시스템 오염 방지',
  },
  {
    id: 'chip-census-003',
    title: '모바일 카테고리 폴더 필터 칩',
    location: 'projects/loworld-ui/collection/items/mobile-category-filter/mobile-category-filter.component.html:2',
    app: 'collection',
    pattern: 'filter',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-button class="chip">을 <lw-chip variant="filter" [selected]="...">로 교체',
  },
  {
    id: 'chip-census-004',
    title: '대화 데이터셋 성향(Demeanor) 필터 칩',
    location: 'projects/loworld-ui/collection/panels/dialogue-dataset-viewer/dialogue-dataset-viewer.component.html:20',
    app: 'collection',
    pattern: 'filter',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '버튼에 padding 3px 8px 오버라이드 주입 중단, <lw-chip variant="filter"> 표준 적용',
  },
  {
    id: 'chip-census-005',
    title: '대화 데이터셋 성격(Personality) 필터 칩',
    location: 'projects/loworld-ui/collection/panels/dialogue-dataset-viewer/dialogue-dataset-viewer.component.html:32',
    app: 'collection',
    pattern: 'filter',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-chip variant="filter" size="sm"> 적용으로 텍스트 및 이모지 정렬 일원화',
  },
  {
    id: 'chip-census-006',
    title: 'D2R 액티브 퀘스트 퀵 포커스 칩',
    location: 'projects/loworld-ui/collection/panels/d2-quest-test-panel/d2-quest-test-panel.component.html:62',
    app: 'rpg',
    pattern: 'action',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '인라인 액션 칩 <lw-chip variant="choice" size="sm">으로 마이그레이션 권장',
  },
  {
    id: 'chip-census-007',
    title: '캐릭터 서머리 카드 성격 슬롯 인디케이터',
    location: 'projects/loworld-ui/collection/items/character-summary-card/character-summary-card.component.html:400',
    app: 'novel',
    pattern: 'status-tag',
    currentImpl: 'span',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '정적 span 칩을 <lw-chip variant="status" [clickable]="false">로 구조화하여 테마 토큰 상속',
  },
  {
    id: 'chip-census-008',
    title: '이벤트 카테고리 카드 LIVE 상태 칩',
    location: 'projects/loworld-ui/collection/items/event-category-card/event-category-card.component.html:12',
    app: 'collection',
    pattern: 'status-tag',
    currentImpl: 'span',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '<span class="status-chip status-chip--onscreen"> ➔ <lw-chip variant="status" colorDot="#10b981">',
  },
  {
    id: 'chip-census-009',
    title: '이벤트 카테고리 카드 HUD 상태 칩',
    location: 'projects/loworld-ui/collection/items/event-category-card/event-category-card.component.html:14',
    app: 'collection',
    pattern: 'status-tag',
    currentImpl: 'span',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '<lw-chip variant="status" colorDot="#3b82f6">로 교체',
  },
  {
    id: 'chip-census-010',
    title: '소설 사이드바 칩 리스트 (Chip List)',
    location: 'projects/loworld-ui/collection/panels/novel-sidebar/novel-sidebar-chip-list.component.html:5',
    app: 'novel',
    pattern: 'filter',
    currentImpl: 'span',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '정적 span 태그 대신 <lw-chip variant="filter"> 적용으로 클릭/선택 인터랙션 지원',
  },
  {
    id: 'chip-census-011',
    title: '상황 데이터셋 뷰어 필터 칩 바',
    location: 'projects/loworld-ui/collection/panels/situation-dataset-viewer/situation-dataset-viewer.component.html:18',
    app: 'collection',
    pattern: 'filter',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '버튼에 덮어씌운 .filter-chip 클래스를 <lw-chip variant="filter">로 전격 대체',
  },
  {
    id: 'chip-census-012',
    title: '플랜 쉘 개요 탭 칩 네비게이션',
    location: 'projects/loworld-ui/src/lib/chrome/shells/plan-shell/plan-shell.component.html:114',
    app: 'primitives',
    pattern: 'standard',
    currentImpl: 'lw-chip',
    isStandard: true,
    status: 'compliant',
    recommendation: '현재 <lw-chip> 표준 규격 정상 준수 인스턴스 (유지 관리)',
  },
  {
    id: 'chip-census-013',
    title: '플랜 쉘 기능정의서 탭 칩 네비게이션',
    location: 'projects/loworld-ui/src/lib/chrome/shells/plan-shell/plan-shell.component.html:124',
    app: 'primitives',
    pattern: 'standard',
    currentImpl: 'lw-chip',
    isStandard: true,
    status: 'compliant',
    recommendation: '현재 <lw-chip> 표준 규격 정상 준수 인스턴스 (유지 관리)',
  },
  {
    id: 'chip-census-014',
    title: '플랜 쉘 WBS 탭 칩 네비게이션',
    location: 'projects/loworld-ui/src/lib/chrome/shells/plan-shell/plan-shell.component.html:127',
    app: 'primitives',
    pattern: 'standard',
    currentImpl: 'lw-chip',
    isStandard: true,
    status: 'compliant',
    recommendation: '현재 <lw-chip> 표준 규격 정상 준수 인스턴스 (유지 관리)',
  },
  {
    id: 'chip-census-015',
    title: '소설 몬스터 패널 속성 필터 칩',
    location: 'projects/loworld-ui/collection/panels/novel-sidebar/novel-sidebar-monsters-panel.component.html:24',
    app: 'novel',
    pattern: 'filter',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-chip variant="filter" size="sm">으로 교체하여 사이드바 컴팩트 레이아웃 정돈',
  },
  {
    id: 'chip-census-016',
    title: '소설 파티 패널 직업/클래스 필터 칩',
    location: 'projects/loworld-ui/collection/panels/novel-sidebar/novel-sidebar-party-panel.component.html:16',
    app: 'novel',
    pattern: 'filter',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-chip variant="filter"> 표준 컴포넌트 마이그레이션 대상',
  },
  {
    id: 'chip-census-017',
    title: '캐릭터 서머리 매니저 상태 필터 필',
    location: 'projects/loworld-ui/collection/panels/character-summary-manager/lw-character-summary-manager.component.html:33',
    app: 'novel',
    pattern: 'filter',
    currentImpl: 'button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '일반 button.filter-pill을 <lw-chip variant="filter">로 통합',
  },
  {
    id: 'chip-census-018',
    title: 'D2 스킬 훈련 클래스 타겟 칩',
    location: 'projects/loworld-ui/collection/panels/skill-training/skill-training.component.html:42',
    app: 'rpg',
    pattern: 'action',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-chip variant="choice">로 전환하여 스킬 슬롯과 시각적 계층 분리',
  },
  {
    id: 'chip-census-019',
    title: 'D2 보드 전제조건(Prereq) 상태 칩',
    location: 'projects/loworld-ui/collection/panels/d2-board/d2-board.component.html:88',
    app: 'rpg',
    pattern: 'status-tag',
    currentImpl: 'span',
    isStandard: false,
    status: 'raw-markup',
    recommendation: 'span.d2-board__prereq-chip을 <lw-chip variant="status" size="sm">으로 교체',
  },
  {
    id: 'chip-census-020',
    title: '웹소설 뷰어 글꼴(Font) 조절 칩',
    location: 'projects/loworld-ui/collection/panels/webnovel-reader/webnovel-reader-settings.component.html:54',
    app: 'novel',
    pattern: 'theme-skin',
    currentImpl: 'button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<button class="lw-webnovel-font-chip"> ➔ <lw-chip variant="choice" size="sm">',
  },
];
