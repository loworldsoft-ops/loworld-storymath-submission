/**
 * LoworldUI Universal Swipe Gesture Design System & Full Audit Catalog
 * 모노레포 전역(17개 Swipe/Touch/Carousel 인스턴스) 전수조사 데이터 및 프리셋/거버넌스 체계
 */

export interface SwipeAuditMetrics {
  totalCount: number;
  standardDirectiveCount: number; // [lwSwipeTrack]
  coreUtilityCount: number;       // bindSwipeGestures
  inlineAdhocCount: number;       // 인라인 터치 리스너
  pureCssSnapCount: number;       // 순수 CSS 스냅
  complianceRate: number;         // 표준화 준수율 %
  presetsCount: number;
  familyDistribution: Array<{
    family: string;
    label: string;
    icon: string;
    count: number;
    percentage: number;
  }>;
  appDistribution: Array<{
    app: string;
    label: string;
    count: number;
    percentage: number;
  }>;
}

export interface SwipeStyleFamily {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  swipeMode: 'item' | 'page';
  scrollSnapMode: 'mandatory' | 'proximity' | 'none';
  enableMouseDrag: boolean;
  enableWheel: boolean;
  countApprox: number;
  percentage: number;
  bestPractice: string;
  codeSnippet: string;
}

export interface SwipePresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  mode: 'item' | 'page';
  snap: 'mandatory' | 'proximity' | 'none';
  mouseDrag: boolean;
  wheel: boolean;
  countApprox: number;
  percentage: number;
  bestPractice: string;
  codeSnippet: string;
}

export interface SwipeCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  styleFamily: 'item-carousel' | 'page-viewer' | 'fluid-bar' | 'master-detail';
  currentImpl: '[lwSwipeTrack]' | 'bindSwipeGestures' | 'inline-touch' | 'css-snap';
  isStandard: boolean;
  status: 'compliant' | 'needs-migration';
  recommendation: string;
}

export const SWIPE_AUDIT_METRICS: SwipeAuditMetrics = {
  totalCount: 17,
  standardDirectiveCount: 8,
  coreUtilityCount: 2,
  inlineAdhocCount: 5,
  pureCssSnapCount: 2,
  complianceRate: 58.9,
  presetsCount: 4,
  familyDistribution: [
    { family: 'item-carousel', label: '아이템 카드 캐러셀 (Item Carousel)', icon: '🃏', count: 8, percentage: 47.1 },
    { family: 'page-viewer', label: '100% 전폭 페이지 뷰어 (Page Viewer)', icon: '📖', count: 4, percentage: 23.5 },
    { family: 'fluid-bar', label: '가변 너비 액션/도구 탭바 (Fluid Tool Bar)', icon: '🎛️', count: 3, percentage: 17.6 },
    { family: 'master-detail', label: '2-Depth 계층 네비게이션 (Master-Detail)', icon: '📱', count: 2, percentage: 11.8 },
  ],
  appDistribution: [
    { app: 'novel-studio', label: 'Novel Studio (웹소설 독서/캐러셀)', count: 4, percentage: 23.5 },
    { app: 'showcase-overview', label: 'Loworld Showcase (월페이퍼/허브)', count: 3, percentage: 17.6 },
    { app: 'd2r-suite', label: 'D2R Database (아이템/인벤토리/룬)', count: 3, percentage: 17.6 },
    { app: 'database-console', label: 'Database Console (모바일 카드/칩스)', count: 2, percentage: 11.8 },
    { app: 'canvas-viewport', label: 'Canvas Viewport (도구/팔레트 바)', count: 2, percentage: 11.8 },
    { app: 'study-homework', label: 'Study & Homework (학습 카드 플립)', count: 2, percentage: 11.8 },
    { app: 'calendar-plan', label: 'Calendar & Plan (주간 뷰 슬라이더)', count: 1, percentage: 5.9 },
  ],
};

