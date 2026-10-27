/** 앱 식별자 */
export type AppId = 'eznote' | 'ezcalendar' | 'loworld-study' | 'loworld-db' | 'loworld-novel' | 'loworld-plan' | 'loworld-develop' | 'loworld-showcase' | 'loworld-llmops' | 'loworld-group' | 'loworld-guide';

/** 앱 표시 이름 */
export const APP_LABELS: Record<AppId, string> = {
  'eznote': 'Note',
  'ezcalendar': 'Calendar',
  'loworld-study': 'Study',
  'loworld-db': 'Database',
  'loworld-novel': 'Novel',
  'loworld-plan': 'Plan',
  'loworld-develop': 'Develop',
  'loworld-showcase': 'Showcase',
  'loworld-llmops': 'LLMOps (생산성 · 데스크톱 전용)',
  'loworld-group': '그룹 (조직 · 멤버 관리 · 데스크톱 전용)',
  'loworld-guide': 'Foundry 가이드 (기술 문서 · 데스크톱 전용)',
};

/** 특정 앱에서의 컴포넌트 사용 맥락 */
export interface AppUsage {
  app: AppId;
  role: string;        // 사용 역할 (예: "메인 데스크톱 셸")
  feature?: string;    // 연관 기능 (예: "노트 편집")
  direct: boolean;     // true: app.ts에서 직접 import / false: Shell 내부에서 간접 사용
}

import type { LwMemberRole } from './member.model';

/** Overview «작업 표시줄·데스크톱 아이콘» 바로가기 */
/** 처음부터 있던 것들. 자동 완성에 쓴다. */
export type KnownOverviewLaunchGroupId = 'note' | 'calendar' | 'homework' | 'novel' | 'db' | 'plan' | 'develop' | 'tools' | 'llmops' | 'platform';
/** 공통은 어떤 앱이 있는지 모른다. 앱이 자기 것을 넣을 수 있게 글자를 다 받는다. */
export type OverviewLaunchGroupId = KnownOverviewLaunchGroupId | (string & {});

export type OverviewAudience = 'public' | 'authenticated' | 'role-based';

export type OverviewGateStyle = 'none' | 'soft-login' | 'hard-block';

/** 처음부터 있던 것들. 자동 완성에 쓴다. */
export type KnownOverviewAppId =
  | 'eznote.desktop'
  | 'eznote.mobile'
  | 'eznote.components'
  | 'ezcalendar.desktop'
  | 'ezcalendar.mobile'
  | 'ezcalendar.components'
  | 'loworld-study.desktop'
  | 'loworld-study.mobile'
  | 'loworld-study.components'
  | 'loworld-novel.demo'
  | 'loworld-novel.mobile'
  | 'loworld-novel.components'
  | 'loworld-novel.consumer'
  | 'loworld-reader.app'
  | 'loworld-db.console'
  | 'loworld-db.components'
  | 'loworld-db.consumer'
  | 'loworld-plan.desktop'
  | 'loworld-plan.mobile'
  | 'loworld-plan.components'
  | 'loworld-develop.desktop'
  | 'loworld-develop.mobile'
  | 'workspace.canvas'
  | 'workspace.all-components'
  | 'workspace.db-schema-note'
  | 'workspace.db-schema-calendar'
  | 'loworld-showcase'
  | 'loworld-llmops.desktop'
  | 'loworld-group.desktop'
  | 'loworld-guide.desktop';
/** 공통은 어떤 앱이 있는지 모른다. 앱이 자기 것을 넣을 수 있게 글자를 다 받는다. */
export type OverviewAppId = KnownOverviewAppId | (string & {});

export type OverviewThemeMode = 'light' | 'dark';

export type OverviewIconId =
  | 'windows'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'search'
  | 'folder'
  | 'home'
  | 'monitor'
  | 'note'
  | 'book'
  | 'mobile'
  | 'components'
  | 'calendar'
  | 'study'
  | 'member'
  | 'users'
  | 'tools'
  | 'external'
  | 'builder'
  | 'database'
  | 'network'
  | 'volume'
  | 'battery'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'refresh'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'close'
  | 'chart'
  | 'settings'
  | 'sidebar';

