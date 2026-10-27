/**
 * LoworldUI Universal Side-Menu Design System & Full Audit Catalog
 * 데스크톱 OS 셸 / 모바일 패널 사이드바 메뉴 전수조사(35개 메뉴 항목) 데이터 및 프리셋/거버넌스 체계
 */

export interface SideMenuAuditMetrics {
  totalCount: number;
  inlineHardcodedCount: number;
  migratedStandardCount: number;
  complianceRate: number;
  presetsCount: number;
  categoryDistribution: Array<{ category: string; label: string; count: number; percentage: number }>;
}

export interface SideMenuStyleFamily {
  id: string;
  name: string;
  nameKo: string;
  badge: string;
  description: string;
  items: Array<{
    name: string;
    description: string;
    selector: string;
    features: string[];
  }>;
}

export interface SideMenuPresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  countApprox: number;
  percentage: number;
  bestPractice: string;
  codeSnippet: string;
}

export interface SideMenuCensusItem {
  id: string;
  title: string;
  section: '즐겨찾기 (Favorites)' | '서비스 도메인 (Locations)';
  parentGroup?: string;
  depth: 'Depth 1 (Parent)' | 'Depth 2 (Sub)' | 'Depth 1 (Flat)';
  targetRoute: string;
  badgeSource: string;
  isStandard: boolean;
  status: 'compliant' | 'migrated';
  description: string;
}

export const SIDE_MENU_AUDIT_METRICS: SideMenuAuditMetrics = {
  totalCount: 35,
  inlineHardcodedCount: 0,
  migratedStandardCount: 35,
  complianceRate: 100,
  presetsCount: 4,
  categoryDistribution: [
    { category: 'ui-components', label: 'UI Components 계층 (도감 및 8개 카테고리)', count: 10, percentage: 28.6 },
    { category: 'design-systems', label: '디자인 시스템 계층 (11대 핵심 소자)', count: 12, percentage: 34.3 },
    { category: 'architecture', label: '코어 아키텍처 계층 (지시자/서비스/테마 등)', count: 6, percentage: 17.1 },
    { category: 'domains', label: '서비스 도메인 계층 (OS, Novel, Battle 등)', count: 7, percentage: 20.0 },
  ],
};

export const SIDE_MENU_STYLE_FAMILIES: SideMenuStyleFamily[] = [
  {
    id: 'os-sidebar-shell',
    name: 'OS Sidebar Shell & Sections',
    nameKo: 'OS 사이드바 셸 및 섹션 그룹',
    badge: 'Layout / Shell',
    description: '데스크톱 macOS Finder 및 태블릿/모바일 반응형 사이드 패널을 통합 지원하는 스크롤/접힘 컨테이너',
    items: [
      {
        name: 'LwSideMenu (루트 셸)',
        description: '사이드바 너비, 접힘(collapsed), 다크 테마 및 스크롤바를 제어하는 최상위 컨테이너',
        selector: '<lw-side-menu [collapsed]="false" width="250px">',
        features: ['가변/고정 너비 커스텀', 'collapsed 애니메이션', '다크/라이트 테마 자동 동기화'],
      },
      {
        name: 'LwSideMenuSection (섹션 그룹)',
        description: '카테고리 구분선, 섹션 타이틀, 우측 유틸리티 액션 슬롯([sectionAction]) 지원',
        selector: '<lw-side-menu-section title="즐겨찾기">',
        features: ['헤더 액션 투입 슬롯', '대문자 서식 및 레터 스페이싱', '일관된 하단 여백'],
      },
    ],
  },
  {
    id: 'accordion-tree',
    name: 'Accordion Navigation Tree',
    nameKo: '아코디언 계층 네비게이션 트리',
    badge: 'Navigation / Tree',
    description: '부모 노드와 자식 노드를 부드러운 CSS Grid 0fr -> 1fr 높이 애니메이션으로 토글하는 계층 트리',
    items: [
      {
        name: 'LwSideMenuTree (트리 그룹)',
        description: '부모 헤더 버튼, 90도 회전 셰브론 토글 버튼, 라우트 태그 및 카운트 뱃지 일체형',
        selector: '<lw-side-menu-tree [(expanded)]="isExpanded" label="UI Components">',
        features: ['양방향 시그널 모델 바인딩', 'CSS Grid 고성능 트랜지션', '원클릭 라우터 복사 지원'],
      },
    ],
  },
  {
    id: 'menu-items',
    name: 'Universal Nav Items & Badges',
    nameKo: '표준 네비게이션 아이템 및 뱃지',
    badge: 'Atom / Interactive',
    description: '일반 플랫 메뉴, 서브트리 메뉴, 인디케이터 라인, 카운트 뱃지 및 라우트 태그를 탑재한 클릭 버튼',
    items: [
      {
        name: 'LwSideMenuItem (단일 아이템)',
        description: 'default / sub / parent 3종 변형을 지원하며 호버/액티브 인셋 하이라이트 제공',
        selector: '<button lw-side-menu-item variant="sub" label="버튼 시스템">',
        features: ['인셋 액센트 보더 하이라이트', '라우트 태그 실시간 복사 피드백', '유연한 아이콘 슬롯'],
      },
    ],
  },
];

