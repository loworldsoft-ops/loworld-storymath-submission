import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwMarkedTextComponent,
  LwProgressBarComponent,
  LwSpinnerComponent,
  LwStackComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { StoryMathPlay } from '../../logic/story-math-play';

/** 이야기 듣기. */
@Component({
  selector: 'scr-story-math-story',
  templateUrl: './story.screen.html',
  hostDirectives: [LwScreen],
  imports: [
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwMarkedTextComponent,
    LwProgressBarComponent,
    LwSpinnerComponent,
    LwStackComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathStoryScreen {
  protected readonly play = inject(StoryMathPlay);
}