export const SWIPE_STYLE_FAMILIES: SwipeStyleFamily[] = [
  {
    id: 'item-carousel',
    name: 'Item Card Carousel',
    nameKo: '아이템 카드 캐러셀',
    icon: '🃏',
    description: '여러 장의 카드를 가로로 나열하고 아이템 단위로 자연스럽게 스냅/페이징하는 패밀리입니다. 마우스 드래그와 터치 스와이프를 모두 지원하며, 클릭 오동작 방지(shouldSuppressClick)를 내장합니다.',
    swipeMode: 'item',
    scrollSnapMode: 'mandatory',
    enableMouseDrag: true,
    enableWheel: false,
    countApprox: 8,
    percentage: 47.1,
    bestPractice: 'swipeMode="item" scrollSnapMode="mandatory"를 사용하고, 카드 내 버튼/링크 클릭 시 #swipe="lwSwipe"의 shouldSuppressClick() 가드를 반드시 적용하세요.',
    codeSnippet: `<div
  class="card-carousel-track"
  lwSwipeTrack
  swipeMode="item"
  scrollSnapMode="mandatory"
  [enableMouseDrag]="true"
  [(activeIndex)]="activeCardIndex"
  #swipe="lwSwipe">
  @for (card of cards; track card.id) {
    <lw-card
      class="carousel-item"
      [variant]="'elevated'"
      (click)="!swipe.shouldSuppressClick() && onSelect(card)">
      <!-- 카드 컨텐츠 -->
    </lw-card>
  }
</div>`,
  },
  {
    id: 'page-viewer',
    name: 'Fullwidth Page Viewer',
    nameKo: '100% 전폭 페이지 뷰어',
    icon: '📖',
    description: '웹소설 뷰어, 슬라이드 프레젠테이션, 데스크톱 가상 데스크톱 화면처럼 1개 화면(100% vw/container) 단위로 완전히 넘어가는 대형 뷰어 패밀리입니다.',
    swipeMode: 'page',
    scrollSnapMode: 'mandatory',
    enableMouseDrag: true,
    enableWheel: false,
    countApprox: 4,
    percentage: 23.5,
    bestPractice: 'swipeMode="page"를 선언하고 각 슬라이드 컨테이너의 width를 100%로 설정하여 뷰포트 정렬을 보장하세요.',
    codeSnippet: `<div
  class="page-viewer-track"
  lwSwipeTrack
  swipeMode="page"
  scrollSnapMode="mandatory"
  [enableMouseDrag]="true"
  [(activeIndex)]="currentPageIndex"
  #pageSwipe="lwSwipe">
  @for (page of pages; track page.id) {
    <section class="viewer-page-surface">
      <!-- 전폭 뷰어 컨텐츠 -->
    </section>
  }
</div>`,
  },
  {
    id: 'fluid-bar',
    name: 'Fluid Action & Tool Bar',
    nameKo: '가변 너비 액션/도구 탭바',
    icon: '🎛️',
    description: '도구 모음, 필터 칩 바, 챕터 목록 탭처럼 항목별 너비가 가변적이며 스냅 없이 부드럽게 마우스 드래그 및 마우스 휠 수평 스크롤이 필요한 바 패밀리입니다.',
    swipeMode: 'item',
    scrollSnapMode: 'none',
    enableMouseDrag: true,
    enableWheel: true,
    countApprox: 3,
    percentage: 17.6,
    bestPractice: 'scrollSnapMode="none"과 [enableWheel]="true"를 결합하여 데스크톱 가로 휠 스크롤과 터치 관성 스크롤을 동시에 활성화하세요.',
    codeSnippet: `<nav
  class="fluid-action-bar"
  lwSwipeTrack
  swipeMode="item"
  scrollSnapMode="none"
  [enableMouseDrag]="true"
  [enableWheel]="true">
  @for (chip of filterChips; track chip.id) {
    <lw-chip [variant]="'filter'">{{ chip.label }}</lw-chip>
  }
</nav>`,
  },
  {
    id: 'master-detail',
    name: 'Master-Detail Navigation',
    nameKo: '2-Depth 계층 네비게이션',
    icon: '📱',
    description: '모바일 메신저나 설정 창처럼 목록(Master)에서 상세(Detail)로 좌우 스와이프 전이하며 뒤로가기 제스처를 지원하는 2계층 화면 패밀리입니다.',
    swipeMode: 'page',
    scrollSnapMode: 'mandatory',
    enableMouseDrag: true,
    enableWheel: false,
    countApprox: 2,
    percentage: 11.8,
    bestPractice: '바텀시트나 모바일 뷰에서 activeIndex를 0(목록)과 1(상세)로 바인딩하여 자연스러운 페이지 전환 제스처를 제공하세요.',
    codeSnippet: `<div
  class="master-detail-track"
  lwSwipeTrack
  swipeMode="page"
  scrollSnapMode="mandatory"
  [(activeIndex)]="navDepthIndex">
  <div class="master-pane">목록 화면</div>
  <div class="detail-pane">상세 화면</div>
</div>`,
  },
];

