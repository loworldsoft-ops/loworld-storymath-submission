/**
 * Vessel 사이드/상단 메뉴에 표시될 아이템 구조
 */
export interface LwVesselMenuItem {
  id: string;              // 컴포넌트/기능 고유 ID (예: 'shop', 'arena', 'reader')
  label: string;           // 메뉴 노출 텍스트 (예: '장비 상점', '전투 아레나')
  icon?: string;           // 메뉴 아이콘 클래스 또는 이모지
  badgeCount?: number;     // 메뉴 우측에 노출할 알림 배지 수
  disabled?: boolean;      // 메뉴 비활성화 플래그
}

/**
 * Vessel 지원 레이아웃 모드
 */
export type LwVesselLayoutMode = 
  | 'single'  // 단일 컴포넌트 전체화면 모드 (메뉴 클릭 시 화면 전환)
  | 'split'   // 2분할 화면 모드 (좌측: 소설, 우측: 선택한 서브 컴포넌트)
  | 'grid'    // 다중 컴포넌트 그리드 모드 (3개 이상을 한눈에 결합 배치)
  | 'overlay' // 메인 컴포넌트 위에 팝업/모달 형태로 오버레이 오버랩
;

/**
 * Vessel 설정 메타데이터
 */
export interface LwVesselConfig {
  title: string;                 // Vessel 최상단 타이틀바 영역 텍스트
  layoutMode: LwVesselLayoutMode;// 초기 레이아웃 모드
  showMenu: boolean;             // 메뉴 사이드바 노출 여부
  menuPosition: 'left' | 'top';  // 메뉴 위치
}
