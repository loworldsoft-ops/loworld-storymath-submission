import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { WINDOW } from '../../../../services/tokens/window.token';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { OverviewExplorerFolder, OverviewExplorerFolderId, OverviewExplorerItem, OverviewExplorerNavNode, OverviewLaunchItem, OverviewWindowTab } from '../../../../services/models/os.types';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';

@Component({
  standalone: true,
  imports: [LwButtonComponent, LwTooltipDirective, OverviewIconComponent],
  selector: 'lw-os-explorer-window',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
  templateUrl: './overview-explorer-window.component.html',
  styleUrl: './overview-explorer-window.component.scss',
})
export class OverviewExplorerWindowComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewExplorerWindowComponent', 'OS');

  folders = input.required<readonly OverviewExplorerFolder[]>();
  currentFolderId = input.required<OverviewExplorerFolderId>();
  runningTabs = input<readonly OverviewWindowTab[]>([]);
  activeWindowTab = input<OverviewWindowTab | null>(null);

  navigateRequested = output<OverviewExplorerFolderId>();
  launchRequested = output<OverviewLaunchItem>();

  private readonly win = inject(WINDOW);
  private readonly selectedItemId = signal<string | null>(null);

  protected readonly navNodes = computed<readonly OverviewExplorerNavNode[]>(() =>
    this.folders().map(folder => ({
      id: folder.id,
      label: folder.title,
      icon: folder.icon,
    }))
  );

  protected readonly currentFolder = computed(() =>
    this.folders().find(folder => folder.id === this.currentFolderId()) ?? this.folders()[0] ?? null
  );

  protected readonly quickAccessItems = computed(() => this.currentFolder()?.items.slice(0, 4) ?? []);

  protected isFolderActive(folderId: OverviewExplorerFolderId): boolean {
    return this.currentFolderId() === folderId;
  }

  protected isItemSelected(itemId: string): boolean {
    return this.selectedItemId() === itemId;
  }

  protected isLaunchRunning(item: OverviewExplorerItem): boolean {
    return !!item.launchItem?.tab && this.runningTabs().includes(item.launchItem.tab as OverviewWindowTab);
  }

  protected isLaunchActive(item: OverviewExplorerItem): boolean {
    return !!item.launchItem?.tab && this.activeWindowTab() === item.launchItem.tab;
  }

  protected navigate(folderId: OverviewExplorerFolderId): void {
    this.navigateRequested.emit(folderId);
  }

  protected selectItem(itemId: string): void {
    this.selectedItemId.set(itemId);
  }

  protected openItem(item: OverviewExplorerItem): void {
    this.selectedItemId.set(item.id);

    if (item.type === 'folder-link' && item.targetFolderId) {
      this.navigate(item.targetFolderId);
      return;
    }

    if (item.type === 'app' && item.launchItem) {
      this.launchRequested.emit(item.launchItem);
      return;
    }

    if (item.type === 'external-link' && item.launchItem?.externalHref) {
      this.win?.open(item.launchItem.externalHref, '_blank', 'noopener,noreferrer');
    }
  }
}