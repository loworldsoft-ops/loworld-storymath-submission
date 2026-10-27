import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import {
  LwAvatarComponent,
  LwButtonComponent,
  LwCardComponent,
  LwIconComponent,
  LwMarkedTextComponent,
  LwProgressBarComponent,
  LwSpinnerComponent,
  LwStackComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { StoryMathPlay } from '../../logic/story-math-play';

/** 풀이 듣기. */
@Component({
  selector: 'scr-story-math-feedback',
  templateUrl: './feedback.screen.html',
  hostDirectives: [LwScreen],
  imports: [
    LwAvatarComponent,
    LwButtonComponent,
    LwCardComponent,
    LwIconComponent,
    LwMarkedTextComponent,
    LwProgressBarComponent,
    LwSpinnerComponent,
    LwStackComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathFeedbackScreen {
  protected readonly play = inject(StoryMathPlay);
}
