import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  LwProgressBarComponent,
  LwStackComponent,
  type LwTabItem,
  LwTabsComponent,
  LwTextComponent,
} from '@loworld/common/ui';
import { MATH_SCHOOLS } from '../../logic/content-check';
import { StoryMathPlay } from '../../logic/story-math-play';
import type { MathSchool } from '../../logic/story-math.model';

/** 홈: 이야기꾼의 인사, 이어 듣기, 학교별 막. */
@Component({
  selector: 'scr-story-math-home',
  templateUrl: './home.screen.html',
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
    LwProgressBarComponent,
    LwStackComponent,
    LwTabsComponent,
    LwTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathHomeScreen {
  protected readonly play = inject(StoryMathPlay);
  protected readonly schoolTabs: readonly LwTabItem<MathSchool>[] = MATH_SCHOOLS.map((s) => ({ key: s.key, label: s.label }));
  /** 누른 학교. 누르기 전에는 이어 듣기 퀘스트의 학교를 보여 준다 */
  private readonly picked = signal<MathSchool | null>(null);
  protected readonly school = computed<MathSchool>(() => this.picked() ?? this.play.nextAct()?.school ?? 'elementary');
  /** 막 열두 개를 한 화면에 놓으면 카드가 작아 차에서 누르기 어렵다. 학교 하나의 막만 보여 준다 */
  protected readonly shownActs = computed(() => this.play.acts.filter((a) => a.school === this.school()));

  protected pickSchool(key: string): void {
    const school = MATH_SCHOOLS.find((s) => s.key === key);
    if (school) this.picked.set(school.key);
  }
}
