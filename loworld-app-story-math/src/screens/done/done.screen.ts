import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import {
  LwAvatarComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwCardComponent,
  LwGridComponent,
  LwIconComponent,
  LwMarkedTextComponent,
  LwPressableDirective,
  LwStackComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { StoryMathPlay } from '../../logic/story-math-play';

/** 퀘스트 마침. */
@Component({
  selector: 'scr-story-math-done',
  templateUrl: './done.screen.html',
  hostDirectives: [LwScreen],
  imports: [
    LwAvatarComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwCardComponent,
    LwGridComponent,
    LwIconComponent,
    LwMarkedTextComponent,
    LwPressableDirective,
    LwStackComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathDoneScreen {
  protected readonly play = inject(StoryMathPlay);
}
