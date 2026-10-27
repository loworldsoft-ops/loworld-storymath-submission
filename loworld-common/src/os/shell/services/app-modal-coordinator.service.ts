import { Injectable, signal, inject, computed } from '@angular/core';
import { LwAccountLoginDialogService } from '../../../patterns/lib/overlay/dialogs/member-login-dialog/lw-member-login-dialog.service';
import { type LwAccountLoginDialogData } from '../../../patterns/lib/overlay/dialogs/member-login-dialog/member-login-dialog.types';
import { LW_ACCOUNT_LOGIN_BRIDGE } from '../../../services/tokens/member-login-bridge.token';

/**
 * 🪟 AppModalCoordinatorService (SRP)
 * 쇼케이스 애플리케이션의 설정 모달, 모바일 로그인 시트 및 계정 인증 다이얼로그 상태를 전담 조정합니다.
 * @angular/cdk/dialog를 완전히 제거하고 통합 Signal 기반 모달 파이프라인을 운영합니다.
 */
@Injectable({
  providedIn: 'root',
})
export class AppModalCoordinatorService {
  private readonly memberLoginDialog = inject(LwAccountLoginDialogService);
  private readonly memberLoginBridge = inject(LW_ACCOUNT_LOGIN_BRIDGE);

  /** 통합 설정 모달 오픈 여부 */
  readonly isOverviewSettingsOpen = signal(false);

  /** 
   * 통합 로그인/계정 다이얼로그 상태
   * LwAccountLoginDialogService(라이브러리 서비스)와 완벽 동기화
   */
  readonly isLoginDialogOpen = computed(() => this.memberLoginDialog.isOpen());
  readonly loginDialogData = computed<LwAccountLoginDialogData>(() => this.memberLoginDialog.data() ?? { view: 'auth' });

  /** 하위 호환성 (모바일 로그인 시트와 동일 취급) */
  readonly isOverviewMobileLoginOpen = this.isLoginDialogOpen;
  readonly overviewMobileLoginData = this.loginDialogData;

  /** 설정 모달 토글 */
  toggleOverviewSettings(): void {
    this.isOverviewSettingsOpen.update((v) => !v);
  }

  /** 설정 모달 닫기 */
  closeOverviewSettings(): void {
    this.isOverviewSettingsOpen.set(false);
  }

  /** 설정 모달 열기 */
  openOverviewSettings(): void {
    this.isOverviewSettingsOpen.set(true);
  }

  /** 로그인/계정 다이얼로그 닫기 */
  closeLoginDialog(): void {
    this.memberLoginDialog.close();
  }

  /** 모바일 로그인 시트 닫기 (하위 호환) */
  closeOverviewMobileLogin(): void {
    this.closeLoginDialog();
  }

  /** 회원 로그인 다이얼로그 / 모바일 시트 열기 */
  openMemberLogin(isMobile: boolean, themeMode: 'light' | 'dark'): void {
    this.memberLoginDialog.openAuth({
      allowSignup: false,
      themeMode,
      windowControls: !isMobile,
      windowStyle: isMobile ? 'standard' : 'os-desktop',
      draggable: !isMobile,
    });
  }

  /** 회원 계정 요약 다이얼로그 / 모바일 시트 열기 */
  openMemberAccount(params: {
    isMobile: boolean;
    hasAccount: boolean;
    canAccessDb: boolean;
    themeMode: 'light' | 'dark';
  }): void {
    const { isMobile, hasAccount, canAccessDb, themeMode } = params;

    if (hasAccount) {
      this.memberLoginDialog.openSummary({
        allowSignup: false,
        ...(canAccessDb ? { mainActionLabel: '통합 디비 콘솔 열기' } : {}),
        themeMode,
        windowControls: !isMobile,
        windowStyle: isMobile ? 'standard' : 'os-desktop',
        draggable: !isMobile,
      });
      return;
    }

    this.memberLoginDialog.openAuth({
      allowSignup: false,
      themeMode,
      windowControls: !isMobile,
      windowStyle: isMobile ? 'standard' : 'os-desktop',
      draggable: !isMobile,
    });
  }

  /** 회원 로그아웃 실행 */
  logout(): void {
    void this.memberLoginBridge.logout();
  }
}
