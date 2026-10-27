import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { OverviewThemeMode } from '../../../../services/models/os.types';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';

type OverviewMobileDockAction = 'home' | 'search' | 'running' | 'account';
type OverviewMobileDockItem = {
  id: OverviewMobileDockAction;
  label: string;
  icon: 'home' | 'search' | 'components' | 'member';
};

@Component({
  standalone: true,
  imports: [LwButtonComponent, OverviewIconComponent],
  selector: 'lw-os-mobile-dock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
  templateUrl: './overview-mobile-dock.component.html',
  styleUrl: './overview-mobile-dock.component.scss',
})
export class OverviewMobileDockComponent {
  selectedAction = input<OverviewMobileDockAction>('home');
  hasRunningWindows = input(false);
  runningCount = input(0);
  themeMode = input<OverviewThemeMode>('light');

  actionSelected = output<OverviewMobileDockAction>();

  protected readonly actions = computed<readonly OverviewMobileDockItem[]>(() => [
    { id: 'home', label: 'Home', icon: 'home' as const },
    { id: 'search', label: 'Search', icon: 'search' as const },
    { id: 'running', label: 'Running', icon: 'components' as const },
    { id: 'account', label: 'Account', icon: 'member' as const },
  ]);

  protected onSelect(action: OverviewMobileDockAction): void {
    this.actionSelected.emit(action);
  }
}