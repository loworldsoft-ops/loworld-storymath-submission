import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { LW_SPEECH_PORT, LW_STORAGE_PORT, type LwStoragePort } from '@loworld/common/services';
import type { LwMarkedSegment } from '@loworld/common/ui';
import { STORY_MATH_ACTS } from '../data/acts';
import { matchChoice } from './story-math-match';
import type { MathAct, MathQuest } from './story-math.model';

export { matchChoice };

/** 화면 하나가 장면 하나다. home·act·settings는 고르는 곳, 나머지는 퀘스트를 진행하는 곳이다. */
export type StoryMathPhase = 'home' | 'act' | 'settings' | 'story' | 'question' | 'feedback' | 'done';

/** 읽는 빠르기. 값은 소리 포트의 rate(1 = 보통)다. */
export type StoryMathRate = 'slower' | 'slow' | 'normal' | 'fast' | 'faster';
export const STORY_MATH_RATES: Record<StoryMathRate, number> = { slower: 0.65, slow: 0.8, normal: 1, fast: 1.2, faster: 1.4 };

/** 문단 사이 쉼. 이야기를 곱씹을 틈. 값은 밀리초 */
export type StoryMathPause = 'none' | 'short' | 'long';
export const STORY_MATH_PAUSES: Record<StoryMathPause, number> = { none: 0, short: 1500, long: 3000 };

/** 퀘스트를 마치고 다음 단원을 저절로 시작하기 전에 기다리는 시간. 그만 들으려는 사람이 멈출 틈 */
const CONTINUE_MS = 4000;

/**
 * 설정. 모두 기기에 남는다. 기본값은 처음 만들 때의 동작 그대로다(설정을 건드리지 않으면 앱이 전과 같다).
 * 앞의 넷(autoPlay, listenEnabled, showText, rate)은 처음부터 있던 것이다.
 */
export interface StoryMathSettings {
  readonly autoPlay: boolean;
  readonly listenEnabled: boolean;
  readonly showText: boolean;
  readonly rate: StoryMathRate;
  /** 이야기꾼의 인사(앱을 열 때)와 마무리(퀘스트 끝)를 소리로 읽는다 */
  readonly narrator: boolean;
  /** 읽는 낱말을 밝힌다 */
  readonly highlight: boolean;
  /** 자동 진행에서 문단과 풀이 뒤에 쉬는 시간 */
  readonly pause: StoryMathPause;
  /** 퀘스트를 마치면 다음 단원을 저절로 시작한다(긴 운전) */
  readonly continueNext: boolean;
  /** 문제를 다 읽으면 바로 듣는다. 끄면 "말로 답하기"를 눌러야 듣는다 */
  readonly autoListen: boolean;
  /** 말로 답할 기회. 못 알아들으면 다시 묻고 이만큼 듣는다 */
  readonly voiceTries: 1 | 2 | 3;
  /** 보기의 말 대신 "첫째", "둘째"로 답하는 것을 받는다 */
  readonly ordinal: boolean;
}

export const STORY_MATH_DEFAULT_SETTINGS: StoryMathSettings = {
  autoPlay: true,
  listenEnabled: true,
  showText: true,
  rate: 'normal',
  narrator: true,
  highlight: true,
  pause: 'none',
  continueNext: false,
  autoListen: true,
  voiceTries: 2,
  ordinal: true,
};

/** 퀘스트 하나를 마친 기록. 기기에 남는다(STORY_MATH_SAVE_KEY). */
export interface StoryMathResult {
  readonly correct: number;
  readonly total: number;
  /** 끝까지 들은 횟수. 기초를 반복해 듣는 것을 보여 주려고 센다 */
  readonly plays: number;
}

/** 기기에 남기는 곳의 이름. 로그인 없이 이 기기에만 남는다 */
export const STORY_MATH_SAVE_KEY = 'story-math:progress';

