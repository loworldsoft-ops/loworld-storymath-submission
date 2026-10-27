import { Injectable, inject } from '@angular/core';
import { SaveFeedbackService } from './save-feedback.service';
import { LwDialogService } from './lw-dialog.service';
import type { LwAlertDialogOptions, LwConfirmDialogOptions } from './lw-dialog.model';
import type { SaveFeedbackMessages } from './save-feedback.model';

/**
 * 앱 전역 UI 피드백 진입점 — 토스트(SaveFeedback) + 모달(LwDialog) 통합.
 * feature 코드는 가능하면 window.confirm / 개별 lw-modal 대신 이 서비스를 사용한다.
 */
@Injectable({ providedIn: 'root' })
export class LwUiFeedbackService {
  private readonly toast = inject(SaveFeedbackService);
  private readonly dialog = inject(LwDialogService);

  showSaving(message?: string, sourceId?: string): void {
    this.toast.showSaving(message, sourceId);
  }

  showSuccess(message?: string, sourceId?: string): void {
    this.toast.showSaved(message, sourceId);
  }

  showError(message?: string, sourceId?: string): void {
    this.toast.showError(message, sourceId);
  }

  showInfo(message: string, sourceId?: string): void {
    this.toast.showInfo(message, sourceId);
  }

  showWarning(message: string, sourceId?: string): void {
    this.toast.showInfo(message, sourceId);
  }

  showAuthRequired(message?: string, sourceId?: string, force = false): boolean {
    return this.toast.showAuthRequired(message, sourceId, force);
  }

  dismissToast(): void {
    this.toast.dismiss();
  }

  async runSave<T>(
    sourceId: string,
    task: () => Promise<T>,
    messages?: Partial<SaveFeedbackMessages>,
  ): Promise<T> {
    return this.toast.runSave(sourceId, task, messages);
  }

  confirm(options: LwConfirmDialogOptions): Promise<boolean> {
    return this.dialog.confirm(options);
  }

  alert(options: LwAlertDialogOptions): Promise<void> {
    return this.dialog.alert(options);
  }
}
