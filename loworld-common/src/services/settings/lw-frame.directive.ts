import { Directive, computed, inject } from '@angular/core';
import { LW_FRAME_APP_DEFAULTS, LW_FRAME_DEFAULT_SETTINGS, LwFrameSettingsStore, type LwFrameSettings } from './lw-frame-settings';

/**
 * 틀을 그리는 부품에 붙인다(hostDirectives). 틀의 설정을 요소의 속성으로 찍어 주고, 부품의 스타일이 그것을 읽는다.
 * 앱의 기본값은 이 틀이 놓인 자리에서 찾는다. OS 화면은 창마다 그 앱의 기본값을 넣어 주므로,
 * 여러 앱이 함께 떠 있어도 틀은 자기 앱의 기본값을 쓴다. 사용자가 바꾼 값이 그 위에 덮인다.
 */
@Directive({
  selector: '[lwFrame]',
  host: {
    '[attr.data-frame-nav-side]': 'value().navSide',
    '[attr.data-frame-nav]': 'value().nav',
    '[attr.data-frame-header]': 'value().header',
    '[attr.data-frame-nav-width]': 'value().navWidth',
    '[attr.data-frame-density]': 'value().density',
    '[attr.data-frame-header-variant]': 'value().headerVariant',
    '[attr.data-frame-nav-variant]': 'value().navVariant',
    '[attr.data-frame-bottom-bar]': 'value().bottomBar',
    '[attr.data-frame-bottom-bar-variant]': 'value().bottomBarVariant',
  },
})
export class LwFrameDirective {
  private readonly store = inject(LwFrameSettingsStore);
  private readonly appDefaults = inject(LW_FRAME_APP_DEFAULTS);
  protected readonly value = computed<LwFrameSettings>(() => ({ ...LW_FRAME_DEFAULT_SETTINGS, ...this.appDefaults, ...this.store.userValue() }));
}
