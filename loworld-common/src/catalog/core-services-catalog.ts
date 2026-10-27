export interface CoreServiceMeta {
  id: string;
  name: string;
  category: 'screen-height' | 'theme' | 'overlay-dialog' | 'feedback' | 'engine';
  categoryLabel: string;
  description: string;
  importedFrom: string;
  codeSnippet: string;
  keyFeatures: string[];
}

export const CORE_SERVICES_CATALOG: CoreServiceMeta[] = [
  {
    id: 'lw-height-analyzer-service',
    name: 'LW_VIEWPORT & LwHeightAnalyzerService',
    category: 'screen-height',
    categoryLabel: '화면 높이 & 반응형 유틸리티',
    description: '동적 화면 높이(vh, dvh) 연산 및 모바일/태블릿/데스크톱 반응형 중단점 자동 감지 서비스.',
    importedFrom: "import { LW_VIEWPORT, LwHeightAnalyzerService } from 'loworld-ui/core';",
    codeSnippet: `// 1. 지금 놓인 화면 조회 (브라우저 창. 시뮬레이터 안에서는 그 화면)
private readonly viewport = inject(LW_VIEWPORT);
readonly isPhone = computed(() => this.viewport.formFactor() === 'phone');     // 768px 이하
readonly isDesktop = computed(() => this.viewport.formFactor() === 'desktop'); // 1024px 이상

// 2. 높이 그룹 재계산
inject(LwHeightAnalyzerService).recalculateGroup('my-layout-group');`,
    keyFeatures: [
      '모바일 브라우저 주소창 숨김/노출 시 dvh 높이 튐 현상 방지',
      '0-Blocking Main Looper 패턴으로 프레임 드랍 없는 높이 추적',
      'Media Query Listener 자동 등록 및 컴포넌트 해제 시 cleanup'
    ]
  },
  {
    id: 'lw-theme-store',
    name: 'LwThemeStore (Theme Manager)',
    category: 'theme',
    categoryLabel: '다크모드 & 테마 관리자',
    description: '애플리케이션 전역 다크모드/라이트모드 동기화 및 CSS 변수 바인딩 스토어.',
    importedFrom: "import { LwThemeStore } from 'loworld-ui/core';",
    codeSnippet: `// 1. 컴포넌트 내 주입
private readonly themeStore = inject(LwThemeStore);

// 2. 테마 모드 조회 (Signal)
readonly currentTheme = this.themeStore.mode; // 'light' | 'dark'

// 3. 테마 전환
this.themeStore.setMode('dark'); // [attr.data-lw-theme="dark"] 자동으로 HTML 노드 바인딩`,
    keyFeatures: [
      '라이트/다크 테마 원클릭 즉시 전환 및 상태 동기화',
      'LocalStorage 자동 영구 보존 및 새로고침 시 플리커 없는 즉시 복원',
      '단일 HTML attribute [data-lw-theme] 설정으로 전역 CSS 변수 일체 전환'
    ]
  },
  {
    id: 'lw-ui-feedback-service',
    name: 'LwUiFeedbackService (Confirm & Alert Facade)',
    category: 'feedback',
    categoryLabel: 'Confirm & Alert 다이얼로그 파사드',
    description: '전역 Confirm / Alert 대화상자를 프로그래밍 async/await 방식으로 간편하게 호출하는 전역 피드백 파사드.',
    importedFrom: "import { LwUiFeedbackService } from 'loworld-ui/core';",
    codeSnippet: `private readonly ui = inject(LwUiFeedbackService);

// 1. Confirm 확인 모달 (Async/Await)
const confirmed = await this.ui.confirm({
  title: '캐릭터 삭제 확인',
  message: '정말로 방랑자 캐릭터를 삭제하시겠습니까?',
  detail: '삭제된 캐릭터 데이터는 복구되지 않습니다.',
  confirmLabel: '삭제',
  tone: 'danger'
});

// 2. Alert 단순 알림 팝업
await this.ui.alert({
  title: '저장 완료',
  message: '성공적으로 저장되었습니다.'
});`,
    keyFeatures: [
      'Async / Await 지원으로 콜백 헬 없는 직관적인 코드 흐름',
      'Danger tone 지원으로 삭제/파손 액션 시 크림슨 레디언트 디자인 제공',
      'Unmounted 호스트 방지 기능 (hostCount === 0 시 globalThis.confirm 안전 폴백)'
    ]
  },
  {
    id: 'lw-dialog-service',
    name: 'LwDialogService (Overlay Manager)',
    category: 'overlay-dialog',
    categoryLabel: '오버레이 & 다이얼로그 서비스',
    description: '프로그래밍 방식의 오버레이 팝업 생성, 키보드 ESC 닫기 및 포커스 트랩 통합 관리 서비스.',
    importedFrom: "import { LwDialogService } from 'loworld-ui/core';",
    codeSnippet: `private readonly dialog = inject(LwDialogService);

// 팝업 열기
const dialogRef = this.dialog.openModal(MyCustomDialogComponent, {
  data: { userId: 'user-123' },
  size: 'md'
});

// 결과 수신
dialogRef.closed.pipe(take(1)).subscribe(result => {
  console.log('팝업 반환 데이터:', result);
});`,
    keyFeatures: [
      'DOM 수평 텔레포트(Overlay Container)로 z-index 스태킹 문제 완전 해결',
      'Dismissible Directive 내장으로 바깥 클릭/ESC 키 자동 처리',
      'Typed Data Injection 지원으로 안전한 프롭 전달'
    ]
  },
  {
    id: 'save-feedback-service',
    name: 'SaveFeedbackService (Async Notification)',
    category: 'feedback',
    categoryLabel: '비동기 피드백 & 토스트 알림',
    description: '백엔드 통신, Firestore 저장, 로컬 변경사항 저장 시 성공/실패 토스트 및 피드백 셸 연동 서비스.',
    importedFrom: "import { SaveFeedbackService } from 'loworld-ui/core';",
    codeSnippet: `private readonly feedback = inject(SaveFeedbackService);

// 저장 성공 알림
this.feedback.notifySuccess('설정이 성공적으로 저장되었습니다.');

// 저장 실패 알림
this.feedback.notifyError('네트워크 오류로 저장에 실패했습니다.');`,
    keyFeatures: [
      '연속 동일 메시지 수신 시 timestamp 자동 재트리거',
      '자동 파기(Auto dismiss 3000ms) 및 마우스 호버 시 일시 정지',
      'Accessibility ARIA Live region 스펙 준수'
    ]
  },
  {
    id: 'narrative-play-facade',
    name: 'NarrativePlayFacadeService (Engine Facade)',
    category: 'engine',
    categoryLabel: '도메인 시나리오 파사드 엔진',
    description: '인터랙티브 소설 리더 본문 렌더링, 선택지 진입, 아이템 획득 및 전투 상태 통합 파사드 엔진.',
    importedFrom: "import { NarrativePlayFacadeService } from 'loworld-ui/core';",
    codeSnippet: `private readonly narrative = inject(NarrativePlayFacadeService);

// 선택지 클릭
this.narrative.selectChoice(choiceId);

// 현재 챕터 및 전투 파라미터 조회
readonly scene = this.narrative.currentScene;
readonly battle = this.narrative.battleState;`,
    keyFeatures: [
      '복잡한 서사 엔진(Narrative Engine)의 단일 접점 Facade 패턴 제공',
      'Signal 기반 불변 State 반환으로 템플릿 변경 감지 최적화',
      '전투 조우 및 아이템 스태시 자동 상태 동기화'
    ]
  }
];
