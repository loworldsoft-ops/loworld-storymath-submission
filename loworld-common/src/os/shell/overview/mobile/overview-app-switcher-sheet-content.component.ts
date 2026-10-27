import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';
import { OverviewWindow, OverviewWindowTab } from '../../../../services/models/os.types';

/**
 * 📱 OverviewAppSwitcherSheetContentComponent
 * 모바일 앱 스위처(멀티태스킹) 바텀시트의 실행 중인 앱 목록 본문 컴포넌트
 */
@Component({
  selector: 'lw-os-app-switcher-sheet-content',
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwBadgeComponent, OverviewIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-app-switcher-sheet-content.component.html',
  styleUrl: './overview-app-switcher-sheet-content.component.scss',
})
export class OverviewAppSwitcherSheetContentComponent {
  readonly windows = input<readonly OverviewWindow[]>([]);
  readonly activeTab = input<OverviewWindowTab | null>(null);
  readonly tabSelect = output<OverviewWindowTab>();
}