/**
 * 기기에 남기는 것. 모양을 바꾸면 v를 올린다. 모르는 v나 깨진 값은 버리고 처음부터 한다.
 * 설정을 더한 것(2026-10-27)은 v를 올리지 않았다. 없는 칸은 기본값으로 읽어서, 전의 기록을 잃지 않는다.
 */
interface StoryMathSaved extends StoryMathSettings {
  readonly v: 1;
  readonly results: readonly (readonly [string, StoryMathResult])[];
  readonly lastQuestId: string | null;
}

const RATES = Object.keys(STORY_MATH_RATES) as StoryMathRate[];
const PAUSES = Object.keys(STORY_MATH_PAUSES) as StoryMathPause[];

/** 남긴 설정을 읽는다. 모르는 값은 기본값으로 */
function readSettings(raw: Partial<Record<keyof StoryMathSettings, unknown>>): StoryMathSettings {
  const d = STORY_MATH_DEFAULT_SETTINGS;
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  return {
    autoPlay: bool(raw.autoPlay, d.autoPlay),
    listenEnabled: bool(raw.listenEnabled, d.listenEnabled),
    showText: bool(raw.showText, d.showText),
    rate: RATES.includes(raw.rate as StoryMathRate) ? (raw.rate as StoryMathRate) : d.rate,
    narrator: bool(raw.narrator, d.narrator),
    highlight: bool(raw.highlight, d.highlight),
    pause: PAUSES.includes(raw.pause as StoryMathPause) ? (raw.pause as StoryMathPause) : d.pause,
    continueNext: bool(raw.continueNext, d.continueNext),
    autoListen: bool(raw.autoListen, d.autoListen),
    voiceTries: raw.voiceTries === 1 || raw.voiceTries === 3 ? raw.voiceTries : d.voiceTries,
    ordinal: bool(raw.ordinal, d.ordinal),
  };
}

/** 알아들은 쪽을 밝혀 두는 시간. 무엇으로 알아들었는지 보고 나서 풀이로 가게 */
const PICK_MS = 600;

const QUEST_PHASES: readonly StoryMathPhase[] = ['story', 'question', 'feedback', 'done'];

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 남겨 둔 것을 읽는다. 지금 없는 퀘스트의 기록은 버린다(퀘스트 파일이 바뀌었을 때). */
function readSaved(storage: LwStoragePort, questIds: ReadonlySet<string>): StoryMathSaved | null {
  let raw: Partial<Record<keyof StoryMathSaved, unknown>> | null;
  try {
    raw = JSON.parse(storage.getItem(STORY_MATH_SAVE_KEY) ?? 'null');
  } catch {
    return null;
  }
  if (!raw || raw.v !== 1) return null;
  const entries: unknown[] = Array.isArray(raw.results) ? raw.results : [];
  const results = entries.flatMap((entry): [string, StoryMathResult][] => {
    if (!Array.isArray(entry)) return [];
    const [id, r] = entry as [unknown, Partial<StoryMathResult> | null];
    const ok = typeof id === 'string' && questIds.has(id) && !!r && typeof r.correct === 'number' && typeof r.total === 'number' && typeof r.plays === 'number';
    return ok ? [[id, { correct: r.correct!, total: r.total!, plays: r.plays! }]] : [];
  });
  const last = raw.lastQuestId;
  return {
    ...readSettings(raw),
    v: 1,
    results,
    lastQuestId: typeof last === 'string' && questIds.has(last) ? last : null,
  };
}

/**
 * 스토리매스의 상태와 진행이다: 홈 → 막 → 이야기 → 문제 → 풀이 → … → 끝.
 * 운전 중에 손을 쓰지 않도록, 읽기가 끝나면 스스로 다음으로 가고(자동 진행), 문제에서는 스스로 듣는다.
 * 화면은 버튼으로도 같은 일을 한다(듣기가 없는 브라우저, 동승자).
 * 이야기꾼은 홈에서 인사하고 퀘스트 끝에서 마무리한다. 이름과 모습은 아직 정하지 않았다.
 */
