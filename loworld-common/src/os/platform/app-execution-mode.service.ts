import { Injectable, computed, signal } from '@angular/core';

export interface NativeExecutionModePayload {
  mode?: string;
  isLocal?: boolean;
  isRemote?: boolean;
  displayName?: string;
  localBundle?: string;
  remoteBundle?: string;
}

@Injectable({ providedIn: 'root' })
export class AppExecutionModeService {
  private readonly nativeReportedMode = signal<string | null>(null);

  constructor() {
    this.initNativeListener();
  }

  private initNativeListener(): void {
    if (typeof window === 'undefined') return;

    // Android/iOS 네이티브 브리지로부터 executionMode 메시지 수신 연동
    const prevHandler = (window as any).onAndroidMessage;
    (window as any).onAndroidMessage = (type: string, data: any) => {
      if (typeof prevHandler === 'function') {
        try {
          prevHandler(type, data);
        } catch (e) {
          console.warn('[AppExecutionModeService] Previous onAndroidMessage error:', e);
        }
      }
      if (type === 'executionMode') {
        const payload = data as NativeExecutionModePayload;
        if (payload?.mode) {
          this.nativeReportedMode.set(payload.mode);
        }
      }
    };
  }

  /**
   * 앱(AOS/iOS 네이티브 셸) 내부에서 실행 중인지 여부 감지
   */
  readonly isNativeApp = computed<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.host === 'appassets.androidplatform.net' ||
      typeof (window as any).androidBridge !== 'undefined' ||
      typeof (window as any).loworldNative !== 'undefined'
    );
  });

  /**
   * 현재 로컬 리소스(Local Bundle) 모드인지 여부 (false면 온라인 웹 Live Server)
   */
  readonly isLocalMode = computed<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const reported = this.nativeReportedMode();
    if (reported === 'LOCAL_ASSET') return true;
    if (reported === 'REMOTE_WEB') return false;
    return (
      window.location.host === 'appassets.androidplatform.net' ||
      window.location.protocol === 'file:'
    );
  });

  /**
   * 모드 상태를 나타내는 아이콘 키 (로컬: box, 온라인: globe)
   */
  readonly modeIcon = computed<string>(() => {
    return this.isLocalMode() ? 'box' : 'globe';
  });

  /**
   * 모드 라벨 텍스트
   */
  readonly modeLabel = computed<string>(() => {
    return this.isLocalMode() ? '로컬 리소스' : '온라인 웹';
  });

  /**
   * 툴팁 문구
   */
  readonly modeTooltip = computed<string>(() => {
    return this.isLocalMode()
      ? '로컬 리소스 버전 (클릭하여 온라인 웹 전환)'
      : '온라인 웹 버전 (클릭하여 로컬 리소스 전환)';
  });

  /**
   * 네이티브 실행 모드 선택기(온라인 웹 ↔ 로컬리소스 전환 모달) 열기
   */
  openModeSelector(): void {
    if (typeof window === 'undefined') return;

    const bridge = (window as any).androidBridge;
    if (bridge && typeof bridge.postMessage === 'function') {
      bridge.postMessage(JSON.stringify({ action: 'openModeSelector' }));
      return;
    }

    const legacy = (window as any).loworldNative;
    if (legacy && typeof legacy.postMessage === 'function') {
      legacy.postMessage('openModeSelector', null);
      return;
    }

    console.log('[AppExecutionModeService] openModeSelector called outside native shell.');
  }
}
