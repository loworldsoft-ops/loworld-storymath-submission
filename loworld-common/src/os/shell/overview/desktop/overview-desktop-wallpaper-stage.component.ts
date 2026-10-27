import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { WallpaperStore } from '../wallpaper/wallpaper.store';

/**
 * 🖼️ OverviewDesktopWallpaperStageComponent (SRP)
 *
 * 데스크톱 가상 OS의 배경화면 렌더링, 블러 필터 및 비네트 비주얼 효과를 전담 캡슐화합니다.
 */
@Component({
  selector: 'lw-os-desktop-wallpaper-stage',
  standalone: true,
  templateUrl: './overview-desktop-wallpaper-stage.component.html',
  styleUrl: './overview-desktop-wallpaper-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewDesktopWallpaperStageComponent {
  protected readonly wallpaperStore = inject(WallpaperStore);
}
