/**
 * LoworldUI Universal Directives Design System & Comprehensive Census Catalog
 * 모노레포 전역 공통 지시자(Directives) 전수조사 데이터, 프리셋, API 레퍼런스 및 거버넌스 체계
 */

export interface DirectiveAuditMetrics {
  totalCount: number;
  primitiveCount: number;
  coreBehaviorCount: number;
  layoutTargetCount: number;
  complianceRate: number;
  presetsCount: number;
  familyDistribution: Array<{
    family: string;
    label: string;
    icon: string;
    count: number;
    percentage: number;
  }>;
  layerDistribution: Array<{
    layer: string;
    label: string;
    count: number;
    percentage: number;
  }>;
}

export interface DirectiveFamilyDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  selector: string;
  layer: 'Primitives (L1)' | 'Core Behavior (L0)' | 'Layout & Binding (L1)';
  bestPractice: string;
  codeSnippet: string;
  badges: string[];
}

export interface DirectiveApiItem {
  id: string;
  selector: string;
  directiveName: string;
  layer: string;
  inputs: string;
  outputs: string;
  purpose: string;
  codeSnippet: string;
}

export interface DirectiveCensusItem {
  id: string;
  directiveName: string;
  selector: string;
  location: string;
  app: string;
  usageType: 'host-directive' | 'template-binding' | 'class-extension';
  isStandard: boolean;
  status: 'active' | 'recommended';
  description: string;
}

export const DIRECTIVES_AUDIT_METRICS: DirectiveAuditMetrics = {
  totalCount: 15,
  primitiveCount: 5,
  coreBehaviorCount: 6,
  layoutTargetCount: 4,
  complianceRate: 100,
  presetsCount: 6,
  familyDistribution: [
    { family: 'gesture', label: '제스처 & 인터랙션 (Gesture & Interaction)', icon: '🖐️', count: 2, percentage: 13.3 },
    { family: 'overlay', label: '오버레이 & 피드백 (Overlay & Tooltip)', icon: '💬', count: 2, percentage: 13.3 },
    { family: 'theme', label: '테마 & 스코프 (Theme & Scope)', icon: '🎨', count: 1, percentage: 6.7 },
    { family: 'dimension', label: '치수 & 반응형 타겟 (Dimension & Target)', icon: '📐', count: 2, percentage: 13.3 },
    { family: 'reactive', label: '반응형 폼 & 앵커 (Reactive & Form)', icon: '⚡', count: 2, percentage: 13.3 },
    { family: 'behavior', label: '코어 행동 믹스인 (Core Behaviors)', icon: '🧬', count: 6, percentage: 40.1 },
  ],
  layerDistribution: [
    { layer: 'Primitives (L1)', label: '공통 프리미티브 소자 지시자', count: 5, percentage: 33.3 },
    { layer: 'Core (L0)', label: '기반 아키텍처 행동 지시자', count: 6, percentage: 40.0 },
    { layer: 'Surface/Layout (L2)', label: '레이아웃/도메인 바인딩 지시자', count: 4, percentage: 26.7 },
  ],
};