export const SWIPE_PRESETS_CATALOG: SwipePresetDefinition[] = [
  {
    id: 'item-card-carousel',
    name: 'Standard Card Carousel',
    nameKo: '표준 카드 캐러셀 프리셋',
    icon: '🃏',
    description: '카드 피커, 캐릭터 쇼케이스, 갤러리 피드 등 카드 단위 멈춤 스냅과 터치/드래그를 지원하는 범용 프리셋입니다.',
    mode: 'item',
    snap: 'mandatory',
    mouseDrag: true,
    wheel: false,
    countApprox: 8,
    percentage: 47.1,
    bestPractice: 'lwSwipeTrack swipeMode="item" scrollSnapMode="mandatory" 조합',
    codeSnippet: `<div class="carousel" lwSwipeTrack swipeMode="item" scrollSnapMode="mandatory" [enableMouseDrag]="true" [(activeIndex)]="idx" #sw="lwSwipe">
  <!-- Items with (click)="!sw.shouldSuppressClick() && action()" -->
</div>`,
  },
  {
    id: 'fullwidth-page-viewer',
    name: 'Fullwidth Page Viewer',
    nameKo: '100% 전폭 페이지 뷰어 프리셋',
    icon: '📖',
    description: '소설 독서 뷰어, 온보딩 튜토리얼 슬라이드, 풀스크린 데스크톱 화면 전환 전용 100% 너비 프리셋입니다.',
    mode: 'page',
    snap: 'mandatory',
    mouseDrag: true,
    wheel: false,
    countApprox: 4,
    percentage: 23.5,
    bestPractice: 'lwSwipeTrack swipeMode="page" scrollSnapMode="mandatory" 조합',
    codeSnippet: `<div class="pager" lwSwipeTrack swipeMode="page" scrollSnapMode="mandatory" [enableMouseDrag]="true" [(activeIndex)]="page">
  <!-- 100% width slides -->
</div>`,
  },
  {
    id: 'wheel-action-bar',
    name: 'Smooth Wheel & Drag Action Bar',
    nameKo: '휠 & 드래그 가변 액션바 프리셋',
    icon: '🎛️',
    description: '필터 칩 바, 도구 팔레트 등 항목 너비가 제각각인 툴바에서 스냅 없이 부드럽게 마우스 휠과 드래그를 허용하는 프리셋입니다.',
    mode: 'item',
    snap: 'none',
    mouseDrag: true,
    wheel: true,
    countApprox: 3,
    percentage: 17.6,
    bestPractice: 'lwSwipeTrack swipeMode="item" scrollSnapMode="none" [enableWheel]="true" 조합',
    codeSnippet: `<nav class="toolbar" lwSwipeTrack swipeMode="item" scrollSnapMode="none" [enableMouseDrag]="true" [enableWheel]="true">
  <!-- Variable width chips or tools -->
</nav>`,
  },
  {
    id: 'mobile-nav-depth',
    name: 'Mobile Nav Depth Transition',
    nameKo: '모바일 뎁스 전환 네비게이터 프리셋',
    icon: '📱',
    description: '모바일 마스터-디테일 화면에서 제스처로 이전/다음 화면을 밀어 넘길 수 있는 2단계 전환 프리셋입니다.',
    mode: 'page',
    snap: 'mandatory',
    mouseDrag: true,
    wheel: false,
    countApprox: 2,
    percentage: 11.8,
    bestPractice: 'lwSwipeTrack swipeMode="page" scrollSnapMode="mandatory" [thresholdPx]="30" 조합',
    codeSnippet: `<div class="nav-depth" lwSwipeTrack swipeMode="page" scrollSnapMode="mandatory" [thresholdPx]="30" [(activeIndex)]="depth">
  <!-- Master (depth 0) and Detail (depth 1) -->
</div>`,
  },
];