/** OS가 앱을 아이콘으로 보일 때의 모양. 앱이 선언서에 적는다. */
export interface LwAppLook {
  /** 아이콘 아래에 적는 짧은 이름. */
  shortLabel?: string;
  /** 아이콘 그림의 주소. */
  iconImage?: string;
  /** 도감 보기에서 쓰는 그림과 꼬리표. */
  codex?: { image: string; tag: string; tone: string };
  /** 데스크탑에서만 뜨는 앱. */
  desktopOnly?: boolean;
}

export interface OverviewLaunchItem {
  /** 이 항목만 앱의 모양과 다를 때 적는다. */
  look?: LwAppLook;
  /** 탐색기에서 이름 아래에 적는 설명. 없으면 'Launch app'이다. */
  subtitle?: string;
  appId: OverviewAppId;
  group: OverviewLaunchGroupId;
  label: string;
  icon: OverviewIconId;
  audience: OverviewAudience;
  gateStyle?: OverviewGateStyle;
  requiredRoles?: readonly LwMemberRole[];
  tab?: string;
  externalHref?: string;
}

export interface OverviewLaunchGroupDef {
  id: OverviewLaunchGroupId;
  title: string;
  /** 탐색기와 바탕화면에 이 묶음이 폴더로 보일 때의 이름, 아이콘, 설명. 없으면 `title`과 기본 아이콘이다. */
  folder?: { title?: string; icon?: OverviewIconId; description?: string };
}

export interface OverviewStartGroupSection extends OverviewLaunchGroupDef {
  items: readonly OverviewLaunchItem[];
}

/** 처음부터 있던 것들. 자동 완성에 쓴다. */
export type KnownOverviewExplorerFolderId =
  | 'home'
  | 'overview-apps'
  | 'note'
  | 'calendar'
  | 'homework'
  | 'novel'
  | 'db'
  | 'plan'
  | 'develop'
  | 'tools'
  | 'external'
  | 'llmops'
  | 'group'
  | 'platform';
/** 공통은 어떤 앱이 있는지 모른다. 앱이 자기 것을 넣을 수 있게 글자를 다 받는다. */
export type OverviewExplorerFolderId = KnownOverviewExplorerFolderId | (string & {});

export interface OverviewExplorerItem {
  id: string;
  type: 'app' | 'external-link' | 'folder-link';
  label: string;
  subtitle?: string;
  icon: OverviewIconId;
  targetFolderId?: OverviewExplorerFolderId;
  launchItem?: OverviewLaunchItem;
}

export interface OverviewExplorerFolder {
  id: OverviewExplorerFolderId;
  title: string;
  pathLabel: string;
  parentId?: OverviewExplorerFolderId;
  description?: string;
  icon: OverviewIconId;
  items: readonly OverviewExplorerItem[];
}

export interface OverviewExplorerNavNode {
  id: OverviewExplorerFolderId;
  label: string;
  icon: OverviewIconId;
}

export interface OverviewTaskbarPin {
  tab: string;
  label: string;
  icon: OverviewIconId;
}

/** 처음부터 있던 것들. 자동 완성에 쓴다. */
export type KnownOverviewWindowTab =
  | 'overview-explorer'
  | 'canvas-demo'
  | 'desktop-demo'
  | 'mobile-demo'
  | 'components'
  | 'cal-demo'
  | 'cal-mobile-demo'
  | 'cal-components'
  | 'hw-demo'
  | 'hw-mobile-demo'
  | 'hw-components'
  | 'novel-demo'
  | 'novel-mobile-demo'
  | 'story-reader'
  | 'novel-components'
  | 'db-console'
  | 'db-components'
  | 'plan-demo'
  | 'plan-mobile-demo'
  | 'plan-components'
  | 'develop-demo'
  | 'develop-mobile-demo'
  | 'all-components'
  | 'db-schema-note'
  | 'db-schema-calendar'
  | 'showcase-components'
  | 'llmops-console'
  | 'group-console'
  | 'guide-console';
/** 공통은 어떤 앱이 있는지 모른다. 앱이 자기 것을 넣을 수 있게 글자를 다 받는다. */
export type OverviewWindowTab = KnownOverviewWindowTab | (string & {});

