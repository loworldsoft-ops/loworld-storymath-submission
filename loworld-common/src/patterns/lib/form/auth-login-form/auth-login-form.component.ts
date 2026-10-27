import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { LoginSubmitPayload } from '../../../../services/models/auth.model';

/**
 * 이메일 및 비밀번호 입력, 유효성 검증을 제공하는 사용자 로그인 폼 컴포넌트입니다.
 */
@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwFormFieldComponent, LwInputComponent],
  selector: 'lw-auth-login-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-login-form.component.html',
  styleUrl: './auth-login-form.component.scss',
})
export class LwAuthLoginFormComponent {
  readonly errorText = input<string | null>(null);
  readonly disabled = input(false);
  readonly submitLabel = input('로그인');

  readonly submitted = output<LoginSubmitPayload>();

  protected readonly email = signal('');
  protected readonly password = signal('');

  protected onEmailInput(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.email.set(t.value);
  }

  protected onPasswordInput(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.password.set(t.value);
  }

  protected onEmailKeydown(ev: KeyboardEvent, passwordInput: HTMLInputElement): void {
    if (ev.key === 'Enter') {
      if ((ev as any).isComposing) return;
      if (!this.password()) {
        ev.preventDefault();
        passwordInput.focus();
      }
    }
  }

  protected onSubmit(ev?: Event): void {
    ev?.preventDefault();
    if (this.disabled()) return;

    let emailVal = this.email().trim();
    let passVal = this.password();

    if (ev?.target instanceof HTMLFormElement) {
      const emailEl = ev.target.querySelector<HTMLInputElement>('#lw-auth-login-email');
      const passEl = ev.target.querySelector<HTMLInputElement>('#lw-auth-login-password');
      if (emailEl?.value && !emailVal) {
        emailVal = emailEl.value.trim();
      }
      if (passEl?.value && !passVal) {
        passVal = passEl.value;
      }
    }

    if (!emailVal || !passVal) return;

    this.submitted.emit({
      email: emailVal,
      password: passVal,
      rememberMe: undefined,
    });
  }
}