import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwAccountLoginDialogComponent } from '../../../../patterns/lib/overlay/dialogs/member-login-dialog/lw-member-login-dialog.component';
import { type LwAccountLoginDialogData } from '../../../../patterns/lib/overlay/dialogs/member-login-dialog/member-login-dialog.types';
import type { LwModalWindowStyle } from '../../../../ui/overlay/modal/modal.types';

/**
 * OS 데스크탑 환경의 로그인 대화상자를 호스팅하는 컴포넌트입니다.
 */
@Component({
  selector: 'lw-os-login-dialog-host',
  standalone: true,
  imports: [LwAccountLoginDialogComponent],
  templateUrl: './overview-login-dialog-host.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewLoginDialogHostComponent {
  readonly data = input.required<LwAccountLoginDialogData>();
  readonly isOpen = input<boolean>(true);
  readonly windowControls = input<boolean>(true);
  readonly windowStyle = input<LwModalWindowStyle>('os-desktop');
  readonly draggable = input<boolean>(true);

  readonly closeRequested = output<void>();
}
