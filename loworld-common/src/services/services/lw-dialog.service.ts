import { Injectable, computed, signal } from '@angular/core';
import type { LwAlertDialogOptions, LwConfirmDialogOptions, LwDialogState } from './lw-dialog.model';

@Injectable({ providedIn: 'root' })
export class LwDialogService {
  private readonly _active = signal<LwDialogState | null>(null);
  private readonly _hosts = signal<string[]>([]);
  private pendingResolve: ((value: boolean) => void) | null = null;

  readonly active = this._active.asReadonly();
  readonly hostCount = computed(() => this._hosts().length);
  readonly primaryHostId = computed(() => this._hosts()[0] ?? null);

  /** LwDialogHostComponent 마운트 라이프사이클 관리 (단일 활성 호스트 보장) */
  registerHost(hostId: string = `host-${Math.random().toString(36).slice(2, 9)}`): { hostId: string; unregister: () => void } {
    this._hosts.update((list) => [...list, hostId]);
    let unregistered = false;

    return {
      hostId,
      unregister: () => {
        if (!unregistered) {
          unregistered = true;
          this._hosts.update((list) => list.filter((id) => id !== hostId));
        }
      },
    };
  }

  /** 차단형 확인 — true: 확인, false: 취소·ESC·배경 */
  confirm(options: LwConfirmDialogOptions): Promise<boolean> {
    if (this._active()) {
      return Promise.resolve(false);
    }

    if (this.hostCount() === 0 && typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function') {
      const text = options.detail ? `${options.title}\n\n${options.message}\n\n${options.detail}` : `${options.title}\n\n${options.message}`;
      return Promise.resolve((globalThis as any).confirm(text));
    }

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this._active.set({
        id: this.createDialogId(),
        kind: 'confirm',
        title: options.title,
        message: options.message,
        detail: options.detail,
        confirmLabel: options.confirmLabel ?? '확인',
        cancelLabel: options.cancelLabel ?? '취소',
        tone: options.tone ?? 'default',
      });
    });
  }

  /** 차단형 알림 — 확인 버튼 또는 ESC·배경으로 닫기 */
  alert(options: LwAlertDialogOptions): Promise<void> {
    if (this._active()) {
      return Promise.resolve();
    }

    if (this.hostCount() === 0 && typeof globalThis !== 'undefined' && typeof (globalThis as any).alert === 'function') {
      const text = options.detail ? `${options.title}\n\n${options.message}\n\n${options.detail}` : `${options.title}\n\n${options.message}`;
      (globalThis as any).alert(text);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.pendingResolve = () => resolve();
      this._active.set({
        id: this.createDialogId(),
        kind: 'alert',
        title: options.title,
        message: options.message,
        detail: options.detail,
        confirmLabel: options.confirmLabel ?? '확인',
        tone: options.tone ?? 'default',
      });
    });
  }

  resolve(confirmed: boolean): void {
    const resolve = this.pendingResolve;
    this.pendingResolve = null;
    this._active.set(null);
    resolve?.(confirmed);
  }

  private createDialogId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
