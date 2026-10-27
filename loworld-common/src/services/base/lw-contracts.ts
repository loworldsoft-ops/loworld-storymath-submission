import { Signal, InputSignal, OutputEmitterRef, ModelSignal } from '@angular/core';
import type { LwSize, LwColor } from '../tokens/global.tokens';
import type { LwActionEvent } from '../models/action-event.model';

/** 테마 반응성 계약 (ISP) */
export interface ILwThemeAware {
  readonly themeMode: Signal<string>;
  readonly isDark: Signal<boolean>;
  readonly resolvedTheme: Signal<string>;
}

/** 크기 규격 계약 (ISP) */
export interface ILwSizeable<TSize extends string = LwSize> {
  readonly size: InputSignal<TSize>;
}

/** 비활성화 제어 계약 (ISP) */
export interface ILwDisableable {
  readonly disabled: InputSignal<boolean>;
}

/** 가시성 제어 계약 (ISP) */
export interface ILwVisible {
  readonly visible: InputSignal<boolean>;
}

/** 사용자 인터랙션 계약 (ISP / LSP) */
export interface ILwInteractive extends ILwDisableable {
  readonly selected: InputSignal<boolean>;
  readonly interactive: InputSignal<boolean>;
  readonly loading: InputSignal<boolean>;
  focus(): void;
}

/** 액션 이벤트 방출 계약 (ISP / LSP) */
export interface ILwActionEmitter<TPayload = any, TAction extends string = string> {
  readonly actionEvent: OutputEmitterRef<LwActionEvent<TPayload, TAction>>;
}

/** 폼 값 컨트롤 계약 (ISP / LSP) */
export interface ILwValueControl<T> extends ILwDisableable {
  readonly value: ModelSignal<T | null>;
  readonly readonly: InputSignal<boolean>;
  readonly placeholder: InputSignal<string>;
}

/** 접이식 패널 계약 (ISP) */
export interface ILwCollapsible {
  readonly collapsed: ModelSignal<boolean>;
  readonly collapsible: InputSignal<boolean>;
  toggleCollapse(): void;
}

/** 모달/오버레이 닫기 계약 (ISP) */
export interface ILwClosable {
  readonly closeRequested: OutputEmitterRef<void>;
}

/** 툴팁 속성 계약 (ISP) */
export interface ILwTooltipAware {
  readonly tooltip: InputSignal<string | null>;
}

/** 모바일 뷰포트 오버라이드 계약 (ISP) */
export interface ILwMobileOverride {
  isMobile?(): boolean;
}

/** 툴팁 해석 결과 계약 (ISP) */
export interface ILwTooltipResolvable {
  resolvedTooltip?(): string | null;
}

/** 가시성 상태 반응성 계약 (ISP) */
export interface ILwVisibleState {
  visible?(): boolean;
}
