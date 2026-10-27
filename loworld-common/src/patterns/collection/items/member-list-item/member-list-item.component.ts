
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LwMember } from '../../../../services/models/member.model';
import { LwAccountRoleBadgeComponent } from '../../../../ui/data-display/badge/member-role-badge.component';

@Component({
  selector: 'lw-account-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LwAccountRoleBadgeComponent, LwButtonComponent],
  templateUrl: './member-list-item.component.html',
  styleUrl: './member-list-item.component.scss',
})
export class LwAccountRowComponent {
  readonly member = input.required<LwMember>();
  readonly selected = input(false);
  readonly canEdit = input(false);
  readonly canDelete = input(false);

  readonly select = output<string>();
  readonly edit = output<LwMember>();
  readonly delete = output<LwMember>();
}