@Injectable()
export class StoryMathPlay {
  private readonly speech = inject(LW_SPEECH_PORT);
  private readonly storage = inject(LW_STORAGE_PORT);

  readonly acts = STORY_MATH_ACTS;
  readonly canSpeak = this.speech.canSpeak;
  readonly canListen = this.speech.canListen;
  /** 모든 퀘스트를 목차 순서로. 이어 듣기와 다음 단원을 고르는 데 쓴다 */
  private readonly allQuests: readonly MathQuest[] = this.acts.flatMap((act) => act.quests);
  private readonly saved = readSaved(this.storage, new Set(this.allQuests.map((q) => q.id)));

  readonly phase = signal<StoryMathPhase>('home');
  readonly act = signal<MathAct | null>(null);
  readonly quest = signal<MathQuest | null>(null);
  readonly paragraphIndex = signal(0);
  readonly questionIndex = signal(0);
  readonly correctCount = signal(0);
  readonly lastCorrect = signal<boolean | null>(null);
  /** 이 퀘스트에서 문제마다 맞았는지 */
  readonly answers = signal<readonly boolean[]>([]);
  /** 마지막 읽기가 너무 빨리 끝났다. 자동 진행을 막는다 */
  readonly speechTooFast = signal(false);
  /** 지금 읽는 글과 읽는 자리. 자리를 모르면 start가 -1 */
  readonly spoken = signal<{ text: string; start: number; end: number } | null>(null);
  /** 소리로 읽는 중. 화면이 "읽는 중"을 보인다 */
  readonly speaking = signal(false);
  readonly listening = signal(false);
  readonly heard = signal('');
  /** 이 문제에서 한 번 못 알아들었다. 화면이 "잘 못 들었어요"와 들은 말을 보인다 */
  readonly missed = signal(false);
  /** 말로 알아들은 쪽. 풀이로 가기 전에 잠깐 밝힌다 */
  readonly picked = signal<0 | 1 | null>(null);
  readonly results = signal<ReadonlyMap<string, StoryMathResult>>(new Map(this.saved?.results ?? []));
  /** 마지막으로 끝까지 들은 퀘스트. 이야기꾼이 "지난번엔 …"이라고 말한다 */
  private readonly lastQuestId = signal<string | null>(this.saved?.lastQuestId ?? null);

  /** 설정. 기기에 남는다. 화면은 아래의 이름별 값을 읽고, 바꿀 때는 set으로 바꾼다 */
  readonly settings = signal<StoryMathSettings>(this.saved ? readSettings(this.saved) : STORY_MATH_DEFAULT_SETTINGS);
  readonly autoPlay = computed(() => this.settings().autoPlay);
  readonly listenEnabled = computed(() => this.settings().listenEnabled);
  readonly showText = computed(() => this.settings().showText);
  readonly rate = computed(() => this.settings().rate);
  /** 기록 지우기·설정 처음대로는 두 번 눌러야 한다. 첫 번째 누름을 기억한다 */
  readonly armed = signal<'results' | 'settings' | null>(null);