export const DIRECTIVE_FAMILIES: DirectiveFamilyDefinition[] = [
  {
    id: 'lwDraggable',
    name: 'Universal Floating Draggable',
    nameKo: '부유형 창/패널 포인터 드래그 지시자',
    icon: '🖐️',
    description: '창(Window), 모달, 플로팅 패널의 헤더나 핸들을 마우스/터치로 잡아 화면 안에서 자유롭게 이동시키는 지시자입니다. 부모 컨테이너 및 뷰포트 경계 자동 클램핑과 터치 이탈 방지(Pointer Capture)를 내장합니다.',
    selector: '[lwDraggable]',
    layer: 'Primitives (L1)',
    bestPractice: 'handleSelector=".window-header" 형태로 드래그 시작 영역을 명시하고, bounds="parent"로 컨테이너 이탈을 방지합니다.',
    badges: ['Pointer Capture', 'Bounds Clamping', 'Absolute & Transform Mode', 'SRP'],
    codeSnippet: `<div
  class="floating-window"
  lwDraggable
  handleSelector=".window-header"
  positionMode="absolute"
  bounds="parent"
  [boundaryMargin]="8"
  (dragEnd)="onWindowMoved($event)">
  <header class="window-header">제목 표시줄 (드래그 영역)</header>
  <div class="window-body">내용...</div>
</div>`,
  },
  {
    id: 'lwSwipeTrack',
    name: 'Universal Swipe & Touch Track',
    nameKo: '범용 가로 스와이프 제스처 트랙 지시자',
    icon: '👆',
    description: '데스크톱 마우스 Grab&Drag, 모바일 터치 스와이프, 마우스 휠 수평 스크롤, CSS Scroll Snap 연동 및 클릭 오동작 방지를 단일 지시어로 제공하는 가로 제스처 트랙입니다.',
    selector: '[lwSwipeTrack]',
    layer: 'Primitives (L1)',
    bestPractice: 'swipeMode="item" (카드 캐러셀) 또는 swipeMode="page" (전폭 뷰어) 전략 패턴을 지정하여 사용합니다.',
    badges: ['Mouse Grab & Drag', 'Touch Gesture', 'Wheel Support', 'Scroll Snap Sync'],
    codeSnippet: `<div
  class="carousel-track"
  lwSwipeTrack
  swipeMode="item"
  scrollSnapMode="mandatory"
  [enableMouseDrag]="true"
  [enableWheel]="true"
  [(activeIndex)]="currentIdx">
  <div class="slide-card">아이템 1</div>
  <div class="slide-card">아이템 2</div>
</div>`,
  },
  {
    id: 'lwTooltip',
    name: 'Floating Acrylic Glass Tooltip',
    nameKo: '플로팅 글래스모피즘 툴팁 지시자',
    icon: '💬',
    description: '호스트 요소에 마우스 호버 또는 포커스 진입 시 지정된 방향(top/bottom/left/right/auto)으로 아크릴 블러 배경의 글래스모피즘 툴팁 풍선도움을 띄워주는 지시자입니다.',
    selector: '[lwTooltip]',
    layer: 'Primitives (L1)',
    bestPractice: '버튼, 뱃지, 아이콘 등에 간결하고 명확한 기능 도움말을 제공하기 위해 사용합니다.',
    badges: ['Auto Placement', 'Backdrop Blur', 'Keyboard Focusin', 'Configurable Delay'],
    codeSnippet: `<button
  lw-button
  variant="secondary"
  lwTooltip="공통 컴포넌트 관제 센터 열기"
  lwTooltipPlacement="top"
  [lwTooltipDelay]="150">
  관제 센터
</button>`,
  },
  {
    id: 'lwThemeScope',
    name: 'Subtree Local Theme Scoper',
    nameKo: '서브트리 로컬 테마 격리 스코프 지시자',
    icon: '🎨',
    description: '전역 테마 상태를 변이하지 않고, 특정 하위 DOM 서브트리나 카드, 모달 윈도우 영역에만 독립적인 테마(dark / light / novel-play)를 부여하고 data-lw-theme 속성을 스코핑합니다.',
    selector: '[lwThemeScope]',
    layer: 'Core Behavior (L0)',
    bestPractice: '어두운 배경의 프리뷰 창이나 특정 위젯 내부에 항상 일관된 테마 대비를 보장할 때 감싸서 사용합니다.',
    badges: ['Local Theme Isolation', 'CSS Custom Property Scope', 'Zero Global Side-Effect'],
    codeSnippet: `<div [lwThemeScope]="'dark'" class="preview-dark-box">
  <!-- 내부 컴포넌트들은 상위 테마와 무관하게 Dark Theme 스타일 적용 -->
  <lw-card variant="elevated">Dark Scoped Card</lw-card>
</div>`,
  },
  {
    id: 'lwDismissible',
    name: 'Escape & Backdrop Outside Dismiss',
    nameKo: '오버레이 자동 닫기(ESC / 외부 클릭) 지시자',
    icon: '🚪',
    description: '팝업, 드롭다운 메뉴, 플라이아웃 소자가 열렸을 때 키보드 ESC 키 입력이나 컨테이너 외부 클릭을 감지하여 자동으로 dismiss 이벤트를 방출하는 단일 책임(SRP) 지시자입니다.',
    selector: '[lwDismissible]',
    layer: 'Primitives (L1)',
    bestPractice: '커스텀 팝오버나 컨텍스트 메뉴의 외부 클릭 닫기 보일러플레이트를 제거할 때 사용합니다.',
    badges: ['ESC Keydown', 'Backdrop Click', 'Clean Host Binding'],
    codeSnippet: `<div
  class="custom-dropdown-popover"
  lwDismissible
  (dismiss)="closeDropdown()">
  <ul class="dropdown-list">
    <li>옵션 1</li>
    <li>옵션 2</li>
  </ul>
</div>`,
  },
  {
    id: 'lwDimensionTargets',
    name: 'Responsive Dimension Synchronization',
    nameKo: '동적 치수 동기화 지시자군 (Height / Width)',
    icon: '📐',
    description: '반응형 그리드 및 스플릿 뷰에서 형제 또는 부모 요소 간의 동적 높이/너비를 계산하고 특정 그룹 ID를 기준으로 치수를 일치시키는 레이아웃 전용 지시자군입니다.',
    selector: '[lwHeightTarget], [lwWidthTarget]',
    layer: 'Layout & Binding (L1)',
    bestPractice: '좌우 2열 패널에서 높이가 동적으로 변하는 카드의 균형을 맞출 때 heightGroupId를 일치시켜 바인딩합니다.',
    badges: ['Responsive Flex Sync', 'Zero CSS Hack', 'Layout Stability'],
    codeSnippet: `<div class="split-pane-left" [lwHeightTarget]="'editor-group'">
  <!-- 높이 자동 동기화 -->
</div>
<div class="split-pane-right" [lwHeightTarget]="'editor-group'">
  <!-- 같은 높이 유지 -->
</div>`,
  },
];

