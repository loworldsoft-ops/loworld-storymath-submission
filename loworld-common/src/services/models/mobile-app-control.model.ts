/**
 * 모바일 앱 제어 메뉴(Mobile App Control Menu) 액션 아이템 모델
 */
export interface LwMobileAppControlAction {
  /** 액션 고유 식별자 (예: 'home', 'modes', 'character', 'settings', 'switcher', 'close') */
  readonly id: string;
  /** 버튼 텍스트 라벨 (예: '홈', '모드 선택', '캐릭터', '뷰어 설정') */
  readonly label: string;
  /** 아이콘 식별자 */
  readonly icon?: 'home' | 'settings' | 'switcher' | 'close' | 'character' | 'book' | 'list' | 'viewer-settings' | 'note' | 'calendar' | 'edit' | 'today' | 'menu' | string;
  /** 커스텀 이미지 아이콘 URL (AI 도감 에셋 등) */
  readonly iconUrl?: string;
  /** 커스텀 SVG path 데이터 (icon 대신 직접 SVG path d 속성 지정 가능) */
  readonly svgPath?: string;
  /** 뱃지 텍스트 (예: 레벨 'Lv.12', 알림 수 등) */
  readonly badge?: string | number;
  /** 활성화(선택) 상태 여부 */
  readonly active?: boolean;
  /** 비활성화 여부 */
  readonly disabled?: boolean;
  /** 접근성 라벨 */
  readonly ariaLabel?: string;
  /** 툴팁 설명 */
  readonly tooltip?: string;
  /** 버튼 역할 ('os' | 'app' | 'danger') */
  readonly role?: 'os' | 'app' | 'danger';
  /** 클릭 핸들러 콜백 */
  readonly handler?: () => void;
  /** 분류별 조합 미니 아이콘 목록 (지정 시 2x2 미니 그리드로 렌더링) */
  readonly compositeIcons?: readonly LwMobileAppControlCompositeIcon[];
}

/**
 * 2x2 조합 아이콘 내 개별 미니 아이콘 항목
 */
export interface LwMobileAppControlCompositeIcon {
  readonly id?: string;
  readonly icon?: string;
  readonly iconUrl?: string;
  readonly svgPath?: string;
  readonly label?: string;
}

/**
 * 모바일 앱 제어 메뉴 상태 페이로드
 */
export interface LwMobileAppControlPayload {
  /** 앱 식별자 (예: 'loworld-novel', 'eznote', 'ezcalendar') */
  readonly appId: string;
  /** 현재 상황/컨텍스트 식별자 (예: 'play-mode', 'catalog', 'editor') */
  readonly situationId?: string;
  /** 상단 헤더 간소화 여부 (하단 제어 메뉴가 활성화되면 상단 헤더의 중복 세션/설정 버튼 숨김) */
  readonly streamlineHeader?: boolean;
  /** 하단 제어 메뉴 액션 목록 */
  readonly actions: readonly LwMobileAppControlAction[];
  /** 현재 활성화된(열린) 모달 또는 바텀시트 오버레이 식별자 */
  readonly activeOverlayId?: string | null;
  /** 활성화된 오버레이 닫기 요청 핸들러 */
  readonly onOverlayDismiss?: () => void;
  /** 액션 클릭 시 공통 핸들러 */
  readonly onAction?: (actionId: string) => void;

  /** 👤 헤더에서 하단 바로 이전된 캐릭터 세션 정보 (하단 바 상시 렌더링용) */
  readonly character?: any | null;
  readonly characterSummaries?: any[] | null;
  /** 🔑 헤더에서 하단 바로 이전된 포탈 회원 세션 정보 */
  readonly memberSession?: any | null;
  readonly showSessionControl?: boolean;
  readonly showCharacterControl?: boolean;

  /** 세션 이벤트 콜백들 */
  readonly onCharacterSelect?: () => void;
  readonly onCharacterDetail?: (summary: any) => void;
  readonly onCharacterSwitch?: (targetId: string) => void;
  readonly onCharacterLogout?: () => void;
  readonly onLogin?: () => void;
  readonly onLogout?: () => void;
  readonly onAccount?: () => void;
}
