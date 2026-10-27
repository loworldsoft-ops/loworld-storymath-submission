import type { ComponentMeta } from '../services/models/os.types';

export const COMMON_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-button',
    name: 'Button (통합 버튼)',
    selector: 'lw-button, button[lw-button], a[lw-button]',
    domain: 'common',
    category: 'buttons',
    description: 'SOLID 원칙 및 hostDirectives 기반의 단일 통합 표준 버튼 소자. 6대 변형(Primary, Secondary, Outline, Ghost, Danger, Novel), 4대 크기, 4대 형태, 로딩 스피너 및 아이콘을 단일 진입점에서 제어.',
    usedIn: [
      { app: 'eznote', role: '사이드바/툴바/페이지네이션/모달 버튼', feature: '노트 전역 액션', direct: true },
      { app: 'ezcalendar', role: '일정 추가/월 이동/구독 모달 버튼', feature: '캘린더 전역 액션', direct: true },
      { app: 'loworld-novel', role: '헤더/던전타워/수치증감 버튼', feature: '소설 전역 액션', direct: true },
      { app: 'loworld-study', role: '과제 사이드바/수업 시작 버튼', feature: '스터디 전역 액션', direct: true },
      { app: 'loworld-db', role: '멤버 폼/삭제 확인/세션 컨트롤', feature: 'DB 전역 액션', direct: true },
      { app: 'loworld-plan', role: '플랜 셸/WBS 링크/캔버스 툴바', feature: '플랜 전역 액션', direct: true }
    ],
    inputs: [
      { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'novel'" },
      { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'" },
      { name: 'shape', type: "'default' | 'pill' | 'circle' | 'square'" },
      { name: 'type', type: "'button' | 'submit' | 'reset'" },
      { name: 'disabled', type: 'boolean' },
      { name: 'loading', type: 'boolean' },
      { name: 'selected', type: 'boolean' },
      { name: 'block', type: 'boolean' },
      { name: 'prefixIcon', type: 'string' },
      { name: 'suffixIcon', type: 'string' },
      { name: 'actionId', type: 'string' },
      { name: 'actionPayload', type: 'any' }
    ],
    outputs: [
      { name: 'actionEvent', type: 'LwActionEvent<any>' }
    ]
  },
  {
    id: 'lw-app-icon',
    name: 'App Icon (앱 아이콘 시스템)',
    englishName: 'Universal App Icon Component',
    selector: 'lw-app-icon',
    domain: 'common',
    category: 'buttons',
    description: '스마트폰 스프링보드, macOS/iOS 플로팅 독 바, 타일 리스트, 미니멀 타이틀바 등 모노레포 전역의 앱 런처 및 아이콘을 전담하는 표준 컴포넌트. 스퀘어클(Squircle), 광택(Sheen), 알림 뱃지, 러닝 닷, 탄성 바운스 애니메이션 완비.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '모바일 홈 스프링보드 & 독 바', feature: '스마트폰 셸 전역 아이콘', direct: true },
      { app: 'loworld-showcase', role: 'macOS 플로팅 독 바', feature: '데스크톱 작업표시줄 독', direct: true },
      { app: 'loworld-showcase', role: '데스크톱 바탕화면 Finder 그리드', feature: '앱 런처 그리드', direct: true },
      { app: 'loworld-study', role: '타이틀바 및 과제 셸 아이콘', feature: '앱 헤더 미니멀 아이콘', direct: true }
    ],
    inputs: [
      { name: 'variant', type: "'springboard' | 'dock' | 'tile' | 'minimal'" },
      { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      { name: 'shape', type: "'squircle' | 'circle' | 'rounded' | 'square'" },
      { name: 'label', type: 'string' },
      { name: 'subtitle', type: 'string | null' },
      { name: 'iconSrc', type: 'string | null' },
      { name: 'icon', type: 'string | null' },
      { name: 'svgPath', type: 'string | null' },
      { name: 'showLabel', type: 'boolean | null' },
      { name: 'tone', type: "'default' | 'danger' | 'primary' | 'warning' | 'success'" },
      { name: 'title', type: 'string | null' },
      { name: 'badge', type: 'string | number | null' },
      { name: 'badgeTone', type: "'primary' | 'danger' | 'warning' | 'success'" },
      { name: 'running', type: 'boolean' },
      { name: 'bouncing', type: 'boolean' },
      { name: 'active', type: 'boolean' },
      { name: 'interactive', type: 'boolean' },
      { name: 'disabled', type: 'boolean' },
      { name: 'sheen', type: 'boolean' }
    ],
    outputs: [
      { name: 'appClick', type: 'MouseEvent' }
    ]
  },
  {
    id: 'lw-badge',
    name: 'Badge',
    selector: 'lw-badge',
    domain: 'common',
    category: 'buttons',
    description: '상태, 수량, 라벨 등을 표시하는 시각 지시자 소자.',
    usedIn: [
      { app: 'eznote', role: '폴더/파일 개수 뱃지', feature: '사이드바 헤더', direct: true },
      { app: 'ezcalendar', role: '디데이/일정 유형 뱃지', feature: '캘린더 카드', direct: true },
      { app: 'loworld-study', role: '단계별 수료 뱃지', feature: '학습 진행률', direct: true },
      { app: 'loworld-novel', role: '아이템 등급 뱃지', feature: '스태시 & 인벤토리', direct: true }
    ],
    inputs: [
      { name: 'variant', type: 'primary | success | warning | danger | info | neutral' },
      { name: 'size', type: 'sm | md | lg' }
    ],
    outputs: []
  },
  {
    id: 'lw-informational-badge',
    name: 'Informational Badge (정보성 뱃지 & 배너)',
    selector: 'lw-informational-badge, lw-info-badge',
    domain: 'common',
    category: 'data',
    description: '노블 스트림 시작 안내, 챕터 로딩 센티넬, 인스펙터 상태 지시자, 툴팁 메타 정보 등 모노레포 전역의 안내성 인라인 뱃지를 6대 테마 적응형으로 표준화한 공통 원자 소자.',
    usedIn: [
      { app: 'loworld-novel', role: '스트림 시작 지점 안내 뱃지', feature: '노블 뷰어 상단', direct: true },
      { app: 'loworld-novel', role: '이전 챕터 로딩 센티넬', feature: '상향 무한 스크롤', direct: true },
      { app: 'loworld-novel', role: '병원/용병/연대기 상태 배너 뱃지', feature: '인스펙터 바디 패널', direct: true },
      { app: 'loworld-novel', role: '월드 맵 실시간 웨이포인트 뱃지', feature: '스토리 맵 패널', direct: true },
      { app: 'loworld-novel', role: 'D2R 룬워드/소켓 카운트 뱃지', feature: '아이템 툴팁 & 큐브', direct: true },
      { app: 'eznote', role: '노트 타입 및 편집 중 상태 뱃지', feature: '노트 뷰어/에디터', direct: true }
    ],
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'icon', type: 'string' },
      { name: 'trailingIcon', type: 'string' },
      { name: 'variant', type: "'stream' | 'banner' | 'subtle' | 'outline' | 'solid'" },
      { name: 'tone', type: "'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral'" },
      { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'" },
      { name: 'clickable', type: 'boolean' },
      { name: 'loading', type: 'boolean' }
    ],
    outputs: [
      { name: 'badgeClick', type: 'void' }
    ]
  },
  {
    id: 'lw-progress-bar',
    name: 'ProgressBar',
    selector: 'lw-progress-bar',
    domain: 'common',
    category: 'data',
    description: '작업 진행 상태나 리소스 비율을 나타내는 프로그레스 바.',
    usedIn: [{ app: 'loworld-novel', role: '캐릭터 로스터', feature: 'D2R 플레이 세션', direct: true }],
    inputs: [
      { name: 'value', type: 'number' },
      { name: 'max', type: 'number' },
      { name: 'variant', type: 'primary | success | warning | danger | info' }
    ],
    outputs: []
  },
  {
    id: 'lw-avatar',
    name: 'Avatar (원형 아바타 시스템)',
    englishName: 'Universal Avatar Primitive Component',
    selector: 'lw-avatar',
    domain: 'common',
    category: 'data',
    designSystemFamily: 'avatars',
    description: '3대 규격(sm: 28px, md: 36px, lg: 44px)과 3단계 무결 렌더링 폴백(이미지 비동기 로딩 -> 이니셜 및 그라디언트 -> SVG 벡터 실루엣)을 캡슐화한 단일 통합 표준 원형 아바타 컴포넌트.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-novel', role: '캐릭터/몬스터 도감 및 서사 대화문 아바타', feature: '스토리 도감 & 대화', direct: true },
      { app: 'loworld-study', role: '과제 룸 참여 학생/멤버 아바타 리스트', feature: '학습 세션 룸', direct: true },
      { app: 'loworld-showcase', role: '데스크톱 바탕화면 사용자 프로필', feature: 'OS 셸 프로필', direct: true },
      { app: 'loworld-develop', role: 'AI 챗봇 어시스턴트 메시지 버블', feature: '챗봇 대화창', direct: true }
    ],
    inputs: [
      { name: 'src', type: 'string | null' },
      { name: 'initial', type: 'string' },
      { name: 'alt', type: 'string' },
      { name: 'size', type: "'sm' | 'md' | 'lg'" },
      { name: 'initialBg', type: 'string' },
      { name: 'disabled', type: 'boolean' }
    ],
    outputs: []
  },
  {
    id: 'lw-chip',
    name: 'Chip',
    selector: 'lw-chip',
    domain: 'common',
    category: 'buttons',
    description: '선택 가능한 태그 형태의 대화형 지시자 소자.',
    usedIn: [
      { app: 'eznote', role: '태그 필터 칩', feature: '검색 바', direct: true },
      { app: 'loworld-novel', role: '속성/필터 칩', feature: '인벤토리 필터', direct: true }
    ],
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'selected', type: 'boolean' }
    ],
    outputs: [{ name: 'toggle', type: 'boolean' }]
  },
  {
    id: 'lw-tooltip',
    name: 'Tooltip (통합 툴팁)',
    selector: 'lw-tooltip, [lwTooltip]',
    domain: 'common',
    category: 'popups',
    description: '단일 통합 표준 툴팁 소자. 4방향 Placement(Top/Bottom/Left/Right), 4대 테마(Dark/Glass/Novel/Light), 3대 크기, 헤더 타이틀, 지연시간(Delay) 제어 및 스마트 뷰포트 플립을 제공하는 컴포넌트 & 디렉티브.',
    layer: 'primitive',
    reusabilityIndex: 9.9,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'eznote', role: '사이드바 레일/툴바 버튼 힌트', feature: '노트 전역 툴팁', direct: true },
      { app: 'ezcalendar', role: '캘린더 날짜/이벤트 빠른 힌트', feature: '캘린더 전역 툴팁', direct: true },
      { app: 'loworld-novel', role: '선택지 조건/장비/스킬 설명', feature: '소설 전역 툴팁', direct: true },
      { app: 'loworld-study', role: '과제/멤버 권한 안내', feature: '스터디 전역 툴팁', direct: true }
    ],
    inputs: [
      { name: 'lwTooltip / content', type: 'string' },
      { name: 'lwTooltipTitle / title', type: 'string' },
      { name: 'lwTooltipPlacement / placement', type: "'top' | 'bottom' | 'left' | 'right'" },
      { name: 'lwTooltipVariant / variant', type: "'dark' | 'glass' | 'novel' | 'light'" },
      { name: 'lwTooltipSize / size', type: "'sm' | 'md' | 'lg'" },
      { name: 'lwTooltipDelay', type: 'number' },
      { name: 'lwTooltipDisabled', type: 'boolean' },
      { name: 'lwTooltipArrow / arrow', type: 'boolean' }
    ],
    outputs: []
  },
  {
    id: 'lw-modal',
    name: 'Modal (단일 통합 표준 모달)',
    englishName: 'Universal Unified Modal',
    selector: 'lw-modal',
    domain: 'common',
    category: 'popups',
    description: '모노레포 전역의 확인(Confirm), 동적 폼(Form), 아이템 피커(Selection), 위저드(Wizard), 탭 설정(Settings) 및 모든 커스텀 슬롯 패널을 단일 진입점에서 통합 수렴하는 유일무이한 표준 모달 컴포넌트.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'eznote', role: '암호/공유/리마인더/설정 모달', feature: '노트 전역 모달', direct: true },
      { app: 'ezcalendar', role: '구독 위저드/캘린더 설정 모달', feature: '캘린더 전역 모달', direct: true },
      { app: 'loworld-novel', role: '캐릭터 상세/D2R 아이템/창고 모달', feature: '소설 및 D2R 전역 모달', direct: true },
      { app: 'loworld-db', role: '회원 등록/수정/삭제 확인 모달', feature: 'DB 관리 모달', direct: true },
      { app: 'loworld-showcase', role: '배경화면/데이터셋 도감 모달', feature: '쇼케이스 전역 모달', direct: true }
    ],
    inputs: [
      { name: 'open', type: 'boolean' },
      { name: 'variant', type: "'custom' | 'confirm' | 'form' | 'selection' | 'wizard' | 'settings'" },
      { name: 'size', type: "'sm' | 'md' | 'lg' | 'full' | 'fullscreen'" },
      { name: 'tone', type: "'default' | 'danger' | 'primary' | 'info' | 'success'" },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'showClose', type: 'boolean' },
      { name: 'backdropBlur', type: 'boolean' },
      { name: 'paddingless', type: 'boolean' },
      { name: 'closeOnBackdrop', type: 'boolean' },
      { name: 'closeOnEsc', type: 'boolean' },
      { name: 'message', type: 'string (confirm 전용)' },
      { name: 'detail', type: 'string (confirm 전용)' },
      { name: 'fields', type: 'LwModalFormField[] (form 전용)' },
      { name: 'items', type: 'LwModalSelectionItem[] (selection 전용)' },
      { name: 'steps', type: 'LwModalWizardStep[] (wizard 전용)' },
      { name: 'tabs', type: 'LwModalSettingsTab[] (settings 전용)' }
    ],
    outputs: [
      { name: 'close', type: 'void' },
      { name: 'confirm', type: 'void' },
      { name: 'cancel', type: 'void' },
      { name: 'formSubmit', type: 'Record<string, any>' },
      { name: 'itemSelect', type: 'string' },
      { name: 'stepChange', type: 'number' },
      { name: 'wizardComplete', type: 'void' },
      { name: 'tabChange', type: 'string' }
    ]
  },
  {
    id: 'lw-unified-list-item',
    name: 'Unified ListItem',
    selector: 'lw-unified-list-item',
    domain: 'common',
    category: 'layout',
    description: '트리, 검색 목록, 사이드바를 통일하는 싱글 오너 리스트 아이템.',
    usedIn: [{ app: 'eznote', role: '목록 로우', feature: '폴더/파일 트리', direct: true }],
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'selected', type: 'boolean' }
    ],
    outputs: [{ name: 'select', type: 'void' }]
  },
  {
    id: 'lw-empty-state',
    name: 'EmptyState',
    selector: 'lw-empty-state',
    domain: 'common',
    category: 'data',
    description: '데이터가 없을 때 시각적 안내와 액션 버튼을 함께 표시.',
    usedIn: [
      { app: 'eznote', role: '빈 검색 결과', feature: '문서 탐색', direct: true },
      { app: 'ezcalendar', role: '일정 없음 안내', feature: '아젠다 뷰', direct: true },
      { app: 'loworld-novel', role: '빈 보관함 안내', feature: '스태시', direct: true }
    ],
    inputs: [
      { name: 'icon', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' }
    ],
    outputs: [{ name: 'action', type: 'void' }]
  },
  {
    id: 'lw-card',
    name: 'Card 1: Layout Primitive Card Shell',
    selector: 'lw-card',
    domain: 'common',
    category: 'cards',
    description: '다양한 변종(flat, elevated, outlined, interactive, glass), 사이즈 및 선택 상태를 지원하는 5대 표준 공통 레이아웃 카드 프리미티브.',
    layer: 'primitive',
    reusabilityIndex: 9.9,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'eznote', role: '그리드/리스트 노트 카드 뼈대', feature: '노트 메인 목록', direct: true },
      { app: 'ezcalendar', role: '일정 및 이벤트 디스플레이 뼈대', feature: '캘린더 메인', direct: true },
      { app: 'loworld-study', role: '수료 방 목록 카드 뼈대', feature: '학습 관리', direct: true },
      { app: 'loworld-novel', role: '아이템/스킬/상점 카드 뼈대', feature: 'D2R 플레이 세션', direct: true },
      { app: 'loworld-develop', role: '캐릭터/퀘스트 카드 뼈대', feature: '개발자 진단', direct: true }
    ],
    inputs: [
      { name: 'variant', type: "'flat' | 'elevated' | 'outlined' | 'interactive' | 'glass'" },
      { name: 'size', type: "'sm' | 'md' | 'lg'" },
      { name: 'selected', type: 'boolean' },
      { name: 'interactive', type: 'boolean' }
    ],
    outputs: [{ name: 'actionEvent', type: 'LwActionEvent' }]
  },
  {
    id: 'lw-unified-card-item',
    name: 'Card 2: Unified Data List Card',
    selector: 'lw-unified-card-item',
    domain: 'common',
    category: 'cards',
    description: '아이콘/아바타 + 타이틀 + 서브타이틀 + 요약 스니펫 + 뱃지 + 타임스탬프가 통합된 5대 표준 공통 데이터 디스플레이 카드 (노트, 휴지통, 학습수료방 통합).',
    layer: 'composite',
    reusabilityIndex: 9.7,
    duplicationRisk: 'safe',
    dependencies: ['lw-card'],
    usedIn: [
      { app: 'eznote', role: '문서/휴지통 리스트 카드', feature: '노트 메인 목록', direct: true },
      { app: 'loworld-study', role: '수료 방 아이템 카드', feature: '학습 관리', direct: true },
      { app: 'loworld-novel', role: '도감/크로니클 카드', feature: '스토리 모듈', direct: true },
      { app: 'loworld-develop', role: '데이터 시뮬레이터 카드', feature: '개발자 진단', direct: true }
    ],
    inputs: [
      { name: 'item', type: 'UnifiedCardItemVm' }
    ],
    outputs: [{ name: 'selectItem', type: 'string' }]
  },
  {
    id: 'lw-fab',
    name: 'FAB',
    selector: 'lw-fab',
    domain: 'common',
    category: 'navigation',
    description: '화면 우하단 등에 고정되는 주요 액션 버튼.',
    usedIn: [
      { app: 'eznote', role: '글쓰기 버튼', feature: '모바일 UX', direct: true }
    ],
    inputs: [
      { name: 'icon', type: 'string' },
      { name: 'color', type: 'string' }
    ],
    outputs: [
      { name: 'click', type: 'void' }
    ]
  },
  {
    id: 'lw-search-input',
    name: 'SearchInput',
    selector: 'lw-search-input',
    domain: 'common',
    category: 'forms',
    description: '검색 기능을 위한 표준 입력 필드.',
    usedIn: [
      { app: 'eznote', role: '문서 검색 필드', feature: '헤더 검색', direct: true },
      { app: 'ezcalendar', role: '일정 검색 필드', feature: '헤더 검색', direct: true }
    ],
    inputs: [
      { name: 'placeholder', type: 'string' },
      { name: 'value', type: 'string' }
    ],
    outputs: [
      { name: 'search', type: 'string' },
      { name: 'clear', type: 'void' }
    ]
  },
  {
    id: 'lw-titlebar-frame',
    name: 'Titlebar Frame',
    selector: 'lw-titlebar-frame',
    domain: 'common',
    category: 'navigation',
    description: '앱 상단의 타이틀 및 액션 영역.',
    usedIn: [
      { app: 'eznote', role: '메인 상단 네비바', feature: '데스크톱/모바일 셸', direct: true }
    ],
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'icon', type: 'string' }
    ],
    outputs: [
      { name: 'back', type: 'void' },
      { name: 'menu', type: 'void' }
    ]
  },
  {
    id: 'lw-grid',
    name: 'Grid (반응형 그리드 시스템)',
    englishName: 'Universal Responsive Grid Component',
    selector: 'lw-grid, [lw-grid], [lwGrid]',
    domain: 'common',
    category: 'layout',
    description: 'Container Query 및 반응형 브레이크포인트 기반의 단일 통합 표준 레이아웃 그리드. minmax blowout 방어 메커니즘, 5대 간격 토큰, 모바일 1열 강제 및 데스크톱 N열 스케일링 완비.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-novel', role: '소설 데이터셋 인스펙터 챕터/씬/도감/인물 그리드', feature: '단락 서사 그리드', direct: true },
      { app: 'loworld-showcase', role: '플레이 모드 선택 카드 그리드', feature: '모드 선택 카드 레이아웃', direct: true }
    ],
    inputs: [
      { name: 'cols', type: 'number | string' },
      { name: 'colsSm', type: 'number | string' },
      { name: 'colsMd', type: 'number | string' },
      { name: 'colsLg', type: 'number | string' },
      { name: 'minItemWidth', type: 'string' },
      { name: 'autoFit', type: 'boolean' },
      { name: 'gap', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | string" },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'" },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'space-between' | 'space-around'" },
      { name: 'flow', type: "'row' | 'column' | 'dense'" },
      { name: 'container', type: 'boolean' }
    ],
    outputs: []
  },
  {
    id: 'lw-list',
    name: 'List (통합 공통 리스트 시스템)',
    englishName: 'Universal List Primitive Component',
    selector: 'lw-list, lw-list-item, lw-list-header',
    domain: 'common',
    category: 'data',
    designSystemFamily: 'lists',
    description: '44px 고밀도 디렉터리, 56px 표준, 72px 확장 레이아웃을 지원하는 슬롯 기반 단일 통합 표준 리스트 컴포넌트. 하드코딩된 HTML <table> 구조를 현대적 웹 컴포넌트 슬롯([lwLeading], [lwContent], [lwMeta], [lwActions])으로 일원화.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '전체 컴포넌트 도감 44px 고밀도 목록', feature: '메인 컴포넌트 브라우저', direct: true },
      { app: 'loworld-showcase', role: '상세 인스펙터 바텀시트 실사용 오딧 목록', feature: '컴포넌트 의존성 바텀시트', direct: true }
    ],
    inputs: [
      { name: 'density', type: "'compact' | 'standard' | 'spacious'" },
      { name: 'variant', type: "'default' | 'flat' | 'bordered' | 'cards'" },
      { name: 'divided', type: 'boolean' },
      { name: 'hoverable', type: 'boolean' },
      { name: 'rounded', type: 'boolean' }
    ],
    outputs: []
  },
  {
    id: 'lw-bottom-sheet',
    name: 'BottomSheet (바텀시트 표면 시스템)',
    englishName: 'Mobile Gesture Bottom Sheet Component',
    selector: 'lw-bottom-sheet',
    domain: 'common',
    category: 'popups',
    designSystemFamily: 'sheets',
    description: '모바일 뷰포트와 실시간 터치 제스처에 최적화된 3단계 스냅(fullscreen, standard, compact) 드로어/바텀시트 표준 소자. 상단 드래그 핸들, 배경 블러 및 iOS Safe Area 완비.',
    layer: 'primitive',
    reusabilityIndex: 9.8,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '컴포넌트 상세 인스펙터 시트', feature: '모바일 오버레이 UX', direct: true },
      { app: 'loworld-novel', role: '장비 장착 & 아이템 인스펙터 바텀시트', feature: 'D2R 모바일 시트', direct: true },
      { app: 'eznote', role: '노트 옵션 & 이동 바텀시트', feature: '모바일 서피스', direct: true }
    ],
    inputs: [
      { name: 'snap', type: "'fullscreen' | 'standard' | 'compact'" },
      { name: 'visible', type: 'boolean' },
      { name: 'title', type: 'string' }
    ],
    outputs: [
      { name: 'close', type: 'void' },
      { name: 'snapChange', type: 'string' }
    ]
  },
  {
    id: 'lw-side-menu-item',
    name: 'SideMenu (통합 사이드-메뉴 내비게이션 시스템)',
    englishName: 'Universal Sidebar Navigation Component',
    selector: 'lw-side-menu-item, lw-side-menu-section',
    domain: 'common',
    category: 'navigation',
    designSystemFamily: 'side-menus',
    description: 'CSS Grid 아코디언 애니메이션과 Content Projection 슬롯을 탑재한 합성 사이드바 내비게이션 컴포넌트. 트리 구조, 활성 배지, 라우팅 태그 복사 기능 완비.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '전체 컴포넌트 도감 4단 사이드바 내비게이션', feature: '모노레포 메인 네비게이터', direct: true },
      { app: 'eznote', role: '폴더/문서 계층 트리 사이드바', feature: '노트 탐색 레일', direct: true }
    ],
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'icon', type: 'string' },
      { name: 'active', type: 'boolean' },
      { name: 'collapsed', type: 'boolean' }
    ],
    outputs: [
      { name: 'select', type: 'string' }
    ]
  },
  {
    id: 'lw-input',
    name: 'Input (표준 텍스트 인풋)',
    englishName: 'Universal Input Component',
    selector: 'lw-input',
    domain: 'common',
    category: 'forms',
    designSystemFamily: 'forms',
    description: '단일 입력 표준 소자. 포커스 링, 에러 상태, 프리픽스/서픽스 아이콘 및 시맨틱 토큰 기반의 4단계 크기 제어.',
    layer: 'primitive',
    reusabilityIndex: 9.8,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-db', role: '회원 등록 폼 인풋', feature: 'DB 사용자 관리', direct: true },
      { app: 'loworld-novel', role: '캐릭터 수치 및 검색 인풋', feature: '서사 파라미터 조작', direct: true }
    ],
    inputs: [
      { name: 'placeholder', type: 'string' },
      { name: 'value', type: 'string | number' },
      { name: 'size', type: "'sm' | 'md' | 'lg'" },
      { name: 'disabled', type: 'boolean' },
      { name: 'invalid', type: 'boolean' }
    ],
    outputs: [
      { name: 'valueChange', type: 'string' }
    ]
  },
  {
    id: 'lw-form-field',
    name: 'FormField (폼 필드 컨테이너)',
    englishName: 'Universal Form Field Wrapper',
    selector: 'lw-form-field',
    domain: 'common',
    category: 'forms',
    designSystemFamily: 'forms',
    description: '라벨(Label), 힌트(Hint), 에러 메시지(Error) 및 필수 인디케이터(*)를 일원화한 폼 컨트롤 래퍼.',
    layer: 'primitive',
    reusabilityIndex: 9.5,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-db', role: '회원 정보 입력 폼 필드', feature: 'DB 양식', direct: true }
    ],
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'required', type: 'boolean' },
      { name: 'error', type: 'string' },
      { name: 'hint', type: 'string' }
    ],
    outputs: []
  },
  {
    id: 'lw-select',
    name: 'Select (표준 드롭다운 셀렉트)',
    englishName: 'Universal Select Component',
    selector: 'lw-select',
    domain: 'common',
    category: 'forms',
    designSystemFamily: 'forms',
    description: '옵션 목록 선택용 표준 드롭다운 컨트롤. 키보드 내비게이션 및 다크 모드 팝오버 완비.',
    layer: 'primitive',
    reusabilityIndex: 9.3,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-db', role: '역할 및 권한 선택 드롭다운', feature: 'DB 멤버 권한 설정', direct: true }
    ],
    inputs: [
      { name: 'options', type: 'Array<{ label: string; value: any }>' },
      { name: 'value', type: 'any' }
    ],
    outputs: [
      { name: 'valueChange', type: 'any' }
    ]
  },
  {
    id: 'lw-checkbox',
    name: 'Checkbox (체크박스 컨트롤)',
    englishName: 'Universal Checkbox Component',
    selector: 'lw-checkbox',
    domain: 'common',
    category: 'forms',
    designSystemFamily: 'forms',
    description: '단일 또는 다중 선택 상태를 표현하는 표준 체크박스. Indeterminate 상태 및 미려한 체크 애니메이션.',
    layer: 'primitive',
    reusabilityIndex: 9.2,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'ezcalendar', role: '일정 카테고리 필터 체크박스', feature: '캘린더 필터', direct: true }
    ],
    inputs: [
      { name: 'checked', type: 'boolean' },
      { name: 'label', type: 'string' },
      { name: 'disabled', type: 'boolean' }
    ],
    outputs: [
      { name: 'checkedChange', type: 'boolean' }
    ]
  },
  {
    id: 'lw-textarea',
    name: 'Textarea (멀티라인 텍스트영역)',
    englishName: 'Universal Textarea Component',
    selector: 'lw-textarea',
    domain: 'common',
    category: 'forms',
    designSystemFamily: 'forms',
    description: '자동 높이 조절 및 글자수 카운트를 지원하는 멀티라인 입력 소자.',
    layer: 'primitive',
    reusabilityIndex: 9.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-novel', role: '씬 프롬프트 및 단락 서사 편집', feature: '노블 에디터', direct: true }
    ],
    inputs: [
      { name: 'rows', type: 'number' },
      { name: 'placeholder', type: 'string' },
      { name: 'maxLength', type: 'number' }
    ],
    outputs: [
      { name: 'valueChange', type: 'string' }
    ]
  },
  {
    id: 'lw-slide-switch',
    name: 'SlideSwitch (슬라이드 토글 스위치)',
    englishName: 'Universal Slide Switch Toggle',
    selector: 'lw-slide-switch',
    domain: 'common',
    category: 'forms',
    designSystemFamily: 'forms',
    description: 'iOS 스타일의 부드러운 스프링 애니메이션을 적용한 On/Off 불리언 토글 스위치.',
    layer: 'primitive',
    reusabilityIndex: 9.1,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '데스크톱 다크모드 및 자동저장 스위치', feature: '설정 토글', direct: true }
    ],
    inputs: [
      { name: 'checked', type: 'boolean' },
      { name: 'size', type: "'sm' | 'md'" }
    ],
    outputs: [
      { name: 'checkedChange', type: 'boolean' }
    ]
  },
  {
    id: 'lw-snackbar',
    name: 'Snackbar (스낵바 알림 토스트)',
    englishName: 'Universal Snackbar & Toast Host',
    selector: 'lw-snackbar, lw-snackbar-host',
    domain: 'common',
    category: 'popups',
    designSystemFamily: 'modals',
    description: '화면 하단 또는 상단에 나타나는 비침습적 피드백 메시지 토스트. 성공/경고/오류/정보 4대 톤 및 자동 닫힘 타이머 완비.',
    layer: 'primitive',
    reusabilityIndex: 9.6,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'eznote', role: '저장 완료 및 클립보드 복사 알림', feature: '노트 피드백', direct: true },
      { app: 'loworld-showcase', role: '라우트 태그 복사 완료 토스트', feature: '도감 UX', direct: true }
    ],
    inputs: [
      { name: 'message', type: 'string' },
      { name: 'tone', type: "'success' | 'warning' | 'danger' | 'info'" },
      { name: 'duration', type: 'number' }
    ],
    outputs: [
      { name: 'dismiss', type: 'void' }
    ]
  },
  {
    id: 'lw-dialog-host',
    name: 'DialogHost (모달 다이얼로그 호스트)',
    englishName: 'Universal Modal Dialog Host Container',
    selector: 'lw-dialog-host',
    domain: 'common',
    category: 'popups',
    designSystemFamily: 'modals',
    description: '단일 인스턴스로 동적 팝업 다이얼로그를 렌더링하고 포커스 트랩과 ESC 닫기를 처리하는 호스트 컨테이너.',
    layer: 'primitive',
    reusabilityIndex: 9.7,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-novel', role: '다이얼로그 팝업 전역 호스팅', feature: '노블 윈도우', direct: true }
    ],
    inputs: [
      { name: 'activeDialogId', type: 'string' }
    ],
    outputs: []
  },
  {
    id: 'lw-section-header',
    name: 'SectionHeader (구조 섹션 헤더)',
    englishName: 'Universal Section Header Component',
    selector: 'lw-section-header',
    domain: 'common',
    category: 'layout',
    designSystemFamily: 'cards',
    description: '섹션의 타이틀, 설명문, 배지 및 우측 액션 슬롯([actions])을 일원화한 표준 레이아웃 헤더 소자.',
    layer: 'primitive',
    reusabilityIndex: 9.9,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '전체 컴포넌트 도감 섹션 헤더', feature: '쇼케이스 레이아웃', direct: true }
    ],
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' }
    ],
    outputs: []
  },
  {
    id: 'lw-metric-line',
    name: 'MetricLine (단일 지표 메트릭 라인)',
    englishName: 'Universal Metric Line Indicator',
    selector: 'lw-metric-line',
    domain: 'common',
    category: 'data',
    designSystemFamily: 'badges',
    description: '라벨과 수치, 증감율 및 진행 바를 1열로 요약 표현하는 고밀도 데이터 라인 소자.',
    layer: 'primitive',
    reusabilityIndex: 9.4,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'loworld-showcase', role: '대시보드 KPI 메트릭 라인', feature: '통계 지표', direct: true }
    ],
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string | number' },
      { name: 'unit', type: 'string' }
    ],
    outputs: []
  },
  {
    id: 'lw-app-stage',
    name: 'App Stage (앱 무대)',
    englishName: 'App Stage',
    selector: 'lw-app-stage',
    domain: 'common',
    category: 'layout',
    description: '앱 화면의 맨 바깥에 놓는 무대. 앱의 셸 하나를 담고 아래에 개발 도구를 둔다. 창 안에서는 창을 가득 채우고, 혼자 떠 있을 때는 테두리가 있는 상자가 된다. 앱마다 따로 있던 뿌리 컴포넌트를 대신한다.',
    layer: 'container',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'eznote', role: '노트 화면의 무대', feature: '데스크탑·모바일 셸을 담는다', direct: true },
      { app: 'ezcalendar', role: '달력 화면의 무대', feature: '셸과 설정·구독 창을 담는다', direct: true },
      { app: 'loworld-plan', role: '플랜 화면의 무대', feature: '상자 없이 셸을 담는다', direct: true }
    ],
    inputs: [
      { name: 'frame', type: "'desktop' | 'mobile'" },
      { name: 'bare', type: 'boolean' },
      { name: 'loading', type: 'boolean' }
    ],
    outputs: []
  },
  {
    id: 'lw-dev-tools',
    name: 'Dev Tools (개발 도구)',
    englishName: 'Developer Tools',
    selector: 'lw-dev-tools',
    domain: 'common',
    category: 'data',
    description: '이벤트 기록과, 저장된 자료를 지우는 단추. 무엇을 지우는지는 앱이 알고, 이 컴포넌트는 눌렸다는 것만 알린다. lw-app-stage 안에 놓는다.',
    layer: 'composite',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    usedIn: [
      { app: 'eznote', role: '노트 화면의 개발 도구', feature: '이벤트 기록, DB·스토리지 초기화', direct: true },
      { app: 'ezcalendar', role: '달력 화면의 개발 도구', feature: '이벤트 기록, DB·스토리지 초기화', direct: true }
    ],
    inputs: [
      { name: 'resetLabel', type: 'string' },
      { name: 'hints', type: 'boolean' }
    ],
    outputs: [
      { name: 'resetData', type: 'void' },
      { name: 'clearStorage', type: 'void' }
    ]
  },
  {
    id: 'lw-stack',
    name: 'Stack (줄 배치)',
    englishName: 'Stack Layout',
    selector: 'lw-stack',
    domain: 'common',
    category: 'layout',
    description: '안의 것을 세로나 가로 한 줄로 늘어놓는다. 간격·정렬·여백·바탕을 토큰의 단계로 고른다. 앱의 화면은 HTML 요소를 쓰지 못하므로 배치는 이것으로 한다.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'direction', type: "'column' | 'row'" },
      { name: 'gap', type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      { name: 'align', type: "'stretch' | 'start' | 'center' | 'end' | 'baseline'" },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'between'" },
      { name: 'padding', type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'" },
      { name: 'wrap', type: "boolean" },
      { name: 'fill', type: "boolean" },
      { name: 'scroll', type: "boolean" },
      { name: 'surface', type: "'none' | 'ground' | 'raised'" },
      { name: 'scrollKey', type: "unknown" }
    ],
    outputs: []
  },
  {
    id: 'lw-text',
    name: 'Text (글자)',
    englishName: 'Text',
    selector: 'lw-text',
    domain: 'common',
    category: 'data',
    description: '글자. 종류가 크기와 굵기를, 어조가 색을 정한다. 모든 앱의 제목과 본문이 같은 모양이 된다.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'variant', type: "'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption' | 'code'" },
      { name: 'tone', type: "'default' | 'muted' | 'accent' | 'danger' | 'success' | 'warning'" },
      { name: 'truncate', type: "boolean" }
    ],
    outputs: []
  },
  {
    id: 'lw-spinner',
    name: 'Spinner (기다림)',
    englishName: 'Spinner',
    selector: 'lw-spinner',
    domain: 'common',
    category: 'data',
    description: '기다리는 중임을 보인다. 자리를 채워 가운데에서 돈다.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'label', type: "string" },
      { name: 'size', type: "'sm' | 'md' | 'lg'" }
    ],
    outputs: []
  },
  {
    id: 'lw-data-table',
    name: 'Data Table (표)',
    englishName: 'Data Table',
    selector: 'lw-data-table',
    domain: 'common',
    category: 'data',
    description: '표. 열의 선언과 행의 배열을 받아 그린다. 행을 고를 수 있고, lwCell 템플릿으로 칸에 배지나 단추를 넣는다. 모든 앱의 표가 이것 하나다.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'columns', type: "LwTableColumn[]" },
      { name: 'rows', type: "T[]" },
      { name: 'rowKey', type: "string" },
      { name: 'selectedKey', type: "unknown" },
      { name: 'selectable', type: "boolean" },
      { name: 'dense', type: "boolean" },
      { name: 'caption', type: "string" },
      { name: 'emptyMessage', type: "string" }
    ],
    outputs: [
      { name: 'rowSelect', type: "T" }
    ]
  },
  {
    id: 'lw-tree',
    name: 'Tree (나무)',
    englishName: 'Tree',
    selector: 'lw-tree',
    domain: 'common',
    category: 'navigation',
    description: '계층이 있는 것(조직, 폴더, 목차)을 고르는 나무. 마디의 배열을 받아 그리고 고른 마디의 id를 알린다. 모든 앱의 나무가 이것 하나다.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'nodes', type: 'LwTreeNode[]' },
      { name: 'selectedId', type: 'string | null' },
      { name: 'ariaLabel', type: 'string' }
    ],
    outputs: [
      { name: 'nodeSelect', type: 'string' }
    ]
  },
  {
    id: 'lw-workbench',
    name: 'Workbench (관리 화면의 틀)',
    englishName: 'Workbench Layout',
    selector: 'lw-workbench',
    domain: 'common',
    category: 'layout',
    description: '관리 화면을 짜는 쉬운 겉. 내용을 속성(lwWorkbenchHeader, lwWorkbenchNav, lwWorkbenchAside)으로 가려 받아 앱의 틀(lw-app-frame)의 자리에 넣는다. 그리는 일은 틀이 한다.',
    layer: 'container',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'nav', type: 'boolean' },
      { name: 'aside', type: 'boolean' }
    ],
    outputs: []
  },
  {
    id: 'lw-frame-settings',
    name: 'Frame Settings (화면 틀 설정)',
    englishName: 'Frame Settings',
    selector: 'lw-frame-settings',
    domain: 'common',
    category: 'forms',
    description: '헤더와 사이드 메뉴를 어떻게 놓을지 고르는 설정 화면. 설정의 선언을 읽어 스스로 그린다. 고른 값은 같은 틀(lw-workspace-desktop-layout, lw-workbench)을 쓰는 모든 앱에 바로 적용된다.',
    layer: 'composite',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [],
    outputs: []
  },
  {
    id: 'lw-app-frame',
    name: 'App Frame (앱의 틀)',
    englishName: 'App Frame',
    selector: 'lw-app-frame',
    domain: 'common',
    category: 'layout',
    description: '앱의 틀. 헤더, 사이드 메뉴, 목록, 본문, 상세가 이 하나의 부품에 놓인다. 자리마다 템플릿을 받아 그리고, 틀의 설정을 읽어 헤더와 사이드 메뉴를 옮기거나 숨긴다. Note, Plan, Develop, Novel의 셸과 lw-workbench(그룹, Database)가 이 위에 그려진다.',
    layer: 'shell',
    reusabilityIndex: 10.0,
    duplicationRisk: 'safe',
    inputs: [
      { name: 'layout', type: 'WorkspaceDesktopLayout' },
      { name: 'slotTemplates', type: 'WorkspaceDesktopSlotTemplates' },
      { name: 'selectedSlotId', type: 'WorkspaceDesktopSlotId | null' },
      { name: 'collectionResizable', type: 'boolean' }
    ],
    outputs: [
      { name: 'slotSelected', type: 'WorkspaceDesktopSlotId' },
      { name: 'collectionWidthChange', type: 'number' }
    ]
  }
];
