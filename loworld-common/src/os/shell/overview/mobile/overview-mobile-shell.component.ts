import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewExplorerFolder, OverviewExplorerFolderId, OverviewExplorerItem, OverviewIconId, OverviewLaunchItem, OverviewTaskbarPin, OverviewThemeMode, OverviewWindowTab } from '../../../../services/models/os.types';
import { LwBottomSheetComponent } from '../../../../ui/overlay/bottom-sheet/bottom-sheet.component';
import { OverviewMobileDockComponent } from './overview-mobile-dock.component';
import { OverviewMobileHomeComponent } from './overview-mobile-home.component';
import { OverviewFolderSheetContentComponent } from './overview-folder-sheet-content.component';

@Component({
  selector: 'lw-os-mobile-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OverviewMobileDockComponent,
    OverviewMobileHomeComponent,
    LwBottomSheetComponent,
    OverviewFolderSheetContentComponent,
  ],
  templateUrl: './overview-mobile-shell.component.html',
  styleUrl: './overview-mobile-shell.component.scss',
})
export class OverviewMobileShellComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewMobileShellComponent', 'OS');

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  folders = input.required<readonly OverviewExplorerFolder[]>();
  memberSession = input<LwMemberAuthSessionView | null>(null);
  selectedGroupId = input<OverviewExplorerFolderId | 'all'>('all');
  sheetFolder = input<OverviewExplorerFolder | null>(null);
  sheetOpen = input(false);
  activeWindowTab = input<OverviewWindowTab | null>(null);
  runningTabs = input<readonly OverviewWindowTab[]>([]);
  workspaceCount = input(0);
  folderCount = input(0);
  runningCount = input(0);
  loginStateLabel = input('오프라인');
  loginLabel = input('게스트');
  pins = input<readonly OverviewTaskbarPin[]>([]);
  settingsActive = input(false);
  dockAction = input<'home' | 'search' | 'running' | 'account'>('home');
  dockVisible = input(true);
  sceneOpen = input(false);
  readonly themeMode = input<OverviewThemeMode>('light');

  groupSelected = output<OverviewExplorerFolderId | 'all'>();
  groupOpenRequested = output<OverviewExplorerFolderId>();
  sheetCloseRequested = output<void>();
  sheetNavigateRequested = output<OverviewExplorerFolderId>();
  launchRequested = output<OverviewLaunchItem>();
  runningTabSelected = output<OverviewWindowTab>();
  loginRequested = output<void>();
  accountRequested = output<void>();
  logoutRequested = output<void>();
  dockActionRequested = output<'home' | 'search' | 'running' | 'account'>();
  startToggleRequested = output<void>();
  searchRequested = output<void>();
  pinToggleRequested = output<string>();
  settingsRequested = output<void>();

  constructor() {
    effect(() => {
      const sceneOpen = this.sceneOpen();
      const activeWindowTab = this.activeWindowTab();

      if (!sceneOpen || !activeWindowTab) {
        return;
      }

      queueMicrotask(() => {
        const host = this.elementRef.nativeElement;
        (host.querySelector('.overview-mobile-shell__content') as HTMLElement | null)?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        (host.querySelector('.overview-mobile-scene__body') as HTMLElement | null)?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    });
  }

  protected onGroupSelected(groupId: OverviewExplorerFolderId | 'all'): void {
    this.groupSelected.emit(groupId);
  }

  protected onGroupOpen(folderId: OverviewExplorerFolderId): void {
    this.groupOpenRequested.emit(folderId);
  }

  protected onSheetClose(): void {
    this.sheetCloseRequested.emit();
  }

  protected onSheetNavigate(folderId: OverviewExplorerFolderId): void {
    this.sheetNavigateRequested.emit(folderId);
  }

  protected isRunning(item: OverviewExplorerItem): boolean {
    return !!item.launchItem?.tab && this.runningTabs().includes(item.launchItem.tab as OverviewWindowTab);
  }

  protected isActive(item: OverviewExplorerItem): boolean {
    return item.launchItem?.tab === this.activeWindowTab();
  }

  protected onSheetItemSelect(item: OverviewExplorerItem): void {
    if (item.type === 'folder-link' && item.targetFolderId) {
      this.sheetNavigateRequested.emit(item.targetFolderId);
      return;
    }

    if (item.launchItem) {
      this.launchRequested.emit(item.launchItem);
    }
  }

  protected onLaunch(item: OverviewLaunchItem): void {
    this.launchRequested.emit(item);
  }

  protected onRunningTabSelected(tab: OverviewWindowTab): void {
    this.runningTabSelected.emit(tab);
  }

  protected onDockAction(action: 'home' | 'search' | 'running' | 'account'): void {
    this.dockActionRequested.emit(action);
  }

  protected onLogin(): void {
    this.loginRequested.emit();
  }

  protected onAccount(): void {
    this.accountRequested.emit();
  }

  protected onLogout(): void {
    this.logoutRequested.emit();
  }
}