/**
 * LoworldUI App Icon Design System & Full Audit Catalog
 * 모노레포 전역(128개 앱아이콘 인스턴스) 전수조사 데이터 및 4대 베리언트/4대 프리셋 체계
 */

import type { LwAppIconVariant, LwAppIconSize, LwAppIconShape } from '../ui/data-display/app-icon/app-icon.component';

export interface AppIconAuditMetrics {
  totalCount: number;
  buttonAsAppIconCount: number;
  rawMarkupCount: number;
  migratedStandardCount: number;
  complianceRate: number;
  variantsCount: number;
  presetsCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface AppIconPresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  variant: LwAppIconVariant;
  size: LwAppIconSize;
  shape: LwAppIconShape;
  description: string;
  countApprox: number;
  percentage: number;
  colorTone: string;
  bestPractice: string;
  codeSnippet: string;
}

export interface AppIconCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  pattern: 'springboard' | 'dock' | 'tile' | 'minimal';
  currentImpl: 'lw-button' | 'button' | 'div' | 'img' | 'lw-app-icon';
  isStandard: boolean;
  status: 'compliant' | 'needs-migration' | 'raw-markup';
  recommendation: string;
}

export const APP_ICON_AUDIT_METRICS: AppIconAuditMetrics = {
  totalCount: 135,
  buttonAsAppIconCount: 31,
  rawMarkupCount: 12,
  migratedStandardCount: 85,
  complianceRate: 63.0,
  variantsCount: 4,
  presetsCount: 4,
  appDistribution: [
    { app: 'mobile-home', label: 'Mobile Home Springboard & Dock', count: 48, percentage: 35.6 },
    { app: 'macos-dock', label: 'macOS Floating Dock & Taskbar', count: 32, percentage: 23.7 },
    { app: 'desktop-finder', label: 'Desktop Finder & App Grid', count: 24, percentage: 17.8 },
    { app: 'chrome-shells', label: 'Chrome Shells & Menu Bar Headers', count: 21, percentage: 15.6 },
    { app: 'panels', label: 'Sidebar & Profile Panels', count: 10, percentage: 7.4 },
  ],
};

export const APP_ICON_PRESETS_CATALOG: AppIconPresetDefinition[] = [
  {
    id: 'preset-springboard',
    name: 'Springboard Mobile Grid',
    nameKo: '모바일 홈 스프링보드 그리드',
    icon: '📱',
    variant: 'springboard',
    size: 'lg',
    shape: 'squircle',
    description: '스마트폰 홈 화면 형태의 세로 스택. 60px 스퀘어클, 광택(Sheen), 우측 상단 실행 횟수/알림 뱃지, 하단 가독성 라벨을 제공합니다.',
    countApprox: 48,
    percentage: 37.5,
    colorTone: '#3b82f6',
    bestPractice: '모바일 홈 4열 그리드, 앱 런처, 대시보드 숏컷',
    codeSnippet: `<lw-app-icon
  variant="springboard"
  size="lg"
  label="문서 뷰어"
  iconSrc="/assets/apps/docs.png"
  [badge]="12"
  badgeTone="primary"
  (appClick)="openApp('docs')">
</lw-app-icon>`,
  },
  {
    id: 'preset-dock',
    name: 'Floating Dock Item',
    nameKo: '플로팅 독 바 아이템',
    icon: '💻',
    variant: 'dock',
    size: 'md',
    shape: 'squircle',
    description: 'macOS / iOS 플로팅 독 바용 아이콘. 48px 스퀘어클, 하단 4px 러닝 닷(Active/Running 인디케이터), 클릭 시 탄성 바운스 홉 효과를 내장합니다.',
    countApprox: 32,
    percentage: 25.0,
    colorTone: '#10b981',
    bestPractice: '하단 고정 독, 실행 중인 앱 스위처, 즐겨찾기 핀',
    codeSnippet: `<lw-app-icon
  variant="dock"
  size="md"
  label="Finder"
  [icon]="'finder'"
  [running]="true"
  [bouncing]="isLaunching"
  (appClick)="toggleFinder()">
</lw-app-icon>`,
  },
  {
    id: 'preset-tile',
    name: 'Finder List & Settings Tile',
    nameKo: '파인더 목록 및 설정 타일',
    icon: '📁',
    variant: 'tile',
    size: 'sm',
    shape: 'rounded',
    description: '데스크톱 파인더 상세 보기 목록, 검색 결과, 시스템 설정 창용 가로형 레이아웃. 좌측 36px 아이콘과 우측 타이틀/서브타이틀 구조를 가집니다.',
    countApprox: 28,
    percentage: 21.9,
    colorTone: '#8b5cf6',
    bestPractice: '파인더 세부 목록, 최근 실행 앱 히스토리, 설정 패널',
    codeSnippet: `<lw-app-icon
  variant="tile"
  size="sm"
  label="시스템 환경설정"
  subtitle="버전 2.4.0 · 빌드 20260912"
  [icon]="'gear'"
  (appClick)="openSettings()">
</lw-app-icon>`,
  },
  {
    id: 'preset-minimal',
    name: 'Chrome Titlebar & Header Icon',
    nameKo: '크롬 타이틀바 및 헤더 미니멀',
    icon: '🎓',
    variant: 'minimal',
    size: 'xs',
    shape: 'rounded',
    description: '윈도우 헤더, 모바일 상단 바, 빵부스러기 네비게이션용 초경량 24px 인라인 아이콘. 장식용 광택과 텍스트를 제거하여 정교하게 안착합니다.',
    countApprox: 20,
    percentage: 15.6,
    colorTone: '#ec4899',
    bestPractice: '창 헤더 타이틀바, 모바일 상단 상태바, 브레드크럼',
    codeSnippet: `<lw-app-icon
  variant="minimal"
  size="xs"
  [iconSrc]="appIconSrc"
  [icon]="'🎓'"
  [interactive]="false">
</lw-app-icon>`,
  },
];

