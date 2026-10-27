import { Injectable, inject } from '@angular/core';
import { LwUiFeedbackService } from '../../../services/services/lw-ui-feedback.service';
import { EVENT_LOGGER } from '../../../services/tokens/event-logger.token';
import { AppModalCoordinatorService } from '../services/app-modal-coordinator.service';
import type { LwAccountLoginDialogData } from '../../../patterns/lib/overlay/dialogs/member-login-dialog/member-login-dialog.types';

/**
 * GlobalNotificationOrchestrator
 * 전역 UI 피드백(알림/토스트/컨펌), 모달 다이얼로그, 이벤트 로깅을 오케스트레이션하는 단일 접점
 */
@Injectable({ providedIn: 'root' })
export class GlobalNotificationOrchestrator {
  readonly ui = inject(LwUiFeedbackService);
  readonly log = inject(EVENT_LOGGER);
  readonly modalCoordinator = inject(AppModalCoordinatorService);

  readonly isOverviewSettingsOpen = this.modalCoordinator.isOverviewSettingsOpen;
  readonly isOverviewMobileLoginOpen = this.modalCoordinator.isOverviewMobileLoginOpen;
  readonly overviewMobileLoginData = this.modalCoordinator.overviewMobileLoginData;
  readonly isLoginDialogOpen = this.modalCoordinator.isLoginDialogOpen;
  readonly loginDialogData = this.modalCoordinator.loginDialogData;

  toggleOverviewSettings(): void {
    this.modalCoordinator.toggleOverviewSettings();
  }

  closeOverviewSettings(): void {
    this.modalCoordinator.closeOverviewSettings();
  }

  openMemberLogin(isMobile: boolean, themeMode: 'dark' | 'light'): void {
    this.modalCoordinator.openMemberLogin(isMobile, themeMode);
  }

  openMemberAccount(options: Parameters<AppModalCoordinatorService['openMemberAccount']>[0]): void {
    this.modalCoordinator.openMemberAccount(options);
  }

  closeLoginDialog(): void {
    this.modalCoordinator.closeLoginDialog();
  }

  closeOverviewMobileLogin(): void {
    this.modalCoordinator.closeOverviewMobileLogin();
  }

  logout(): void {
    this.modalCoordinator.logout();
  }

  confirm(options: Parameters<LwUiFeedbackService['confirm']>[0]): Promise<boolean> {
    return this.ui.confirm(options);
  }

  showSuccess(message: string): void {
    this.ui.showSuccess(message);
  }

  showError(message: string): void {
    this.ui.showError(message);
  }

  showInfo(message: string, tag?: string): void {
    this.ui.showInfo(message, tag);
  }
}
