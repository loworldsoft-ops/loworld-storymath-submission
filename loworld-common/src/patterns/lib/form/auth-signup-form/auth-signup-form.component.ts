import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCheckboxComponent } from '../../../../ui/form/checkbox/checkbox.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { SignupSubmitPayload } from '../../../../services/models/auth.model';

/**
 * 사용자 회원가입 및 이용약관 동의 입력을 처리하는 폼 컴포넌트입니다.
 */
@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwInputComponent, LwCheckboxComponent, LwFormFieldComponent],
  selector: 'lw-auth-signup-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-signup-form.component.html',
  styleUrl: './auth-signup-form.component.scss',
})
export class LwAuthSignupFormComponent {
  readonly errorText = input<string | null>(null);
  readonly disabled = input(false);
  readonly submitLabel = input('회원가입');

  readonly submitted = output<SignupSubmitPayload>();

  protected readonly displayName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly acceptTerms = signal(false);

  protected onDisplayNameInput(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.displayName.set(t.value);
  }

  protected onEmailInput(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.email.set(t.value);
  }

  protected onPasswordInput(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.password.set(t.value);
  }

  protected onTermsChange(ev: Event): void {
    const t = ev.target as HTMLInputElement;
    this.acceptTerms.set(t.checked);
  }

  protected onFieldKeydown(ev: KeyboardEvent, nextInput: HTMLInputElement): void {
    if (ev.key === 'Enter') {
      if ((ev as any).isComposing) return;
      ev.preventDefault();
      nextInput.focus();
    }
  }

  protected onSubmit(ev?: Event): void {
    ev?.preventDefault();
    if (this.disabled()) return;
    if (this.password().length < 8) return;
    if (!this.acceptTerms()) return;
    this.submitted.emit({
      displayName: this.displayName().trim(),
      email: this.email().trim().toLowerCase(),
      password: this.password(),
      acceptTerms: this.acceptTerms(),
    });
  }
}