export const SIDE_MENU_PRESETS_CATALOG: SideMenuPresetDefinition[] = [
  {
    id: 'finder-nav-tree',
    name: 'macOS Finder Navigation Tree',
    nameKo: 'macOS Finder 스타일 계층형 트리',
    icon: '📂',
    description: '대분류 허브로의 즉시 이동과 하위 카테고리 확장을 동시에 지원하는 2-Way 트리 프리셋입니다.',
    countApprox: 3,
    percentage: 8.6,
    bestPractice: '<lw-side-menu-tree>를 활용하여 부모 클릭과 셰브론 토글 클릭을 분리하고, 부드러운 아코디언 인터랙션을 제공하세요.',
    codeSnippet: `<lw-side-menu-tree
  [(expanded)]="isUiExpanded"
  label="UI Components"
  [badge]="totalCount"
  [active]="currentTab === 'components-hub'"
  (headerClick)="goToHub()"
>
  <button lw-side-menu-item variant="sub" label="전체 컴포넌트 도감" [active]="isAll" (click)="openAll()" />
  <button lw-side-menu-item variant="sub" label="레이아웃 & 셸" [badge]="32" (click)="filter('layout')" />
</lw-side-menu-tree>`,
  },
  {
    id: 'domain-location-list',
    name: 'Domain Location Flat Item List',
    nameKo: '도메인 로케이션 단일 아이템 리스트',
    icon: '🌐',
    description: '아이콘, 대문자 도메인 명칭, 도메인별 소속 컴포넌트 개수를 심플하고 명확하게 시각화하는 1-depth 리스트 프리셋입니다.',
    countApprox: 7,
    percentage: 20.0,
    bestPractice: '<lw-side-menu-item variant="default">에 [itemIcon]과 [badge]를 전달하여 모바일 및 데스크톱에서 균일한 터치 타겟을 확보하세요.',
    codeSnippet: `<button lw-side-menu-item
  label="NOVEL"
  [badge]="storyCount"
  [active]="selectedDomain === 'novel'"
  (click)="selectDomain('novel')"
>
  <lw-os-icon itemIcon icon="book" [size]="15" />
</button>`,
  },
  {
    id: 'compact-design-system-menu',
    name: 'Compact Design System Sub-Item',
    nameKo: '29px 컴팩트 디자인 시스템 서브메뉴',
    icon: '🎨',
    description: '좁은 사이드바 너비에서도 많은 양의 디자인 시스템 소자를 한눈에 볼 수 있도록 29px 높이로 압축 렌더링되는 서브메뉴 프리셋입니다.',
    countApprox: 12,
    percentage: 34.3,
    bestPractice: '<lw-side-menu-item variant="sub">를 사용하여 좌측 인디케이터 라인과 함께 하이라이트 인셋 효과를 적용하세요.',
    codeSnippet: `<button lw-side-menu-item
  variant="sub"
  label="사이드-메뉴 시스템"
  [badge]="35"
  [active]="currentTab === 'side-menus'"
  [routeTag]="'#/systems/side-menus'"
  [showRouteBadge]="showTags"
  (click)="selectTab('side-menus')"
/>`,
  },
  {
    id: 'section-with-utility-action',
    name: 'Section Header with Utility Toggle Action',
    nameKo: '유틸리티 액션 버튼이 결합된 섹션 헤더',
    icon: '⚙️',
    description: '섹션 제목 옆에 라우트 태그 토글, 새로고침, 정렬 등 유틸리티 버튼을 배치하는 고급 섹션 헤더 프리셋입니다.',
    countApprox: 1,
    percentage: 2.9,
    bestPractice: '<lw-side-menu-section>의 [sectionAction] 슬롯에 컴팩트 버튼을 배치하여 인터랙티브 옵션을 제공하세요.',
    codeSnippet: `<lw-side-menu-section title="즐겨찾기 (Favorites)">
  <button sectionAction lw-button variant="ghost" size="xs" shape="pill" type="button" class="route-badge-toggle-btn" (click)="toggleRouteBadges()">
    <span>🔗 라우트 켬</span>
  </button>
  <!-- 메뉴 내용 -->
</lw-side-menu-section>`,
  },
];

