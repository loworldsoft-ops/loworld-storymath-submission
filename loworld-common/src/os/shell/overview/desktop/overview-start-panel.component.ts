import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewLaunchItem, OverviewStartGroupSection } from '../../../../services/models/os.types';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';
import { isOverviewItemDisabled } from '../../../platform/overview-access';

/**
 * 탐색기(시작) 패널. 독의 탐색기 단추 위에 뜨고, 앱을 묶음별 목록으로 보여 준다.
 * 계정 정보는 메뉴 막대에 있으므로 여기에는 두지 않는다.
 */
@Component({
  standalone: true,
  imports: [LwIconComponent, LwPressableDirective, OverviewIconComponent],
  selector: 'lw-os-start-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-start-panel.component.html',
  styleUrl: './overview-start-panel.component.scss',
  host: { '(document:keydown.escape)': 'closeRequested.emit()' },
})
export class OverviewStartPanelComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewStartPanelComponent', 'OS');

  sections = input.required<readonly OverviewStartGroupSection[]>();
  memberSession = input<LwMemberAuthSessionView | null>(null);

  closeRequested = output<void>();
  launchRequested = output<OverviewLaunchItem>();
  loginRequested = output<void>();
  accountRequested = output<void>();
  logoutRequested = output<void>();

  protected isItemDisabled(item: OverviewLaunchItem): boolean {
    return isOverviewItemDisabled(item, this.memberSession());
  }

  /** 같은 이름의 데스크톱용·모바일용 앱을 구분해 준다. */
  protected variantOf(item: OverviewLaunchItem): string {
    if (item.externalHref) return '새 창';
    return item.icon === 'mobile' || (item.tab ?? '').includes('mobile') ? '모바일' : '';
  }
}
