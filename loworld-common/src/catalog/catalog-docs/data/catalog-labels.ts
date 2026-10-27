import { ComponentMeta, PlatformSupportType } from '../../../services/models/os.types';

export type CatalogCategory = ComponentMeta['category'];
export type CatalogDomain = ComponentMeta['domain'];
export type CatalogLayer = NonNullable<ComponentMeta['layer']>;

/** 목차와 색인에 쓰는 분류 순서 */
export const CATEGORY_ORDER: readonly CatalogCategory[] = ['cards', 'layout', 'forms', 'navigation', 'data', 'popups', 'buttons', 'view', 'fantasy', 'sci-fi', 'mystery', 'wuxia'];

export const CATEGORY_LABELS: Readonly<Record<CatalogCategory, string>> = {
  cards: '도메인 카드',
  layout: '레이아웃 & 컨테이너',
  forms: '폼 & 에디터',
  navigation: '네비게이션',
  data: '데이터 표시',
  popups: '팝업 & 오버레이',
  buttons: '버튼 & 액션',
  view: '화면 뷰 & 셸',
  fantasy: '판타지 RPG',
  'sci-fi': 'SF / 사이버펑크',
  mystery: '추리 / 스릴러',
  'wuxia': '무협',
  martial: '무협',
};

export const CATEGORY_DESCRIPTIONS: Readonly<Record<CatalogCategory, string>> = {
  cards: 'lw-card 표면 위에 도메인 데이터(로스터, 파티원 상태, 퀘스트 등)를 얹은 완제품 카드.',
  layout: '레이아웃, 패널 등 화면의 뼈대를 이루는 컨테이너.',
  forms: '입력창, 에디터, 선택 상자 등 사용자 입력을 받는 컨트롤.',
  navigation: '메뉴, 탭, 사이드바 등 앱 안에서 이동을 돕는 컴포넌트.',
  data: '표, 목록, 지표 등 정보를 보여 주는 컴포넌트.',
  popups: '모달, 대화상자 등 화면 위에 띄우는 컴포넌트.',
  buttons: '동작을 시작하거나 상태를 알리는 버튼과 표시기.',
  view: '독립된 화면이나 복합 콘텐츠 뷰.',
  fantasy: '판타지 RPG 소설 장면과 인터랙티브 스토리.',
  'sci-fi': '사이버펑크 세계관의 스토리 라인.',
  mystery: '추리 스토리 라인.',
  'wuxia': '무협 서사 스토리 라인.',
  martial: '무협 서사 스토리 라인.',
};

/** 계층이 없는 항목은 복합 부품으로 센다. */
export const DEFAULT_LAYER: CatalogLayer = 'composite';

export const LAYER_LABELS: Readonly<Record<CatalogLayer, string>> = {
  primitive: 'L1 단일 소자',
  composite: 'L2 복합 부품',
  container: 'L2 컨테이너',
  shell: 'L3 셸',
};

export const DOMAIN_LABELS: Readonly<Record<CatalogDomain, string>> = {
  common: '공통',
  note: 'Note',
  calendar: 'Calendar',
  'homework': 'Study',
  'novel': 'Novel',
  curriculum: 'Study',
  story: 'Novel',
  db: 'Database',
  plan: 'Plan',
  develop: 'Develop',
  showcase: 'Showcase',
};

export const PLATFORM_LABELS: Readonly<Record<PlatformSupportType, string>> = {
  adaptive: '적응형 (데스크톱·모바일)',
  'desktop-only': '데스크톱 전용',
  'mobile-only': '모바일 전용',
  'shared-primitive': '공용 소자',
};
