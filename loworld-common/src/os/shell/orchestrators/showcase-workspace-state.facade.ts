import { Injectable, inject } from '@angular/core';
import { OverviewThemeStore } from '../overview/store/overview-theme.store';
import { OverviewUiStateStore } from '../overview/store/overview-ui-state.store';
import { OverviewViewTypeStore } from '../overview/store/overview-view-type.store';
import { OverviewWindowStore } from '../overview/store/overview-window.store';
import { OverviewClockStore } from '../overview/store/overview-clock.store';
import { WallpaperStore } from '../overview/wallpaper/wallpaper.store';
import { DeviceModeService } from '../overview/device/device-mode.service';

/**
 * 🖥️ ShowcaseWorkspaceStateFacade (SRP / Facade)
 * 쇼케이스 윈도우, 테마, 뷰타입, UI 상태, 시계, 배경화면 및 디바이스 상태 스토어를 전담하는 파사드
 */
@Injectable({ providedIn: 'root' })
export class ShowcaseWorkspaceStateFacade {
  readonly clockStore = inject(OverviewClockStore);
  readonly themeStore = inject(OverviewThemeStore);
  readonly uiState = inject(OverviewUiStateStore);
  readonly viewTypeStore = inject(OverviewViewTypeStore);
  readonly windowStore = inject(OverviewWindowStore);
  readonly wallpaperStore = inject(WallpaperStore);
  readonly deviceModeService = inject(DeviceModeService);
}
