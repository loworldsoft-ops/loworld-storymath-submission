import type { LwAppLook, OverviewExplorerFolder, OverviewExplorerItem, OverviewTaskbarPin } from '../../../../services/models/os.types';
import type { DomainDefinition, LwAppMobile } from './domain-registry.types';

/**
 * OS가 앱을 아이콘으로 보일 때의 모양(짧은 이름, 아이콘 그림, 도감 그림)을 찾는 한 곳이다.
 * 앱은 선언서(`domain.look`, `launchItems[].look`)에 적는다. OS는 앱의 이름을 보고 추측하지 않는다.
 * 바탕화면, 작업표시줄, 모바일 홈, 폴더 시트가 모두 여기서 읽는다.
 */
const OS_LOOKS: Record<string, LwAppLook> = {
  'overview-explorer': { shortLabel: 'Explorer', iconImage: '/assets/icons/apps/app_finder.png' },
  'workspace.all-components': { shortLabel: 'Components', iconImage: '/assets/icons/apps/app_components.png' },
  'home': { shortLabel: 'Home' },
  'overview-apps': { shortLabel: 'Apps' },
  'tools': { shortLabel: 'Tools', codex: { image: '/assets/codex/personality/entries/p_wrath.png', tag: '분노·도구', tone: 'wrath' } },
  'external': { shortLabel: 'Connect', codex: { image: '/assets/codex/personality/seal_desires.png', tag: '욕망·연결', tone: 'desire' } },
};
const OS_ALIASES: Record<string, string> = {
  'explorer': 'overview-explorer',
  'finder': 'overview-explorer',
  'all-components': 'workspace.all-components',
  'components': 'workspace.all-components',
  'showcase-components': 'workspace.all-components',
};

const DEFAULT_CODEX = { image: '/assets/codex/personality/seal_desires.png', tag: '성격 도감', tone: 'seal' } as const;

/** OS가 스스로 갖는 것의 열쇠. 사용 기록과 홈의 쪽 구성에서 앱을 가리킬 때 쓴다. */
const OS_APP_KEYS: Record<string, string> = {
  'workspace.all-components': 'components', 'all-components': 'components', 'components': 'components', 'showcase-components': 'components',
};

/** 홈(바탕화면, 모바일 홈)의 한 쪽. 어느 앱을 어느 쪽에 놓을지는 띄우는 쪽이 정한다. */
export interface LwOsHomePage {
  readonly id: string;
  readonly title: string;
  /** 이 쪽에 놓을 앱의 열쇠(선언서의 `domain.id`, OS의 것은 `canvas`·`components`). 적지 않으면 다른 쪽에 놓이지 않은 나머지 전부다. */
  readonly apps?: readonly string[];
}

const DEFAULT_HOME_PAGES: readonly LwOsHomePage[] = [{ id: 'page-apps', title: '앱' }];

const looks = new Map<string, LwAppLook>();
const appKeys = new Map<string, string>();
const mobiles = new Map<string, LwAppMobile>();
let appKeyOrder: string[] = [];
let pages: readonly LwOsHomePage[] = DEFAULT_HOME_PAGES;

function seed(): void {
  looks.clear();
  appKeys.clear();
  mobiles.clear();
  for (const [key, appKey] of Object.entries(OS_APP_KEYS)) appKeys.set(key, appKey);
  appKeyOrder = [];
  for (const [key, look] of Object.entries(OS_LOOKS)) looks.set(key, look);
  for (const [alias, key] of Object.entries(OS_ALIASES)) looks.set(alias, OS_LOOKS[key]);
}
seed();

