import { Injectable, signal } from '@angular/core';
import type { AuthShellMode } from '../../../../../services/models/auth.model';
import type { LwModalWindowStyle } from '../../../../../ui/overlay/modal/modal.types';
import type { LwAccountLoginDialogData } from './member-login-dialog.types';

export type { LwAccountLoginDialogData } from './member-login-dialog.types';

export interface LwAccountLoginDialogOpenOptions {
  initialMode?: AuthShellMode;
  mainActionLabel?: string;
  /** 회원가입 탭을 보일지 (기본 true) */
  allowSignup?: boolean;
  themeMode?: 'light' | 'dark';
  windowControls?: boolean;
  windowStyle?: LwModalWindowStyle;
  draggable?: boolean;
  showHeader?: boolean;
}

/**
 * 🪟 LwAccountLoginDialogService
 * - @angular/cdk/dialog 의존성을 완전히 제거하고 순수 Angular Signal 기반으로 다이얼로그 상태를 관리합니다.
 * - cdk-dialog-container로 인한 레이어 가림 및 z-index 간섭을 원천 차단합니다.
 */
@Injectable({ providedIn: 'root' })
export class LwAccountLoginDialogService {
  readonly isOpen = signal<boolean>(false);
  readonly data = signal<LwAccountLoginDialogData | null>(null);

  openAuth(options?: LwAccountLoginDialogOpenOptions): void {
    const initialMode = options?.initialMode ?? 'login';
    this.data.set({
      view: 'auth',
      initialMode,
      mainActionLabel: options?.mainActionLabel,
      allowSignup: options?.allowSignup,
      themeMode: options?.themeMode,
      windowControls: options?.windowControls ?? true,
      windowStyle: options?.windowStyle ?? 'os-desktop',
      draggable: options?.draggable ?? true,
      showHeader: options?.showHeader ?? true,
    } satisfies LwAccountLoginDialogData);
    this.isOpen.set(true);
  }

  openSummary(options?: Omit<LwAccountLoginDialogOpenOptions, 'initialMode'>): void {
    this.data.set({
      view: 'summary',
      mainActionLabel: options?.mainActionLabel,
      allowSignup: options?.allowSignup,
      themeMode: options?.themeMode,
      windowControls: options?.windowControls ?? true,
      windowStyle: options?.windowStyle ?? 'os-desktop',
      draggable: options?.draggable ?? true,
      showHeader: options?.showHeader ?? true,
    } satisfies LwAccountLoginDialogData);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