export const DIRECTIVES_API_CHEATSHEET: DirectiveApiItem[] = [
  {
    id: 'lw-draggable',
    selector: '[lwDraggable]',
    directiveName: 'LwDraggableDirective',
    layer: 'Primitives (L1)',
    inputs: 'handleSelector, disabled, positionMode, bounds, boundaryMargin, applyStyle',
    outputs: 'position, isDragging, dragStart, dragMove, dragEnd',
    purpose: '부유형 윈도우, 모달, 플로팅 패널의 포인터 캡처 및 화면 경계 클램핑 드래그',
    codeSnippet: '<aside lwDraggable handleSelector=".header" bounds="parent">...</aside>',
  },
  {
    id: 'lw-swipe-track',
    selector: '[lwSwipeTrack]',
    directiveName: 'LwSwipeTrackDirective',
    layer: 'Primitives (L1)',
    inputs: 'swipeMode, scrollSnapMode, itemSelector, enableMouseDrag, enableTouch, enableWheel',
    outputs: 'activeIndex, activeIndexChange, isDragging',
    purpose: '카드 캐러셀 및 전폭 뷰어의 마우스/터치/휠 제스처 트랙 및 스냅 동기화',
    codeSnippet: '<div lwSwipeTrack swipeMode="item" [(activeIndex)]="idx">...</div>',
  },
  {
    id: 'lw-tooltip',
    selector: '[lwTooltip]',
    directiveName: 'LwTooltipDirective',
    layer: 'Primitives (L1)',
    inputs: 'lwTooltip, lwTooltipPlacement, lwTooltipVariant, lwTooltipSize, lwTooltipDelay, lwTooltipDisabled',
    outputs: '-',
    purpose: '호버/포커스 시 글래스모피즘 아크릴 툴팁 오버레이 풍선도움 표시',
    codeSnippet: '<button lw-button [lwTooltip]="\'저장하기\'" lwTooltipPlacement="top">저장</button>',
  },
  {
    id: 'lw-theme-scope',
    selector: '[lwThemeScope]',
    directiveName: 'LwThemeScopeDirective',
    layer: 'Core (L0)',
    inputs: 'lwThemeScope ("dark" | "light" | "auto")',
    outputs: '-',
    purpose: '전역 상태 변경 없이 특정 DOM 서브트리에만 국소 테마 스코프 격리 적용',
    codeSnippet: '<div [lwThemeScope]="\'dark\'">...</div>',
  },
  {
    id: 'lw-dismissible',
    selector: '[lwDismissible]',
    directiveName: 'LwDismissibleDirective',
    layer: 'Primitives (L1)',
    inputs: 'dismissDisabled',
    outputs: 'dismiss (void)',
    purpose: 'ESC 키 입력 및 엘리먼트 외부 클릭 감지 시 자동 닫기 이벤트 방출',
    codeSnippet: '<div class="popover" lwDismissible (dismiss)="close()">...</div>',
  },
  {
    id: 'lw-height-target',
    selector: '[lwHeightTarget]',
    directiveName: 'LwHeightTargetDirective',
    layer: 'Layout (L1)',
    inputs: 'lwHeightTarget (groupId: string)',
    outputs: '-',
    purpose: '동일 그룹 ID를 공유하는 요소들 간의 반응형 높이 실시간 동기화',
    codeSnippet: '<div [lwHeightTarget]="\'main-column\'">...</div>',
  },
  {
    id: 'lw-width-target',
    selector: '[lwWidthTarget]',
    directiveName: 'LwWidthTargetDirective',
    layer: 'Layout (L1)',
    inputs: 'lwWidthTarget (groupId: string)',
    outputs: '-',
    purpose: '동일 그룹 ID를 공유하는 요소들 간의 반응형 너비 실시간 동기화',
    codeSnippet: '<div [lwWidthTarget]="\'sidebar-group\'">...</div>',
  },
  {
    id: 'lw-model-signal',
    selector: '[lwModelSignal]',
    directiveName: 'LwModelSignalDirective',
    layer: 'Primitives (L1)',
    inputs: 'lwModelSignal (WritableSignal)',
    outputs: 'lwModelSignalChange',
    purpose: '네이티브 HTML 폼 컨트롤과 Angular WritableSignal 간의 양방향 연동',
    codeSnippet: '<input type="text" [lwModelSignal]="querySignal" />',
  },
  {
    id: 'lw-game-play-scroll-anchor',
    selector: '[lwNovelPlayScrollAnchor]',
    directiveName: 'LwNovelPlayScrollAnchorDirective',
    layer: 'Surface (L2)',
    inputs: 'anchorId, autoScrollEnabled',
    outputs: 'anchorIntersected',
    purpose: '웹소설 플레이어 씬 전환 시 부드러운 스크롤 앵커링 및 뷰포트 교차 감지',
    codeSnippet: '<div [lwNovelPlayScrollAnchor]="sceneId">...</div>',
  },
  {
    id: 'lw-interactive-behavior',
    selector: 'LwInteractiveBehaviorDirective',
    directiveName: 'LwInteractiveBehaviorDirective',
    layer: 'Core (L0)',
    inputs: 'disabled, loading, active, selected',
    outputs: 'interactionStateChange',
    purpose: '버튼, 카드, 탭 등 인터랙티브 소자의 공통 상태 행동 믹스인',
    codeSnippet: '@Directive({ hostDirectives: [LwInteractiveBehaviorDirective] })',
  },
];

