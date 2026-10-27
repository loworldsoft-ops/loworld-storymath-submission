import { Injectable, signal } from '@angular/core';
import { DEFAULT_SAVE_FEEDBACK_MESSAGES, type SaveFeedbackKind, type SaveFeedbackMessages, type SaveFeedbackPayload, type SaveFeedbackToast } from './save-feedback.model';

const DEFAULT_DURATION_MS: Record<SaveFeedbackKind, number> = {
  saving: 0,
  saved: 2500,
  error: 4500,
  auth_required: 5000,
  info: 3000,
};

const AUTH_REQUIRED_DEDUPE_MS = 8000;

@Injectable({ providedIn: 'root' })
export class SaveFeedbackService {
  private readonly _active = signal<SaveFeedbackToast | null>(null);
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly lastAuthRequiredAt = new Map<string, number>();

  readonly active = this._active.asReadonly();

  show(payload: SaveFeedbackPayload): void {
    this.clearDismissTimer();

    this._active.set({
      kind: payload.kind,
      message: payload.message,
      sourceId: payload.sourceId,
    });

    const durationMs = payload.durationMs ?? DEFAULT_DURATION_MS[payload.kind];
    if (durationMs > 0) {
      this.dismissTimer = setTimeout(() => this.dismiss(), durationMs);
    }
  }

  dismiss(): void {
    this.clearDismissTimer();
    this._active.set(null);
  }

  showSaving(message = DEFAULT_SAVE_FEEDBACK_MESSAGES.saving, sourceId?: string): void {
    this.show({ kind: 'saving', message, sourceId, durationMs: 0 });
  }

  showSaved(message = DEFAULT_SAVE_FEEDBACK_MESSAGES.saved, sourceId?: string): void {
    this.show({ kind: 'saved', message, sourceId });
  }

  showError(message = DEFAULT_SAVE_FEEDBACK_MESSAGES.error, sourceId?: string): void {
    this.show({ kind: 'error', message, sourceId });
  }

  showInfo(message: string, sourceId?: string): void {
    this.show({ kind: 'info', message, sourceId });
  }

  showAuthRequired(
    message = DEFAULT_SAVE_FEEDBACK_MESSAGES.authRequired,
    sourceId?: string,
    force = false,
  ): boolean {
    const key = sourceId ?? '__global__';
    const now = Date.now();
    const last = this.lastAuthRequiredAt.get(key) ?? 0;
    if (!force && now - last < AUTH_REQUIRED_DEDUPE_MS) {
      return false;
    }

    this.lastAuthRequiredAt.set(key, now);
    this.show({ kind: 'auth_required', message, sourceId });
    return true;
  }

  notifySkippedDueToAuth(sourceId: string, message?: string): void {
    this.showAuthRequired(message ?? DEFAULT_SAVE_FEEDBACK_MESSAGES.authRequired, sourceId);
  }

  async runSave<T>(
    sourceId: string,
    task: () => Promise<T>,
    messages?: Partial<SaveFeedbackMessages>,
  ): Promise<T> {
    this.showSaving(messages?.saving, sourceId);
    try {
      const result = await task();
      this.showSaved(messages?.saved, sourceId);
      return result;
    } catch (error) {
      this.showError(messages?.error, sourceId);
      throw error;
    }
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
