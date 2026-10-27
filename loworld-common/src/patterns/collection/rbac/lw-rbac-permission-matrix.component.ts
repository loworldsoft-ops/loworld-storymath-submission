import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwCheckboxComponent } from '../../../ui/form/checkbox/checkbox.component';
import { LwIconComponent } from '../../../ui/media/icon/icon.component';
import { OrgRole, OrgRoleId, RbacRoleMatrixRow } from '../console/console.models';

@Component({
  selector: 'lw-rbac-permission-matrix',
  standalone: true,
  imports: [LwCheckboxComponent, LwIconComponent],
  templateUrl: './lw-rbac-permission-matrix.component.html',
  styleUrl: './lw-rbac-permission-matrix.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRbacPermissionMatrixComponent {
  readonly matrix = input<readonly RbacRoleMatrixRow[]>([]);
  readonly roles = input<readonly OrgRole[]>([]);
  readonly readonly = input<boolean>(false);

  readonly togglePermission = output<{ domain: string; role: OrgRoleId; value: boolean }>();
}
