import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OverviewIconId } from '../../../../services/models/os.types';

@Component({
  selector: 'lw-os-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './overview-icon.component.html',
  styleUrl: './overview-icon.component.scss',
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[attr.aria-hidden]': 'decorative()',
  },
})
export class OverviewIconComponent {
  icon = input.required<OverviewIconId>();
  size = input(20);
  decorative = input(true);
  label = input('');
}