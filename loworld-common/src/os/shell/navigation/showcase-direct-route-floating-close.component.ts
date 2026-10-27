import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { OverviewWindowFloatingCloseComponent } from '../overview/window-system/overview-window-floating-close.component';

/** Overview 창 프레임 밖(직접 라우트)에서 데모를 닫고 Overview로 돌아가는 플로팅 닫기 */
@Component({
  selector: 'lw-showcase-direct-route-floating-close',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverviewWindowFloatingCloseComponent],
  templateUrl: './showcase-direct-route-floating-close.component.html',
  styleUrl: './showcase-direct-route-floating-close.component.scss',
})
export class ShowcaseDirectRouteFloatingCloseComponent {
  closeRequested = output<void>();
}
