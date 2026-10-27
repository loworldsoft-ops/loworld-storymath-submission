import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import type { OsDockItem } from './os-app.types';

/**
 * 독. 자주 여는 앱을 한 줄로 놓는다. 데스크톱과 모바일 홈이 함께 쓴다.
 * 항목 크기는 `--os-dock-item`(기본 44px)으로 바깥에서 정한다.
 */
@Component({
  selector: 'lw-os-dock',
  standalone: true,
  imports: [LwIconComponent, LwPressableDirective, LwTooltipDirective],
  templateUrl: './os-dock.component.html',
  styleUrl: './os-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsDockComponent {
  readonly items = input.required<readonly OsDockItem[]>();
  readonly label = input<string>('독');
  readonly itemSelect = output<string>();
}