  readonly paragraph = computed(() => this.quest()?.story[this.paragraphIndex()] ?? '');
  readonly storyCount = computed(() => this.quest()?.story.length ?? 0);
  readonly question = computed(() => this.quest()?.questions[this.questionIndex()] ?? null);
  readonly questionCount = computed(() => this.quest()?.questions.length ?? 0);
  /** 지금 문제의 정답 보기 글 */
  readonly answerLabel = computed(() => {
    const question = this.question();
    if (!question) return '';
    return question.choices[question.answer].label;
  });
  /** 말로 답할 수 있나. 듣기가 있고 설정에서 켜져 있어야 한다 */
  readonly canAnswerByVoice = computed(() => this.canListen && this.listenEnabled());
  /** 지금 퀘스트의 막 */
  readonly questAct = computed<MathAct | null>(() => {
    const quest = this.quest();
    if (!quest) return null;
    return this.acts.find((a) => a.quests.some((q) => q.id === quest.id)) ?? null;
  });
  /** 이어 듣기: 아직 마치지 않은 첫 퀘스트. 다 마쳤으면 null */
  readonly nextQuest = computed(() => this.allQuests.find((q) => !this.results().has(q.id)) ?? null);
  /** 이어 듣기 퀘스트의 막 */
  readonly nextAct = computed<MathAct | null>(() => {
    const next = this.nextQuest();
    if (!next) return null;
    return this.acts.find((a) => a.quests.some((q) => q.id === next.id)) ?? null;
  });
  /** 지금 퀘스트의 다음 퀘스트(목차 순서). 마지막이면 null */
  readonly followingQuest = computed(() => {
    const quest = this.quest();
    if (!quest) return null;
    return this.allQuests[this.allQuests.findIndex((q) => q.id === quest.id) + 1] ?? null;
  });

  /** 이야기꾼의 인사. 홈에 보이고, 앱을 열 때 읽는다. 제목 뒤에 조사를 붙이지 않으려고 "… 이야기"로 쓴다 */
  readonly greeting = computed(() => {
    const next = this.nextQuest();
    const last = this.allQuests.find((q) => q.id === this.lastQuestId());
    if (!next) return '지금 있는 이야기를 모두 들었어요. 다시 듣고 싶은 막을 골라 보세요.';
    if (!last) return `어서 와요. 오늘은 '${next.title}' 이야기를 들어 볼까요?`;
    return `어서 와요. 지난번엔 '${last.title}' 이야기를 들었지요. 오늘은 '${next.title}' 이야기를 들어 볼까요?`;
  });

  /** 이야기꾼의 마무리. 퀘스트 끝에 보이고 읽는다 */
  readonly closing = computed(() => {
    const quest = this.quest();
    if (!quest) return '';
    const following = this.followingQuest();
    return following
      ? `오늘은 '${quest.title}' 이야기를 들었어요. 다음에는 '${following.title}' 이야기를 들어 봐요.`
      : `오늘은 '${quest.title}' 이야기를 들었어요. 지금 있는 이야기는 여기까지예요.`;
  });

  /** 설정을 닫으면 돌아갈 곳 */
  private beforeSettings: StoryMathPhase = 'home';

  /**
   * 장면이 바뀔 때마다 1씩 는다. 읽기·듣기는 늦게 끝나므로, 끝났을 때 그사이 장면이 바뀌었으면 아무것도 하지 않으려고.
   */
  private step = 0;