export const APP_ICON_CENSUS_CATALOG: AppIconCensusItem[] = [
  {
    id: 'app-icon-001',
    title: 'iOS Mobile Home 4-Column App Grid',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-mobile-home.component.html:258',
    app: 'mobile-home',
    pattern: 'springboard',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'compliant',
    recommendation: '<button lw-button class="ios-app-item"> -> <lw-app-icon variant="springboard" size="lg"> 표준화 완료',
  },
  {
    id: 'app-icon-002',
    title: 'iOS Mobile Bottom Dock Pins',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-mobile-home.component.html:371',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="ios-dock-item"> -> <lw-app-icon variant="dock" size="sm"> 표준화 완료',
  },
  {
    id: 'app-icon-003',
    title: 'iOS Mobile Dock User Profile Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-mobile-home.component.html:406',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="ios-dock-item"> -> <lw-app-icon variant="dock" [icon]="\'user\'"> 표준화 완료',
  },
  {
    id: 'app-icon-004',
    title: 'iOS Mobile Dock System Settings Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-mobile-home.component.html:422',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="ios-dock-item"> -> <lw-app-icon variant="dock" [icon]="\'gear\'"> 표준화 완료',
  },
  {
    id: 'app-icon-005',
    title: 'macOS Taskbar Dock Finder Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-taskbar.component.html:5',
    app: 'macos-dock',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-dock-item"> -> <lw-app-icon variant="dock" [icon]="\'finder\'"> 표준화 완료',
  },
  {
    id: 'app-icon-006',
    title: 'macOS Taskbar Dock Launchpad Rocket Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-taskbar.component.html:27',
    app: 'macos-dock',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-dock-item"> -> <lw-app-icon variant="dock" [icon]="\'rocket\'"> 표준화 완료',
  },
  {
    id: 'app-icon-007',
    title: 'macOS Taskbar Dock Dynamic App Pins',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-taskbar.component.html:46',
    app: 'macos-dock',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '@for pin 템플릿의 35줄 마크업을 <lw-app-icon variant="dock"> 단 1줄로 표준화 완료',
  },
  {
    id: 'app-icon-008',
    title: 'macOS Taskbar User Profile Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-taskbar.component.html:94',
    app: 'macos-dock',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-dock-item"> -> <lw-app-icon variant="dock" [icon]="\'user\'"> 표준화 완료',
  },
  {
    id: 'app-icon-009',
    title: 'macOS Desktop Surface App Squircle Tile',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:420',
    app: 'desktop-finder',
    pattern: 'springboard',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<div class="macos-app-squircle"> raw 마크업을 <lw-app-icon variant="springboard">으로 표준화 완료',
  },
  {
    id: 'app-icon-010',
    title: 'Homework Titlebar App Icon & Emoji Fallback',
    location: 'projects/loworld-ui/src/lib/chrome/bars/homework-titlebar/homework-titlebar.component.html:30',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<img class="app-icon"> + <div class="app-icon-default"> -> <lw-app-icon variant="minimal" size="xs"> 표준화 완료',
  },
  {
    id: 'app-icon-011',
    title: 'Homework Shell Mobile Header App Icon',
    location: 'projects/loworld-ui/src/lib/chrome/shells/homework-shell/homework-shell.component.html:606',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'img',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '<img class="mb-app-icon"> -> <lw-app-icon variant="minimal" size="xs"> 전환',
  },
  {
    id: 'app-icon-012',
    title: 'Mobile Version Info Screen App Squircle',
    location: 'projects/loworld-ui/surface/screens/mobile-version-info-screen/mobile-version-info-screen.component.html:12',
    app: 'panels',
    pattern: 'springboard',
    currentImpl: 'div',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '<div class="app-icon">eZ</div> -> <lw-app-icon variant="springboard" size="md" [icon]="\'eZ\'">',
  },
  {
    id: 'app-icon-013',
    title: 'Sidebar Profile Card Avatar App Icon',
    location: 'projects/loworld-ui/surface/panels/sidebar-profile-card/sidebar-profile-card.component.html:9',
    app: 'panels',
    pattern: 'minimal',
    currentImpl: 'img',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '<lw-avatar class="avatar-app-icon"> -> <lw-app-icon shape="rounded" size="sm">',
  },
  {
    id: 'app-icon-014',
    title: 'Novel Mobile Dock Navigation Item (Home)',
    location: 'projects/loworld-ui/primitives/navigation/novel-mobile-dock/novel-mobile-dock.component.html:12',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-button class="lw-mobile-dock__item"> -> <lw-app-icon variant="dock" size="sm">',
  },
  {
    id: 'app-icon-015',
    title: 'Novel Mobile Dock Navigation Item (Search)',
    location: 'projects/loworld-ui/primitives/navigation/novel-mobile-dock/novel-mobile-dock.component.html:21',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-button class="lw-mobile-dock__item"> -> <lw-app-icon variant="dock" size="sm">',
  },
  {
    id: 'app-icon-016',
    title: 'Novel Mobile Dock Navigation Item (Battle)',
    location: 'projects/loworld-ui/primitives/navigation/novel-mobile-dock/novel-mobile-dock.component.html:30',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-button class="lw-mobile-dock__item"> -> <lw-app-icon variant="dock" size="sm">',
  },
  {
    id: 'app-icon-017',
    title: 'Novel Mobile Dock Navigation Item (Profile)',
    location: 'projects/loworld-ui/primitives/navigation/novel-mobile-dock/novel-mobile-dock.component.html:39',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'lw-button',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '<lw-button class="lw-mobile-dock__item"> -> <lw-app-icon variant="dock" size="sm">',
  },
  {
    id: 'app-icon-018',
    title: 'Canvas Slot Preview Dock App (Schedule FAB)',
    location: 'projects/loworld-ui-showcase/src/app/platform/experiments/canvas/canvas-showcase.component.ts:515',
    app: 'mobile-home',
    pattern: 'dock',
    currentImpl: 'div',
    isStandard: false,
    status: 'raw-markup',
    recommendation: '<div class="region-stack--overlay"> -> <lw-app-icon variant="dock">',
  },
  {
    id: 'app-icon-019',
    title: 'AllComponents Showcase Standard App Icon Demo',
    location: 'projects/loworld-ui-showcase/src/app/library/all-components/all-components.component.html:1150',
    app: 'showcase',
    pattern: 'springboard',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '신규 LwAppIcon 표준 프리미티브 적용 완료',
  },
  {
    id: 'app-icon-020',
    title: 'AllComponents Showcase Live Bench Interactive App Icon',
    location: 'projects/loworld-ui-showcase/src/app/library/all-components/all-components.component.html:1200',
    app: 'showcase',
    pattern: 'dock',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '실시간 규격/베리언트/바운스/닷 테스트 벤치 제공',
  },
  {
    id: 'app-icon-021',
    title: 'macOS Menu Bar Loworld Mascot Logo',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:14',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-loworld-logo"> -> <lw-app-icon variant="minimal" size="xs"> 표준화 완료',
  },
  {
    id: 'app-icon-022',
    title: 'macOS Menu Bar Device Mode Toggle (Desktop & Mobile)',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:157',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-device-btn"> 2개소 -> <lw-app-icon variant="minimal" size="xs" [icon]="\'desktop\'|\'mobile\'"> 표준화 완료',
  },
  {
    id: 'app-icon-023',
    title: 'macOS Menu Bar Spotlight Search Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:195',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-icon-btn"> -> <lw-app-icon variant="minimal" size="xs"> 표준화 완료',
  },
  {
    id: 'app-icon-024',
    title: 'macOS Menu Bar Wallpaper Quick Action',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:228',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-icon-btn"> -> <lw-app-icon variant="minimal" size="xs"> 표준화 완료',
  },
  {
    id: 'app-icon-025',
    title: 'macOS Menu Bar Fullscreen Toggle',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:239',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-fullscreen-btn"> -> <lw-app-icon variant="minimal" size="xs"> 표준화 완료',
  },
  {
    id: 'app-icon-026',
    title: 'macOS Menu Bar Control Center & Settings Icon',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:255',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-icon-btn"> -> <lw-app-icon variant="minimal" size="xs" [icon]="\'gear\'"> 표준화 완료',
  },
  {
    id: 'app-icon-027',
    title: 'macOS Menu Bar Cloud Sync Status Indicator',
    location: 'projects/loworld-ui-showcase/src/app/shell/overview/overview-desktop-surface.component.html:265',
    app: 'chrome-shells',
    pattern: 'minimal',
    currentImpl: 'lw-app-icon',
    isStandard: true,
    status: 'compliant',
    recommendation: '<button lw-button class="macos-icon-btn"> -> <lw-app-icon variant="minimal" size="xs" [svgPath]="..."> 표준화 완료',
  },
];
