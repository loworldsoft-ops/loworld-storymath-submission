import { ComponentMeta } from '../../services/models/os.types';

export const SHOWCASE_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-component-tile-grid',
    name: '컴포넌트 카탈로그 그리드',
    englishName: 'Component Tile Grid',
    selector: 'lw-component-tile-grid',
    domain: 'showcase',
    category: 'data',
    description: '쇼케이스 내의 컴포넌트 목록을 유튜브 스타일의 카드 그리드로 렌더링하고 카테고리 필터링 및 검색 기능을 제공합니다.',
    usedIn: [{ app: 'loworld-showcase', role: '컴포넌트 탐색 격자판 렌더러', direct: true }],
    inputs: [
      { name: 'components', type: 'readonly ComponentMeta[]' },
      { name: 'themeMode', type: 'OverviewThemeMode' }
    ],
    outputs: [
      { name: 'componentSelect', type: 'string' }
    ],
    layer: 'composite',
    reusabilityIndex: 4,
    duplicationRisk: 'safe',
    dependencies: ['lw-icon'],
    referencedBy: ['lw-develop-showcase', 'app-all-components']
  },
  {
    id: 'lw-component-detail',
    name: '컴포넌트 상세 플레이어',
    englishName: 'Component Detail Previewer',
    selector: 'lw-component-detail',
    domain: 'showcase',
    category: 'view',
    description: '선택된 컴포넌트의 Inputs/Outputs 명세를 동적으로 해석하여 렌더링하고 스펙 문서 및 라이브 데모 조작부를 표출합니다.',
    usedIn: [{ app: 'loworld-showcase', role: '컴포넌트 상세 분석 샌드박스 플레이어', direct: true }],
    inputs: [
      { name: 'comp', type: 'ComponentMeta' },
      { name: 'domain', type: 'DomainId' },
      { name: 'themeMode', type: 'OverviewThemeMode' }
    ],
    outputs: [
      { name: 'openNav', type: 'void' }
    ],
    layer: 'composite',
    reusabilityIndex: 3,
    duplicationRisk: 'safe',
    dependencies: ['lw-badge', 'lw-card'],
    referencedBy: ['lw-develop-showcase', 'app-all-components']
  },
  {
    id: 'app-all-components',
    name: '통합 컴포넌트 탐색기',
    englishName: 'All Components Explorer',
    selector: 'app-all-components',
    domain: 'showcase',
    category: 'view',
    description: '모노레포 내 모든 컴포넌트 자산들의 공통화율 지표, 종속성 크로스 매트릭스 및 계층화 분류를 탐색하는 핵심 대시보드입니다.',
    usedIn: [{ app: 'loworld-showcase', role: '컴포넌트 관제 센터', direct: true }],
    inputs: [
      { name: 'viewType', type: '"grid" | "list"' },
      { name: 'themeMode', type: 'OverviewThemeMode' },
      { name: 'embedded', type: 'boolean' }
    ],
    outputs: [
      { name: 'navigateTo', type: 'string' },
      { name: 'closeRequested', type: 'void' }
    ],
    layer: 'shell',
    reusabilityIndex: 1,
    duplicationRisk: 'safe',
    dependencies: ['lw-component-tile-grid', 'lw-os-icon'],
    referencedBy: ['lw-os-desktop-surface']
  },
  {
    id: 'lw-os-desktop-surface',
    name: '데스크톱 바탕화면 셸',
    englishName: 'Overview Desktop Surface',
    selector: 'lw-os-desktop-surface',
    domain: 'showcase',
    category: 'layout',
    description: '가상 OS 윈도우 바탕화면 환경을 렌더링하고 마우스 드래그를 통한 윈도우 생성, 이동, 포커스 순서(Z-Index)를 조정합니다.',
    usedIn: [{ app: 'loworld-showcase', role: '가상 OS 전체 데스크톱 환경 관리자', direct: true }],
    inputs: [
      { name: 'themeMode', type: 'OverviewThemeMode' }
    ],
    outputs: [
      { name: 'windowOpen', type: 'string' }
    ],
    layer: 'shell',
    reusabilityIndex: 1,
    duplicationRisk: 'safe',
    dependencies: ['lw-os-taskbar', 'lw-os-window-frame'],
    referencedBy: []
  },
  {
    id: 'lw-os-taskbar',
    name: '가상 작업 표시줄',
    englishName: 'Overview Taskbar',
    selector: 'lw-os-taskbar',
    domain: 'showcase',
    category: 'navigation',
    description: '화면 최하단에 상시 노출되어 가상 OS의 시작 메뉴 팝업 제어, 윈도우 창 핀 고정 및 활성 윈도우 전환 기능을 돕습니다.',
    usedIn: [{ app: 'loworld-showcase', role: '작업 표시줄 컨트롤러', direct: true }],
    inputs: [
      { name: 'windows', type: 'OverviewWindow[]' },
      { name: 'themeMode', type: 'OverviewThemeMode' }
    ],
    outputs: [
      { name: 'toggleWindow', type: 'string' }
    ],
    layer: 'shell',
    reusabilityIndex: 1,
    duplicationRisk: 'safe',
    dependencies: ['lw-os-start-panel'],
    referencedBy: ['lw-os-desktop-surface']
  },
  {
    id: 'lw-os-window-frame',
    name: '다중 윈도우 프레임',
    englishName: 'Overview Window Frame',
    selector: 'lw-os-window-frame',
    domain: 'showcase',
    category: 'layout',
    description: '타이틀바, 조작 제어 버튼(최소/최대/닫기)을 포함하며 마우스 드래그를 통한 크기 조절 및 좌표 드래깅 이동이 가능합니다.',
    usedIn: [{ app: 'loworld-showcase', role: '가상 다중 창 프레임', direct: true }],
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'state', type: 'OverviewWindowState' },
      { name: 'zIndex', type: 'number' }
    ],
    outputs: [
      { name: 'focus', type: 'void' },
      { name: 'close', type: 'void' }
    ],
    layer: 'shell',
    reusabilityIndex: 1,
    duplicationRisk: 'warn',
    dependencies: ['lw-os-icon'],
    referencedBy: ['lw-os-desktop-surface']
  },
  {
    id: 'lw-os-start-panel',
    name: '시작 메뉴 런처',
    englishName: 'Overview Start Panel',
    selector: 'lw-os-start-panel',
    domain: 'showcase',
    category: 'navigation',
    description: '작업 표시줄 윈도우 클릭 시 오픈되는 가상 시작 메뉴로, 최근 실행 앱 아이콘 및 테마 전환/로그아웃 기능을 렌더링합니다.',
    usedIn: [{ app: 'loworld-showcase', role: '시작 메뉴 팝업 런처', direct: true }],
    inputs: [
      { name: 'open', type: 'boolean' }
    ],
    outputs: [
      { name: 'launchApp', type: 'string' }
    ],
    layer: 'shell',
    reusabilityIndex: 1,
    duplicationRisk: 'safe',
    dependencies: ['lw-os-icon'],
    referencedBy: ['lw-os-taskbar']
  }
];
