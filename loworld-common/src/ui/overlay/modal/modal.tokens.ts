import { InjectionToken } from '@angular/core';

/** 모달을 띄우는 모양. 'window'는 가운데 창, 'sheet'는 아래에서 올라오는 바텀시트. */
export type LwModalPresentation = 'window' | 'sheet';

/**
 * 앱 전체 `lw-modal`의 기본 모양. 주지 않으면 'window'다.
 * 모달마다 `presentation` 입력으로 따로 정할 수 있다.
 *
 *   providers: [{ provide: LW_MODAL_PRESENTATION, useValue: 'sheet' }]
 */
export const LW_MODAL_PRESENTATION = new InjectionToken<LwModalPresentation>('LW_MODAL_PRESENTATION');