/** 띄우는 쪽이 부팅할 때 한 번 부른다(`provideLwOs`). 앱의 선언서에 적힌 모양과, 홈의 쪽 구성을 등록한다. */
export function registerAppLooks(domains: readonly DomainDefinition[], homePages?: readonly LwOsHomePage[]): void {
  seed();
  pages = homePages?.length ? homePages : DEFAULT_HOME_PAGES;
  const add = (key: string | undefined, look: LwAppLook) => {
    if (key && !looks.has(key)) looks.set(key, look);
  };
  const addKey = (key: string | undefined, appKey: string) => {
    if (key && !appKeys.has(key)) appKeys.set(key, appKey);
  };
  for (const domain of domains) {
    appKeyOrder.push(domain.id);
    if (domain.mobile) mobiles.set(domain.id, domain.mobile);
    for (const item of domain.launchItems) {
      const look = { ...domain.look, ...item.look };
      add(item.appId, look);
      add(item.tab, look);
      // 자기 모양을 따로 적은 항목은 홈에서 따로 놓이는 앱이다(소설의 리더).
      const appKey = item.look ? item.appId : domain.id;
      addKey(item.appId, appKey);
      addKey(item.tab, appKey);
    }
    addKey(domain.id, domain.id);
    addKey(domain.launchGroup.id, domain.id);
    if (!domain.look) continue;
    add(domain.id, domain.look);
    add(domain.launchGroup.id, domain.look);
  }
}

/** 탭, 앱 id, 폴더 id가 어느 앱의 것인지. 모르는 것은 그대로 돌려준다. */
export function appKeyOf(...keys: readonly (string | undefined)[]): string {
  for (const key of keys) {
    const appKey = key ? appKeys.get(key) : undefined;
    if (appKey) return appKey;
  }
  return (keys.find((key) => !!key) ?? '').toLowerCase();
}

/** 등록된 앱이거나 OS가 스스로 갖는 것의 열쇠인지. */
export function isKnownAppKey(key: string): boolean {
  return appKeyOrder.includes(key) || Object.values(OS_APP_KEYS).includes(key);
}

/** 그 탭의 앱이 모바일 OS 화면에서 쓰는 것. 자기 모양을 따로 적은 항목(리더)은 앱의 것을 쓰지 않는다. */
export function appMobileOf(tab: string): LwAppMobile | undefined {
  return mobiles.get(appKeyOf(tab));
}

/** 등록된 차례의 앱의 열쇠. 사용 기록이 같을 때의 차례로 쓴다. */
export function registeredAppKeys(): readonly string[] {
  return [...appKeyOrder, 'components'];
}

/** 홈의 쪽과, 앱의 열쇠가 놓일 쪽의 id를 돌려준다. */
export function homePages(): readonly LwOsHomePage[] {
  return pages;
}

export function homePageIdOf(appKey: string): string | null {
  return (pages.find((page) => page.apps?.includes(appKey)) ?? pages.find((page) => !page.apps))?.id ?? null;
}

function find(...keys: readonly (string | undefined)[]): LwAppLook | undefined {
  for (const key of keys) {
    const look = key ? looks.get(key) : undefined;
    if (look) return look;
  }
  return undefined;
}

function firstWord(raw: string): string {
  return raw.trim().split(/[\s&_.-]+/)[0] || raw;
}

const ofItem = (item: OverviewExplorerItem) => find(item.launchItem?.appId, item.launchItem?.tab, item.id);

export function appShortLabel(item: OverviewExplorerItem): string {
  return ofItem(item)?.shortLabel ?? firstWord(item.label);
}

export function appIconImage(item: OverviewExplorerItem): string {
  return ofItem(item)?.iconImage ?? '';
}

export function pinShortLabel(pin: OverviewTaskbarPin): string {
  return find(pin.tab)?.shortLabel ?? firstWord(pin.label);
}

export function pinIconImage(pin: OverviewTaskbarPin): string {
  return find(pin.tab)?.iconImage ?? '';
}

export function folderShortLabel(folder: OverviewExplorerFolder): string {
  return find(folder.id)?.shortLabel ?? firstWord(folder.title);
}

/** 도감 보기에서 쓰는 그림과 꼬리표. 적지 않은 앱은 기본 그림이다. */
export function codexLook(key: string): { image: string; tag: string; tone: string } {
  return find(key)?.codex ?? DEFAULT_CODEX;
}

export function isDesktopOnlyApp(item: OverviewExplorerItem): boolean {
  return ofItem(item)?.desktopOnly ?? false;
}
