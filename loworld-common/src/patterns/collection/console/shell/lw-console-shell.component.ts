import { LwAppFrameComponent } from '../../../frame/app-frame/app-frame.component';
import { DEFAULT_WORKSPACE_DESKTOP_LAYOUT, type WorkspaceDesktopLayout } from '../../../../services/models/workspace-layout.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ConsoleGroup, ConsoleTabId, ConsoleUser } from '../console.models';
import { LwConsoleSidebarComponent } from './sidebar/lw-console-sidebar.component';

/** LLMOps 콘솔 셸: 사이드 메뉴와 본문을 앱의 틀(lw-app-frame)의 자리에 놓는다. 이 셸에는 헤더가 없다. */
@Component({
  selector: 'lw-console-shell',
  standalone: true,
  imports: [LwConsoleSidebarComponent, LwAppFrameComponent],
  templateUrl: './lw-console-shell.component.html',
  styleUrl: './lw-console-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwConsoleShellComponent {
  readonly themeMode = input<'light' | 'dark'>('light');
  readonly collapsed = input<boolean>(false);
  readonly activeTab = input.required<ConsoleTabId>();
  readonly currentGroup = input.required<ConsoleGroup>();
  readonly groups = input<readonly ConsoleGroup[]>([]);
  readonly user = input.required<ConsoleUser>();
  readonly platformOpen = input<boolean>(false);
  readonly groupPopoverOpen = input<boolean>(false);

  readonly toggleCollapse = output<void>();
  readonly toggleTheme = output<void>();
  readonly selectTab = output<ConsoleTabId>();
  readonly togglePlatform = output<void>();
  readonly groupPopoverOpenChange = output<boolean>();
  readonly selectGroup = output<string>();
  readonly openProfile = output<void>();

  protected readonly frameLayout = computed<WorkspaceDesktopLayout>(() => ({
    ...DEFAULT_WORKSPACE_DESKTOP_LAYOUT,
    collectionOpen: false,
    sidebarCollapsed: this.collapsed(),
    visibleSlots: ['sidebar', 'detail'],
  }));
}

