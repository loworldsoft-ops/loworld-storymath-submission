
import { CommonModule } from '@angular/common';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwActionEvent } from '../../../../services/models/action-event.model';
import { LwColorBehaviorDirective } from '../../../../services/base/lw-color-behavior.directive';
import { LwUIBehaviorDirective } from '../../../../services/base/lw-ui-behavior.directive';
import { DEFAULT_STORY_PLAY_THEME_ID, type StoryPlayThemeId } from '../../../../services/models/story-play-theme.model';
import type { ActiveMissionCardVm } from '../../../../services/utils/narrative-hud-vm.util';

/**
 * 진행 중인 활성 미션 및 퀘스트 진행 상태를 표시하는 카드 컴포넌트입니다.
 */
@Component({
  imports: [CommonModule, LwCardComponent],
  selector: 'lw-active-mission-card',
  standalone: true,
  templateUrl: './active-mission-card.component.html',
  styleUrl: './active-mission-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: LwUIBehaviorDirective, inputs: ['disabled', 'visible'] },
    { directive: LwColorBehaviorDirective, inputs: ['color'] },
  ],
  host: {
  },
})
export class LwActiveMissionCardComponent {
  readonly missions = input.required<ActiveMissionCardVm[]>();
  readonly theme = input<StoryPlayThemeId>(DEFAULT_STORY_PLAY_THEME_ID);
  readonly emptyMessage = input('활성 미션이 없습니다');

  readonly missionClick = output<LwActionEvent<{ questId: string }>>();

  protected onMissionClick(questId: string): void {
    this.missionClick.emit({
      actionId: 'ACTIVE_MISSION_CLICKED',
      payload: { questId },
      source: 'lw-active-mission-card',
    });
  }
}
