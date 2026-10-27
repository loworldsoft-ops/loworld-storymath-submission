/**
 * LoworldUI Card Design System & Full Audit Catalog
 * 모노레포 전역(820개 카드/표면 컨테이너 인스턴스) 전수조사 데이터 및 6대 스타일 분류 체계
 */

import type { LwCardVariant, LwCardLayout, LwCardElevation, LwSize } from '../services/tokens/global.tokens';

export interface CardAuditMetrics {
  totalCount: number;
  migratedCount: number;
  unmigratedRawCount: number;
  unifiedRate: number;
  styleFamiliesCount: number;
  variantsCount: number;
  layoutsCount: number;
  elevationsCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface CardSampleItem {
  id: string;
  name: string;
  description: string;
  familyId: string;
  variant: LwCardVariant;
  layout: LwCardLayout;
  elevation: LwCardElevation;
  size: LwSize;
  interactive?: boolean;
  selected?: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: string;
  bodySnippet: string;
  metaFooter?: string;
  icon?: string;
  htmlSnippet: string;
  useCase: string;
  realWorldLocation: string;
}

export interface CardStyleFamily {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  countApprox: number;
  percentage: number;
  colorTone: string;
  items: CardSampleItem[];
}

export interface CardApiProp {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
  required?: boolean;
}

export const CARD_AUDIT_METRICS: CardAuditMetrics = {
  totalCount: 820,
  migratedCount: 315,
  unmigratedRawCount: 505,
  unifiedRate: 38.4,
  styleFamiliesCount: 6,
  variantsCount: 4, // outlined, elevated, flat, glass
  layoutsCount: 4,  // stack, row, tile, custom
  elevationsCount: 4, // none, sm, md, lg
  appDistribution: [
    { app: 'wuxia', label: 'Wuxia & Novel 세계관 앱', count: 236, percentage: 28.8 },
    { app: 'showcase', label: 'Showcase 포털 & 데모', count: 210, percentage: 25.6 },
    { app: 'd2r', label: 'D2R & RPG 전투 시스템', count: 148, percentage: 18.0 },
    { app: 'homework', label: 'Homework & 생산성 앱', count: 92, percentage: 11.2 },
    { app: 'core', label: '공통 프리미티브 & 패널', count: 74, percentage: 9.0 },
    { app: 'scifi', label: 'Sci-Fi & 사이버 터미널', count: 60, percentage: 7.4 },
  ],
};

export const CARD_STYLE_FAMILIES: CardStyleFamily[] = [
  {
    id: 'profile-summary',
    name: 'Entity & Profile Summary',
    nameKo: '엔티티 & 캐릭터 프로필 요약',
    icon: '👤',
    description: '캐릭터, 몬스터, 파티원, 보스 등의 스탯·레벨·상태를 집약적으로 표출하는 대형/중형 서피스 카드',
    countApprox: 184,
    percentage: 22.4,
    colorTone: '#6366f1',
    items: [
      {
        id: 'card-char-summary',
        name: '캐릭터 종합 프로필 카드',
        description: '영웅의 이름, 소속 문파, 레벨, 체력/내력 수치를 집약 표기하는 마스터 카드',
        familyId: 'profile-summary',
        variant: 'outlined',
        layout: 'stack',
        elevation: 'sm',
        size: 'md',
        interactive: true,
        title: '설아 (雪兒) · 천룬문 동문',
        subtitle: '수호검사 · Lv.1 (경험치 0%)',
        badge: '주인공',
        badgeTone: 'primary',
        bodySnippet: '천룬문 장문인의 막내 제자. 한빙검결의 기초를 연마 중이며 동문과의 유대가 깊다.',
        metaFooter: 'HP 100/100 · MP 80/80 · 민첩 14 · 방어력 12',
        icon: '🗡️',
        htmlSnippet: `<lw-card variant="outlined" layout="stack" [interactive]="true" size="md">\n  <div class="card-header">\n    <strong>설아 (雪兒)</strong>\n    <lw-badge label="주인공" />\n  </div>\n  <p>천룬문 장문인의 막내 제자...</p>\n</lw-card>`,
        useCase: '캐릭터 세션 컨트롤러 및 내비게이션 드로어 요약 카드',
        realWorldLocation: 'collection/items/character-summary-card',
      },
      {
        id: 'card-monster-summary',
        name: '몬스터 인카운터 카드',
        description: '조우한 마수/보스의 위험도 등급과 저항 속성을 표기하는 배틀 카드',
        familyId: 'profile-summary',
        variant: 'outlined',
        layout: 'row',
        elevation: 'sm',
        size: 'sm',
        interactive: true,
        title: '빙결 백호 (氷結 白虎)',
        subtitle: '극지 희귀 마수 · 위협도 A급',
        badge: '선공 몬스터',
        badgeTone: 'danger',
        bodySnippet: '영하의 한기를 뿜어내는 백호. 빙결 공격 시 광역 동결 디버프를 부여한다.',
        metaFooter: 'HP 2,400 / 2,400 · 약점: 화염 속성',
        icon: '🐯',
        htmlSnippet: `<lw-card variant="outlined" layout="row" [interactive]="true" size="sm">\n  <span class="icon">🐯</span>\n  <div>\n    <strong>빙결 백호</strong>\n    <p>HP 2,400 / 약점: 화염</p>\n  </div>\n</lw-card>`,
        useCase: '전투 배너 및 조우 몬스터 목록',
        realWorldLocation: 'collection/items/banner-monster-card',
      },
    ],
  },
  {
    id: 'inventory-item',
    name: 'Inventory & Shop Item',
    nameKo: '아이템 & 상점 인벤토리 카드',
    icon: '🎒',
    description: '장비, 소모품, 상점 거래 물품, 던전 전리품의 희귀도 및 가격/수량을 나열하는 카드',
    countApprox: 174,
    percentage: 21.2,
    colorTone: '#f59e0b',
    items: [
      {
        id: 'card-novel-shop-item',
        name: '소설 서점 상점 아이템 카드',
        description: '가격, 희귀도, 구매 가능 상태 및 프리뷰 기능을 제공하는 상품 카드',
        familyId: 'inventory-item',
        variant: 'outlined',
        layout: 'row',
        elevation: 'sm',
        size: 'sm',
        interactive: true,
        title: '현천빙벽검초 (玄天氷璧劍抄)',
        subtitle: '고대 비급 전승서 · 희귀도 SSR',
        badge: '5,000 금화',
        badgeTone: 'warning',
        bodySnippet: '한빙검결의 비전 공격 식을 기록한 양피지. 착용자의 검기 피해량이 35% 증폭된다.',
        metaFooter: '잔여 수량 1개 · 구매 즉시 인벤토리 귀속',
        icon: '📜',
        htmlSnippet: `<lw-card variant="outlined" layout="row" [interactive]="true" size="sm">\n  <span class="icon">📜</span>\n  <div class="content">\n    <strong>현천빙벽검초</strong>\n    <lw-badge label="5,000 금화" />\n  </div>\n</lw-card>`,
        useCase: '무협 상점 및 아이템 상점 카탈로그 뷰',
        realWorldLocation: 'collection/items/novel-shop-item-card',
      },
      {
        id: 'card-loot-claim',
        name: '전리품 획득 카드',
        description: '보스 처치 후 드랍된 전리품 수령 액션이 포함된 컴팩트 카드',
        familyId: 'inventory-item',
        variant: 'flat',
        layout: 'row',
        elevation: 'none',
        size: 'sm',
        interactive: true,
        title: '서리결정 원석 x3',
        subtitle: '연금술 및 장비 강화 재료',
        badge: '자동 획득 가능',
        badgeTone: 'success',
        bodySnippet: '영구 동토층에서만 채굴되는 순도 99%의 얼음 광석.',
        metaFooter: '클릭 시 전리품 주머니로 이동',
        icon: '💎',
        htmlSnippet: `<lw-card variant="flat" layout="row" [interactive]="true" size="sm">\n  <div class="loot-info">\n    <strong>서리결정 원석 x3</strong>\n    <lw-button size="xs" variant="secondary">챙긴다 ➔</lw-button>\n  </div>\n</lw-card>`,
        useCase: '던전 클리어 보상 및 전리품 획득 바텀시트',
        realWorldLocation: 'collection/items/loot-claim-card',
      },
    ],
  },
  {
    id: 'narrative-scene',
    name: 'Narrative & Scene Incident',
    nameKo: '스토리 서사 & 인카운터 씬 카드',
    icon: '📖',
    description: '기·승·전·결 4국면 서사 단락, 신문 배틀 기록, 시나리오 퀘스트 사건 카드',
    countApprox: 152,
    percentage: 18.5,
    colorTone: '#3b82f6',
    items: [
      {
        id: 'card-story-paragraph',
        name: '기승전결 4국면 서사 단락 카드',
        description: '서사 밸런스 비율 및 국면별 문단 텍스트를 담아내는 다층 구조 카드',
        familyId: 'narrative-scene',
        variant: 'glass',
        layout: 'stack',
        elevation: 'md',
        size: 'md',
        interactive: true,
        title: '제1막 · 2단락 [承 (승)]',
        subtitle: '문파 연무장의 결투와 은밀한 밀서',
        badge: '단락 완료',
        badgeTone: 'neutral',
        bodySnippet: '새벽 안개가 걷히기 전, 연무장에 들어선 설아는 등 뒤에서 들려오는 낯선 기척에 검을 뽑아 들었다...',
        metaFooter: '분량 1,240자 · 인카운터: [연무장 비무] 연동',
        icon: '📑',
        htmlSnippet: `<lw-card variant="glass" layout="stack" [interactive]="true" size="md">\n  <header>제1막 · 2단락 [承]</header>\n  <p>새벽 안개가 걷히기 전...</p>\n  <footer>분량 1,240자</footer>\n</lw-card>`,
        useCase: '스토리 단락 관리자 및 서사 진행 뷰어',
        realWorldLocation: 'collection/items/story-paragraph-card',
      },
      {
        id: 'card-newspaper-battle',
        name: '신문 배틀 헤드라인 카드',
        description: '전투 결과와 승패 로그를 신문 기사 형식으로 요약 렌더링하는 카드',
        familyId: 'narrative-scene',
        variant: 'outlined',
        layout: 'stack',
        elevation: 'sm',
        size: 'sm',
        interactive: false,
        title: '대혈투 끝에 북해빙궁 정찰대 섬멸',
        subtitle: '전투 결과: 대승 (Victory)',
        badge: '신문 기사 1면',
        badgeTone: 'danger',
        bodySnippet: '3라운드에 걸친 치열한 공방전 끝에 설아의 빙벽검기가 적장의 퇴로를 차단하며 승리를 거두었다.',
        metaFooter: '피해량 1,850 · 획득 명성 +120',
        icon: '📰',
        htmlSnippet: `<lw-card variant="outlined" layout="stack" size="sm">\n  <div class="news-header"><strong>대혈투 끝에 정찰대 섬멸</strong></div>\n  <p>3라운드에 걸친 치열한 공방전...</p>\n</lw-card>`,
        useCase: '신문 헤드라인 및 주간 사건 보고서 패널',
        realWorldLocation: 'collection/items/newspaper-battle-card',
      },
    ],
  },
  {
    id: 'record-archive',
    name: 'Note & Record Archive',
    nameKo: '메모 & 아카이브 기록 카드',
    icon: '📝',
    description: '사용자가 작성한 메모, 시나리오 스크랩, 저장된 라이브러리 항목, 휴지통 카드',
    countApprox: 128,
    percentage: 15.6,
    colorTone: '#10b981',
    items: [
      {
        id: 'card-note-item',
        name: '시나리오 아이디어 메모 카드',
        description: '태그, 최종 수정 시각, 요약 본문을 컴팩트하게 노출하는 아카이브 카드',
        familyId: 'record-archive',
        variant: 'outlined',
        layout: 'stack',
        elevation: 'sm',
        size: 'sm',
        interactive: true,
        title: '빙결 심법 3권의 전개 복선',
        subtitle: '작성자: 작가 · 폴더: [세계관 설정]',
        badge: '#설정 #복선',
        badgeTone: 'neutral',
        bodySnippet: '주인공이 습득한 한빙검결은 사실 북해빙궁에서 분파된 옛 장로가 봉인해둔 비전이었다는 반전 요소.',
        metaFooter: '수정일 2026-09-12 14:20 · 용량 2.4KB',
        icon: '📌',
        htmlSnippet: `<lw-card variant="outlined" layout="stack" [interactive]="true" size="sm">\n  <header><strong>빙결 심법 3권</strong></header>\n  <p>주인공이 습득한 한빙검결은 사실...</p>\n  <footer>2026-09-12</footer>\n</lw-card>`,
        useCase: '노트 데스크톱/모바일 패널 및 컬렉션 아카이브',
        realWorldLocation: 'collection/items/document-card',
      },
      {
        id: 'card-saved-library',
        name: '저장된 라이브러리 항목 카드',
        description: '클라우드 동기화 상태, 버전 정보 및 저장 장소 배지가 포함된 자산 카드',
        familyId: 'record-archive',
        variant: 'outlined',
        layout: 'row',
        elevation: 'sm',
        size: 'sm',
        interactive: true,
        title: 'Loworld Factory Core Design Token v2',
        subtitle: 'JSON 토큰 번들 · 스키마 동기화 완료',
        badge: '동기화됨',
        badgeTone: 'success',
        bodySnippet: '모노레포 전역 6대 테마의 색상, 타이포그래피, 모서리 곡률 규격이 저장된 마스터 정의서.',
        metaFooter: '버전 v2.4.0 · 소유자: Loworld Ops',
        icon: '💾',
        htmlSnippet: `<lw-card variant="outlined" layout="row" [interactive]="true" size="sm">\n  <span class="icon">💾</span>\n  <div>\n    <strong>Loworld Core Tokens</strong>\n    <lw-badge label="동기화됨" />\n  </div>\n</lw-card>`,
        useCase: '라이브러리 및 프로젝트 템플릿 탐색기',
        realWorldLocation: 'collection/items/saved-library-item',
      },
    ],
  },
  {
    id: 'metric-kpi',
    name: 'Metric & Scoreboard KPI',
    nameKo: '대시보드 KPI & 메트릭 통계 카드',
    icon: '📊',
    description: '수치 요약, 진행률 퍼센트, 게이지, 전수조사 상태를 알리는 대시보드 블록 카드',
    countApprox: 100,
    percentage: 12.2,
    colorTone: '#8b5cf6',
    items: [
      {
        id: 'card-audit-metric-chip',
        name: '전수조사 통계 스코어보드 카드',
        description: '아이콘, 카테고리 라벨, 대형 수치 강조 표기를 컴팩트하게 담는 지표 카드',
        familyId: 'metric-kpi',
        variant: 'elevated',
        layout: 'row',
        elevation: 'sm',
        size: 'xs',
        interactive: false,
        title: '전수조사 카드 총계',
        badge: '820개',
        badgeTone: 'primary',
        bodySnippet: '모노레포 6대 앱 전역에서 발굴된 모든 카드 서피스 인스턴스 전수조사 완료.',
        metaFooter: '공통화율 38.4% (315개) ➔ 100% 통합 진행 중',
        icon: '🃏',
        htmlSnippet: `<lw-card variant="elevated" layout="row" size="xs">\n  <span class="icon">🃏</span>\n  <div>\n    <span class="label">전수조사 카드 총계</span>\n    <strong class="value">820개</strong>\n  </div>\n</lw-card>`,
        useCase: '쇼케이스 포털 헤더 스코어보드 및 대시보드 KPI 패널',
        realWorldLocation: 'library/all-components',
      },
      {
        id: 'card-system-health',
        name: '시스템 무결성 상태 카드',
        description: '번들 사이즈, 빌드 상태 및 제로 에러 지표를 모니터링하는 현황 카드',
        familyId: 'metric-kpi',
        variant: 'outlined',
        layout: 'row',
        elevation: 'none',
        size: 'sm',
        interactive: false,
        title: '컴파일 무결성 & 타입 안정성',
        badge: '정상 (0 Error)',
        badgeTone: 'success',
        bodySnippet: 'loworld-ui 6개 라이브러리 패키지 빌드 및 monorepo ng-typecheck 통과.',
        metaFooter: '최종 빌드 검증: 2026-09-12 16:40 KST',
        icon: '⚡',
        htmlSnippet: `<lw-card variant="outlined" layout="row" size="sm">\n  <span class="icon">⚡</span>\n  <div>\n    <strong>컴파일 무결성</strong>\n    <span class="desc">타입 검사 0 Error 통과</span>\n  </div>\n</lw-card>`,
        useCase: '개발 도구 패널 및 팩토리 시스템 상태 뷰어',
        realWorldLocation: 'lib/develop/story-entropy',
      },
    ],
  },
  {
    id: 'showcase-tile',
    name: 'Showcase & Navigation Tile',
    nameKo: '쇼케이스 내비게이션 & 스펙 타일',
    icon: '🧭',
    description: '쇼케이스 첫 화면 컴포넌트 타일 그리드, 규격 가이드 및 빠른 이동 카드',
    countApprox: 82,
    percentage: 10.1,
    colorTone: '#06b6d4',
    items: [
      {
        id: 'card-component-tile',
        name: '쇼케이스 원자 컴포넌트 타일',
        description: '컴포넌트 명칭, 참조 횟수, 상태 및 바로가기 액션을 제공하는 정사각/와이드 타일',
        familyId: 'showcase-tile',
        variant: 'glass',
        layout: 'stack',
        elevation: 'md',
        size: 'md',
        interactive: true,
        title: 'LwButtonComponent',
        subtitle: '1,614 references across workspace',
        badge: 'Core Primitive',
        badgeTone: 'primary',
        bodySnippet: '모노레포의 모든 클릭 상호작용 소자를 책임지는 8대 스타일 단일 불변 버튼.',
        metaFooter: '경로: primitives/form/button · 규격 완비',
        icon: '🔘',
        htmlSnippet: `<lw-card variant="glass" layout="stack" [interactive]="true" size="md">\n  <strong>LwButtonComponent</strong>\n  <p>1,614 references</p>\n</lw-card>`,
        useCase: '쇼케이스 메인 데스크톱 탐색 타일 그리드',
        realWorldLocation: 'library/component-tile-grid',
      },
      {
        id: 'card-guide-doc',
        name: '디자인 가이드라인 문서 카드',
        description: '3-Tier CSS 토큰 규칙 및 테마 오버라이드 거버넌스 문서를 안내하는 카드',
        familyId: 'showcase-tile',
        variant: 'outlined',
        layout: 'stack',
        elevation: 'sm',
        size: 'sm',
        interactive: true,
        title: '불변 토큰 쉴드 & 테마 브리지 가이드',
        subtitle: 'docs/10-dev-logs/2026-09-12',
        badge: '공식 가이드',
        badgeTone: 'neutral',
        bodySnippet: '하위 로컬 SCSS에서의 임의 오버라이드를 방어하고 일관된 테마 가독성을 유지하는 설계.',
        metaFooter: '작성일: 2026-09-12 · 최종 승인 완료',
        icon: '📜',
        htmlSnippet: `<lw-card variant="outlined" layout="stack" [interactive]="true" size="sm">\n  <strong>불변 토큰 쉴드 가이드</strong>\n  <p>docs/10-dev-logs/...</p>\n</lw-card>`,
        useCase: '설계 문서 탐색기 및 가이드 탭',
        realWorldLocation: 'docs/10-dev-logs/2026-09-12',
      },
    ],
  },
];

export const CARD_API_CHEATSHEET: CardApiProp[] = [
  {
    name: 'variant',
    type: "'outlined' | 'elevated' | 'flat' | 'glass'",
    defaultValue: "'outlined'",
    description: '카드의 시각적 룩앤필 및 테두리/그림자/블러 효과를 결정합니다.',
  },
  {
    name: 'layout',
    type: "'stack' | 'row' | 'tile' | 'custom'",
    defaultValue: "'stack'",
    description: '내부 요소 배치 흐름(세로 적층, 가로 분할, 정사각 타일 등)을 지정합니다.',
  },
  {
    name: 'elevation',
    type: "'none' | 'sm' | 'md' | 'lg'",
    defaultValue: "'sm'",
    description: '카드의 z축 그림자 깊이를 제어합니다.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg'",
    defaultValue: "'md'",
    description: '카드의 내부 기본 패딩 및 폰트 크기 스케일을 제어합니다.',
  },
  {
    name: 'interactive',
    type: 'boolean',
    defaultValue: 'false',
    description: 'true 시 마우스 호버 리프트, 부드러운 하이라이트 및 포커스 링 인터랙션이 활성화됩니다.',
  },
  {
    name: 'selected',
    type: 'boolean',
    defaultValue: 'false',
    description: 'true 시 테마별 액센트 링 및 선택 배경색이 적용됩니다.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'true 시 반투명 비활성화 스타일이 적용되며 모든 클릭 이벤트가 차단됩니다.',
  },
  {
    name: 'noPadding',
    type: 'boolean',
    defaultValue: 'false',
    description: '카드 자체의 기본 내부 여백을 0으로 만들어 풀블리드 미디어 커버를 수용할 수 있게 합니다.',
  },
  {
    name: 'actionId',
    type: 'string',
    defaultValue: 'undefined',
    description: '카드 클릭 시 발송되는 actionEvent의 식별자입니다.',
  },
];
