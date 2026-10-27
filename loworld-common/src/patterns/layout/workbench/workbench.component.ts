import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DEFAULT_WORKSPACE_DESKTOP_LAYOUT, type WorkspaceDesktopLayout, type WorkspaceDesktopSlotId } from '../../../services/models/workspace-layout.model';
import { LwAppFrameComponent } from '../../frame/app-frame/app-frame.component';

/**
 * 관리 화면을 짜는 쉬운 겉이다. 위에 머리줄, 왼쪽에 고르는 자리, 가운데에 본문, 오른쪽에 상세가 온다.
 * 그리는 일은 앱의 틀(lw-app-frame)이 한다. 여기는 내용을 속성으로 가려 받아 틀의 자리에 넣어 줄 뿐이다.
 * 자리는 lwWorkbenchHeader, lwWorkbenchNav, lwWorkbenchAside로 가린다. 나머지는 본문이다.
 */
@Component({
  selector: 'lw-workbench',
  imports: [LwAppFrameComponent],
  templateUrl: './workbench.component.html',
  styleUrl: './workbench.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwWorkbenchComponent {
  /** 왼쪽 자리를 보일지. */
  readonly nav = input(true);
  /** 오른쪽 자리를 보일지. 고른 것이 없으면 접는다. */
  readonly aside = input(false);

  protected readonly layout = computed<WorkspaceDesktopLayout>(() => {
    const visibleSlots: WorkspaceDesktopSlotId[] = ['topbar', ...(this.nav() ? (['sidebar'] as const) : []), 'detail', ...(this.aside() ? (['aside'] as const) : [])];
    return { ...DEFAULT_WORKSPACE_DESKTOP_LAYOUT, collectionOpen: false, visibleSlots };
  });
}
