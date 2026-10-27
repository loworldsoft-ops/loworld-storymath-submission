import { LwAccountRoleBadgeComponent } from '../../../../ui/data-display/badge/member-role-badge.component';
import { LwAvatarComponent } from '../../../../ui/data-display/avatar/avatar.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OverviewExplorerFolder, OverviewExplorerFolderId, OverviewExplorerItem, OverviewLaunchItem } from '../../../../services/models/os.types';
import { OverviewSessionFacade } from '../facade/overview-session.facade';
import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { LwUiFeedbackService } from '../../../../services/services/lw-ui-feedback.service';
import { type LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewClockStore } from '../store/overview-clock.store';
import { WallpaperStore } from '../wallpaper/wallpaper.store';
import { OverviewFactoryPanelComponent } from './overview-factory-panel.component';
import { OverviewAppUsageStore } from '../store/overview-app-usage.store';
import { DesktopSurfaceEntry } from './overview-desktop-surface.data';
import { OverviewDesktopGridManagerService } from './overview-desktop-grid-manager.service';
import { isBrowserFullscreen, toggleBrowserFullscreen } from './overview-desktop-fullscreen.util';
import { OsAppGridComponent } from '../os/os-app-grid.component';
import { OsMenuComponent, OsMenuDividerComponent, OsMenuItemComponent } from '../os/os-menu.component';
import type { OsAppPage, OsAppTile } from '../os/os-app.types';
import { AppExecutionModeService } from '../../../platform/app-execution-mode.service';

export * from './overview-desktop-surface.data';

type DesktopMenuId = 'system' | 'view' | 'search' | 'session';

/**
 * 데스크톱 홈. 메뉴 막대와 앱 격자를 놓는다. 독은 `lw-os-taskbar`가 그린다.
 *
 * 배경화면 위에 늘 떠 있는 것은 앱 아이콘과 페이지 점뿐이다.
 * 통계 패널, 검색, 계정 정보는 메뉴 막대에서 눌렀을 때만 뜬다.
 */
@Component({
  standalone: true,
  imports: [
    LwAccountRoleBadgeComponent,
    LwAvatarComponent,
    LwIconComponent,
    LwPressableDirective,
    LwTooltipDirective,
    OverviewFactoryPanelComponent,
    OsAppGridComponent,
    OsMenuComponent,
    OsMenuItemComponent,
    OsMenuDividerComponent,
  ],
  selector: 'lw-os-desktop-surface',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-desktop-surface.component.html',
  styleUrl: './overview-desktop-surface.component.scss',
  host: {
    '[attr.data-os-wallpaper-tone]': 'wallpaperTone().tone',
    '[attr.data-os-wallpaper-kind]': 'wallpaperTone().kind',
    '(document:click)': 'closeAllMenus()',
    '(document:keydown.escape)': 'closeAllMenus()',
  },
})
export class OverviewDesktopSurfaceComponent implements AfterViewInit, OnDestroy {
  private readonly lifecycleLog = injectLifecycleLog('OverviewDesktopSurfaceComponent', 'OS');

  protected readonly gridManager = inject(OverviewDesktopGridManagerService);
  private readonly overviewSession = inject(OverviewSessionFacade, { optional: true });
  private readonly clockStore = inject(OverviewClockStore);
  private readonly ui = inject(LwUiFeedbackService);
  protected readonly wallpaperStore = inject(WallpaperStore);
  protected readonly appUsageStore = inject(OverviewAppUsageStore);
  protected readonly executionMode = inject(AppExecutionModeService);
  private readonly doc = inject(DOCUMENT);

  folders = input.required<readonly OverviewExplorerFolder[]>();
  windowCount = input(0);
  activeExplorerFolderId = input<OverviewExplorerFolderId | null>(null);
  isOwner = input<boolean | undefined>(undefined);
  memberSession = input<LwMemberAuthSessionView | null | undefined>(undefined);
  deviceMode = input<'desktop' | 'mobile'>('desktop');

  folderOpenRequested = output<OverviewExplorerFolderId>();
  launchRequested = output<OverviewLaunchItem>();
  deviceModeChange = output<'desktop' | 'mobile'>();
  settingsRequested = output<void>();
  loginRequested = output<void>();
  accountRequested = output<void>();
  logoutRequested = output<void>();

  private readonly grid = viewChild(OsAppGridComponent);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly activeMenu = signal<DesktopMenuId | null>(null);
  protected readonly factoryOpen = signal<boolean>(false);
  protected readonly isFullscreen = signal<boolean>(false);
  protected readonly pageIndex = signal<number>(0);
  protected readonly searchQuery = this.gridManager.searchQuery;
  protected readonly wallpaperTone = this.wallpaperStore.wallpaperTone;

  protected readonly currentMemberSession = computed<LwMemberAuthSessionView | null>(() => {
    const explicit = this.memberSession();
    if (explicit !== undefined) return explicit;
    return this.overviewSession?.memberAuthSession() ?? null;
  });

  protected readonly isAuthenticated = computed<boolean>(() => this.currentMemberSession() !== null);

