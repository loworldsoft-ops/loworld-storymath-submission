import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, type Type } from '@angular/core';
import { LwScreen } from '@loworld/common/os';
import { StoryMathPlay, type StoryMathPhase } from '../../logic/story-math-play';
import { StoryMathActScreen } from '../act/act.screen';
import { StoryMathDoneScreen } from '../done/done.screen';
import { StoryMathFeedbackScreen } from '../feedback/feedback.screen';
import { StoryMathHomeScreen } from '../home/home.screen';
import { StoryMathQuestionScreen } from '../question/question.screen';
import { StoryMathSettingsScreen } from '../settings/settings.screen';
import { StoryMathStoryScreen } from '../story/story.screen';

/** 장면마다 보여 줄 화면. 화면 템플릿에는 lw-* 밖의 요소를 쓸 수 없어서(A2) ngComponentOutlet으로 바꿔 끼운다. */
const SCREENS: Record<StoryMathPhase, Type<unknown>> = {
  home: StoryMathHomeScreen,
  act: StoryMathActScreen,
  settings: StoryMathSettingsScreen,
  story: StoryMathStoryScreen,
  question: StoryMathQuestionScreen,
  feedback: StoryMathFeedbackScreen,
  done: StoryMathDoneScreen,
};

/** 앱의 창 하나. 진행 상태(StoryMathPlay)를 여기서 하나 만들어 모든 화면이 함께 쓴다. */
@Component({
  selector: 'scr-story-math-play',
  templateUrl: './play.screen.html',
  imports: [NgComponentOutlet],
  hostDirectives: [LwScreen],
  providers: [StoryMathPlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryMathPlayScreen {
  private readonly play = inject(StoryMathPlay);
  protected readonly screen = computed(() => SCREENS[this.play.phase()]);
}
