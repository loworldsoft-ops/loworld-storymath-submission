import type { ComponentMeta, PlatformSupportType, AdaptivePlatformSpec } from '../services/models/os.types';

/**
 * 📱🖥️ LoworldUI 전수조사 기반 플랫폼 지원 명세 사전
 * 전수조사 실측 데이터(Desktop 22개, Mobile 45개, Adaptive 12개, Shared 355개) 기반
 */
export const PLATFORM_CENSUS_SPEC_MAP: Record<string, Partial<AdaptivePlatformSpec>> = {
  // ── 🖥️ 데스크톱 전용 컴포넌트 (Desktop Only) ──
  'lw-os-desktop-surface': {
    supportType: 'desktop-only',
    headlessController: 'OverviewWindowManagerService',
    desktopSpec: {
      presenterComponent: 'OverviewDesktopSurfaceComponent',
      layoutType: 'standard',
      interactions: ['바탕화면 우클릭 컨텍스트 메뉴', '아이콘 드래그 & 드롭', '러버밴드 다중 선택', '단축키 런처'],
    },
    keyDifferences: [
      '데스크톱 윈도우 OS 모티프의 대화면 캔버스 및 파일/앱 아이콘 그리드 배치 제공',
      '모바일에서는 스프링보드 터치 그리드(OverviewMobileHomeComponent)로 대체됨',
    ],
  },
  'lw-os-taskbar': {
    supportType: 'desktop-only',
    headlessController: 'OverviewWindowManagerService',
    desktopSpec: {
      presenterComponent: 'OverviewTaskbarComponent',
      layoutType: 'standard',
      interactions: ['시작 메뉴 토글', '활성 창 썸네일 미리보기', '시스템 트레이 제어'],
    },
    keyDifferences: [
      'Windows 11 모티프 하단 작업표시줄로 멀티태스킹 윈도우 탭을 관리',
      '모바일에서는 하단 4슬롯 독(OverviewMobileDock) 및 제스처 바텀바로 대체',
    ],
  },
  'lw-os-window-frame': {
    supportType: 'desktop-only',
    headlessController: 'OverviewWindowManagerService',
    desktopSpec: {
      presenterComponent: 'OverviewWindowFrameComponent',
      layoutType: 'modal-window',
      interactions: ['8방향 테두리 리사이즈', '타이틀바 드래그 이동', '최소화/최대화/복원 캡슐 애니메이션'],
    },
    keyDifferences: [
      '다중 윈도우 겹침(Cascade), 스냅 레이아웃, 크기 조절을 완벽히 지원하는 데스크톱 창 프레임',
      '모바일에서는 단일 풀스크린 뷰포트로 전환되어 윈도우 프레임이 생략됨',
    ],
  },
  'lw-os-window-fullscreen-capsule': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'OverviewWindowFullscreenCapsuleComponent',
      layoutType: 'floating-panel',
      interactions: ['화면 최상단 마우스 진입 시 슬라이드 다운', '창 복원 및 닫기'],
    },
    keyDifferences: ['데스크톱 창 전체화면 모드 시 상단 플로팅 복원 컨트롤러'],
  },
  'lw-os-start-panel': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'OverviewStartPanelComponent',
      layoutType: 'floating-panel',
      interactions: ['검색 필터', '고정 앱 그리드 클릭', '최근 항목 탐색', 'ESC 닫기'],
    },
    keyDifferences: ['Windows 시작 메뉴 스타일 플로팅 런처 패널'],
  },
  'lw-os-explorer-window': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'OverviewExplorerWindowComponent',
      layoutType: '3-pane',
      interactions: ['좌측 폴더 트리 탐색', '경로 주소창 입력', '아이콘/상세 목록 뷰 전환'],
    },
    keyDifferences: ['데스크톱 전용 파일/도메인 탐색기 창'],
  },
  'lw-workspace-desktop-shell': {
    supportType: 'desktop-only',
    headlessController: 'LwWorkspaceDesktopStore',
    desktopSpec: {
      presenterComponent: 'LwWorkspaceDesktopShellComponent',
      layoutType: '3-pane',
      interactions: ['3단 컬럼 리사이즈 분할', '문서 다중 선택', '마우스 호버 툴바'],
    },
    keyDifferences: [
      '좌측 폴더 트리, 중앙 노트 목록, 우측 본문 에디터가 한눈에 펼쳐지는 3-Pane 대화면 셸',
      '모바일에서는 단일 화면 전환형(LwWorkspaceMobileShell)으로 분기',
    ],
  },
  'lw-workspace-desktop-layout': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'LwAppFrameComponent',
      layoutType: '3-pane',
      interactions: ['슬롯별 너비 조정 및 접기/펼치기'],
    },
    keyDifferences: ['3열 데스크톱 슬롯 분할 레이아웃 컴포넌트'],
  },
  'lw-study-desktop-presenter': {
    supportType: 'desktop-only',
    headlessController: 'STUDY_SHELL_HOST',
    desktopSpec: {
      presenterComponent: 'LwStudyDesktopPresenterComponent',
      layoutType: '3-pane',
      interactions: ['좌측 멤버 목록 + 중앙 상태/상세 + 우측 인벤토리 대화면 분할'],
    },
    keyDifferences: ['과제/스터디 도메인의 데스크톱 3단 대화면 전용 Presenter (SOLID SRP 분리 완료)'],
  },
  'lw-strategy-desktop-presenter': {
    supportType: 'desktop-only',
    headlessController: 'STRATEGY_SHELL_HOST',
    desktopSpec: {
      presenterComponent: 'LwStrategyDesktopPresenterComponent',
      layoutType: '3-pane',
      interactions: ['좌측 룬 카탈로그 + 중앙 소켓 시뮬레이터 + 우측 빌드 인스펙터'],
    },
    keyDifferences: ['플랜/전략 도메인의 데스크톱 3단 대화면 전용 Presenter (SOLID SRP 분리 완료)'],
  },
  'lw-workspace-canvas-desktop-shell': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'LwWorkspaceCanvasDesktopShellComponent',
      layoutType: 'standard',
      interactions: ['7슬롯 도구상자 + 줌/팬 캔버스 워크스페이스'],
    },
    keyDifferences: ['캔버스 샌드박스의 데스크톱 전용 7슬롯 레이아웃 셸'],
  },
  'lw-document-recording-bar': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'LwDesktopRecordingBarComponent',
      layoutType: 'floating-panel',
      interactions: ['가로형 오디오 파형 렌더링 및 타임라인 스크럽'],
    },
    keyDifferences: ['데스크톱 에디터 상단/하단 가로형 고정 음성 녹음 툴바'],
  },
  'lw-document-drawing-panel': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'LwDesktopDrawingPanelComponent',
      layoutType: 'standard',
      interactions: ['마우스 드래그 자유 곡선 드로잉', '브러시 굵기/색상 팔레트'],
    },
    keyDifferences: ['데스크톱 전용 인라인 캔버스 드로잉 도구 패널'],
  },
  'lw-chronicle-modal': {
    supportType: 'desktop-only',
    desktopSpec: {
      presenterComponent: 'LwChronicleModalComponent',
      layoutType: 'modal-window',
      interactions: ['대형 모달 윈도우 연대기 타임라인 브라우징'],
    },
    keyDifferences: ['데스크톱 윈도우 화면에 최적화된 대형 연대기 모달'],
  },

  // ── 📱 모바일 전용 컴포넌트 (Mobile Only) ──
  'lw-os-mobile-shell': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'OverviewMobileShellComponent',
      layoutType: '1-pane-dock',
      interactions: ['하드웨어 노치/다이내믹 아일랜드 렌더링', '물리 베젤 및 안전 영역(Safe-Area) 시뮬레이션'],
    },
    keyDifferences: [
      '스마트폰 디바이스 외형(아이폰/갤럭시) 하드웨어 베젤 및 반응형 뷰포트 컨테이너',
    ],
  },
  'lw-os-mobile-scene': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'OverviewMobileSceneComponent',
      layoutType: '1-pane-dock',
      interactions: ['스와이프 화면 전환', '상단 상태표시줄(Status Bar)', '가상 키보드 패딩 대응'],
    },
    keyDifferences: ['모바일 OS 내부 화면 렌더링 및 상태바/홈인디케이터 관리'],
  },
  'lw-os-mobile-home': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'OverviewMobileHomeComponent',
      layoutType: '1-pane-dock',
      interactions: ['터치 앱 아이콘 실행', '좌우 페이지 스와이프 제스처', '위젯 타일 표시'],
    },
    keyDifferences: ['iOS/Android 모바일 스프링보드 홈 화면'],
  },
  'lw-os-mobile-dock': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'OverviewMobileDockComponent',
      layoutType: '1-pane-dock',
      interactions: ['엄지 영역 4슬롯 퀵 런처', '터치 진동 피드백'],
    },
    keyDifferences: ['스마트폰 하단 고정 4개 주요 앱 터치 독'],
  },
  'lw-os-mobile-bottom-bar': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'OverviewMobileBottomBarComponent',
      layoutType: '1-pane-dock',
      interactions: ['플로팅 OS 전환 시트 열기', '스마트폰 기종 실시간 변경'],
    },
    keyDifferences: ['모바일 OS 모드 전환 및 디바이스 기종 변경을 위한 하단 플로팅 컨트롤 바'],
  },
  'lw-workspace-mobile-shell': {
    supportType: 'mobile-only',
    headlessController: 'LwWorkspaceMobileStore',
    mobileSpec: {
      presenterComponent: 'LwWorkspaceMobileShellComponent',
      layoutType: '1-pane-dock',
      interactions: ['1-Pane 전체화면 뷰 전환', '하단 액션 플로팅 버튼(FAB)', '터치 백 제스처'],
    },
    keyDifferences: [
      '대화면 3단 컬럼 대신 단일 화면 스택 탐색 및 풀스크린 에디터 제공',
    ],
  },
  'lw-study-mobile-presenter': {
    supportType: 'mobile-only',
    headlessController: 'STUDY_SHELL_HOST',
    mobileSpec: {
      presenterComponent: 'LwStudyMobilePresenterComponent',
      layoutType: '1-pane-dock',
      interactions: ['단일 화면 탭 전환 + 하단 액션 시트 + 모바일 풀스크린 멤버 뷰'],
    },
    keyDifferences: ['과제/스터디 도메인의 모바일 터치 최적화 1-Pane Presenter (SOLID SRP 분리 완료)'],
  },
  'lw-strategy-mobile-presenter': {
    supportType: 'mobile-only',
    headlessController: 'STRATEGY_SHELL_HOST',
    mobileSpec: {
      presenterComponent: 'LwStrategyMobilePresenterComponent',
      layoutType: '1-pane-dock',
      interactions: ['모바일 탭 바 + 룬워드 바텀시트 + 터치 소켓 선택기'],
    },
    keyDifferences: ['플랜/전략 도메인의 모바일 터치 최적화 1-Pane Presenter (SOLID SRP 분리 완료)'],
  },
  'lw-story-mobile-dock': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwStoryMobileDockComponent',
      layoutType: '1-pane-dock',
      interactions: ['엄지 도달 영역 4개 퀵 액션 트리거'],
    },
    keyDifferences: ['소설 모바일 화면 하단 고정 액션 독'],
  },
  'lw-play-quest-sheet': {
    supportType: 'mobile-only',
    headlessController: 'StoryPlayCrossPlatformController',
    mobileSpec: {
      presenterComponent: 'LwStoryPlayQuestSheetComponent',
      layoutType: 'bottom-sheet',
      interactions: ['하단 스와이프 업/다운 제스처', '퀘스트 수락 및 보상 수령 터치'],
    },
    keyDifferences: ['데스크톱 우측 인스펙터 퀘스트 뷰를 모바일 전용 제스처 바텀시트로 구현'],
  },
  'lw-story-equipment-sheet': {
    supportType: 'mobile-only',
    headlessController: 'StoryPlayCrossPlatformController',
    mobileSpec: {
      presenterComponent: 'LwStoryEquipmentSheetComponent',
      layoutType: 'bottom-sheet',
      interactions: ['인벤토리 아이템 탭 장착', '상세 스탯 비교 팝오버'],
    },
    keyDifferences: ['모바일 전용 장비 및 인벤토리 관리 바텀시트'],
  },
  'lw-story-cube-sheet': {
    supportType: 'mobile-only',
    headlessController: 'StoryPlayCrossPlatformController',
    mobileSpec: {
      presenterComponent: 'LwStoryCubeSheetComponent',
      layoutType: 'bottom-sheet',
      interactions: ['큐브 합성 슬롯 터치 등록', '합성 애니메이션 피드백'],
    },
    keyDifferences: ['모바일 전용 호라드릭 큐브 조합 바텀시트'],
  },
  'lw-story-character-detail-sheet': {
    supportType: 'mobile-only',
    headlessController: 'StoryPlayCrossPlatformController',
    mobileSpec: {
      presenterComponent: 'LwStoryCharacterDetailSheetComponent',
      layoutType: 'bottom-sheet',
      interactions: ['스탯 포인트 터치 분배', '캐릭터 프로필 상세 열람'],
    },
    keyDifferences: ['모바일 전용 캐릭터 스탯 및 프로필 상세 바텀시트'],
  },
  'lw-document-mobile-collection': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentMobileCollectionPanelComponent',
      layoutType: '1-pane-dock',
      interactions: ['모바일 카드 리스트 스크롤', '풀-투-리프레시', '스와이프 삭제'],
    },
    keyDifferences: ['모바일 터치 환경에 맞춘 대형 터치 타겟 노트 카드 목록'],
  },
  'lw-document-mobile-editor': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentMobileEditorComponent',
      layoutType: 'fullscreen-page',
      interactions: ['가상 키보드 연동 툴바', '음성 입력 원터치 트리거'],
    },
    keyDifferences: ['모바일 가상 키보드 높이에 맞추어 동적 패딩이 적용되는 풀스크린 에디터'],
  },
  'lw-document-mobile-editor-toolbar': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentMobileEditorToolbarComponent',
      layoutType: '1-pane-dock',
      interactions: ['가상 키보드 상단 터치 포맷 버튼'],
    },
    keyDifferences: ['모바일 가상 키보드 윗단에 고정되는 터치 서식 툴바'],
  },
  'lw-document-mobile-viewer': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentMobileViewerComponent',
      layoutType: 'fullscreen-page',
      interactions: ['전체화면 읽기 모드', '상단 내비게이션 바 숨김/표시'],
    },
    keyDifferences: ['모바일 한 손 독서에 최적화된 풀스크린 마크다운 뷰어'],
  },
  'lw-document-settings-screen': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentSettingsScreenComponent',
      layoutType: 'fullscreen-page',
      interactions: ['모바일 네이티브 스타일 전체화면 설정 페이지'],
    },
    keyDifferences: ['데스크톱 모달 다이얼로그 대신 전체화면 페이지 전환으로 설정 제공'],
  },
  'lw-document-password-lock-screen': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentPasswordLockScreenComponent',
      layoutType: 'fullscreen-page',
      interactions: ['4자리 PIN 터치 키패드', '지문/Face ID 애니메이션'],
    },
    keyDifferences: ['모바일 전용 PIN 잠금 해제 풀스크린'],
  },
  'lw-document-fab': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentFabComponent',
      layoutType: '1-pane-dock',
      interactions: ['우측 하단 엄지 플로팅 버튼', '스피드 다이얼 메뉴 확장'],
    },
    keyDifferences: ['모바일 화면 우측 하단 플로팅 액션 버튼 (신규 메모/녹음)'],
  },
  'lw-document-more-panel': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDocumentMorePanelComponent',
      layoutType: 'bottom-sheet',
      interactions: ['하단 슬라이드 시트 메뉴', '공유/내보내기/삭제 액션'],
    },
    keyDifferences: ['모바일 추가 옵션 바텀 슬라이드 메뉴'],
  },
  'lw-drawing-pad': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwDrawingPadComponent',
      layoutType: 'fullscreen-page',
      interactions: ['터치 및 스타일러스 펜 압력 감지 드로잉'],
    },
    keyDifferences: ['모바일 터치/펜 입력에 맞춘 풀스크린 손글씨 패드'],
  },
  'lw-workspace-canvas-mobile-shell': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwWorkspaceCanvasMobileShellComponent',
      layoutType: '1-pane-dock',
      interactions: ['핀치 투 줌', '2핑거 팬 제스처', '접이식 도구 바텀독'],
    },
    keyDifferences: ['모바일 제스처 최적화 캔버스 6슬롯 레이아웃 셸'],
  },
  'lw-bottom-sheet-slider': {
    supportType: 'mobile-only',
    mobileSpec: {
      presenterComponent: 'LwBottomSheetSliderComponent',
      layoutType: 'bottom-sheet',
      interactions: ['3단 높이 스냅 (Collapsed / Half / Expanded)', '상단 드래그 핸들'],
    },
    keyDifferences: ['터치 제스처로 높이를 조절하는 범용 모바일 바텀시트 슬라이더'],
  },

  // ── 🔄 적응형 / Coordinator 셸 (Adaptive Shells) ──
  'lw-study-shell': {
    supportType: 'adaptive',
    headlessController: 'STUDY_SHELL_HOST',
    desktopSpec: {
      presenterComponent: 'LwStudyDesktopPresenterComponent',
      layoutType: '3-pane',
      interactions: ['대화면 3단 컬럼 분할', '파티원 상태 및 인벤토리 동시 노출'],
    },
    mobileSpec: {
      presenterComponent: 'LwStudyMobilePresenterComponent',
      layoutType: '1-pane-dock',
      interactions: ['단일 화면 탭 전환 + 하단 모바일 바텀시트 오버레이'],
    },
    keyDifferences: [
      '단일 Coordinator 셸이 STUDY_SHELL_HOST 계약을 통해 데스크톱/모바일 전용 Presenter에 상태를 위임',
    ],
  },
  'lw-strategy-shell': {
    supportType: 'adaptive',
    headlessController: 'STRATEGY_SHELL_HOST',
    desktopSpec: {
      presenterComponent: 'LwStrategyDesktopPresenterComponent',
      layoutType: '3-pane',
      interactions: ['좌측 룬 카탈로그 + 중앙 소켓 시뮬레이터 + 우측 빌드 인스펙터'],
    },
    mobileSpec: {
      presenterComponent: 'LwStrategyMobilePresenterComponent',
      layoutType: '1-pane-dock',
      interactions: ['모바일 탭 바 + 룬워드 바텀시트 + 터치 소켓 선택기'],
    },
    keyDifferences: [
      '단일 Coordinator 셸이 STRATEGY_SHELL_HOST 계약을 통해 데스크톱/모바일 전용 Presenter에 상태를 위임',
    ],
  },
  'lw-schedule-desktop-shell': {
    supportType: 'adaptive',
    headlessController: 'LwScheduleStore',
    desktopSpec: {
      presenterComponent: 'LwScheduleDesktopShellComponent (Desktop Mode)',
      layoutType: '3-pane',
      interactions: ['좌측 고정 미니 캘린더 사이드바 + 중앙 대형 월간 그리드'],
    },
    mobileSpec: {
      presenterComponent: 'LwScheduleDesktopShellComponent (Mobile Mode)',
      layoutType: '1-pane-dock',
      interactions: ['사이드바를 모바일 슬라이드 드로어로 자동 전환 + 일정 목록 바텀시트'],
    },
    keyDifferences: [
      'isMobile 신호에 따라 사이드바가 고정 컬럼에서 모바일 슬라이드 드로어로 반응형 변형',
    ],
  },
  'lw-develop-shell': {
    supportType: 'adaptive',
    desktopSpec: {
      presenterComponent: 'LwDevelopShellComponent (Desktop Mode)',
      layoutType: '3-pane',
      interactions: ['좌측 고정 내비게이션 레일 + 중앙 샌드박스 + 우측 코드 뷰어'],
    },
    mobileSpec: {
      presenterComponent: 'LwDevelopShellComponent (Mobile Mode)',
      layoutType: '1-pane-dock',
      interactions: ['레일을 햄버거 터치 드로어로 전환 + 모바일 전체화면 프리뷰'],
    },
    keyDifferences: [
      '데스크톱 3단 레이아웃이 모바일 뷰포트에서 터치 드로어 및 단일 컬럼으로 적응형 변형',
    ],
  },
  'lw-db-shell': {
    supportType: 'adaptive',
    desktopSpec: {
      presenterComponent: 'LwDbShellComponent (Desktop Mode)',
      layoutType: '3-pane',
      interactions: ['대형 데이터 그리드 테이블 + 컬럼 정렬 + 필터 바'],
    },
    mobileSpec: {
      presenterComponent: 'LwDbShellComponent (Mobile Mode)',
      layoutType: '1-pane-dock',
      interactions: ['테이블 대신 모바일 카드 리스트로 렌더링 전환 + 필터 바텀시트'],
    },
    keyDifferences: [
      '화면 폭에 따라 고밀도 데이터 그리드 테이블과 모바일 카드 뷰를 적응형 전환',
    ],
  },
  'app-all-components': {
    supportType: 'adaptive',
    desktopSpec: {
      presenterComponent: 'AllComponentsComponent (Desktop View)',
      layoutType: '3-pane',
      interactions: ['좌측 도메인 트리 + 중앙 타일 그리드 + 우측 인스펙터 패널'],
    },
    mobileSpec: {
      presenterComponent: 'AllComponentsComponent (Mobile View)',
      layoutType: '1-pane-dock',
      interactions: ['좌측 패널 자동 접힘 + 단일 컬럼 리스트 뷰 + 터치 필터 오버레이'],
    },
    keyDifferences: [
      '데스크톱 3단 OS 윈도우 구조에서 모바일 단일 탐색 뷰로 반응형 전환',
    ],
  },
};

