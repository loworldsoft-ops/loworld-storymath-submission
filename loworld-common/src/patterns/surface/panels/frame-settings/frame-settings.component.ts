import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LW_FRAME_SETTING_ITEMS, LwFrameSettingsStore, type LwFrameSettings } from '../../../../services/settings/lw-frame-settings';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwStackComponent } from '../../../../ui/layout/stack/stack.component';
import { LwTabsComponent, type LwTabItem } from '../../../../ui/navigation/tabs/tabs.component';
import { LwTextComponent } from '../../../../ui/typography/text/text.component';

/**
 * 틀의 설정을 바꾸는 화면이다. 설정의 선언(LW_FRAME_SETTING_ITEMS)을 읽어 스스로 그린다.
 * 항목을 더하려면 선언에 한 줄을 넣는다. 이 화면은 고치지 않는다.
 */
@Component({
  selector: 'lw-frame-settings',
  imports: [LwButtonComponent, LwStackComponent, LwTabsComponent, LwTextComponent],
  templateUrl: './frame-settings.component.html',
  styleUrl: './frame-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwFrameSettingsComponent {
  protected readonly store = inject(LwFrameSettingsStore);
  protected readonly items = LW_FRAME_SETTING_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    tabs: item.choices.map((choice): LwTabItem => ({ key: choice.value, label: choice.label })),
  }));

  protected change(key: keyof LwFrameSettings, value: string): void {
    this.store.set(key, value as never);
  }
}
