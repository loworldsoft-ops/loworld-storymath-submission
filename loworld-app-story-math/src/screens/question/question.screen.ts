import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import {
  LwAvatarComponent,
  LwButtonComponent,
  LwCardComponent,
  LwIconComponent,
  LwMarkedTextComponent,
  LwPressableDirective,
  LwProgressBarComponent,
  LwStackComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { StoryMathPlay } from '../../logic/story-math-play';

/** 문제 풀기. */
@Component({
  selector: 'scr-story-math-question',
  templateUrl: './question.screen.html',
  hostDirectives: [LwScreen],
  imports: [
    LwAvatarComponent,
    LwButtonComponent,
    LwCardComponent,
    LwIconComponent,
    LwMarkedTextComponent,
    LwPressableDirective,
    LwProgressBarComponent,
    LwStackComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathQuestionScreen {
  protected readonly play = inject(StoryMathPlay);
}