export const DIRECTIVES_CENSUS_CATALOG: DirectiveCensusItem[] = [
  {
    id: 'c-drag-01',
    directiveName: 'LwDraggableDirective',
    selector: '[lwDraggable]',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-factory-panel.component.html:2',
    app: 'showcase-overview',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: 'macOS 팩토리 관제 통계 패널의 헤더 그립 드래그 및 캔버스 경계 클램핑 제어',
  },
  {
    id: 'c-drag-02',
    directiveName: 'LwDraggableDirective',
    selector: '[lwDraggable]',
    location: 'projects/loworld-ui/primitives/overlay/modal/modal.component.ts:33',
    app: 'loworld-ui (Primitives)',
    usageType: 'host-directive',
    isStandard: true,
    status: 'recommended',
    description: '범용 LwModalComponent의 타이틀바 헤더 드래그 이동 공통화 표준',
  },
  {
    id: 'c-swipe-01',
    directiveName: 'LwSwipeTrackDirective',
    selector: '[lwSwipeTrack]',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-factory-panel.component.html:170',
    app: 'showcase-overview',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '팩토리 계층(Layers) 칩스 그리드의 마우스 드래그 및 휠 수평 스와이프 트랙',
  },
  {
    id: 'c-swipe-02',
    directiveName: 'LwSwipeTrackDirective',
    selector: '[lwSwipeTrack]',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-mobile-home.component.html:154',
    app: 'showcase-overview',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '모바일 홈 화면 바로가기 위젯 카드 가로 스와이프 제스처 트랙',
  },
  {
    id: 'c-tooltip-01',
    directiveName: 'LwTooltipDirective',
    selector: '[lwTooltip]',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:77',
    app: 'showcase-overview',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: 'macOS 메뉴 막대 상단 액션 항목 및 시스템 버튼 호버 툴팁 안내',
  },
  {
    id: 'c-tooltip-02',
    directiveName: 'LwTooltipDirective',
    selector: '[lwTooltip]',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-factory-panel.component.html:32',
    app: 'showcase-overview',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '팩토리 관제 패널 접기/펼치기 원형 버튼 상태 안내 툴팁',
  },
  {
    id: 'c-theme-01',
    directiveName: 'LwThemeScopeDirective',
    selector: '[lwThemeScope]',
    location: 'projects/loworld-ui/surface/dialogs/document-settings-dialog/document-settings-dialog.component.html:1',
    app: 'note-studio',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '노트 시스템 설정 모달 서브트리의 로컬 테마 격리 제어',
  },
  {
    id: 'c-dismiss-01',
    directiveName: 'LwDismissibleDirective',
    selector: '[lwDismissible]',
    location: 'projects/loworld-ui/primitives/overlay/modal/modal.component.html:4',
    app: 'loworld-ui (Primitives)',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '모달 백드롭 외부 클릭 및 ESC 키 입력 시 닫기 이벤트 트리거',
  },
  {
    id: 'c-height-01',
    directiveName: 'LwHeightTargetDirective',
    selector: '[lwHeightTarget]',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.ts:196',
    app: 'showcase-overview',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '데스크톱 메인 서피스와 캔버스 레이아웃 높이 실시간 동기화',
  },
  {
    id: 'c-novel-01',
    directiveName: 'LwNovelPlayScrollAnchorDirective',
    selector: '[lwNovelPlayScrollAnchor]',
    location: 'projects/loworld-ui/collection/panels/novel-play/novel-play-reader-panel.component.html:48',
    app: 'novel-studio',
    usageType: 'template-binding',
    isStandard: true,
    status: 'active',
    description: '웹소설 독서 진행 시 각 문단(Paragraph) 앵커링 및 스크롤 추적',
  },
];
