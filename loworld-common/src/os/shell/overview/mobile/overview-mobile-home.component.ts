import { homePageIdOf, homePages, isDesktopOnlyApp } from '../../../platform/core/domain-registry/app-look';
import { WindowTabRegistryService } from '../../../platform/core/domain-registry/window-tab-registry.service';
import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { type LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { OverviewExplorerFolder, OverviewExplorerFolderId, OverviewExplorerItem, OverviewLaunchItem, OverviewTaskbarPin, OverviewWindowTab } from '../../../../services/models/os.types';
import { type OverviewMobileAppPage, cleanAppLabel, cleanPinLabel, getPinAppImage, getAppIconImage } from './overview-mobile-home.config';
import { WallpaperStore } from '../wallpaper/wallpaper.store';
import { OverviewAppUsageStore } from '../store/overview-app-usage.store';
import { AppExecutionModeService } from '../../../platform/app-execution-mode.service';
import { isOverviewItemDisabled } from '../../../platform/overview-access';
import { OsAppGridComponent } from '../os/os-app-grid.component';
import { OsDockComponent } from '../os/os-dock.component';
import type { OsAppPage, OsAppTile, OsDockItem } from '../os/os-app.types';

export type { OverviewMobileAppPage };

const FINDER_ID = '__finder__';

/**
 * 모바일 홈. 위에 시각과 조작 단추, 가운데에 앱 격자, 아래에 독을 놓는다.
 * 격자와 독은 데스크톱 홈과 같은 부품이다. 칸 크기만 다르다.
 */
@Component({
  standalone: true,
  imports: [LwIconComponent, LwPressableDirective, OsAppGridComponent, OsDockComponent],
  selector: 'lw-os-mobile-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile-home.component.html',
  styleUrl: './overview-mobile-home.component.scss',
  host: {
    '[attr.data-os-wallpaper-tone]': 'wallpaperTone().tone',
    '[attr.data-os-wallpaper-kind]': 'wallpaperTone().kind',
  },
})
export class OverviewMobileHomeComponent implements OnDestroy {
  private readonly lifecycleLog = injectLifecycleLog('OverviewMobileHomeComponent', 'OS');

  folders = input.required<readonly OverviewExplorerFolder[]>();
  runningTabs = input<readonly OverviewWindowTab[]>([]);
  activeWindowTab = input<OverviewWindowTab | null>(null);
  selectedGroupId = input<OverviewExplorerFolderId | 'all'>('all');
  memberSession = input<LwMemberAuthSessionView | null>(null);
  pins = input<readonly OverviewTaskbarPin[]>([]);
  loginLabel = input('게스트');
  settingsActive = input(false);

  groupSelected = output<OverviewExplorerFolderId | 'all'>();
  groupOpenRequested = output<OverviewExplorerFolderId>();
  runningTabSelected = output<OverviewWindowTab>();
  launchRequested = output<OverviewLaunchItem>();
  loginRequested = output<void>();
  accountRequested = output<void>();
  logoutRequested = output<void>();
  startToggleRequested = output<void>();
  searchRequested = output<void>();
  pinToggleRequested = output<string>();
  settingsRequested = output<void>();

  private readonly wallpaperStore = inject(WallpaperStore);
  protected readonly appUsageStore = inject(OverviewAppUsageStore);
  private readonly windowTabs = inject(WindowTabRegistryService);
  protected readonly executionMode = inject(AppExecutionModeService);

  protected readonly wallpaperTone = this.wallpaperStore.wallpaperTone;
  protected readonly pageIndex = signal<number>(0);
  protected readonly currentTime = signal<string>('');
  protected readonly currentDate = signal<string>('');
  protected readonly hasSession = computed(() => this.memberSession() !== null);

  private clockTimerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.updateClock();
    if (typeof window !== 'undefined') {
      this.clockTimerId = setInterval(() => this.updateClock(), 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.clockTimerId) clearInterval(this.clockTimerId);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    this.currentDate.set(`${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}`);
  }

  /** 전체 사용 가능한 고유 앱 목록 (개별 컴포넌트 서브앱 제외, '모든 컴포넌트 설명서'만 유지) */
  protected readonly allAvailableApps = computed<readonly OverviewExplorerItem[]>(() => {
    const appMap = new Map<string, OverviewExplorerItem>();
    for (const folder of this.folders()) {
      for (const item of folder.items) {
        if (item.type === 'app' && item.launchItem) {
          const key = item.launchItem.tab || item.launchItem.appId || item.id;
          const label = item.label;
          const tab = item.launchItem.tab;
          const isComponentSubApp =
            (tab !== 'all-components' && !label.includes('모든 컴포넌트')) &&
            (label.includes('컴포넌트') || (!!tab && tab.includes('component')));

          if (!isComponentSubApp && !appMap.has(key)) {
            appMap.set(key, item);
          }
        }
      }
    }
    return Array.from(appMap.values());
  });

  /**
   * 앱마다 홈에 놓을 항목 하나를 고른다. 한 앱에 탭이 여럿이면(데스크탑, 모바일) 모바일에서 열리는 것을 고른다.
   * 데스크탑에서만 뜨는 앱은 뺀다.
   */
  protected readonly projectApps = computed<readonly OverviewExplorerItem[]>(() => {
    const picked = new Map<string, OverviewExplorerItem>();
    const opensOnMobile = (item: OverviewExplorerItem) => {
      const tab = item.launchItem?.tab ?? '';
      return this.windowTabs.mobileTabOf(tab) === tab;
    };
    for (const item of this.allAvailableApps()) {
      // 바깥 주소로 나가는 항목은 앱이 아니다.
      if (!item.launchItem?.tab || isDesktopOnlyApp(item)) continue;
      const key = this.getAppCanonicalId(item);
      const known = picked.get(key);
      if (!known || (!opensOnMobile(known) && opensOnMobile(item))) picked.set(key, item);
    }
    return [...picked.values()];
  });

  /** 모바일 앱 엔트리의 Canonical ID 추출 */
  protected getAppCanonicalId(app: OverviewExplorerItem): string {
    const raw = app.launchItem?.tab || app.launchItem?.appId || app.id;
    return this.appUsageStore.normalizeCanonicalId(raw);
  }

  /** 모바일 앱 엔트리의 누적 실행 횟수 조회 */
  protected getAppLaunchCount(app: OverviewExplorerItem): number {
    const raw = app.launchItem?.tab || app.launchItem?.appId || app.id;
    return this.appUsageStore.getLaunchCount(raw);
  }

  /**
   * 스마트 런처 3-Page 스와이프 그리드 데이터
   * 1페이지: 자주 사용하는 앱 (로컬스토리지 누적 실행 횟수 및 최근 사용 시각 기준 자동 랭킹)
   * 2페이지: 생산성 & 교육·창작 프로젝트 (Canvas, ezNote, ezCalendar, Loworld Study)
   * 3페이지: 게임, 데이터 & 개발 프로젝트 (Loworld Novel, 리더(소설 제목), Loworld DB, Loworld Plan, Loworld Develop, 모든 컴포넌트)
   */
  protected readonly appPages = computed<readonly OverviewMobileAppPage[]>(() => {
    const allProjectList = this.projectApps();

    // 1페이지: 사용량 랭킹 기준 정렬 (실행 이력 있는 앱만 포함)
    const sortedKeys = this.appUsageStore.sortedCanonicalAppKeys();
    const usedApps = allProjectList.filter(app => this.getAppLaunchCount(app) > 0);
    const sortedApps = [...usedApps].sort((a, b) => {
      const countA = this.getAppLaunchCount(a);
      const countB = this.getAppLaunchCount(b);
      if (countA !== countB) {
        return countB - countA;
      }
      const keyA = this.getAppCanonicalId(a);
      const keyB = this.getAppCanonicalId(b);
      const idxA = sortedKeys.indexOf(keyA);
      const idxB = sortedKeys.indexOf(keyB);
      return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
    });

    const page1Apps = sortedApps.slice(0, 8);

    // 나머지 쪽은 띄우는 쪽이 정한 구성을 따른다.
    const rest = homePages().map((page, index): OverviewMobileAppPage => {
      const apps = allProjectList.filter((app) => homePageIdOf(this.getAppCanonicalId(app)) === page.id);
      return { id: page.id, title: page.title, subtitle: apps.map((app) => cleanAppLabel(app)).join(' · '), badge: `Page ${index + 2}`, apps };
    });

    return [
      {
        id: 'page-most-used',
        title: '자주 사용하는 앱',
        subtitle: '실행 횟수 기반 스마트 추천',
        badge: 'Page 1',
        apps: page1Apps,
      },
      ...rest,
    ];
  });

  /** 격자에 넘길 페이지. 비어 있는 "자주 사용하는 앱"은 뺀다. */
  protected readonly pages = computed<readonly OsAppPage[]>(() =>
    this.appPages()
      .filter((page) => page.apps.length > 0)
      .map((page) => ({ id: page.id, title: page.title, apps: page.apps.map((app) => this.toTile(app)) }))
  );

  private readonly itemsById = computed(() => new Map(this.allAvailableApps().map((item) => [item.id, item] as const)));

  /** 독: 탐색기와 고정해 둔 앱. 데스크톱 독과 같은 구성이다. */
  protected readonly dockItems = computed<readonly OsDockItem[]>(() => [
    {
      id: FINDER_ID,
      label: '탐색기',
      iconSrc: '/assets/icons/apps/app_finder.png',
      icon: 'finder',
      running: this.runningTabs().includes('overview-explorer' as OverviewWindowTab),
      active: this.activeWindowTab() === 'overview-explorer',
    },
    ...this.pins()
      .filter((pin) => pin.tab !== 'overview-explorer' && !this.isMobilePin(pin))
      .map((pin) => ({
        id: pin.tab,
        label: cleanPinLabel(pin),
        iconSrc: getPinAppImage(pin) || null,
        icon: pin.icon || 'box',
        running: this.runningTabs().includes(pin.tab as OverviewWindowTab),
        active: this.activeWindowTab() === pin.tab,
      })),
  ]);

  private toTile(item: OverviewExplorerItem): OsAppTile {
    const locked = isOverviewItemDisabled(item.launchItem ?? item.id, this.memberSession());
    const label = cleanAppLabel(item);
    return {
      id: item.id,
      label,
      iconSrc: getAppIconImage(item) || null,
      icon: 'box',
      locked,
      tooltip: locked ? `${label} (로그인 필요)` : label,
    };
  }

  private isMobilePin(pin: OverviewTaskbarPin): boolean {
    const label = pin.label.toLowerCase();
    const tab = pin.tab.toLowerCase();
    return label.includes('모바일') || tab.includes('mobile') || pin.icon === 'mobile';
  }

  protected openApp(tile: OsAppTile): void {
    const item = this.itemsById().get(tile.id);
    if (!item) return;
    if (!item.launchItem) {
      this.loginRequested.emit();
      return;
    }
    if (!tile.locked) {
      this.appUsageStore.recordLaunch(item.launchItem.tab || item.launchItem.appId || item.id);
    }
    this.launchRequested.emit(item.launchItem);
  }

  protected onDockSelect(id: string): void {
    if (id === FINDER_ID) this.startToggleRequested.emit();
    else this.pinToggleRequested.emit(id);
  }

  protected onAccountPress(): void {
    if (this.hasSession()) this.accountRequested.emit();
    else this.loginRequested.emit();
  }
}
