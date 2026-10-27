import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, model, output } from '@angular/core';
import { LwAuthLoginFormComponent } from '../../../form/auth-login-form/auth-login-form.component';
import { LwAuthSignupFormComponent } from '../../../form/auth-signup-form/auth-signup-form.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwModalComponent } from '../../../../../ui/overlay/modal/modal.component';
import { LwAvatarComponent } from '../../../../../ui/data-display/avatar/avatar.component';
import { type LwModalWindowStyle } from '../../../../../ui/overlay/modal/modal.types';
import type { LoginSubmitPayload, SignupSubmitPayload } from '../../../../../services/models/auth.model';
import type { LwAccountLoginDialogData } from './member-login-dialog.types';
import { LwLoginModalFacade } from './lw-member-login-dialog.facade';
import { LwAccountLoginDialogService } from './lw-member-login-dialog.service';

/**
 * 단일 통합 포탈 로그인/계정 다이얼로그 컴포넌트
 * - 단일 모달(lw-modal) 기반으로 로그인/계정 폼 제공
 * - 비즈니스 및 상태 관리는 LwLoginModalFacade (SRP & DIP)로 위임
 * - @angular/cdk/dialog 의존성 완전 제거 및 순수 선언형 모달 파이프라인 정립
 */
@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwModalComponent, LwAvatarComponent, LwAuthLoginFormComponent, LwAuthSignupFormComponent],
  selector: 'lw-account-login-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LwLoginModalFacade],
  templateUrl: './lw-member-login-dialog.component.html',
  styleUrl: './lw-member-login-dialog.component.scss',
})
export class LwAccountLoginDialogComponent implements OnInit {
  private readonly dialogService = inject(LwAccountLoginDialogService, { optional: true });
  protected readonly facade = inject(LwLoginModalFacade);

  /** 외부 템플릿 바인딩용 입력값 (선택적) */
  readonly inputData = input<LwAccountLoginDialogData | undefined>(undefined, { alias: 'data' });
  readonly isOpen = model<boolean>(true);
  readonly showContext = input<boolean>(false);
  readonly labelledBy = input<string>('lw-account-login-dialog-title');
  readonly windowControls = input<boolean>(true);
  readonly windowStyle = input<LwModalWindowStyle>('os-desktop');
  readonly draggable = input<boolean>(true);
  readonly showHeader = input<boolean>(true);

  private readonly effectiveServiceData = computed(() => this.dialogService?.data() ?? null);

  readonly resolvedWindowControls = computed(() => {
    const data = this.inputData() ?? this.effectiveServiceData();
    if (data?.windowControls !== undefined) return data.windowControls;
    return this.windowControls();
  });

  readonly resolvedWindowStyle = computed(() => {
    const data = this.inputData() ?? this.effectiveServiceData();
    if (data?.windowStyle !== undefined) return data.windowStyle;
    return this.windowStyle();
  });

  readonly resolvedDraggable = computed(() => {
    const data = this.inputData() ?? this.effectiveServiceData();
    if (data?.draggable !== undefined) return data.draggable;
    return this.draggable();
  });

  readonly resolvedShowHeader = computed(() => {
    const data = this.inputData() ?? this.effectiveServiceData();
    if (data?.showHeader !== undefined) return data.showHeader;
    return this.showHeader();
  });

  /** 모달 닫기 요청 이벤트 */
  readonly closeRequested = output<void>();

  ngOnInit(): void {
    const effectiveData = this.inputData() ?? this.effectiveServiceData() ?? { view: 'auth' };
    this.facade.initialize(effectiveData);
  }

  close(): void {
    this.isOpen.set(false);
    this.closeRequested.emit();
    this.dialogService?.close();
  }

  protected async onLogin(payload: LoginSubmitPayload): Promise<void> {
    const success = await this.facade.login(payload);
    if (success) {
      this.close();
    }
  }

  protected async onSignup(payload: SignupSubmitPayload): Promise<void> {
    const success = await this.facade.signup(payload);
    if (success) {
      this.close();
    }
  }

  protected async onLogout(): Promise<void> {
    await this.facade.logout();
    this.close();
  }

  protected goMain(): void {
    this.facade.goMain();
    this.close();
  }

  protected showAuthPanel(): void {
    this.facade.switchPanel('auth');
  }
}