import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwAppIconComponent } from '../../../../ui/data-display/app-icon/app-icon.component';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';
import { appIconImage, appShortLabel } from '../../../platform/core/domain-registry/app-look';
import type { OverviewExplorerItem, OverviewIconId, OverviewWindowTab } from '../../../../services/models/os.types';

/**
 * 📁 OverviewFolderSheetContentComponent
 * 모바일 홈 스크린 앱 그룹(폴더) 바텀시트의 앱 아이콘 그리드 컴포넌트
 */
@Component({
  selector: 'lw-os-folder-sheet-content',
  standalone: true,
  imports: [CommonModule, LwAppIconComponent, OverviewIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-folder-sheet-content.component.html',
  styleUrl: './overview-folder-sheet-content.component.scss',
})
export class OverviewFolderSheetContentComponent {
  readonly items = input.required<readonly OverviewExplorerItem[]>();
  readonly runningTabs = input<readonly OverviewWindowTab[]>([]);
  readonly activeTab = input<OverviewWindowTab | null>(null);

  readonly itemSelect = output<OverviewExplorerItem>();

  protected isRunning(item: OverviewExplorerItem): boolean {
    const tab = item.launchItem?.tab;
    return !!tab && this.runningTabs().includes(tab as OverviewWindowTab);
  }

  protected isActive(item: OverviewExplorerItem): boolean {
    const tab = item.launchItem?.tab;
    return !!tab && this.activeTab() === tab;
  }

  protected readonly cleanAppLabel = appShortLabel;

  protected getItemIcon(item: OverviewExplorerItem): OverviewIconId {
    return (item.icon as OverviewIconId) || 'folder';
  }

  protected readonly getAppIconImage = appIconImage;
}