export type OverviewWindowState = 'normal' | 'minimized' | 'maximized';
export type OverviewWindowLaunchMode = 'normal' | 'maximized';
export type OverviewWindowSize = 'desktop' | 'mobile' | 'wide';
export type OverviewWindowMobileChrome = 'dock-visible';

/** 공통 창/앱 세션 기저 인터페이스 (ISP) */
export interface BaseWindowSession {
  readonly tab: OverviewWindowTab;
  readonly title: string;
  readonly icon: OverviewIconId;
}

/** 데스크톱 다중 창 시스템 전용 디스크립터 (ISP) */
export interface DesktopWindowDescriptor extends BaseWindowSession {
  size: OverviewWindowSize;
  state: OverviewWindowState;
  zIndex: number;
  offset: number;
  explorerFolderId?: OverviewExplorerFolderId;
  lastState?: OverviewWindowState;
}

/** 모바일 단일 뷰포트 씬 세션 전용 인터페이스 (ISP) */
export interface MobileAppSession extends BaseWindowSession {
  sceneMode?: 'active' | 'background';
  bottomBarActiveActionId?: string;
  canGoBack?: boolean;
}

/** 하위 호환성을 위한 OverviewWindow 별칭 타입 */
export type OverviewWindow = DesktopWindowDescriptor;

export type PlatformSupportType = 'adaptive' | 'desktop-only' | 'mobile-only' | 'shared-primitive';

export interface AdaptivePlatformSpec {
  /** 지원 플랫폼 유형 */
  supportType: PlatformSupportType;
  /** 공통 비즈니스 로직을 담당하는 Headless Controller/Store 클래스명 */
  headlessController?: string;
  /** 데스크탑 환경에서의 UX 사양 */
  desktopSpec?: {
    presenterComponent: string;
    layoutType: '3-pane' | 'modal-window' | 'floating-panel' | 'standard';
    interactions: string[];
  };
  /** 모바일 환경에서의 UX 사양 */
  mobileSpec?: {
    presenterComponent: string;
    layoutType: '1-pane-dock' | 'bottom-sheet' | 'fullscreen-page' | 'standard';
    interactions: string[];
  };
  /** 모바일과 데스크탑 간의 핵심 차이점 요약 리스트 */
  keyDifferences: string[];
}

/** 🎨 디자인 시스템 패밀리 분류 */
export type DesignSystemFamily =
  | 'buttons'
  | 'badges'
  | 'cards'
  | 'modals'
  | 'sheets'
  | 'chips'
  | 'app-icons'
  | 'avatars'
  | 'grids'
  | 'lists'
  | 'swipes'
  | 'side-menus'
  | 'navigation'
  | 'forms'
  | 'data-view';

export interface ComponentMeta {
  id: string;
  name: string;
  /** 타일 그리드 desc 등에 표시할 영문 컴포넌트명 (선택) */
  englishName?: string;
  selector: string;
  domain: 'note' | 'calendar' | 'homework' | 'novel' | 'plan' | 'develop' | 'common' | 'db' | 'showcase' | 'curriculum' | 'story';
  category: 'buttons' | 'forms' | 'navigation' | 'layout' | 'popups' | 'data' | 'view' | 'cards' | 'fantasy' | 'sci-fi' | 'mystery' | 'wuxia' | 'martial';
  description: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
  usedIn?: AppUsage[];
  // App Factory Metadata
  layer?: 'primitive' | 'composite' | 'container' | 'shell';
  reusabilityIndex?: number;
  duplicationRisk?: 'safe' | 'warn' | 'critical';
  dependencies?: string[];
  referencedBy?: string[];
  /** 💡 크로스 플랫폼 적응형 사양 (모바일/데스크탑 차이점 및 Presenter 정보) */
  crossPlatformSpec?: AdaptivePlatformSpec;
  /** 🎨 소속 디자인 시스템 패밀리 (버튼, 배지, 카드, 모달, 바텀시트, 칩스, 앱아이콘, 그리드, 네비게이션 등) */
  designSystemFamily?: DesignSystemFamily;
  /** 🧩 채택 및 조립에 사용된 L1 디자인 시스템 표준 소자 목록 (예: ['lw-card', 'lw-badge', 'lw-button']) */
  designSystemPrimitives?: string[];
}