  /** 읽기마다 1씩 는다. 끊긴 앞의 읽기가 늦게 끝나며 speaking을 끄지 않게 */
  private sayTurn = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.halt());
    // 운전 중에 앱을 열면 화면을 보지 않아도 무엇을 들을지 알 수 있게, 홈의 인사를 읽는다.
    if (this.settings().narrator) void this.say(this.greeting());
  }

  /** 막에서 마친 퀘스트의 수 */
  doneCount(act: MathAct): number {
    return act.quests.filter((q) => this.results().has(q.id)).length;
  }

  /** 단원의 퀘스트. 퀘스트 파일이 아직 없으면 null(준비 중) */
  questOfUnit(act: MathAct, unitId: string): MathQuest | null {
    return act.quests.find((q) => q.id === unitId) ?? null;
  }

  /** 막 화면의 학기 이름. 고등학교는 학기 대신 과목으로 나뉘어 과목 이름을 쓴다(예: "미적분Ⅱ · 기하") */
  semesterLabel(act: MathAct, semester: number): string {
    const courses = [...new Set(act.units.filter((u) => u.semester === semester).flatMap((u) => (u.course ? [u.course] : [])))];
    return courses.length ? courses.join(' · ') : `${semester}학기`;
  }

  /** "1막 · 1번째 단원". 막의 units 순서로 센다. 홈의 이어 듣기 */
  placeOf(quest: MathQuest): string {
    const act = this.acts.find((a) => a.units.some((u) => u.id === quest.id)) ?? this.acts.find((a) => a.quests.some((q) => q.id === quest.id));
    if (!act) return quest.topic;
    const unitIdx = act.units.findIndex((u) => u.id === quest.id);
    const nth = unitIdx >= 0 ? unitIdx + 1 : act.quests.findIndex((q) => q.id === quest.id) + 1;
    return `${act.title} · ${nth}번째 단원`;
  }

  /** 읽는 자리를 바탕으로 글을 past·now·ahead 조각으로 나눈다. "읽는 곳 밝히기"를 끄면 나누지 않는다 */
  segmentsOf(text: string): LwMarkedSegment[] {
    const sp = this.spoken();
    if (!this.settings().highlight || !sp || sp.start < 0) return [{ text }];
    const offset = sp.text.indexOf(text);
    if (offset < 0) return [{ text }];
    const relStart = Math.max(0, Math.min(text.length, sp.start - offset));
    const relEnd = Math.max(relStart, Math.min(text.length, sp.end - offset));
    const segments: LwMarkedSegment[] = [];
    if (relStart > 0) {
      segments.push({ text: text.slice(0, relStart), state: 'past' });
    }
    if (relEnd > relStart) {
      segments.push({ text: text.slice(relStart, relEnd), state: 'now' });
    }
    if (relEnd < text.length) {
      segments.push({ text: text.slice(relEnd), state: 'ahead' });
    }
    return segments.length > 0 ? segments : [{ text }];
  }

  goHome(): void {
    this.halt();
    this.quest.set(null);
    this.phase.set('home');
  }

  openAct(act: MathAct): void {
    this.halt();
    this.quest.set(null);
    this.act.set(act);
    this.phase.set('act');
  }

  /** 퀘스트를 고른 막으로 돌아간다. 막을 거치지 않고 들어왔으면 그 퀘스트의 막으로 간다 */
  backToAct(): void {
    const act = this.questAct() ?? this.act();
    if (act) this.openAct(act);
    else this.goHome();
  }

  openSettings(): void {
    const phase = this.phase();
    // 퀘스트 도중에 열면 읽기를 멈추고, 닫으면 그 장면을 처음부터 다시 읽는다.
    this.halt();
    this.beforeSettings = phase;
    this.phase.set('settings');
  }

  closeSettings(): void {
    const back = this.beforeSettings;
    if (QUEST_PHASES.includes(back) && this.quest()) void this.go(back);
    else this.phase.set(back);
  }

  startQuest(quest: MathQuest): void {
    this.quest.set(quest);
    this.paragraphIndex.set(0);
    this.questionIndex.set(0);
    this.correctCount.set(0);
    this.lastCorrect.set(null);
    this.answers.set([]);
    void this.go('story');
  }

  restart(): void {
    const quest = this.quest();
    if (quest) this.startQuest(quest);
  }

  /** 이야기를 건너뛰고 첫 문제로 간다. 다시 듣는 사람(기초 반복)을 위해서다. */
  skipToQuestions(): void {
    if (this.phase() !== 'story') return;
    this.questionIndex.set(0);
    void this.go('question');
  }

  /** 이야기의 앞 문단. 첫 문단이면 그 문단을 다시 읽는다. */
  previous(): void {
    if (this.phase() !== 'story') return;
    this.paragraphIndex.update((i) => Math.max(0, i - 1));
    void this.go('story');
  }

  /** 이야기의 다음 문단, 풀이 뒤의 다음 문제. 문제에서는 답을 골라야 하므로 아무것도 하지 않는다. */
  next(): void {
    const quest = this.quest();
    if (!quest) return;
    const phase = this.phase();
    if (phase === 'story') {
      if (this.paragraphIndex() < quest.story.length - 1) {
        this.paragraphIndex.update((i) => i + 1);
        void this.go('story');
      } else {
        this.questionIndex.set(0);
        void this.go('question');
      }
    } else if (phase === 'feedback') {
      if (this.questionIndex() < quest.questions.length - 1) {
        this.questionIndex.update((i) => i + 1);
        void this.go('question');
      } else {
        this.record(quest);
        void this.go('done');
      }
    }
  }

  /** 지금 장면을 다시 읽는다. */
  replay(): void {
    const phase = this.phase();
    if (QUEST_PHASES.includes(phase)) void this.go(phase);
  }

  /** 읽는 중이면 멈춘다. 멈춘 뒤에는 replay로 그 장면을 다시 읽는다. */
  pause(): void {
    this.halt();
  }

  choose(index: number): void {
    const question = this.question();
    if (this.phase() !== 'question' || !question) return;
    const correct = index === question.answer;
    this.lastCorrect.set(correct);
    this.answers.update((arr) => [...arr, correct]);
    if (correct) this.correctCount.update((n) => n + 1);
    void this.go('feedback');
  }

  /** 말로 답을 듣는다. 못 알아들으면 두 번까지 다시 묻고, 그래도 모르면 버튼을 기다린다. */
  async listenAnswer(): Promise<void> {
    const my = this.step;
    const question = this.question();
    if (this.phase() !== 'question' || !question || !this.canAnswerByVoice() || this.listening()) return;
    for (let tries = 0; tries < this.settings().voiceTries; tries++) {
      this.listening.set(true);
      const heard = await this.speech.listen();
      this.listening.set(false);
      if (my !== this.step) return;
      this.heard.set(heard);
      const index = matchChoice(heard, question.choices, this.settings().ordinal);
      if (index !== null) {
        this.picked.set(index);
        await delay(PICK_MS);
        if (my !== this.step) return;
        this.choose(index);
        return;
      }
      this.missed.set(true);
      await this.say(`${question.choices[0].label}, ${question.choices[1].label} 중에서 하나만 말해 주세요.`);
      if (my !== this.step) return;
    }
  }

  /** 설정 하나를 바꾸고 기기에 남긴다 */
  set<K extends keyof StoryMathSettings>(key: K, value: StoryMathSettings[K]): void {
    this.settings.update((s) => ({ ...s, [key]: value }));
    this.armed.set(null);
    this.save();
  }

  toggle(key: 'autoPlay' | 'listenEnabled' | 'showText' | 'narrator' | 'highlight' | 'continueNext' | 'autoListen' | 'ordinal'): void {
    this.set(key, !this.settings()[key]);
  }

  toggleAutoPlay(): void {
    this.toggle('autoPlay');
  }

  toggleListen(): void {
    this.toggle('listenEnabled');
  }

  toggleShowText(): void {
    this.toggle('showText');
  }

  setRate(rate: StoryMathRate): void {
    this.set('rate', rate);
  }

  /** 들은 기록(마친 단원, 맞힌 수, 들은 횟수)을 지운다. 처음 누르면 준비만 하고, 한 번 더 누르면 지운다 */
  clearResults(): void {
    if (this.armed() !== 'results') return this.armed.set('results');
    this.armed.set(null);
    this.results.set(new Map());
    this.lastQuestId.set(null);
    this.save();
  }

  /** 설정을 처음대로 돌린다. 기록은 두고, 소리 엔진은 셸이 따로 기억하므로 건드리지 않는다. 두 번 눌러야 한다 */
  resetSettings(): void {
    if (this.armed() !== 'settings') return this.armed.set('settings');
    this.armed.set(null);
    this.settings.set(STORY_MATH_DEFAULT_SETTINGS);
    this.save();
  }

  private record(quest: MathQuest): void {
    const before = this.results().get(quest.id);
    const next = new Map(this.results());
    next.set(quest.id, { correct: this.correctCount(), total: quest.questions.length, plays: (before?.plays ?? 0) + 1 });
    this.results.set(next);
    this.lastQuestId.set(quest.id);
    this.save();
  }

  /** 기록과 설정을 기기에 남긴다. 남길 수 없는 곳(사생활 보호 창)이면 저장 포트가 앱이 떠 있는 동안만 들고 있다 */
  private save(): void {
    const saved: StoryMathSaved = {
      ...this.settings(),
      v: 1,
      results: [...this.results()],
      lastQuestId: this.lastQuestId(),
    };
    this.storage.setItem(STORY_MATH_SAVE_KEY, JSON.stringify(saved));
  }

  private speakOptions(): { rate: number } {
    return { rate: STORY_MATH_RATES[this.rate()] };
  }

  /** 읽는 동안 speaking을 켠다. */
  private async say(text: string): Promise<void> {
    const my = ++this.sayTurn;
    this.speaking.set(true);
    this.spoken.set({ text, start: -1, end: -1 });
    let hasRange = false;
    const startTime = Date.now();
    await this.speech.speak(text, {
      ...this.speakOptions(),
      onRange: (s, e) => {
        if (my === this.sayTurn) {
          hasRange = true;
          this.spoken.set({ text, start: s, end: e });
        }
      },
    });
    if (my === this.sayTurn) {
      this.speaking.set(false);
      if (hasRange) {
        this.spoken.set({ text, start: text.length, end: text.length });
      }
      const elapsed = Date.now() - startTime;
      const threshold = Math.min(text.length * 30, 1000);
      this.speechTooFast.set(text.length > 10 && elapsed < threshold);
    }
  }

  private halt(): void {
    this.step++;
    this.sayTurn++;
    this.speech.stop();
    this.speaking.set(false);
    this.listening.set(false);
    this.spoken.set(null);
  }

  private async go(phase: StoryMathPhase): Promise<void> {
    const my = ++this.step;
    this.speech.stop();
    this.listening.set(false);
    this.missed.set(false);
    this.picked.set(null);
    if (phase !== 'feedback') {
      this.heard.set('');
    }
    this.phase.set(phase);
    await this.say(this.spokenText(phase));
    if (my !== this.step) return;
    const settings = this.settings();
    if (phase === 'question') {
      if (settings.autoListen) void this.listenAnswer();
      return;
    }
    // 읽기가 바로 끝나는 환경(목소리가 없는 브라우저)에서 이야기가 한순간에 지나가지 않게
    const spoke = this.canSpeak && !this.speechTooFast();
    if (settings.autoPlay && spoke && (phase === 'story' || phase === 'feedback')) {
      const pause = STORY_MATH_PAUSES[settings.pause];
      if (pause) await delay(pause);
      if (my !== this.step) return;
      this.next();
      return;
    }
    // 긴 운전: 다 들으면 잠깐 쉬고 다음 단원을 시작한다. 그사이 화면을 누르면(장면이 바뀌면) 멈춘다
    const following = this.followingQuest();
    if (phase === 'done' && settings.continueNext && spoke && following) {
      await delay(CONTINUE_MS);
      if (my !== this.step) return;
      this.startQuest(following);
    }
  }

  private spokenText(phase: StoryMathPhase): string {
    const question = this.question();
    switch (phase) {
      case 'story':
        return this.paragraph();
      case 'question':
        return question?.prompt ?? '';
      case 'feedback':
        return `${this.lastCorrect() ? '맞았어요.' : '아니에요.'} ${question?.explain ?? ''}`;
      case 'done': {
        const score = `퀘스트를 마쳤어요. ${this.questionCount()}문제 중 ${this.correctCount()}문제를 맞혔어요.`;
        return this.settings().narrator ? `${score} ${this.closing()}` : score;
      }
      default:
        return '';
    }
  }
}
