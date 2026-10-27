import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';
import { ConsoleChangeLog } from '../console.models';

/** 변경 이력 표. 권한이 없으면 안내만 보여 준다. */
@Component({
  selector: 'lw-console-change-log',
  standalone: true,
  imports: [LwBadgeComponent, LwEmptyStateComponent],
  templateUrl: './lw-console-change-log.component.html',
  styleUrl: './lw-console-change-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwConsoleChangeLogComponent {
  readonly logs = input<readonly ConsoleChangeLog[]>([]);
  readonly permitted = input<boolean>(true);
}

