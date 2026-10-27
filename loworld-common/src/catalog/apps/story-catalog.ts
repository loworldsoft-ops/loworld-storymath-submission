import { ComponentMeta } from '../../services/models/os.types';

export const STORY_CATALOG: ComponentMeta[] = [
  {
    id: 'lw-section-header',
    name: 'Sidebar Section Header',
    selector: 'lw-section-header',
    domain: 'novel',
    category: 'view',
    description: '사이드바 패널 제목과 설명을 렌더링하는 헤더 primitive.',
    usedIn: [],
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
    ],
    outputs: [],
  },
  {
    id: 'lw-narrative-sidebar-empty-state',
    name: 'Sidebar Empty State',
    selector: 'lw-empty-state',
    domain: 'novel',
    category: 'view',
    description: '사이드바 비어 있음 메시지를 렌더링하는 primitive.',
    usedIn: [],
    inputs: [{ name: 'message', type: 'string' }],
    outputs: [],
  },
  {
    id: 'lw-narrative-sidebar-metric-line',
    name: 'Sidebar Metric Line',
    selector: 'lw-metric-line',
    domain: 'novel',
    category: 'view',
    description: '좌측 라벨과 우측 값을 정렬하는 sidebar 메트릭 라인 primitive.',
    usedIn: [
      { app: 'loworld-novel', role: '스토리 리더 메트릭 라인', feature: '이름, 레벨, 진행률 표시', direct: true },
    ],
    inputs: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string' },
      { name: 'alignTop', type: 'boolean' },
    ],
    outputs: [],
  },
  {
    id: 'lw-progress-chip',
    name: 'Progress Chip (진행 상황 칩)',
    selector: 'lw-progress-chip',
    domain: 'novel',
    category: 'cards',
    description: '퀘스트, 액트, 토벌, EXP, 골드 등 실시간 진행 상태와 미니 게이지 바를 캡슐화한 표준 진행률 칩 컴포넌트.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    usedIn: [
      { app: 'loworld-showcase', role: 'allcomponents', feature: '칩 샌드박스', direct: true },
    ],
    inputs: [{ name: 'chip', type: 'ProgressChipVm' }],
    outputs: [],
  },
  {
    id: 'lw-slide-switch',
    name: 'Slide Switch (슬라이드 토글 스위치 프리미티브)',
    selector: 'lw-slide-switch',
    domain: 'novel',
    category: 'forms',
    description: 'WAI-ARIA switch 롤 및 부드러운 트랙/썸 애니메이션을 내장한 모노레포 공통 토글 스위치.',
    layer: 'primitive',
    reusabilityIndex: 10.0,
    usedIn: [
      { app: 'loworld-showcase', role: 'allcomponents', feature: '토글 스위치 샌드박스', direct: true },
    ],
    inputs: [
      { name: 'checked', type: 'boolean' },
      { name: 'ariaLabel', type: 'string | null' },
    ],
    outputs: [{ name: 'toggle', type: 'Event' }],
  },
  {
    id: 'lw-cube-recipe-view',
    name: 'Cube Recipe View (연성 조합법 뷰)',
    selector: 'lw-cube-recipe-view',
    domain: 'novel',
    category: 'view',
    description: '호라드림/카나이의 함에서 사용 가능한 룬 조합, 장비 업그레이드, 소켓 뚫기 공식 목록을 제공하는 조합법 뷰.',
    layer: 'composite',
    reusabilityIndex: 8.9,
    usedIn: [
      { app: 'loworld-showcase', role: 'allcomponents', feature: '조합법 가이드 샌드박스', direct: true },
    ],
    inputs: [
      { name: 'recipes', type: 'any[]' },
      { name: 'searchQuery', type: 'string' },
    ],
    outputs: [
      { name: 'selectRecipe', type: 'any' },
    ],
  },
];