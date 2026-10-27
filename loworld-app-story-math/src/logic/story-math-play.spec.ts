import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LW_SPEECH_PORT, LW_STORAGE_PORT, type LwSpeakOptions, type LwSpeechPort, type LwStoragePort, MemoryStorageAdapter } from '@loworld/common/services';
import { STORY_MATH_ACTS } from '../data/acts';
import { STORY_MATH_DEFAULT_SETTINGS, STORY_MATH_SAVE_KEY, StoryMathPlay, matchChoice } from './story-math-play';

// 진행의 시험은 1막의 첫 퀘스트로 한다. 글은 작가가 계속 고치므로 특정 낱말에 기대지 않는다.
const quest = STORY_MATH_ACTS[0].quests[0];
const firstAnswer = quest.questions[0].choices[quest.questions[0].answer].label;

function fakeSpeech(heard: string[] = []): LwSpeechPort {
  return {
    canSpeak: true,
    canListen: heard.length > 0,
    speak: vi.fn().mockImplementation((_text: string, _options?: LwSpeakOptions) => Promise.resolve()),
    listen: vi.fn().mockImplementation(() => Promise.resolve(heard.shift() ?? '')),
    stop: vi.fn(),
  };
}

/** 저장은 시험마다 새 메모리로 한다. 브라우저 저장소를 쓰면 앞 시험의 기록이 남는다. */
function setup(speech: LwSpeechPort, storage: LwStoragePort = new MemoryStorageAdapter()): StoryMathPlay {
  TestBed.configureTestingModule({
    providers: [StoryMathPlay, { provide: LW_SPEECH_PORT, useValue: speech }, { provide: LW_STORAGE_PORT, useValue: storage }],
  });
  return TestBed.inject(StoryMathPlay);
}

/** 자동 진행을 끄고 버튼으로 퀘스트를 끝까지 간다. 맞힐 문제 수를 고른다. */
function playThrough(play: StoryMathPlay, correct = quest.questions.length): void {
  play.startQuest(quest);
  for (let i = 0; i < quest.story.length; i++) play.next();
  quest.questions.forEach((question, i) => {
    play.choose(i < correct ? question.answer : 1 - question.answer);
    play.next();
  });
}

describe('matchChoice', () => {
  const choices = [
    { label: '양', says: ['양'] },
    { label: '돌', says: ['돌'] },
  ] as const;
  it('한쪽 낱말만 들리면 그쪽이다', () => {
    expect(matchChoice('돌', choices)).toBe(1);
    expect(matchChoice('양 이요', choices)).toBe(0);
  });
  it('둘 다 들리거나 아무것도 없으면 null이다', () => {
    expect(matchChoice('양이랑 돌', choices)).toBeNull();
    expect(matchChoice('', choices)).toBeNull();
    expect(matchChoice('모르겠어', choices)).toBeNull();
  });
  it('답의 낱말이 없으면 첫째·둘째로 고른다', () => {
    expect(matchChoice('첫째', choices)).toBe(0);
    expect(matchChoice('두 번째요', choices)).toBe(1);
  });
  it('답의 낱말이 있으면 첫째·둘째보다 먼저 본다', () => {
    const numbers = [
      { label: '하나', says: ['하나'] },
      { label: '둘', says: ['둘'] },
    ] as const;
    expect(matchChoice('둘째', numbers)).toBe(1);
    expect(matchChoice('하나', numbers)).toBe(0);
  });
});