/**
 * 🔍 단일 컴포넌트의 플랫폼 지원 유형(PlatformSupportType)을 정확히 판별
 */
export function getPlatformSupportType(comp: ComponentMeta): PlatformSupportType {
  // 1. 컴포넌트 자체에 crossPlatformSpec이 명시된 경우
  if (comp.crossPlatformSpec?.supportType) {
    return comp.crossPlatformSpec.supportType;
  }

  // 2. 전수조사 명세 사전에 매핑된 경우
  const mapped = PLATFORM_CENSUS_SPEC_MAP[comp.id] || PLATFORM_CENSUS_SPEC_MAP[comp.selector];
  if (mapped?.supportType) {
    return mapped.supportType;
  }

  // 3. 식별자 및 셀렉터 휴리스틱 룰 엔진
  const id = comp.id.toLowerCase();
  const sel = comp.selector.toLowerCase();

  if (
    id.includes('bottom-sheet') ||
    id.includes('sheet') ||
    id.includes('fab') ||
    id.includes('dock') ||
    id.includes('mobile-shell') ||
    id.includes('mobile-scene') ||
    id.includes('mobile-home') ||
    id.includes('mobile-dock') ||
    id.includes('mobile-presenter') ||
    id.includes('mobile-bottom-bar') ||
    sel.includes('mobile') ||
    sel.includes('bottom-sheet')
  ) {
    return 'mobile-only';
  }

  if (
    id.includes('desktop-shell') ||
    id.includes('desktop-surface') ||
    id.includes('desktop-icon') ||
    id.includes('desktop-presenter') ||
    id.includes('taskbar') ||
    id.includes('window-frame') ||
    id.includes('start-panel') ||
    id.includes('explorer-window') ||
    sel.includes('taskbar') ||
    sel.includes('desktop')
  ) {
    return 'desktop-only';
  }

  if (
    id.includes('adaptive-shell') ||
    id.includes('study-shell') ||
    id.includes('strategy-shell') ||
    id.includes('showcase') ||
    id.includes('all-components')
  ) {
    return 'adaptive';
  }

  // 4. 그 외 기본 Primitives 및 Panels
  return 'shared-primitive';
}

