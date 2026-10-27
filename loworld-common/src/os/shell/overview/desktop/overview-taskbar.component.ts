import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewTaskbarPin, OverviewThemeMode } from '../../../../services/models/os.types';

import { pinIconImage, pinShortLabel } from '../../../platform/core/domain-registry/app-look';

import { OsDockComponent } from '../os/os-dock.component';
import type { OsDockItem } from '../os/os-app.types';

const FINDER_ID = '__finder__';

@Component({
  standalone: true,
  imports: [OsDockComponent],
  selector: 'lw-os-taskbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-taskbar.component.html',
  styleUrl: './overview-taskbar.component.scss',
})
export class OverviewTaskbarComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewTaskbarComponent', 'OS');

  pins = input<readonly OverviewTaskbarPin[]>([]);
  activeWindowTab = input<string | null>(null);
  runningTabs = input<readonly string[]>([]);
  minimizedTabs = input<readonly string[]>([]);
  startOpen = input(false);
  workspaceCount = input(0);
  folderCount = input(0);
  openWindowCount = input(0);
  memberSession = input<LwMemberAuthSessionView | null>(null);
  loginLabel = input('게스트');
  loginStateLabel = input('오프라인');
  readonly themeMode = input<OverviewThemeMode>('light');
  settingsActive = input(false);

  startToggleRequested = output<void>();
  searchRequested = output<void>();
  pinToggleRequested = output<string>();
  loginRequested = output<void>();
  accountRequested = output<void>();
  logoutRequested = output<void>();
  themeToggleRequested = output<void>();
  settingsRequested = output<void>();

  protected readonly getPinAppImage = pinIconImage;

  /** Finder가 중복 렌더링되지 않도록 overview-explorer를 제외한 순수 앱 핀 목록 */
  protected readonly dockPins = computed(() =>
    this.pins().filter(pin => pin.tab !== 'overview-explorer' && !this.isMobilePin(pin))
  );

  /** 독에 놓을 항목: 탐색기(시작 패널)와 고정해 둔 앱. 설정과 계정은 메뉴 막대에 있다. */
  protected readonly dockItems = computed<readonly OsDockItem[]>(() => [
    {
      id: FINDER_ID,
      label: '탐색기',
      iconSrc: '/assets/icons/apps/app_finder.png',
      icon: 'finder',
      running: this.isFinderRunning(),
      active: this.startOpen() || this.isFinderActive(),
    },
    ...this.dockPins().map((pin) => ({
      id: pin.tab,
      label: this.cleanPinLabel(pin),
      iconSrc: this.getPinAppImage(pin) || null,
      icon: pin.icon || 'box',
      running: this.isPinRunning(pin),
      active: this.isPinActive(pin),
    })),
  ]);

  protected onDockSelect(id: string): void {
    if (id === FINDER_ID) this.startToggleRequested.emit();
    else this.pinToggleRequested.emit(id);
  }

  protected readonly cleanPinLabel = pinShortLabel;

  protected readonly isFinderRunning = computed(() =>
    this.runningTabs().includes('overview-explorer')
  );

  protected readonly isFinderActive = computed(() =>
    this.activeWindowTab() === 'overview-explorer'
  );

  protected isMobilePin(pin: OverviewTaskbarPin): boolean {
    const label = pin.label.toLowerCase();
    const tab = pin.tab.toLowerCase();
    return label.includes('모바일') || tab.includes('mobile') || pin.icon === 'mobile';
  }

  protected isPinActive(pin: OverviewTaskbarPin): boolean {
    return this.activeWindowTab() === pin.tab;
  }

  protected isPinRunning(pin: OverviewTaskbarPin): boolean {
    return this.runningTabs().includes(pin.tab);
  }
}
