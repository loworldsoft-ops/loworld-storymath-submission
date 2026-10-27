import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { LW_SPEECH_PORT, LW_STORAGE_PORT, type LwSpeechPort, MemoryStorageAdapter } from '@loworld/common/services';
import { STORY_MATH_ACTS } from '../../data/acts';
import { StoryMathPlay } from '../../logic/story-math-play';
import { StoryMathPlayScreen } from './play.screen';

const speech: LwSpeechPort = {
  canSpeak: false,
  canListen: false,
  speak: vi.fn().mockResolvedValue(undefined),
  listen: vi.fn().mockResolvedValue(''),
  stop: vi.fn(),
};

/** 장면마다 화면이 오류 없이 그려지는지 본다. 모양은 보지 않는다(사용자가 본다). */
describe('StoryMathPlayScreen', () => {
  it('일곱 장면을 차례로 그린다', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LW_SPEECH_PORT, useValue: speech },
        { provide: LW_STORAGE_PORT, useValue: new MemoryStorageAdapter() },
      ],
    });
    const fixture = TestBed.createComponent(StoryMathPlayScreen);
    const play = fixture.debugElement.injector.get(StoryMathPlay);
    const text = () => {
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).textContent ?? '';
    };
    const act = STORY_MATH_ACTS[0];
    const quest = act.quests[0];

    expect(text()).toContain('이어 듣기');
    expect(text()).toContain('이야기꾼');
    play.openAct(act);
    expect(text()).toContain('9까지의 수');
    play.startQuest(quest);
    expect(text()).toContain(quest.story[0]);
    play.skipToQuestions();
    expect(text()).toContain(quest.questions[0].prompt);
    play.heard.set('양');
    play.choose(quest.questions[0].answer);
    expect(text()).toContain('맞았어요');
    expect(text()).toContain('→');
    expect(text()).toContain(quest.questions[0].choices[quest.questions[0].answer].label);
    play.openSettings();
    expect(text()).toContain('읽는 빠르기');
    play.closeSettings();
    for (let i = 0; i < quest.questions.length; i++) {
      if (play.phase() === 'question') play.choose(0);
      play.next();
    }
    expect(play.phase()).toBe('done');
    expect(text()).toContain('개 맞혔어요');
    expect(text()).toContain('퀘스트 끝');
    expect(text()).toContain(play.closing());
  });
});