/**
 * 📋 단일 컴포넌트의 종합 적응형 플랫폼 사양(AdaptivePlatformSpec)을 완전하게 보충하여 반환
 */
export function resolvePlatformSpec(comp: ComponentMeta): AdaptivePlatformSpec {
  const supportType = getPlatformSupportType(comp);
  const census = PLATFORM_CENSUS_SPEC_MAP[comp.id] || PLATFORM_CENSUS_SPEC_MAP[comp.selector];

  // 컴포넌트 메타데이터에 이미 사양이 있을 경우 전수조사 사전과 병합
  if (comp.crossPlatformSpec) {
    return {
      supportType,
      headlessController: comp.crossPlatformSpec.headlessController || census?.headlessController,
      desktopSpec: comp.crossPlatformSpec.desktopSpec || census?.desktopSpec,
      mobileSpec: comp.crossPlatformSpec.mobileSpec || census?.mobileSpec,
      keyDifferences: (comp.crossPlatformSpec.keyDifferences && comp.crossPlatformSpec.keyDifferences.length > 0)
        ? comp.crossPlatformSpec.keyDifferences
        : (census?.keyDifferences || getDefaultKeyDifferences(comp, supportType)),
    };
  }

  if (census) {
    return {
      supportType,
      headlessController: census.headlessController,
      desktopSpec: census.desktopSpec,
      mobileSpec: census.mobileSpec,
      keyDifferences: census.keyDifferences || getDefaultKeyDifferences(comp, supportType),
    };
  }

  // 기본 공통 소자 또는 규칙에 따른 사양 생성
  return {
    supportType,
    desktopSpec: {
      presenterComponent: comp.name,
      layoutType: 'standard',
      interactions: ['마우스 호버 하이라이트', '키보드 포커스', '도구 설명(Tooltip) 표출'],
    },
    mobileSpec: {
      presenterComponent: comp.name,
      layoutType: 'standard',
      interactions: ['터치 탭 피드백', '터치 리플 효과', '반응형 100% 폭 적응'],
    },
    keyDifferences: getDefaultKeyDifferences(comp, supportType),
  };
}