export const SIDE_MENU_CENSUS_CATALOG: SideMenuCensusItem[] = [
  // 1. UI Components 트리
  {
    id: 'census-ui-hub',
    title: 'UI Components (통합 허브)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 1 (Parent)',
    targetRoute: '#/components-hub',
    badgeSource: 'totalCount (전체 컴포넌트 총합)',
    isStandard: true,
    status: 'migrated',
    description: '전체 UI 컴포넌트 랜딩 대시보드로 이동하며 서브메뉴를 펼칩니다.',
  },
  {
    id: 'census-ui-all',
    title: '전체 컴포넌트 도감',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/components',
    badgeSource: 'totalCount',
    isStandard: true,
    status: 'migrated',
    description: '모든 컴포넌트를 갤러리/테이블 형태로 탐색할 수 있는 기본 도감 뷰입니다.',
  },
  {
    id: 'census-ui-cat-layout',
    title: '레이아웃 & 셸 (layout)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/layout',
    badgeSource: 'categoryCounts["layout"]',
    isStandard: true,
    status: 'migrated',
    description: '데스크톱 윈도우, 사이드바, 헤더바 등 레이아웃 컴포넌트 필터링.',
  },
  {
    id: 'census-ui-cat-navigation',
    title: '네비게이션 & 바 (navigation)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/navigation',
    badgeSource: 'categoryCounts["navigation"]',
    isStandard: true,
    status: 'migrated',
    description: '사이드메뉴, 탭바, 브레드크럼, FAB 등 내비게이션 요소 필터링.',
  },
  {
    id: 'census-ui-cat-popups',
    title: '팝업 & 오버레이 (popups)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/popups',
    badgeSource: 'categoryCounts["popups"]',
    isStandard: true,
    status: 'migrated',
    description: '모달, 바텀시트, 툴팁, 드롭다운 메뉴 필터링.',
  },
  {
    id: 'census-ui-cat-data-display',
    title: '데이터 디스플레이 (data-display)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/data-display',
    badgeSource: 'categoryCounts["data-display"]',
    isStandard: true,
    status: 'migrated',
    description: '카드, 배지, 아바타, 프로그레스바, 지표 라인 필터링.',
  },
  {
    id: 'census-ui-cat-forms',
    title: '폼 & 컨트롤 (forms)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/forms',
    badgeSource: 'categoryCounts["forms"]',
    isStandard: true,
    status: 'migrated',
    description: '버튼, 검색창, 스위치, 컬러피커 등 입력 요소 필터링.',
  },
  {
    id: 'census-ui-cat-canvas',
    title: '캔버스 & 인터랙션 (canvas)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/canvas',
    badgeSource: 'categoryCounts["canvas"]',
    isStandard: true,
    status: 'migrated',
    description: '게임 뷰, 맵 에디터, 캔버스 그래픽 요소 필터링.',
  },
  {
    id: 'census-ui-cat-feedback',
    title: '피드백 & 상태 (feedback)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/feedback',
    badgeSource: 'categoryCounts["feedback"]',
    isStandard: true,
    status: 'migrated',
    description: '스낵바, 다이얼로그, 로딩 인디케이터 필터링.',
  },
  {
    id: 'census-ui-cat-media',
    title: '미디어 & 비주얼 (media)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: 'UI Components 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/category/media',
    badgeSource: 'categoryCounts["media"]',
    isStandard: true,
    status: 'migrated',
    description: 'SVG 아이콘, 앱 아이콘, 일러스트레이션 뷰 필터링.',
  },

  // 2. 디자인 시스템 트리 (11대 핵심 소자 + 허브)
  {
    id: 'census-ds-hub',
    title: '디자인 시스템 (카탈로그 허브)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 1 (Parent)',
    targetRoute: '#/systems',
    badgeSource: '4,567 (11대 소자 총합)',
    isStandard: true,
    status: 'migrated',
    description: '버튼, 배지, 카드, 모달, 시트, 칩스 등 핵심 소자 카탈로그 허브.',
  },
  {
    id: 'census-ds-buttons',
    title: '버튼 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/buttons',
    badgeSource: 'buttonAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwButton 16개 스타일 패밀리 및 1,200+ 버튼 인스턴스 감사.',
  },
  {
    id: 'census-ds-badges',
    title: '배지 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/badges',
    badgeSource: 'badgeAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwBadge 알림/상태/카운트 인디케이터 전수조사.',
  },
  {
    id: 'census-ds-cards',
    title: '카드 표면 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/cards',
    badgeSource: 'cardAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwCard 아웃라인/솔리드/인셋/글래스 서피스 카탈로그.',
  },
  {
    id: 'census-ds-modals',
    title: '모달 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/modals',
    badgeSource: 'modalAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwModal 윈도우 스타일 및 포털 오버레이 전수조사.',
  },
  {
    id: 'census-ds-sheets',
    title: '바텀시트 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/sheets',
    badgeSource: 'sheetAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwBottomSheet 3단 스냅 및 모바일 제스처 시트 카탈로그.',
  },
  {
    id: 'census-ds-chips',
    title: '칩스 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/chips',
    badgeSource: 'chipAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwChip 태그/필터/선택 소자 전수조사.',
  },
  {
    id: 'census-ds-app-icons',
    title: '앱아이콘 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/app-icons',
    badgeSource: 'appIconAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwAppIcon 스퀴클/라운드/글래스 앱 런처 아이콘 카탈로그.',
  },
  {
    id: 'census-ds-grids',
    title: '그리드 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/grids',
    badgeSource: 'gridAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwGrid 반응형 그리드 및 갭/배치 시스템.',
  },
  {
    id: 'census-ds-lists',
    title: '리스트 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/lists',
    badgeSource: 'listAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwList 44px 컴팩트 디렉터리 및 테이블 전수조사.',
  },
  {
    id: 'census-ds-swipes',
    title: '스와이프 시스템',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/swipes',
    badgeSource: 'swipeAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwSwipeTrack 스와이프 제스처 및 액션 트랙 전수조사.',
  },
  {
    id: 'census-ds-side-menus',
    title: '사이드-메뉴 시스템 (신규)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '디자인 시스템 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/side-menus',
    badgeSource: 'sideMenuAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: 'LwSideMenu / LwSideMenuTree / LwSideMenuItem 공통 컴포넌트 전수조사.',
  },

  // 3. 코어 아키텍처 트리
  {
    id: 'census-arch-hub',
    title: '코어 아키텍처 & 기반 (통합 허브)',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '코어 아키텍처 트리',
    depth: 'Depth 1 (Parent)',
    targetRoute: '#/architecture-hub',
    badgeSource: 'totalFoundationCount',
    isStandard: true,
    status: 'migrated',
    description: '지시자, 서비스, 토큰 등 기반 아키텍처 대시보드.',
  },
  {
    id: 'census-arch-directives',
    title: '공통 지시자',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '코어 아키텍처 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/directives',
    badgeSource: 'directivesAuditMetrics.totalCount',
    isStandard: true,
    status: 'migrated',
    description: '드래그, 툴팁, 제스처 등 공통 디렉티브 카탈로그.',
  },
  {
    id: 'census-arch-services',
    title: '코어 서비스',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '코어 아키텍처 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/services',
    badgeSource: 'coreServicesCatalog.length',
    isStandard: true,
    status: 'migrated',
    description: '테마, 오버레이, 사운드 등 모노레포 싱글톤 서비스.',
  },
  {
    id: 'census-arch-colors',
    title: '테마 & 칼라',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '코어 아키텍처 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/colors',
    badgeSource: 'colorTokensCatalog.length',
    isStandard: true,
    status: 'migrated',
    description: 'HSL 기반 테마 토큰 및 시맨틱 팔레트.',
  },
  {
    id: 'census-arch-guides',
    title: '리드미 가이드',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '코어 아키텍처 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/guides',
    badgeSource: 'architectureGuidesCatalog.length',
    isStandard: true,
    status: 'migrated',
    description: '모노레포 개발 가이드 및 코딩 컨벤션.',
  },
  {
    id: 'census-arch-history',
    title: '워크 히스토리',
    section: '즐겨찾기 (Favorites)',
    parentGroup: '코어 아키텍처 트리',
    depth: 'Depth 2 (Sub)',
    targetRoute: '#/history',
    badgeSource: 'workHistoryCatalog.length',
    isStandard: true,
    status: 'migrated',
    description: '컴포넌트 리팩토링 및 아키텍처 작업 로그.',
  },

  // 4. 서비스 도메인 섹션 (Locations)
  {
    id: 'census-dom-os',
    title: 'OS',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/os',
    badgeSource: 'getDomainCount("os")',
    isStandard: true,
    status: 'migrated',
    description: '데스크톱 윈도우, 태스크바, 독, 셸 도메인 컴포넌트 필터링.',
  },
  {
    id: 'census-dom-novel',
    title: 'NOVEL',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/novel',
    badgeSource: 'getDomainCount("novel")',
    isStandard: true,
    status: 'migrated',
    description: '비주얼 노벨 렌더러, 대화창, 캐릭터 스탠딩, 오디오 도메인 필터링.',
  },
  {
    id: 'census-dom-battle',
    title: 'BATTLE',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/battle',
    badgeSource: 'getDomainCount("battle")',
    isStandard: true,
    status: 'migrated',
    description: '턴제 배틀 필드, HP 게이지, 스킬 커맨드 도메인 필터링.',
  },
  {
    id: 'census-dom-rpg',
    title: 'RPG',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/rpg',
    badgeSource: 'getDomainCount("rpg")',
    isStandard: true,
    status: 'migrated',
    description: '인벤토리, 장비창, 퀘스트 로그, 상태창 도메인 필터링.',
  },
  {
    id: 'census-dom-chat',
    title: 'CHAT',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/chat',
    badgeSource: 'getDomainCount("chat")',
    isStandard: true,
    status: 'migrated',
    description: '메신저 룸, 말풍선 버블, 이모티콘 피커 도메인 필터링.',
  },
  {
    id: 'census-dom-app',
    title: 'APP',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/app',
    badgeSource: 'getDomainCount("app")',
    isStandard: true,
    status: 'migrated',
    description: '설정, 캘린더, 파일 매니저, 미디어 플레이어 등 내장 앱 도메인 필터링.',
  },
  {
    id: 'census-dom-system',
    title: 'SYSTEM',
    section: '서비스 도메인 (Locations)',
    depth: 'Depth 1 (Flat)',
    targetRoute: '#/domain/system',
    badgeSource: 'getDomainCount("system")',
    isStandard: true,
    status: 'migrated',
    description: '시스템 알림, 권한 게이트, 스토리지 모니터 등 인프라 필터링.',
  },
];