describe('StoryMathPlay', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('막이 12개이고 1막에 퀘스트가 있다', () => {
    expect(STORY_MATH_ACTS).toHaveLength(12);
    expect(STORY_MATH_ACTS[0].grade).toBe('초등 1학년');
    expect(STORY_MATH_ACTS[0].quests.length).toBeGreaterThan(0);
  });

  it('고등학교 막은 학기 대신 과목 이름을 쓴다', () => {
    const play = setup(fakeSpeech());
    expect(play.semesterLabel(STORY_MATH_ACTS[0], 1)).toBe('1학기');
    expect(play.semesterLabel(STORY_MATH_ACTS[11], 2)).toBe('미적분Ⅱ · 기하');
  });

  it('홈에서 시작하고, 이어 듣기는 아직 마치지 않은 첫 퀘스트다', () => {
    const play = setup(fakeSpeech());
    expect(play.phase()).toBe('home');
    expect(play.nextQuest()?.id).toBe(quest.id);
  });

  it('자동 진행을 끄면 버튼으로 이야기 → 문제 → 풀이 → 끝까지 가고, 마친 기록이 남는다', () => {
    const play = setup(fakeSpeech());
    play.toggleAutoPlay();
    playThrough(play, 2);
    expect(play.phase()).toBe('done');
    expect(play.correctCount()).toBe(2);
    expect(play.results().get(quest.id)).toEqual({ correct: 2, total: quest.questions.length, plays: 1 });
    expect(play.doneCount(STORY_MATH_ACTS[0])).toBe(1);
    expect(play.nextQuest()?.id).not.toBe(quest.id);
  });

  it('한 번 더 들으면 들은 횟수가 는다', () => {
    const play = setup(fakeSpeech());
    play.toggleAutoPlay();
    playThrough(play);
    playThrough(play);
    expect(play.results().get(quest.id)?.plays).toBe(2);
  });

  it('이야기를 건너뛰면 첫 문제로 가고, 앞 문단은 첫 문단에서 멈춘다', () => {
    const play = setup(fakeSpeech());
    play.toggleAutoPlay();
    play.startQuest(quest);
    play.previous();
    expect(play.paragraphIndex()).toBe(0);
    play.next();
    play.previous();
    expect(play.paragraphIndex()).toBe(0);
    play.skipToQuestions();
    expect(play.phase()).toBe('question');
    expect(play.questionIndex()).toBe(0);
  });

  it('문제에서 말로 답하면 그 답을 고른다', async () => {
    const play = setup(fakeSpeech([firstAnswer]));
    play.toggleAutoPlay();
    play.startQuest(quest);
    for (let i = 0; i < quest.story.length; i++) play.next();
    await vi.waitFor(() => expect(play.phase()).toBe('feedback'));
    expect(play.heard()).toBe(firstAnswer);
    expect(play.lastCorrect()).toBe(true);
  });

  it('말로 답하기를 끄면 듣지 않는다', async () => {
    const speech = fakeSpeech([firstAnswer]);
    const play = setup(speech);
    play.toggleAutoPlay();
    play.toggleListen();
    play.startQuest(quest);
    play.skipToQuestions();
    await Promise.resolve();
    expect(play.canAnswerByVoice()).toBe(false);
    expect(speech.listen).not.toHaveBeenCalled();
  });

  it('읽는 빠르기를 소리 포트에 넘긴다', () => {
    const speech = fakeSpeech();
    const play = setup(speech);
    play.setRate('slow');
    play.startQuest(quest);
    expect(speech.speak).toHaveBeenLastCalledWith(quest.story[0], expect.objectContaining({ rate: 0.8 }));
  });

  it('설정을 열면 읽기를 멈추고, 닫으면 그 장면으로 돌아간다', () => {
    const speech = fakeSpeech();
    const play = setup(speech);
    play.toggleAutoPlay();
    play.startQuest(quest);
    play.next();
    play.openSettings();
    expect(play.phase()).toBe('settings');
    expect(speech.stop).toHaveBeenCalled();
    play.closeSettings();
    expect(play.phase()).toBe('story');
    expect(play.paragraphIndex()).toBe(1);
  });

  it('막으로 돌아가면 읽기를 멈추고 그 퀘스트의 막을 연다', () => {
    const speech = fakeSpeech();
    const play = setup(speech);
    play.startQuest(quest);
    play.backToAct();
    expect(play.phase()).toBe('act');
    expect(play.act()?.id).toBe('act-1');
    expect(play.quest()).toBeNull();
    expect(speech.stop).toHaveBeenCalled();
  });

  it('말로 답하면 알아들은 쪽을 잠깐 밝힌 뒤 풀이로 간다', async () => {
    const play = setup(fakeSpeech([firstAnswer]));
    play.toggleAutoPlay();
    play.startQuest(quest);
    play.skipToQuestions();
    await vi.waitFor(() => expect(play.picked()).toBe(quest.questions[0].answer));
    expect(play.phase()).toBe('question');
    await vi.waitFor(() => expect(play.phase()).toBe('feedback'));
    expect(play.picked()).toBeNull();
  });

  it('못 알아들으면 들은 말을 남기고 다시 묻는다', async () => {
    // 두 번째 듣기는 붙잡아 두어, 다시 묻는 동안의 상태를 본다.
    let answer = (_text: string) => {};
    const speech = fakeSpeech(['모르겠어']);
    speech.listen = vi.fn().mockResolvedValueOnce('모르겠어').mockImplementationOnce(() => new Promise<string>((resolve) => (answer = resolve)));
    const play = setup(speech);
    play.toggleAutoPlay();
    play.startQuest(quest);
    play.skipToQuestions();
    await vi.waitFor(() => expect(speech.listen).toHaveBeenCalledTimes(2));
    expect(play.missed()).toBe(true);
    expect(play.heard()).toBe('모르겠어');
    expect(speech.speak).toHaveBeenCalledWith(expect.stringContaining('중에서 하나만'), expect.objectContaining({ rate: 1 }));
    answer(firstAnswer);
    await vi.waitFor(() => expect(play.phase()).toBe('feedback'));
    expect(play.lastCorrect()).toBe(true);
    expect(play.missed()).toBe(false);
  });

  it('읽는 동안만 speaking이 켜진다', async () => {
    let finish = () => {};
    const speech = fakeSpeech();
    speech.speak = vi.fn().mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    const play = setup(speech);
    play.toggleAutoPlay();
    play.startQuest(quest);
    expect(play.speaking()).toBe(true);
    finish();
    await vi.waitFor(() => expect(play.speaking()).toBe(false));
  });

  it('이야기꾼은 처음에 첫 퀘스트를 권하고, 앱을 열 때 인사를 읽는다', () => {
    const speech = fakeSpeech();
    const play = setup(speech);
    expect(play.greeting()).toContain(`'${quest.title}'`);
    expect(play.greeting()).not.toContain('지난번');
    expect(speech.speak).toHaveBeenCalledWith(play.greeting(), expect.objectContaining({ rate: 1 }));
  });

  it('퀘스트를 마치면 이야기꾼이 지난번 이야기와 다음 단원을 말한다', () => {
    const play = setup(fakeSpeech());
    play.toggleAutoPlay();
    playThrough(play);
    const following = play.followingQuest();
    expect(following).not.toBeNull();
    expect(play.closing()).toContain(`'${following!.title}'`);
    expect(play.greeting()).toContain(`지난번엔 '${quest.title}'`);
  });

  it('기록과 설정을 기기에 남기고, 다시 열면 그대로 이어 간다', () => {
    const storage = new MemoryStorageAdapter();
    const first = setup(fakeSpeech(), storage);
    first.toggleAutoPlay();
    first.toggleShowText();
    first.setRate('slow');
    playThrough(first, 2);

    TestBed.resetTestingModule();
    const again = setup(fakeSpeech(), storage);
    expect(again.results().get(quest.id)).toEqual({ correct: 2, total: quest.questions.length, plays: 1 });
    expect(again.nextQuest()?.id).not.toBe(quest.id);
    expect(again.autoPlay()).toBe(false);
    expect(again.showText()).toBe(false);
    expect(again.listenEnabled()).toBe(true);
    expect(again.rate()).toBe('slow');
    expect(again.greeting()).toContain(`지난번엔 '${quest.title}'`);
  });

  it('남긴 것이 깨졌거나 모르는 퀘스트면 버리고 처음부터 한다', () => {
    const broken = new MemoryStorageAdapter();
    broken.setItem(STORY_MATH_SAVE_KEY, '{');
    expect(setup(fakeSpeech(), broken).nextQuest()?.id).toBe(quest.id);

    TestBed.resetTestingModule();
    const unknown = new MemoryStorageAdapter();
    unknown.setItem(
      STORY_MATH_SAVE_KEY,
      JSON.stringify({ v: 1, results: [['없는-퀘스트', { correct: 1, total: 1, plays: 1 }], 'x'], lastQuestId: '없는-퀘스트', rate: 'warp' }),
    );
    const play = setup(fakeSpeech(), unknown);
    expect(play.results().size).toBe(0);
    expect(play.rate()).toBe('normal');
    expect(play.greeting()).not.toContain('지난번');
  });

  it('segmentsOf: 자리가 없으면 한 조각, 자리 (3, 5)가 오면 past·now·ahead 세 조각, 풀이에서도 자리가 맞게 옮겨진다', () => {
    const play = setup(fakeSpeech());
    const raw = '사과 다섯 개';
    // 자리가 없으면 한 조각
    expect(play.segmentsOf(raw)).toEqual([{ text: raw }]);

    // 자리 (3, 5)가 오면 past·now·ahead 세 조각이고 글을 이으면 원래 글
    play.spoken.set({ text: raw, start: 3, end: 5 });
    const segs = play.segmentsOf(raw);
    expect(segs).toEqual([
      { text: '사과 ', state: 'past' },
      { text: '다섯', state: 'now' },
      { text: ' 개', state: 'ahead' },
    ]);
    expect(segs.map((s) => s.text).join('')).toBe(raw);

    // 풀이(앞에 "맞았어요. "가 붙은 글)에서도 자리가 맞게 옮겨진다
    const prefix = '맞았어요. ';
    play.spoken.set({ text: prefix + raw, start: prefix.length + 3, end: prefix.length + 5 });
    const explainSegs = play.segmentsOf(raw);
    expect(explainSegs).toEqual([
      { text: '사과 ', state: 'past' },
      { text: '다섯', state: 'now' },
      { text: ' 개', state: 'ahead' },
    ]);
  });

  it('읽기가 끝나면 다 읽음(past 한 조각), halt() 뒤에는 한 조각(그냥 글)', async () => {
    const speech = fakeSpeech();
    speech.speak = vi.fn().mockImplementation(async (_text: string, options?: LwSpeakOptions) => {
      options?.onRange?.(0, 2);
    });
    const play = setup(speech);
    play.toggleAutoPlay();
    play.startQuest(quest);
    await Promise.resolve();
    expect(play.segmentsOf(quest.story[0])).toEqual([{ text: quest.story[0], state: 'past' }]);
    play.pause();
    expect(play.segmentsOf(quest.story[0])).toEqual([{ text: quest.story[0] }]);
  });

  it('speechTooFast: 바로 끝나면 자동 진행이 멈추고(첫 문단), 1초 걸리면 다음 문단으로 간다', async () => {
    // 바로 끝나는 가짜
    const speechFast = fakeSpeech();
    const playFast = setup(speechFast);
    playFast.startQuest(quest);
    await Promise.resolve();
    expect(playFast.speechTooFast()).toBe(true);
    expect(playFast.paragraphIndex()).toBe(0);

    // 1초 걸리는 가짜
    vi.useFakeTimers();
    try {
      TestBed.resetTestingModule();
      const speechSlow = fakeSpeech();
      speechSlow.speak = vi.fn().mockImplementation(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      const playSlow = setup(speechSlow);
      playSlow.startQuest(quest);
      await vi.advanceTimersByTimeAsync(1100);
      expect(playSlow.speechTooFast()).toBe(false);
      expect(playSlow.paragraphIndex()).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('answers: 세 문제를 맞음·틀림·맞음으로 고르면 [true, false, true], startQuest로 비워진다', () => {
    const play = setup(fakeSpeech());
    play.toggleAutoPlay();
    play.startQuest(quest);
    play.skipToQuestions();
    play.choose(quest.questions[0].answer);
    play.next();
    play.choose(1 - quest.questions[1].answer);
    play.next();
    play.choose(quest.questions[2].answer);
    expect(play.answers()).toEqual([true, false, true]);
    play.startQuest(quest);
    expect(play.answers()).toEqual([]);
  });

  it('questAct와 placeOf: 첫 퀘스트에서 1막, 1막 · 1번째 단원', () => {
    const play = setup(fakeSpeech());
    play.startQuest(quest);
    expect(play.questAct()?.title).toBe('1막');
    expect(play.placeOf(quest)).toBe('1막 · 1번째 단원');
  });

  it('answerLabel: 첫 문제의 정답 보기 글', () => {
    const play = setup(fakeSpeech());
    play.startQuest(quest);
    play.skipToQuestions();
    expect(play.answerLabel()).toBe(firstAnswer);
  });

  it('설정을 바꾸지 않으면 처음의 동작 그대로다', () => {
    expect(STORY_MATH_DEFAULT_SETTINGS).toEqual({
      autoPlay: true, listenEnabled: true, showText: true, rate: 'normal',
      narrator: true, highlight: true, pause: 'none', continueNext: false, autoListen: true, voiceTries: 2, ordinal: true,
    });
  });

  it('새 설정이 없던 옛 기록도 읽고, 없는 칸은 기본값이다', () => {
    const storage = new MemoryStorageAdapter();
    storage.setItem(STORY_MATH_SAVE_KEY, JSON.stringify({ v: 1, results: [[quest.id, { correct: 1, total: 3, plays: 1 }]], lastQuestId: quest.id, autoPlay: false, listenEnabled: true, showText: true, rate: 'fast' }));
    const play = setup(fakeSpeech(), storage);
    expect(play.results().get(quest.id)?.correct).toBe(1);
    expect(play.settings()).toEqual({ ...STORY_MATH_DEFAULT_SETTINGS, autoPlay: false, rate: 'fast' });
  });

  it('새 설정도 기기에 남는다', () => {
    const storage = new MemoryStorageAdapter();
    const first = setup(fakeSpeech(), storage);
    first.set('rate', 'faster');
    first.set('pause', 'long');
    first.set('voiceTries', 3);
    first.toggle('narrator');
    first.toggle('continueNext');
    TestBed.resetTestingModule();
    const again = setup(fakeSpeech(), storage);
    expect(again.settings()).toEqual({ ...STORY_MATH_DEFAULT_SETTINGS, rate: 'faster', pause: 'long', voiceTries: 3, narrator: false, continueNext: true });
  });

  it('이야기꾼을 끄면 인사를 읽지 않고, 끝에서 점수만 말한다', () => {
    const storage = new MemoryStorageAdapter();
    setup(fakeSpeech(), storage).toggle('narrator');
    TestBed.resetTestingModule();
    const speech = fakeSpeech();
    const play = setup(speech, storage);
    expect(speech.speak).not.toHaveBeenCalled();
    play.toggleAutoPlay();
    playThrough(play);
    const last = (speech.speak as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as string;
    expect(last).toContain('문제를 맞혔어요');
    expect(last).not.toContain(play.closing());
  });

  it('읽는 곳 밝히기를 끄면 글을 나누지 않는다', () => {
    const play = setup(fakeSpeech());
    play.spoken.set({ text: '하나 둘 셋', start: 3, end: 4 });
    expect(play.segmentsOf('하나 둘 셋')).toHaveLength(3);
    play.toggle('highlight');
    expect(play.segmentsOf('하나 둘 셋')).toEqual([{ text: '하나 둘 셋' }]);
  });

  it('"첫째·둘째"를 끄면 자리로 답한 말을 받지 않는다', () => {
    const choices = quest.questions[0].choices;
    expect(matchChoice('둘째', choices)).toBe(1);
    expect(matchChoice('둘째', choices, false)).toBeNull();
  });

  it('바로 듣기를 끄면 문제를 읽고 듣지 않는다', async () => {
    const speech = fakeSpeech([firstAnswer]);
    const play = setup(speech);
    play.toggleAutoPlay();
    play.toggle('autoListen');
    play.startQuest(quest);
    play.skipToQuestions();
    await vi.waitFor(() => expect(play.speaking()).toBe(false));
    expect(speech.listen).not.toHaveBeenCalled();
    void play.listenAnswer();
    await vi.waitFor(() => expect(play.phase()).toBe('feedback'));
  });

  it('말로 답할 기회만큼 듣고 멈춘다', async () => {
    const speech = fakeSpeech(['모르겠어', '모르겠어', '모르겠어', '모르겠어']);
    const play = setup(speech);
    play.toggleAutoPlay();
    play.set('voiceTries', 3);
    play.startQuest(quest);
    play.skipToQuestions();
    await vi.waitFor(() => expect(speech.listen).toHaveBeenCalledTimes(3));
    await vi.waitFor(() => expect(play.listening()).toBe(false));
    expect(speech.listen).toHaveBeenCalledTimes(3);
    expect(play.phase()).toBe('question');
  });

  it('다음 단원 이어 듣기를 켜면 퀘스트를 마친 뒤 다음 단원을 시작한다', async () => {
    vi.useFakeTimers();
    try {
      // 읽기가 바로 끝나면 목소리가 없는 것으로 보고 저절로 넘어가지 않는다. 그래서 읽기에 2초를 준다.
      const speech = fakeSpeech();
      speech.speak = vi.fn().mockImplementation(() => new Promise<void>((resolve) => setTimeout(resolve, 2000)));
      const play = setup(speech);
      play.toggleAutoPlay();
      play.toggle('continueNext');
      playThrough(play);
      const following = play.followingQuest()!;
      expect(play.phase()).toBe('done');
      await vi.advanceTimersByTimeAsync(2000 + 4000 + 100);
      expect(play.quest()?.id).toBe(following.id);
      expect(play.phase()).toBe('story');
    } finally {
      vi.useRealTimers();
    }
  });

  it('기록 지우기와 설정 처음대로는 두 번 눌러야 한다', () => {
    const play = setup(fakeSpeech());
    play.toggleAutoPlay();
    playThrough(play);
    play.clearResults();
    expect(play.results().size).toBe(1);
    expect(play.armed()).toBe('results');
    play.clearResults();
    expect(play.results().size).toBe(0);
    expect(play.greeting()).not.toContain('지난번');

    play.resetSettings();
    expect(play.autoPlay()).toBe(false);
    play.resetSettings();
    expect(play.settings()).toEqual(STORY_MATH_DEFAULT_SETTINGS);
  });
});
