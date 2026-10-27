import { ChangeDetectionStrategy, Component, input, model, output, viewChild } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { LwSwipeTrackDirective } from '../../../../ui/gesture/lw-swipe-track.directive';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import type { OsAppPage, OsAppTile } from './os-app.types';

/**
 * 홈 화면의 앱 격자. 데스크톱 홈과 모바일 홈이 함께 쓴다.
 *
 * 페이지를 한 장씩 가로로 넘긴다. 페이지마다 위에 분류 이름을 적고, 아래 가운데 점으로 지금 페이지를 보여 준다.
 * 칸 크기는 `--os-app-tile`, 아이콘 크기는 `--os-app-icon`으로 바깥에서 정한다.
 */
@Component({
  selector: 'lw-os-app-grid',
  standalone: true,
  imports: [LwButtonComponent, LwIconComponent, LwPressableDirective, LwSwipeTrackDirective, LwTooltipDirective],
  templateUrl: './os-app-grid.component.html',
  styleUrl: './os-app-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsAppGridComponent {
  readonly pages = input.required<readonly OsAppPage[]>();
  readonly pageIndex = model<number>(0);
  readonly appOpen = output<OsAppTile>();
  readonly emptyAction = output<OsAppPage>();

  private readonly track = viewChild<LwSwipeTrackDirective>('track');

  goTo(index: number): void {
    const last = this.pages().length - 1;
    this.track()?.goTo(Math.max(0, Math.min(last, index)));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.goTo(this.pageIndex() + 1);
    else if (event.key === 'ArrowLeft') this.goTo(this.pageIndex() - 1);
  }
}