export const SWIPE_CENSUS_CATALOG: SwipeCensusItem[] = [
  {
    id: 'novel-reader-carousel',
    title: '소설 표지 및 추천작 카드 캐러셀',
    location: 'projects/loworld-ui-showcase/.../novel-reader-carousel.component.html (L12)',
    app: 'novel-studio',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lwSwipeTrack swipeMode="item" scrollSnapMode="mandatory" 모범 적용 완료.',
  },
  {
    id: 'overview-desktop-surface',
    title: '멀티 데스크톱 스페이스 가상 화면 전환 스와이프',
    location: 'projects/loworld-ui-showcase/.../overview-desktop-surface.component.html (L8)',
    app: 'showcase-overview',
    styleFamily: 'page-viewer',
    currentImpl: 'bindSwipeGestures',
    isStandard: true,
    status: 'compliant',
    recommendation: '코어 유틸 bindSwipeGestures 적용 완료. 향후 템플릿 [lwSwipeTrack] 지시어로 통일 가능.',
  },
  {
    id: 'overview-wallpaper-dialog',
    title: '월페이퍼 배경화면 선택 피커 캐러셀',
    location: 'projects/loworld-ui-showcase/.../overview-wallpaper-dialog.component.ts (L45)',
    app: 'showcase-overview',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '모달 다이얼로그 내부 표준 [lwSwipeTrack] 카드 스냅 적용 완료.',
  },
  {
    id: 'd2r-character-picker',
    title: '디아블로2 직업 및 캐릭터 선택 카드 슬라이더',
    location: 'projects/loworld-ui-showcase/.../d2r-character-picker.component.html (L5)',
    app: 'd2r-suite',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '표준 [lwSwipeTrack] 적용 완료.',
  },
  {
    id: 'd2r-inventory-grid-bar',
    title: '디아블로2 룬/보석 탭 툴바 스와이프',
    location: 'projects/loworld-ui-showcase/.../d2r-inventory-grid.component.html (L20)',
    app: 'd2r-suite',
    styleFamily: 'fluid-bar',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '가변 너비 룬 카테고리 탭 수평 드래그 표준 적용 완료.',
  },
  {
    id: 'd2r-runeword-catalog',
    title: '룬워드 상세 장비 카드 캐러셀',
    location: 'projects/loworld-ui-showcase/.../d2r-runeword-catalog.component.html (L18)',
    app: 'd2r-suite',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '카드 단위 스냅 표준 [lwSwipeTrack] 적용 완료.',
  },
  {
    id: 'novel-viewer-reader',
    title: '웹소설 본문 독서 뷰어 페이지 넘김',
    location: 'projects/loworld-ui-showcase/.../novel-viewer.component.ts (L88)',
    app: 'novel-studio',
    styleFamily: 'page-viewer',
    currentImpl: 'inline-touch',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '인라인 touchstart/touchend 제스처를 [lwSwipeTrack] swipeMode="page"로 마이그레이션 권장.',
  },
  {
    id: 'novel-chapter-nav',
    title: '소설 챕터 목차 네비게이션 가로 바',
    location: 'projects/loworld-ui-showcase/.../novel-chapter-nav.component.ts (L34)',
    app: 'novel-studio',
    styleFamily: 'fluid-bar',
    currentImpl: 'css-snap',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '순수 CSS scroll-snap에서 데스크톱 마우스 드래그를 지원하는 [lwSwipeTrack]으로 확장 권장.',
  },
  {
    id: 'novel-character-relationship',
    title: '등장인물 관계도 노드 슬라이더 바',
    location: 'projects/loworld-ui-showcase/.../novel-character-relationship.component.ts (L52)',
    app: 'novel-studio',
    styleFamily: 'fluid-bar',
    currentImpl: 'css-snap',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '마우스 휠 및 드래그 지원 [lwSwipeTrack] scrollSnapMode="none" 전환 권장.',
  },
  {
    id: 'database-mobile-card-list',
    title: '모바일 데이터베이스 행 카드 스와이프 목록',
    location: 'projects/loworld-ui-showcase/.../database-mobile-card-list.component.html (L14)',
    app: 'database-console',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '모바일 전용 카드 스와이프 [lwSwipeTrack] 적용 완료.',
  },
  {
    id: 'database-filter-chips-bar',
    title: '데이터베이스 뷰 필터 칩스 스와이프 탭바',
    location: 'projects/loworld-ui-showcase/.../database-filter-chips-bar.component.ts (L29)',
    app: 'database-console',
    styleFamily: 'fluid-bar',
    currentImpl: 'bindSwipeGestures',
    isStandard: true,
    status: 'compliant',
    recommendation: 'bindSwipeGestures 유틸 적용 완료. 템플릿 지시어로 통일 권장.',
  },
  {
    id: 'canvas-toolbar',
    title: '무한 캔버스 반응형 플로팅 툴바',
    location: 'projects/loworld-ui-showcase/.../canvas-toolbar.component.ts (L40)',
    app: 'canvas-viewport',
    styleFamily: 'fluid-bar',
    currentImpl: 'inline-touch',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '모바일 좁은 폭에서 overflow-x: auto 대신 [lwSwipeTrack] [enableWheel]="true" 적용 권장.',
  },
  {
    id: 'canvas-palette-bar',
    title: '캔버스 색상/브러시 프리셋 팔레트 바',
    location: 'projects/loworld-ui-showcase/.../canvas-palette-bar.component.ts (L61)',
    app: 'canvas-viewport',
    styleFamily: 'fluid-bar',
    currentImpl: 'inline-touch',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '인라인 pointerdown 핸들러를 [lwSwipeTrack] scrollSnapMode="none"으로 교체 권장.',
  },
  {
    id: 'study-card-flip-carousel',
    title: '학습 단어장 카드 플립 및 스와이프 캐러셀',
    location: 'projects/loworld-ui-showcase/.../study-card-flip-carousel.component.html (L8)',
    app: 'study-homework',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '단어 카드 플립 + [lwSwipeTrack] 결합 완료.',
  },
  {
    id: 'homework-submission-gallery',
    title: '과제 제출물 이미지 첨부 갤러리 슬라이더',
    location: 'projects/loworld-ui-showcase/.../homework-submission-gallery.component.html (L15)',
    app: 'study-homework',
    styleFamily: 'item-carousel',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '표준 [lwSwipeTrack] 적용 완료.',
  },
  {
    id: 'calendar-week-slider',
    title: '캘린더 주간(Week) 뷰 슬라이더',
    location: 'projects/loworld-ui-showcase/.../calendar-week-slider.component.ts (L73)',
    app: 'calendar-plan',
    styleFamily: 'page-viewer',
    currentImpl: 'inline-touch',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '인라인 터치 핸들러를 [lwSwipeTrack] swipeMode="page"로 표준화 권장.',
  },
  {
    id: 'shortcuts-guide-pager',
    title: '단축키 가이드 다이얼로그 페이징 슬라이더',
    location: 'projects/loworld-ui-showcase/.../shortcuts-guide-pager.component.html (L6)',
    app: 'showcase-overview',
    styleFamily: 'page-viewer',
    currentImpl: '[lwSwipeTrack]',
    isStandard: true,
    status: 'compliant',
    recommendation: '모달 내부 [lwSwipeTrack] swipeMode="page" 표준화 완료.',
  },
];

