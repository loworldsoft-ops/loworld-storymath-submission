import { Injectable, signal } from '@angular/core';
import type { OverviewExplorerFolderId } from '../../../../services/models/os.types';

type OverviewMobileDockAction = 'home' | 'search' | 'running' | 'account';

@Injectable({ providedIn: 'root' })
export class OverviewUiStateStore {
  readonly startOpen = signal(false);
  readonly mobileSelectedGroup = signal<OverviewExplorerFolderId | 'all'>('all');
  readonly mobileSheetFolderId = signal<OverviewExplorerFolderId | null>(null);
  readonly mobileDockAction = signal<OverviewMobileDockAction>('home');
  readonly allComponentsMobileSidebarOpen = signal(false);

  toggleStart(): void {
    this.startOpen.update(isOpen => !isOpen);
  }

  closeStart(): void {
    this.startOpen.set(false);
  }

  selectMobileGroup(groupId: OverviewExplorerFolderId | 'all'): void {
    this.mobileSelectedGroup.set(groupId);
  }

  openMobileGroup(folderId: OverviewExplorerFolderId): void {
    this.mobileSelectedGroup.set(folderId);
    this.mobileSheetFolderId.set(folderId);
  }

  closeMobileGroup(): void {
    this.mobileSheetFolderId.set(null);
  }

  openAllComponentsMobileSidebar(): void {
    this.allComponentsMobileSidebarOpen.set(true);
  }

  closeAllComponentsMobileSidebar(): void {
    this.allComponentsMobileSidebarOpen.set(false);
  }

  toggleAllComponentsMobileSidebar(): void {
    this.allComponentsMobileSidebarOpen.update(isOpen => !isOpen);
  }

  setMobileSheetFolder(folderId: OverviewExplorerFolderId | null): void {
    this.mobileSheetFolderId.set(folderId);
  }

  setDockAction(action: OverviewMobileDockAction): void {
    this.mobileDockAction.set(action);
  }
}