  protected readonly clockText = computed<string>(() => {
    const iso = this.clockStore.nowIso();
    const d = iso ? new Date(iso) : new Date();
    const day = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day}) ${hours >= 12 ? '오후' : '오전'} ${hours % 12 || 12}:${minutes}`;
  });

  /** 격자에 넘길 페이지. 비어 있는 "자주 사용하는 앱"은 빼고, 검색 중이면 결과를 한 페이지로 모은다. */
  protected readonly pages = computed<readonly OsAppPage[]>(() => {
    const query = this.searchQuery().trim();
    if (query) {
      const apps = this.toTiles(this.gridManager.processedDesktopEntries());
      return [
        {
          id: 'search',
          title: `검색: ${query}`,
          apps,
          empty: { title: `"${query}"에 맞는 앱이 없습니다`, hint: '다른 이름으로 찾아보세요.', actionLabel: '검색 지우기' },
        },
      ];
    }
    return this.gridManager
      .desktopAppPages()
      .filter((page) => page.entries.length > 0)
      .map((page) => ({ id: page.id, title: page.title, apps: this.toTiles(page.entries) }));
  });

  private readonly itemsById = computed(() => {
    const map = new Map<string, OverviewExplorerItem>();
    for (const entry of this.gridManager.desktopEntries()) {
      if (entry.kind === 'app') map.set(entry.item.id, entry.item);
    }
    return map;
  });

  private readonly onFullscreenChangeBound = () => this.isFullscreen.set(isBrowserFullscreen(this.doc));

  constructor() {
    effect(() => this.gridManager.folders.set(this.folders()));
    effect(() => this.gridManager.currentMemberSession.set(this.currentMemberSession()));
    // 페이지 수가 줄면(검색 등) 처음으로 돌아간다.
    effect(() => {
      if (this.pageIndex() >= this.pages().length) this.pageIndex.set(0);
    });
  }

  ngAfterViewInit(): void {
    this.doc.addEventListener('fullscreenchange', this.onFullscreenChangeBound);
    this.doc.addEventListener('webkitfullscreenchange', this.onFullscreenChangeBound);
    this.onFullscreenChangeBound();
  }

  ngOnDestroy(): void {
    this.doc.removeEventListener('fullscreenchange', this.onFullscreenChangeBound);
    this.doc.removeEventListener('webkitfullscreenchange', this.onFullscreenChangeBound);
  }

  /** 같은 페이지에 같은 이름이 둘이면 줄인 이름 대신 원래 이름을 쓴다. */
  private toTiles(entries: readonly DesktopSurfaceEntry[]): OsAppTile[] {
    const apps = entries.filter((e): e is Extract<DesktopSurfaceEntry, { kind: 'app' }> => e.kind === 'app');
    const counts = new Map<string, number>();
    for (const entry of apps) {
      const label = this.gridManager.cleanEntryLabel(entry);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return apps.map((entry) => {
      const short = this.gridManager.cleanEntryLabel(entry);
      return {
        id: entry.item.id,
        label: (counts.get(short) ?? 0) > 1 ? entry.item.label.trim() : short,
        iconSrc: this.gridManager.getEntryAppImage(entry) || null,
        icon: 'box',
        locked: this.gridManager.isEntryDisabled(entry),
        tooltip: this.gridManager.getEntryTooltip(entry),
      };
    });
  }

  protected openApp(tile: OsAppTile): void {
    const item = this.itemsById().get(tile.id);
    if (!item?.launchItem) return;
    if (!tile.locked) {
      this.appUsageStore.recordLaunch(item.launchItem.tab || item.launchItem.appId || item.id);
    }
    this.launchRequested.emit(item.launchItem);
  }

  protected toggleMenu(menu: DesktopMenuId, event: Event): void {
    event.stopPropagation();
    this.activeMenu.update((current) => (current === menu ? null : menu));
    if (menu === 'search' && this.activeMenu() === 'search') {
      queueMicrotask(() => this.searchInput()?.nativeElement.focus());
    }
  }

  /** 바깥을 누르거나 Esc를 누르면 열려 있던 메뉴와 통계 패널을 닫는다. */
  protected closeAllMenus(): void {
    this.activeMenu.set(null);
    this.factoryOpen.set(false);
  }

  protected toggleFactory(event: Event): void {
    event.stopPropagation();
    const next = !this.factoryOpen();
    this.closeAllMenus();
    this.factoryOpen.set(next);
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.closeAllMenus();
  }

  protected openSettings(): void {
    this.closeAllMenus();
    this.settingsRequested.emit();
  }

  protected openWallpaper(): void {
    this.closeAllMenus();
    this.wallpaperStore.openModal();
  }

  protected showPhoneMode(): void {
    this.closeAllMenus();
    this.deviceModeChange.emit('mobile');
  }

  protected onLogin(): void {
    this.closeAllMenus();
    this.loginRequested.emit();
  }

  protected onAccount(): void {
    this.closeAllMenus();
    this.accountRequested.emit();
  }

  protected onLogout(): void {
    this.closeAllMenus();
    this.logoutRequested.emit();
  }

  protected async toggleFullscreen(): Promise<void> {
    this.closeAllMenus();
    await toggleBrowserFullscreen(this.doc);
  }

  protected async resetAppUsage(): Promise<void> {
    this.closeAllMenus();
    const confirmed = await this.ui.confirm({
      title: '자주 사용하는 앱 기록 초기화',
      message: '앱 실행 횟수와 최근 사용 기록을 모두 지울까요?',
      detail: '지운 뒤에는 "자주 사용하는 앱" 페이지가 비고, 앱을 다시 실행하면 새로 쌓입니다.',
      confirmLabel: '초기화',
      cancelLabel: '취소',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.appUsageStore.resetUsage();
    this.ui.showSuccess('자주 사용하는 앱 기록을 지웠습니다.');
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey && event.metaKey && (event.key === 'f' || event.key === 'F')) || event.key === 'F11') {
      event.preventDefault();
      void this.toggleFullscreen();
    }
  }
}
