export interface ArchitectureGuideMeta {
  id: string;
  title: string;
  category: 'layer' | 'export' | 'signal' | 'theme';
  categoryLabel: string;
  summary: string;
  guidelines: string[];
}

export const ARCHITECTURE_GUIDES_CATALOG: ArchitectureGuideMeta[] = [
  {
    id: 'component-layer-hierarchy',
    title: '4단계 컴포넌트 계층 규격 (Component Layers Rule)',
    category: 'layer',
    categoryLabel: '컴포넌트 계층 구조',
    summary: 'LoworldUI의 모든 시각적 요소는 역할과 재사용성에 따라 4단계 계층으로 엄격히 구분됩니다.',
    guidelines: [
      '1. Primitive (기초 소자): 상태나 도메인 지식이 없는 가장 작고 유연한 기초 소자 (LwButton, LwChip, LwBadge, LwInput, LwModalFrame)',
      '2. Composite (기능 부품): 특정 시각 패턴이나 기능이 조합된 부품 (LwItemTooltip, LwCodexCategoryRow, LwStepProgress)',
      '3. Container (비즈니스 판): 데이터 바인딩 및 비즈니스 로직을 주입받아 도메인 뷰를 형성하는 컴포넌트 (LwRpgCharacterDetailPanelComponent, LwUnifiedCodexSidebarPanel)',
      '4. Shell (조립 셸): 앱 전체 레이아웃과 크롬, 헤더, 사이드바를 총괄하는 상위 레이아웃 셸 (LwStudyShell, LwNovelDesktopShell)'
    ]
  },
  {
    id: 'barrel-export-structure',
    title: '모듈 수출 패키지 규격 (Barrel Export Rule)',
    category: 'export',
    categoryLabel: '패키지 수출 구조',
    summary: '컴포넌트 및 서비스의 import 경로는 도메인/계층에 따라 지정된 엔트리 포인트를 통해 사용해야 합니다.',
    guidelines: [
      "import { ... } from 'loworld-ui/core';  // 엔직, 모델, 데이터셋, 유틸 서비스",
      "import { ... } from 'loworld-ui/primitives'; // 기초 소자 컴포넌트",
      "import { ... } from 'loworld-ui/collection'; // 패널, 리스트, 카드 컬렉션 컴포넌트",
      "import { ... } from 'loworld-ui/surface'; // 서사, 캘린더 등 종합 워크스페이스 컴포넌트"
    ]
  },
  {
    id: 'signal-state-rule',
    title: 'Signal 기반 상태 관리 규격 (Signal First Rule)',
    category: 'signal',
    categoryLabel: '상태 관리 가이드',
    summary: '모든 상태는 Angular Signals(signal, computed, input)를 우선으로 작성하며, 메인 스레드 블로킹을 금지합니다.',
    guidelines: [
      '1. Component Inputs: @Input() 대신 input(), input.required() 사용',
      '2. Derived State: 파생 상태 연산 시 즉각 파생되는 computed() 시그널 활용',
      '3. 0-Blocking Policy: Main UI 스레드를 차단하는 동기 대기(webLatch.await 등) 완전 금지',
      '4. Safe Cleanup: OnDestroy 시 MediaMatcher listener 및 Async timer 핸들러 반드시 해제'
    ]
  }
];
