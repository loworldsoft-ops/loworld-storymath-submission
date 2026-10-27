
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwColorBehaviorDirective } from '../../../../services/base/lw-color-behavior.directive';
import { LwUIBehaviorDirective } from '../../../../services/base/lw-ui-behavior.directive';
import { DEFAULT_STORY_PLAY_THEME_ID, type StoryPlayThemeId } from '../../../../services/models/story-play-theme.model';
import type { StatSpineStripVm } from '../../../../services/utils/narrative-hud-vm.util';

/**
 * 캐릭터의 핵심 스탯 수치를 간결한 세로/가로 스트립 형태로 표시하는 컴포넌트입니다.
 */
@Component({
  selector: 'lw-stat-spine-strip',
  standalone: true,
  templateUrl: './stat-spine-strip.component.html',
  styleUrl: './stat-spine-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: LwUIBehaviorDirective, inputs: ['disabled', 'visible'] },
    { directive: LwColorBehaviorDirective, inputs: ['color'] },
  ],
  host: {
  },
})
export class LwStatSpineStripComponent {
  readonly data = input.required<StatSpineStripVm>();
  readonly theme = input<StoryPlayThemeId>(DEFAULT_STORY_PLAY_THEME_ID);
}
