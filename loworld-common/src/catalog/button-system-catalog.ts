/**
 * LoworldUI Button Design System & Full Audit Catalog
 * 모노레포 전역(1,614개 버튼 인스턴스) 전수조사 데이터 및 8대 스타일 분류 체계
 */

export interface ButtonAuditMetrics {
  totalCount: number;
  unmigratedRawCount: number;
  unifiedRate: number;
  styleFamiliesCount: number;
  variantsCount: number;
  sizesCount: number;
  shapesCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface ButtonSampleItem {
  id: string;
  name: string;
  description: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'novel';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill' | 'circle' | 'square';
  block?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  customClass?: string;
  content: string;
  htmlSnippet: string;
  useCase: string;
  realWorldLocation?: string;
}

export interface ButtonStyleFamily {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  countApprox: number;
  colorTone: string;
  items: ButtonSampleItem[];
}

export interface ButtonApiProp {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
  required?: boolean;
}

export const BUTTON_AUDIT_METRICS: ButtonAuditMetrics = {
  totalCount: 1614,
  unmigratedRawCount: 0,
  unifiedRate: 100,
  styleFamiliesCount: 8,
  variantsCount: 6,
  sizesCount: 4,
  shapesCount: 4,
  appDistribution: [
    { app: 'loworld-novel', label: '소설 엔진 (Novel)', count: 486, percentage: 30.1 },
    { app: 'loworld-ui-showcase', label: '쇼케이스 포털 (Showcase)', count: 342, percentage: 21.2 },
    { app: 'eznote', label: '노트 시스템 (Note)', count: 268, percentage: 16.6 },
    { app: 'loworld-study', label: '학습 플랫폼 (Study)', count: 184, percentage: 11.4 },
    { app: 'ezcalendar', label: '캘린더 시스템 (Calendar)', count: 142, percentage: 8.8 },
    { app: 'loworld-db', label: '데이터베이스 (DB)', count: 116, percentage: 7.2 },
    { app: 'loworld-plan', label: '플랜 & WBS (Plan)', count: 76, percentage: 4.7 },
  ],
};

export const BUTTON_STYLE_FAMILIES: ButtonStyleFamily[] = [
  {
    id: 'standard-semantic',
    name: 'Standard Semantic Actions',
    nameKo: '1. 표준 시맨틱 액션 (6대 변형)',
    icon: '🎯',
    description: '메인 CTA, 저장, 폼 제출, 취소, 경고 및 삭제 등 웹 애플리케이션 전역의 표준 상호작용 소자',
    countApprox: 420,
    colorTone: '#6366f1',
    items: [
      {
        id: 'btn-primary',
        name: 'Primary CTA',
        description: '페이지나 모달 내 가장 중요한 단일 주 액션 (저장, 제출, 완료)',
        variant: 'primary',
        size: 'md',
        content: '저장 및 발행',
        htmlSnippet: '<button lw-button variant="primary">저장 및 발행</button>',
        useCase: '폼 제출, 신규 생성 완료, 결제 진행, 설정 저장',
        realWorldLocation: '모달 푸터, 에디터 헤더, 플랜 생성 폼',
      },
      {
        id: 'btn-secondary',
        name: 'Secondary (Default)',
        description: '중립적 보조 액션 및 취소, 닫기, 기본 툴바 버튼 (기본 변형)',
        variant: 'secondary',
        size: 'md',
        content: '취소 및 닫기',
        htmlSnippet: '<button lw-button variant="secondary">취소 및 닫기</button>',
        useCase: '모달 닫기, 이전 단계 복귀, 보조 옵션 선택',
        realWorldLocation: '다이얼로그 취소, 뷰어 서브 툴바',
      },
      {
        id: 'btn-outline',
        name: 'Outline Accent',
        description: '외곽선 경계로 시각적 계층을 유지하면서 보조 액션을 강조',
        variant: 'outline',
        size: 'md',
        content: '옵션 설정',
        htmlSnippet: '<button lw-button variant="outline">옵션 설정</button>',
        useCase: '세부 옵션 토글, 서브 페이지 이동, 필터 확장',
        realWorldLocation: '노트 에디터 속성창, 캘린더 뷰 전환',
      },
      {
        id: 'btn-ghost',
        name: 'Ghost Minimal',
        description: '배경 없이 플랫하게 표시되며 호버 시 부드러운 하이라이트를 제공',
        variant: 'ghost',
        size: 'md',
        content: '링크 열기',
        htmlSnippet: '<button lw-button variant="ghost">링크 열기</button>',
        useCase: '테이블 행 액션, 네비게이션 서브 링크, 카드 내부 액션',
        realWorldLocation: '데이터 테이블 행 관리, 사이드바 항목',
      },
      {
        id: 'btn-danger',
        name: 'Danger Destructive',
        description: '데이터 삭제, 초기화, 강제 종료 등 파괴적 결과가 따르는 위험 액션',
        variant: 'danger',
        size: 'md',
        content: '항목 영구 삭제',
        htmlSnippet: '<button lw-button variant="danger">항목 영구 삭제</button>',
        useCase: '데이터 삭제 확인, 계정 탈퇴, 캐시 강제 비우기',
        realWorldLocation: '삭제 확인 모달, 진단 리셋 패널',
      },
      {
        id: 'btn-novel-var',
        name: 'Novel RPG Variant',
        description: '골드 & 앰버 광택 그라데이션이 적용된 노블/RPG 테마 전용 액션 소자',
        variant: 'novel',
        size: 'md',
        content: '시나리오 진행',
        htmlSnippet: '<button lw-button variant="novel">시나리오 진행</button>',
        useCase: '소설 챕터 전환, 전투 개시, 퀘스트 수락',
        realWorldLocation: '노블 뷰어 하단 툴바, 룬 장비 제작',
      },
    ],
  },
  {
    id: 'novel-rpg',
    name: 'Domain Specialized - Novel & RPG',
    nameKo: '2. 소설 & 판타지 RPG 도메인 특화',
    icon: '⚔️',
    description: '웹소설 인터랙티브 뷰어, 룬 합성 큐브, 던전 타워 전투 및 연대기 탐색 전용 스타일',
    countApprox: 248,
    colorTone: '#f59e0b',
    items: [
      {
        id: 'btn-battle-act',
        name: 'Battle Act: Attack',
        description: 'D2R 스타일 전투 커맨드 버튼 (골드 테두리 + 호버 앰버 글로우)',
        variant: 'novel',
        size: 'md',
        content: '⚔️ 일반 공격 (Attack)',
        htmlSnippet: '<button lw-button variant="novel" class="battle-act-btn">⚔️ 일반 공격</button>',
        useCase: '소설 인터랙티브 전투 시스템 턴 진행',
        realWorldLocation: 'novel-play.component.html',
      },
      {
        id: 'btn-artifice-cube',
        name: 'Artifice Horadric Cube',
        description: '호라드릭 큐브 룬워드 조합 및 연성 실행 버튼',
        variant: 'novel',
        size: 'sm',
        content: '✨ 룬 연성 (Transmute)',
        htmlSnippet: '<button lw-button variant="novel" size="sm" class="artifice-cube__btn">✨ 룬 연성</button>',
        useCase: '룬워드 소켓 제작 및 아이템 변환',
        realWorldLocation: 'artifice-cube-panel.component.html',
      },
      {
        id: 'btn-chronicle-flip',
        name: 'Chronicle Tome Nav',
        description: '고서(Parchment) 연대기 챕터 좌우 넘김 버튼',
        variant: 'secondary',
        size: 'sm',
        shape: 'circle',
        content: '‹',
        htmlSnippet: '<button lw-button variant="secondary" shape="circle" size="sm" class="lw-chronicle-tome__arrow-btn">‹</button>',
        useCase: '양장본 고서 양면 페이지 넘김',
        realWorldLocation: 'chronicle-tome.component.html',
      },
      {
        id: 'btn-webnovel-theme',
        name: 'Novel Viewer Theme Chip',
        description: '웹소설 뷰어 서체 및 배경 스킨(다크/페이퍼/신문) 즉시 전환 칩',
        variant: 'outline',
        size: 'xs',
        shape: 'pill',
        content: '📜 고서 스킨',
        htmlSnippet: '<button lw-button variant="outline" size="xs" shape="pill" class="lw-webnovel-theme-chip">📜 고서 스킨</button>',
        useCase: '소설 본문 가독성 스킨 실시간 변경',
        realWorldLocation: 'story-phase-banner-panel.component.html',
      },
    ],
  },
  {
    id: 'icon-quick',
    name: 'Icon-Only & Quick Actions',
    nameKo: '3. 아이콘 전용 및 퀵 액션 (1:1 FAB / Toolbar)',
    icon: '⚡',
    description: '텍스트 없이 1:1 비율로 동작하는 원형(Circle) 및 사각(Square) 퀵 액션 버튼',
    countApprox: 185,
    colorTone: '#38bdf8',
    items: [
      {
        id: 'btn-circle-close',
        name: 'Circle Close Action',
        description: '패널 및 다이얼로그 우상단 원형 닫기 퀵 액션',
        variant: 'ghost',
        size: 'sm',
        shape: 'circle',
        content: '✕',
        htmlSnippet: '<button lw-button variant="ghost" shape="circle" size="sm" aria-label="닫기">✕</button>',
        useCase: '오버레이 닫기, 모달 해제, 검색어 비우기',
        realWorldLocation: '모달 헤더, 사이드 패널',
      },
      {
        id: 'btn-circle-settings',
        name: 'Circle Floating FAB',
        description: '화면 우하단 또는 툴바 고정 원형 설정 / 액션 트리거',
        variant: 'secondary',
        size: 'md',
        shape: 'circle',
        content: '⚙️',
        htmlSnippet: '<button lw-button variant="secondary" shape="circle" size="md" aria-label="환경설정">⚙️</button>',
        useCase: '환경설정 다이얼로그 호출, 테마 피커 열기',
        realWorldLocation: 'macOS Finder 툴바 우측 액션',
      },
      {
        id: 'btn-square-toolbar',
        name: 'Square Toolbar Tool',
        description: '에디터 툴바 및 서식 도구 모음 내 1:1 정사각 격자 아이콘 버튼',
        variant: 'ghost',
        size: 'sm',
        shape: 'square',
        content: '✂️',
        htmlSnippet: '<button lw-button variant="ghost" shape="square" size="sm" title="자르기">✂️</button>',
        useCase: '텍스트 포맷팅, 그리기 도구 선택, 정렬 도구',
        realWorldLocation: '노트 서식 툴바, 캔버스 WBS 툴바',
      },
      {
        id: 'btn-prefix-icon',
        name: 'Prefix Icon Button',
        description: '의미를 직관적으로 전달하는 좌측 시각 아이콘 결합형 버튼',
        variant: 'outline',
        size: 'md',
        prefixIcon: '📁',
        content: '폴더 열기',
        htmlSnippet: '<button lw-button variant="outline" prefixIcon="📁">폴더 열기</button>',
        useCase: '파일 탐색, 다운로드, 클라우드 동기화',
        realWorldLocation: 'DB 테이블 익스포트, 폴더 생성',
      },
    ],
  },
  {
    id: 'segmented-nav',
    name: 'Segmented & Navigation Tabs',
    nameKo: '4. 세그먼트 알약 및 네비게이션 탭',
    icon: '🧭',
    description: 'macOS 일체형 캡슐 뷰 스위처 및 포털 사이드바 / 서브 네비게이션 탭',
    countApprox: 215,
    colorTone: '#10b981',
    items: [
      {
        id: 'btn-segmented-pill-active',
        name: 'Segmented Pill (Active)',
        description: 'macOS 스타일 세그먼트 컨트롤 내 활성화된 알약 아이템',
        variant: 'secondary',
        size: 'sm',
        customClass: 'seg-item is-active',
        content: '⊞ 갤러리 뷰',
        htmlSnippet: '<button lw-button class="seg-item is-active"><span class="seg-icon">⊞</span> 갤러리 뷰</button>',
        useCase: '화면 보기 방식 전환 (아이콘/목록, 갤러리/매트릭스/랭킹)',
        realWorldLocation: 'all-components 툴바 중앙 뷰 스위처',
      },
      {
        id: 'btn-segmented-pill-idle',
        name: 'Segmented Pill (Inactive)',
        description: '세그먼트 컨트롤 내 대기 상태 알약 아이템',
        variant: 'secondary',
        size: 'sm',
        customClass: 'seg-item',
        content: '▦ 매트릭스',
        htmlSnippet: '<button lw-button class="seg-item"><span class="seg-icon">▦</span> 매트릭스</button>',
        useCase: '뷰 모드 전환 대기 상태',
        realWorldLocation: 'Finder 툴바',
      },
      {
        id: 'btn-portal-tab',
        name: 'Portal Sidebar Tab',
        description: '좌측 사이드바 및 인스펙터 내 대분류 탐색 탭',
        variant: 'ghost',
        size: 'sm',
        customClass: 'portal-tab',
        content: '🧩 컴포넌트 카탈로그',
        htmlSnippet: '<button lw-button variant="ghost" class="portal-tab"><span class="tab-icon">🧩</span> 컴포넌트</button>',
        useCase: '쇼케이스 포털 메인 탭 탐색',
        realWorldLocation: 'all-components 좌측 네비게이션',
      },
      {
        id: 'btn-category-chip-tab',
        name: 'Category Chip Tab',
        description: '가로 스크롤형 모바일 시트 및 카테고리 분류 탭',
        variant: 'ghost',
        size: 'xs',
        customClass: 'category-chip-tab',
        content: 'Layout & Containers',
        htmlSnippet: '<button lw-button variant="ghost" size="xs" class="category-chip-tab">Layout & Containers</button>',
        useCase: '모바일 서브페이지 및 카테고리 필터링 탭',
        realWorldLocation: 'novel-mobile-sheet-content.component.html',
      },
    ],
  },
  {
    id: 'chips-presets',
    name: 'Chips & Preset Selectors',
    nameKo: '5. 칩 및 프리셋 선택자 (태그/필터)',
    icon: '🏷️',
    description: '상태 토글 칩, 데이터셋 필터 칩, 테마/블러/배속 프리셋 버튼',
    countApprox: 178,
    colorTone: '#8b5cf6',
    items: [
      {
        id: 'btn-filter-chip',
        name: 'Filter Tag Chip',
        description: '다중 조건 필터링 토글 태그 칩',
        variant: 'outline',
        size: 'xs',
        shape: 'pill',
        content: 'Active Only ✓',
        htmlSnippet: '<button lw-button variant="outline" size="xs" shape="pill" class="filter-chip">Active Only ✓</button>',
        useCase: '데이터 그리드 필터링, 완료 여부 토글',
        realWorldLocation: '쇼케이스 카탈로그 필터 바',
      },
      {
        id: 'btn-speed-chip',
        name: 'Speed Multiplier Chip',
        description: '소설 오디오북 및 텍스트 롤링 배속 선택 버튼',
        variant: 'ghost',
        size: 'xs',
        content: '2.0x 배속',
        htmlSnippet: '<button lw-button variant="ghost" size="xs" class="speed-chip">2.0x 배속</button>',
        useCase: '재생 속도 및 애니메이션 프레임 제어',
        realWorldLocation: 'novel-mobile-shell.component.html',
      },
      {
        id: 'btn-blur-preset',
        name: 'Glassmorphism Blur Preset',
        description: 'iOS 블러 배경 모드 전환 프리셋 버튼',
        variant: 'outline',
        size: 'sm',
        content: 'Ultra Blur (30px)',
        htmlSnippet: '<button lw-button variant="outline" size="sm" class="blur-preset-btn">Ultra Blur (30px)</button>',
        useCase: '배경 블러 투명도 즉시 제어',
        realWorldLocation: 'overview-mobile-home.component.html',
      },
    ],
  },
  {
    id: 'os-chrome',
    name: 'OS Chrome & System Controls',
    nameKo: '6. OS 셸 & 시스템 크롬 컨트롤',
    icon: '🖥️',
    description: 'macOS 트래픽 라이트(신호등), Finder 툴바, 윈도우 프레임 캡션 및 iOS 독 아이템',
    countApprox: 112,
    colorTone: '#ec4899',
    items: [
      {
        id: 'btn-traffic-close',
        name: 'macOS Traffic Light: Close',
        description: '창 닫기 붉은색 트래픽 라이트 원형 버튼',
        variant: 'danger',
        size: 'xs',
        shape: 'circle',
        customClass: 'traffic-btn--close',
        content: '',
        htmlSnippet: '<button lw-button variant="danger" shape="circle" size="xs" class="traffic-btn traffic-btn--close" aria-label="창 닫기"></button>',
        useCase: 'macOS 윈도우 프레임 창 닫기',
        realWorldLocation: 'overview-window-frame.component.html',
      },
      {
        id: 'btn-traffic-minimize',
        name: 'macOS Traffic Light: Minimize',
        description: '창 최소화 노란색 트래픽 라이트 버튼',
        variant: 'outline',
        size: 'xs',
        shape: 'circle',
        customClass: 'traffic-btn--minimize',
        content: '',
        htmlSnippet: '<button lw-button variant="outline" shape="circle" size="xs" class="traffic-btn traffic-btn--minimize" aria-label="최소화"></button>',
        useCase: 'macOS 윈도우 프레임 창 최소화',
        realWorldLocation: 'overview-window-frame.component.html',
      },
      {
        id: 'btn-finder-toolbar',
        name: 'macOS Finder Toolbar Icon',
        description: '사이드바 토글 및 디바이스 뷰 전환 툴바 아이콘',
        variant: 'secondary',
        size: 'sm',
        customClass: 'finder-icon-btn',
        content: '🗂️',
        htmlSnippet: '<button lw-button class="finder-icon-btn" aria-label="사이드바 토글">🗂️</button>',
        useCase: 'Finder 도구 모음 좌/우 패널 개폐',
        realWorldLocation: 'all-components.component.html 헤더',
      },
      {
        id: 'btn-ios-dock',
        name: 'iOS Mobile Dock Item',
        description: '모바일 홈 화면 하단 독 전용 앱 런처 아이콘 버튼',
        variant: 'ghost',
        size: 'lg',
        shape: 'square',
        customClass: 'ios-dock-item',
        content: '📱',
        htmlSnippet: '<button lw-button variant="ghost" shape="square" size="lg" class="ios-dock-item">📱</button>',
        useCase: '스마트폰 시뮬레이터 하단 앱 빠른 실행',
        realWorldLocation: 'overview-mobile-home.component.html',
      },
    ],
  },
  {
    id: 'mobile-block',
    name: 'Mobile Sheet & Full-Width Block',
    nameKo: '7. 모바일 바텀시트 & 전폭 블록 액션',
    icon: '📱',
    description: '화면 가로 100%를 차지하는 블록 CTA 및 모바일 제스처 바텀시트 메뉴 항목',
    countApprox: 134,
    colorTone: '#64748b',
    items: [
      {
        id: 'btn-block-cta',
        name: 'Full-Width Block CTA',
        description: '모바일 뷰포트 하단 또는 폼 하단의 단일 100% 전폭 강조 버튼',
        variant: 'primary',
        size: 'lg',
        block: true,
        content: '🚀 전체 프로세스 즉시 실행 (Block 100%)',
        htmlSnippet: '<button lw-button variant="primary" size="lg" [block]="true">🚀 전체 프로세스 실행</button>',
        useCase: '모바일 가입 완료, 결제 승인, 메인 제출',
        realWorldLocation: 'common-demo.component.ts, document-settings-dialog',
      },
      {
        id: 'btn-sheet-action-item',
        name: 'Action Sheet Menu Item',
        description: 'iOS 스타일 바텀시트 내 수평 터치 친화 행 메뉴 버튼',
        variant: 'ghost',
        size: 'md',
        block: true,
        customClass: 'mobile-actions-sheet__action',
        content: '📋 클립보드로 전체 복사하기',
        htmlSnippet: '<button lw-button variant="ghost" [block]="true" class="mobile-actions-sheet__action">📋 클립보드 복사</button>',
        useCase: '바텀시트 액션 시트 메뉴 선택',
        realWorldLocation: 'novel-mobile-sheet-content.component.html',
      },
    ],
  },
  {
    id: 'sizes-hierarchy',
    name: 'Size Hierarchy & Dimensions',
    nameKo: '8. 4대 크기 체계 (Size Hierarchy)',
    icon: '📐',
    description: 'XS(24px)부터 LG(46px)까지 일관된 수직 리듬과 터치 타겟을 보장하는 규격 체계',
    countApprox: 123,
    colorTone: '#0284c7',
    items: [
      {
        id: 'btn-size-xs',
        name: 'Extra Small (XS - 24px)',
        description: '밀집 인라인 태그, 초소형 테이블 도구용 (Height: 24px, Font: 11px)',
        variant: 'primary',
        size: 'xs',
        content: 'XS (24px)',
        htmlSnippet: '<button lw-button variant="primary" size="xs">XS (24px)</button>',
        useCase: '좁은 카드 헤더, 인라인 태그 버튼',
      },
      {
        id: 'btn-size-sm',
        name: 'Small (SM - 30px)',
        description: '보조 툴바 및 콤팩트 다이얼로그용 (Height: 30px, Font: 12px)',
        variant: 'primary',
        size: 'sm',
        content: 'SM (30px)',
        htmlSnippet: '<button lw-button variant="primary" size="sm">SM (30px)</button>',
        useCase: 'Finder 툴바, 보조 서브 액션',
      },
      {
        id: 'btn-size-md',
        name: 'Medium (MD - 38px, Default)',
        description: '전역 표준 기본값 (Height: 38px, Font: 14px)',
        variant: 'primary',
        size: 'md',
        content: 'MD (38px - 기본)',
        htmlSnippet: '<button lw-button variant="primary" size="md">MD (38px)</button>',
        useCase: '표준 폼 버튼, 헤더 액션',
      },
      {
        id: 'btn-size-lg',
        name: 'Large (LG - 46px)',
        description: '메인 히어로 CTA 및 모바일 엄지 터치 최적화 (Height: 46px, Font: 15px Bold)',
        variant: 'primary',
        size: 'lg',
        content: 'LG (46px Hero CTA)',
        htmlSnippet: '<button lw-button variant="primary" size="lg">LG (46px)</button>',
        useCase: '히어로 섹션, 모바일 하단 플로팅 CTA',
      },
    ],
  },
];

export const BUTTON_API_CHEATSHEET: ButtonApiProp[] = [
  {
    name: 'variant',
    type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'novel'",
    defaultValue: "'secondary'",
    description: '버튼의 시각적 테마 변형. 브랜드 메인 CTA, 보조, 아웃라인, 투명 플랫, 파괴적 위험, 판타지 노블 테마 제공.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg'",
    defaultValue: "'md'",
    description: '버튼 규격 크기. 24px(xs), 30px(sm), 38px(md - 기본), 46px(lg).',
  },
  {
    name: 'shape',
    type: "'default' | 'pill' | 'circle' | 'square'",
    defaultValue: "'default'",
    description: '외곽 형태. 4~8px 사각 라운딩(default), 캡슐형(pill), 1:1 원형(circle), 1:1 정사각(square).',
  },
  {
    name: 'loading',
    type: 'boolean',
    defaultValue: 'false',
    description: '로딩 스피너 활성화 여부. true 시 텍스트가 숨겨지고 중앙 회전 SVG 스피너가 표시되며 클릭 차단.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: '비활성화 여부. 반투명 처리 및 pointer-events 차단, 네이티브 disabled 속성 바인딩.',
  },
  {
    name: 'block',
    type: 'boolean',
    defaultValue: 'false',
    description: '가로 너비 100% 확장 여부 (display: flex, width: 100%). 모바일 하단 CTA에 최적화.',
  },
  {
    name: 'selected',
    type: 'boolean',
    defaultValue: 'false',
    description: '토글/세그먼트 탭 등에서 현재 활성화 선택 상태인지 여부 (.lw-btn--active 클래스 자동 반영).',
  },
  {
    name: 'prefixIcon',
    type: 'string',
    defaultValue: 'undefined',
    description: '버튼 좌측에 표시할 이모지 또는 아이콘 문자열.',
  },
  {
    name: 'suffixIcon',
    type: 'string',
    defaultValue: 'undefined',
    description: '버튼 우측에 표시할 이모지 또는 화살표 문자열.',
  },
  {
    name: 'actionId',
    type: 'string',
    defaultValue: 'undefined',
    description: 'LwActionEvent 디스패치 시 포함할 고유 액션 식별자 (예: "SAVE_DOCUMENT").',
  },
  {
    name: 'actionPayload',
    type: 'any',
    defaultValue: 'undefined',
    description: 'LwActionEvent 디스패치 시 함께 전달할 페이로드 데이터 객체.',
  },
  {
    name: 'actionEvent',
    type: 'OutputEmitter<LwActionEvent<any>>',
    defaultValue: '-',
    description: '클릭 또는 키보드(Enter/Space) 조작 시 발생하는 표준 액션 이벤트 스트림.',
  },
];
