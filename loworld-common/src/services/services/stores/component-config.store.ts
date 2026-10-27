import { Injectable, Signal } from '@angular/core';
import { injectLocalStorage } from '../../utils/storage.util';

const TOOLTIPS_ENABLED_STORAGE_KEY = 'loworld-ui.tooltips-enabled';
const BUTTON_TOOLTIPS_ENABLED_STORAGE_KEY = 'loworld-ui.button-tooltips-enabled';
const COMPONENT_TOOLTIPS_ENABLED_STORAGE_KEY = 'loworld-ui.component-tooltips-enabled';
const TITLEBAR_BUTTON_LABELS_ENABLED_STORAGE_KEY = 'loworld-ui.titlebar-button-labels-enabled';
const CONSOLE_LOGS_ENABLED_STORAGE_KEY = 'loworld-ui.console-logs-enabled';

/**
 * 전역 컴포넌트 프레임워크 런타임 설정 스토어 (Component Config Store)
 * SRP: 컴포넌트 공통 상속 계층의 툴팁 팝업 제어(버튼 설명 툴팁 vs 컴포넌트 메타 툴팁 분리),
 * 타이틀바 버튼 라벨 노출 제어, 개발 콘솔 로깅(텔레메트리) On/Off 상태 관리 및 LocalStorage 영속화.
 */
@Injectable({ providedIn: 'root' })
export class LwComponentConfigStore {
  private static _instance: LwComponentConfigStore | null = null;

  /** 전체 툴팁 마스터 스토리지 (기본: false) */
  private readonly _tooltipsStorage = injectLocalStorage<boolean>(
    TOOLTIPS_ENABLED_STORAGE_KEY,
    false
  );

  /** 버튼 기능 기본 설명 툴팁 스토리지 (기본: false) */
  private readonly _buttonTooltipsStorage = injectLocalStorage<boolean>(
    BUTTON_TOOLTIPS_ENABLED_STORAGE_KEY,
    false
  );

  /** 컴포넌트 아키텍처/엔지니어링 메타 툴팁 ([LwButton] variant: ... 등) 스토리지 (기본: false) */
  private readonly _componentTooltipsStorage = injectLocalStorage<boolean>(
    COMPONENT_TOOLTIPS_ENABLED_STORAGE_KEY,
    false
  );

  /** 타이틀바 액션 버튼의 텍스트 라벨 노출 여부 (기본: false - 아이콘 전용) */
  private readonly _titlebarButtonLabelsStorage = injectLocalStorage<boolean>(
    TITLEBAR_BUTTON_LABELS_ENABLED_STORAGE_KEY,
    false
  );

  private readonly _consoleLogsStorage = injectLocalStorage<boolean>(
    CONSOLE_LOGS_ENABLED_STORAGE_KEY,
    false
  );

  /** 전체 툴팁 활성화 여부 (마스터) */
  readonly tooltipsEnabled: Signal<boolean> = this._tooltipsStorage.value;
  /** 버튼 기능 기본 설명 툴팁 활성화 여부 */
  readonly buttonTooltipsEnabled: Signal<boolean> = this._buttonTooltipsStorage.value;
  /** 컴포넌트 메타 툴팁([LwButton] 등) 활성화 여부 */
  readonly componentTooltipsEnabled: Signal<boolean> = this._componentTooltipsStorage.value;
  /** 타이틀바 액션 버튼 텍스트 라벨 노출 여부 (false 시 아이콘만 노출) */
  readonly titlebarButtonLabelsEnabled: Signal<boolean> = this._titlebarButtonLabelsStorage.value;
  /** 개발자 콘솔 로깅 텔레메트리 활성화 여부 */
  readonly consoleLogsEnabled: Signal<boolean> = this._consoleLogsStorage.value;

  constructor() {
    LwComponentConfigStore._instance = this;
  }

  /**
   * @deprecated Dependency Injection 안티패턴 방지를 위해 inject(LwComponentConfigStore) 주입을 권장합니다.
   * 기존 비-DI 정적 컨텍스트 호환성을 위해 유지됩니다.
   */
  public static getInstance(): LwComponentConfigStore | null {
    return LwComponentConfigStore._instance;
  }

  /**
   * 전체 툴팁 표시 여부 설정
   */
  public setTooltipsEnabled(enabled: boolean): void {
    this._tooltipsStorage.set(enabled);
  }

  /**
   * 전체 툴팁 표시 여부 토글
   */
  public toggleTooltips(): void {
    this._tooltipsStorage.set(!this.tooltipsEnabled());
  }

  /**
   * 버튼 기능 기본 설명 툴팁 표시 여부 설정
   */
  public setButtonTooltipsEnabled(enabled: boolean): void {
    this._buttonTooltipsStorage.set(enabled);
  }

  /**
   * 버튼 기능 기본 설명 툴팁 토글
   */
  public toggleButtonTooltips(): void {
    this._buttonTooltipsStorage.set(!this.buttonTooltipsEnabled());
  }

  /**
   * 컴포넌트 메타 툴팁 표시 여부 설정
   */
  public setComponentTooltipsEnabled(enabled: boolean): void {
    this._componentTooltipsStorage.set(enabled);
  }

  /**
   * 컴포넌트 메타 툴팁 토글
   */
  public toggleComponentTooltips(): void {
    this._componentTooltipsStorage.set(!this.componentTooltipsEnabled());
  }

  /**
   * 타이틀바 버튼 텍스트 라벨 표시 여부 설정
   */
  public setTitlebarButtonLabelsEnabled(enabled: boolean): void {
    this._titlebarButtonLabelsStorage.set(enabled);
  }

  /**
   * 타이틀바 버튼 텍스트 라벨 토글
   */
  public toggleTitlebarButtonLabels(): void {
    this._titlebarButtonLabelsStorage.set(!this.titlebarButtonLabelsEnabled());
  }

  /**
   * 콘솔 로깅 출력 여부 설정
   */
  public setConsoleLogsEnabled(enabled: boolean): void {
    this._consoleLogsStorage.set(enabled);
  }

  /**
   * 콘솔 로깅 출력 여부 토글
   */
  public toggleConsoleLogs(): void {
    this._consoleLogsStorage.set(!this.consoleLogsEnabled());
  }
}
