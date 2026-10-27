import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwSlideSwitchComponent } from '../../../../ui/form/slide-switch/slide-switch.component';
import { LwSliderComponent } from '../../../../ui/form/slider/slider.component';
import { WallpaperStore } from './wallpaper.store';
import { WallpaperCategory } from './wallpaper.model';

/** 배경화면 고르기. 고른 배경과 흐림은 데스크톱 OS와 모바일 OS가 함께 쓴다. */
@Component({
  selector: 'lw-os-wallpaper-dialog',
  standalone: true,
  imports: [LwButtonComponent, LwIconComponent, LwModalComponent, LwSlideSwitchComponent, LwSliderComponent],
  templateUrl: './overview-wallpaper-dialog.component.html',
  styleUrl: './overview-wallpaper-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewWallpaperDialogComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewWallpaperDialogComponent', 'OS');

  protected readonly store = inject(WallpaperStore);

  protected readonly categories: readonly { id: WallpaperCategory; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'solid', label: '단색' },
    { id: 'solarpunk', label: '솔라 유토피아' },
    { id: 'spring', label: '봄' },
    { id: 'summer', label: '여름' },
    { id: 'autumn', label: '가을' },
    { id: 'winter', label: '겨울' },
    { id: 'aurora', label: '오로라' },
    { id: 'graphic', label: '그래픽' },
    { id: 'minimal', label: '미니멀' },
  ];

  protected onSelectWallpaper(id: string): void {
    this.store.applyWallpaper(id);
  }

  protected isApplied(id: string): boolean {
    return this.store.effectiveWallpaperId() === id;
  }

  protected onBlurSliderInput(eventOrVal: Event | number): void {
    const val = typeof eventOrVal === 'number' ? eventOrVal : parseFloat((eventOrVal.target as HTMLInputElement).value);
    this.store.setBlur(val);
  }
}