function getDefaultKeyDifferences(comp: ComponentMeta, supportType: PlatformSupportType): string[] {
  switch (supportType) {
    case 'desktop-only':
      return [
        '데스크톱 OS 환경의 대화면 윈도우, 마우스 정밀 조작 및 키보드 단축키에 특화된 전용 컴포넌트입니다.',
        '모바일 OS 모드에서는 대응되는 모바일 전용 뷰 또는 바텀시트로 대체 동작합니다.',
      ];
    case 'mobile-only':
      return [
        '스마트폰 터치 뷰포트, 하단 엄지 영역(Thumb-Zone), 스와이프 제스처에 최적화된 모바일 전용 컴포넌트입니다.',
        '데스크톱 OS 모드에서는 3단 윈도우 패널 또는 모달 다이얼로그로 대체 동작합니다.',
      ];
    case 'adaptive':
      return [
        '단일 인터페이스 뒤에서 뷰포트 및 디바이스 모드를 감지하여 데스크톱 뷰와 모바일 뷰를 적응형으로 자동 전환합니다.',
        '내부 비즈니스 로직과 상태 머신은 Headless 아키텍처로 100% 일원화되어 있습니다.',
      ];
    case 'shared-primitive':
    default:
      return [
        '플랫폼에 종속되지 않는 순수 L1 디자인 시스템 소자 또는 공통 도메인 컴포넌트입니다.',
        '데스크톱과 모바일 양쪽 화면 모두에서 100% 동일한 비주얼과 인터랙션으로 재사용됩니다.',
      ];
  }
}

/**
 * 🏷️ 플랫폼 지원 유형별 UI 레이블 반환
 */
export function getPlatformSupportLabel(type: PlatformSupportType | 'all'): string {
  switch (type) {
    case 'desktop-only': return '데스크톱 전용';
    case 'mobile-only': return '모바일 전용';
    case 'adaptive': return '적응형 셸';
    case 'shared-primitive': return '공통 소자';
    case 'all': default: return '전체 플랫폼';
  }
}

/**
 * 🎨 플랫폼 지원 유형별 이모지/아이콘 반환
 */
export function getPlatformSupportIcon(type: PlatformSupportType | 'all'): string {
  switch (type) {
    case 'desktop-only': return '🖥️';
    case 'mobile-only': return '📱';
    case 'adaptive': return '🔄';
    case 'shared-primitive': return '🧱';
    case 'all': default: return '🌐';
  }
}