export interface SwipeApiCheatsheetItem {
  prop: string;
  type: string;
  defaultValue: string;
  default?: string;
  desc: string;
}

export const SWIPE_API_CHEATSHEET: SwipeApiCheatsheetItem[] = [
  {
    prop: 'swipeMode',
    type: "'item' | 'page'",
    defaultValue: "'item'",
    get default() { return this.defaultValue; },
    desc: "스와이프 이동 단위 (item: 아이템 폭/간격 단위, page: 뷰포트 컨테이너 100% 전폭 단위)",
  },
  {
    prop: 'scrollSnapMode',
    type: "'mandatory' | 'proximity' | 'none'",
    defaultValue: "'mandatory'",
    get default() { return this.defaultValue; },
    desc: 'CSS 및 제스처 스크롤 스냅 정책 (none 지정 시 부드러운 가변 툴바 스크롤)',
  },
  {
    prop: 'enableMouseDrag',
    type: 'boolean',
    defaultValue: 'true',
    get default() { return this.defaultValue; },
    desc: '데스크톱 환경에서 마우스 좌클릭 드래그로 스와이프 제스처 시뮬레이션 허용 여부',
  },
  {
    prop: 'enableTouch',
    type: 'boolean',
    defaultValue: 'true',
    get default() { return this.defaultValue; },
    desc: '모바일 및 태블릿 터치 스크린 제스처 허용 여부',
  },
  {
    prop: 'enableWheel',
    type: 'boolean',
    defaultValue: 'false',
    get default() { return this.defaultValue; },
    desc: '데스크톱 마우스 휠 세로/가로 스크롤을 트랙 수평 스크롤로 자동 변환할지 여부',
  },
  {
    prop: 'thresholdPx',
    type: 'number',
    defaultValue: '40',
    get default() { return this.defaultValue; },
    desc: '페이지/아이템 전환으로 인정되는 최소 스와이프 드래그 픽셀 임계값',
  },
  {
    prop: '[(activeIndex)]',
    type: 'model<number>',
    defaultValue: '0',
    get default() { return this.defaultValue; },
    desc: '현재 포커스된 아이템/페이지 인덱스 (양방향 Two-way 시그널 바인딩 지원)',
  },
  {
    prop: 'shouldSuppressClick()',
    type: '() => boolean',
    defaultValue: 'method',
    get default() { return this.defaultValue; },
    desc: '스와이프 드래그 직후 내부 클릭 이벤트가 오작동으로 발화하는 것을 방지하는 가드 메서드',
  },
  {
    prop: 'prev() / next()',
    type: '() => void',
    defaultValue: 'method',
    get default() { return this.defaultValue; },
    desc: '좌우 이전/다음 단위로 스무스 스크롤 이동',
  },
  {
    prop: 'goTo(index)',
    type: '(index: number) => void',
    defaultValue: 'method',
    get default() { return this.defaultValue; },
    desc: '지정된 인덱스로 즉시 부드럽게 스크롤 정렬',
  },
];
