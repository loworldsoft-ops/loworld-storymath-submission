import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';

import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';

/**
 * 문서의 비밀번호 보호를 설정하거나 해제하는 모달 다이얼로그 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-password-dialog',
  standalone: true,
  imports: [LwModalComponent, LwButtonComponent, LwInputComponent, LwFormFieldComponent],
  templateUrl: './document-password-dialog.component.html',
  styleUrl: './document-password-dialog.component.scss',
})
export class LwDocumentPasswordDialogComponent {
  readonly currentPassword = input<string>('');
  readonly save = output<string>();
  readonly close = output();

  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly mismatch = signal(false);

  constructor() {

    effect(() => {
      const value = this.currentPassword();
      this.password.set(value);
      this.confirmPassword.set(value);
      this.mismatch.set(false);
    });
  }

  savePassword(): void {
    if (this.password() !== this.confirmPassword()) {
      this.mismatch.set(true);
      return;
    }
    this.save.emit(this.password());
  }
}
