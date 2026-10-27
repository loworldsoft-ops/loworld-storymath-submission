import { Injectable, signal, computed } from '@angular/core';
import type { LwMobileAppControlAction, LwMobileAppControlPayload } from '../models/mobile-app-control.model';

@Injectable({ providedIn: 'root' })
export class LwMobileAppControlService {
  /** 앱별 등록된 제어 메뉴 페이로드 맵 */
  private readonly appPayloadsSignal = signal<ReadonlyMap<string, LwMobileAppControlPayload>>(new Map());

  /** 현재 활성화된 앱 식별자 */
  private readonly activeAppIdSignal = signal<string | null>(null);

  /** 단일 호환용 최신 페이로드 시그널 */
  private readonly controlPayloadSignal = signal<LwMobileAppControlPayload | null>(null);

  /** 현재 활성화된 앱 ID (읽기 전용) */
  readonly activeAppId = this.activeAppIdSignal.asReadonly();

  /** 현재 등록된 제어 메뉴 페이로드 (읽기 전용, 활성 앱 기준 격리 반환) */
  readonly currentPayload = computed<LwMobileAppControlPayload | null>(() => {
    const activeApp = this.activeAppIdSignal();
    if (activeApp) {
      const payload = this.appPayloadsSignal().get(activeApp);
      if (payload) return payload;
    }
    return this.controlPayloadSignal();
  });

  /** 현재 상황별 커스텀 액션 목록 */
  readonly customActions = computed<readonly LwMobileAppControlAction[] | null>(() => {
    return this.currentPayload()?.actions ?? null;
  });

  /** 상단 헤더 간소화 활성화 여부 */
  readonly isHeaderStreamlined = computed<boolean>(() => {
    return this.currentPayload()?.streamlineHeader ?? false;
  });

  /** 현재 활성화된 모달 또는 바텀시트 오버레이 식별자 */
  readonly activeOverlayId = computed<string | null>(() => {
    return this.currentPayload()?.activeOverlayId ?? null;
  });

  /** 🌟 현재 모바일 바텀시트 열림 상태 시그널 (하단 바 하강 트리거용) */
  private readonly isBottomSheetOpenSignal = signal<boolean>(false);
  readonly isBottomSheetOpen = this.isBottomSheetOpenSignal.asReadonly();

  /** 바텀시트 열림 상태 업데이트 */
  setBottomSheetOpen(isOpen: boolean): void {
    this.isBottomSheetOpenSignal.set(isOpen);
  }

  /**
   * 현재 활성 앱 식별자 지정 (윈도우 전환 시 호출)
   */
  setActiveApp(appId: string | null): void {
    this.activeAppIdSignal.set(appId);
  }

  /**
   * 특정 앱에 등록된 제어 메뉴 페이로드 조회
   */
  getPayloadForApp(appId: string): LwMobileAppControlPayload | null {
    return this.appPayloadsSignal().get(appId) ?? (this.controlPayloadSignal()?.appId === appId ? this.controlPayloadSignal() : null);
  }

  /**
   * 앱 상황별 제어 메뉴 등록
   */
  setAppControlMenu(payload: LwMobileAppControlPayload | null): void {
    this.controlPayloadSignal.set(payload);
    if (payload?.appId) {
      this.appPayloadsSignal.update(map => {
        const next = new Map(map);
        next.set(payload.appId, payload);
        return next;
      });
      if (!this.activeAppIdSignal()) {
        this.activeAppIdSignal.set(payload.appId);
      }
    }
  }

  /**
   * 활성화된 오버레이 ID 업데이트 (예: 'character', 'viewer-settings')
   */
  setActiveOverlay(overlayId: string | null, onDismiss?: () => void): void {
    const activeApp = this.activeAppIdSignal();
    if (activeApp && this.appPayloadsSignal().has(activeApp)) {
      this.appPayloadsSignal.update(map => {
        const current = map.get(activeApp);
        if (!current) return map;
        const next = new Map(map);
        next.set(activeApp, {
          ...current,
          activeOverlayId: overlayId,
          onOverlayDismiss: onDismiss ?? current.onOverlayDismiss,
        });
        return next;
      });
    }

    this.controlPayloadSignal.update(current => {
      if (!current) return current;
      return {
        ...current,
        activeOverlayId: overlayId,
        onOverlayDismiss: onDismiss ?? current.onOverlayDismiss,
      };
    });
  }

  /**
   * 현재 열린 오버레이 닫기 요청
   */
  dismissActiveOverlay(): void {
    const payload = this.currentPayload();
    if (payload?.onOverlayDismiss) {
      payload.onOverlayDismiss();
    }
    this.setActiveOverlay(null);
  }

  /**
   * 제어 메뉴 초기화 (앱 종료 또는 기본 OS 상태 복귀 시)
   */
  clearAppControlMenu(appId?: string): void {
    if (!appId) {
      this.controlPayloadSignal.set(null);
      this.appPayloadsSignal.set(new Map());
      this.activeAppIdSignal.set(null);
      return;
    }

    this.appPayloadsSignal.update(map => {
      if (!map.has(appId)) return map;
      const next = new Map(map);
      next.delete(appId);
      return next;
    });

    if (this.controlPayloadSignal()?.appId === appId) {
      this.controlPayloadSignal.set(null);
    }
    if (this.activeAppIdSignal() === appId) {
      this.activeAppIdSignal.set(null);
    }
  }

  /**
   * 액션 실행
   */
  executeAction(actionId: string): void {
    const payload = this.currentPayload();
    if (!payload) return;

    const action = payload.actions.find(a => a.id === actionId);
    if (action?.handler) {
      action.handler();
    }
    if (payload.onAction) {
      payload.onAction(actionId);
    }
  }
}
