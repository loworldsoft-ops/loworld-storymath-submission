import { Type } from '@angular/core';
import type { LwFrameSettings } from '../services/settings/lw-frame-settings';
import type { LwMobileAppControlAction } from '../services/models/mobile-app-control.model';
import type { LwMemberAuthSessionView } from '../services/models/auth.model';
import type {
  ComponentMeta,
  LwAppLook,
  OverviewExplorerFolder,
  OverviewIconId,
  OverviewLaunchGroupDef,
  OverviewLaunchItem,
  OverviewWindow,
  OverviewWindowMobileChrome,
  OverviewWindowSize,
  OverviewWindowTab,
} from '../services/models/os.types';

/** 공통은 어떤 앱이 있는지 모른다. 새 앱은 자기 id를 그대로 넣는다. */
export type DomainId = string;

/** 모바일 OS 화면에서 이 앱이 쓰는 것. */
export interface LwAppMobile {
  /** 하단 바의 기본 단추. 앱이 띄워진 뒤 스스로 넣기 전에 보인다. */
  dock?: readonly LwMobileAppControlAction[];
  /** 탭이 여럿이어도 하단 바를 하나의 id로 다루려면 적는다. */
  controlAppId?: string;
  /** 하단 바에 캐릭터 단추를 보인다. */
  characterSession?: boolean;
}

export interface DomainDefinition {
  id: DomainId;
  label: string;
  icon: OverviewIconId;
  /** OS가 이 앱을 아이콘으로 보일 때의 모양. */
  look?: LwAppLook;
  /** 모바일 OS 화면에서 쓰는 것. */
  mobile?: LwAppMobile;
  launchGroup: OverviewLaunchGroupDef;
  launchItems: readonly OverviewLaunchItem[];
  catalog: readonly ComponentMeta[];
}

export interface WindowTabContext {
  window: OverviewWindow;
  themeMode: 'light' | 'dark';
  memberAuthSession?: LwMemberAuthSessionView | null;
  loginLabel?: string;
  loginStateLabel?: string;
  developSelectedComponent?: any;
  developComponentCatalog?: unknown;
  isMobile?: boolean;
  overviewViewType?: string;
  allComponentsRouteSection?: string | null;
  allComponentsRouteDetailId?: string | null;
  overviewAllComponentsMobileSidebarOpen?: boolean;
  overviewExplorerFolders?: readonly OverviewExplorerFolder[];
  overviewRunningTabs?: readonly string[];
  overviewActiveWindowTab?: OverviewWindowTab | null;
  [key: string]: unknown;
}

/** OS가 탭을 창, 작업표시줄, 주소의 제목에 보일 때 쓰는 것. */
export interface WindowTabPresentation {
  title: string;
  icon: OverviewIconId;
  size: OverviewWindowSize;
  /** 작업표시줄에 고정했을 때의 이름. 없으면 `title`이다. */
  pinLabel?: string;
  mobileChrome?: OverviewWindowMobileChrome;
}

export type WindowTabSettingsMode = string;

export interface WindowTabRegistration {
  tab: OverviewWindowTab | string;
  /** 이 탭의 앱이 정한 틀의 기본값. 선언서의 `frame`을 부팅할 때 탭마다 옮겨 적는다. 앱이 직접 적지 않는다. */
  frame?: Partial<LwFrameSettings>;
  /** 이 탭 아래의 주소. `mode/:modeId`처럼 탭 이름 뒤에 붙는 부분만 적는다. 탭 이름만 있는 주소는 늘 생긴다. */
  routes?: readonly string[];
  /** 이 탭으로 넘기는 옛 주소. */
  routeAliases?: readonly string[];
  /** 이 탭의 창 제목, 아이콘, 크기. 앱이 선언서에 적는다. 없으면 탭 이름과 넓은 창을 쓴다. */
  window?: WindowTabPresentation;
  component?: Type<unknown>;
  loadComponent?: () => Promise<Type<unknown>>;
  wrapInScrollPage?: boolean;
  resolveInputs?: (context: WindowTabContext) => Record<string, unknown>;
  /** 모바일 모드에서 이 탭 대신 여는 탭 (데스크톱용 등록에 적는다) */
  mobileTab?: OverviewWindowTab | string;
  /** 이 탭이 활성일 때 여는 앱 설정 화면 */
  settingsMode?: WindowTabSettingsMode;
}
