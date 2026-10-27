import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwCardComponent,
  LwIconComponent,
  LwPressableDirective,
  LwProgressBarComponent,
  LwStackComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { StoryMathPlay } from '../../logic/story-math-play';

/** 막: 학기별 단원 목록. */
@Component({
  selector: 'scr-story-math-act',
  templateUrl: './act.screen.html',
  hostDirectives: [LwScreen],
  imports: [
    LwBadgeComponent,
    LwButtonComponent,
    LwCardComponent,
    LwIconComponent,
    LwPressableDirective,
    LwProgressBarComponent,
    LwStackComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathActScreen {
  protected readonly play = inject(StoryMathPlay);
}
