import { type LwMemberRole, LW_MEMBER_ROLE_LABELS } from '../../../services/models/member.model';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'lw-account-role-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './member-role-badge.component.html',
  styleUrl: './member-role-badge.component.scss',
})
export class LwAccountRoleBadgeComponent {
  readonly role = input.required<LwMemberRole>();
  readonly label = computed(() => LW_MEMBER_ROLE_LABELS[this.role()]);
}