export const SIDE_MENU_API_CHEATSHEET = `<!-- 1. 기본 사이드-메뉴 셸 및 섹션 구성 -->
<lw-side-menu [collapsed]="isSidebarCollapsed()" width="250px" ariaLabel="앱 메인 내비게이션">
  <lw-side-menu-section title="즐겨찾기 (Favorites)">
    <!-- 유틸리티 버튼 슬롯 -->
    <button sectionAction lw-button variant="ghost" size="xs" shape="pill" type="button" class="route-badge-toggle-btn" (click)="toggleTags()">
      🔗 라우트 켬
    </button>

    <!-- 계층형 아코디언 트리 -->
    <lw-side-menu-tree
      [(expanded)]="isUiTreeOpen"
      label="UI Components"
      [badge]="totalCount"
      [active]="currentTab === 'components-hub'"
      [routeTag]="'#/components-hub'"
      [showRouteBadge]="showTags()"
      (headerClick)="openHub()"
      (routeTagClick)="copyRoute('#/components-hub')"
    >
      <button lw-side-menu-item
        variant="sub"
        label="전체 컴포넌트 도감"
        [badge]="totalCount"
        [active]="currentTab === 'components'"
        (click)="openExplorer('all')"
      />
      <button lw-side-menu-item
        variant="sub"
        label="레이아웃 & 셸"
        [badge]="32"
        [active]="category === 'layout'"
        (click)="filterCategory('layout')"
      />
    </lw-side-menu-tree>
  </lw-side-menu-section>

  <!-- 2. 플랫 아이템 섹션 -->
  <lw-side-menu-section title="서비스 도메인 (Locations)">
    @for (dom of DOMAINS; track dom) {
      <button lw-side-menu-item
        variant="default"
        [label]="dom | uppercase"
        [badge]="getDomainCount(dom)"
        [active]="activeDomain === dom"
        (click)="selectDomain(dom)"
      >
        <lw-os-icon itemIcon [icon]="getDomainIcon(dom)" [size]="15" />
      </button>
    }
  </lw-side-menu-section>
</lw-side-menu>`;
