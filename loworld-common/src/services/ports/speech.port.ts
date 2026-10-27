import { InjectionToken } from '@angular/core';
import { nativeHasAction } from './native-bridge';
import { NativeSpeechAdapter } from './native-speech.adapter';

/**
 * 소리로 읽고 듣는 길이다.
 * 브라우저에서는 Web Speech API가, 안드로이드 셸 안에서는 셸이 고른 엔진(안드로이드 기본, 차에서는 Pleos)이 같은 모양으로 들어온다.
 * 화면은 어느 쪽인지 모른다. 엔진을 고르는 일은 `LW_SPEECH_ENGINE_PORT`가 한다.
 */
export interface LwSpeechPort {
  /** 읽을 수 있나. 없으면 speak는 바로 끝난다 */
  readonly canSpeak: boolean;
  /** 들을 수 있나. 없으면 listen은 바로 빈 글을 준다 */
  readonly canListen: boolean;
  /** 다 읽으면 끝난다. stop()으로 끊겨도 끝난다(실패하지 않는다) */
  speak(text: string, options?: LwSpeakOptions): Promise<void>;
  /** 한 번 듣고 들은 글을 준다. 못 들었거나 끊기면 빈 글이다(실패하지 않는다) */
  listen(): Promise<string>;
  /** 읽기와 듣기를 멈춘다 */
  stop(): void;
}

/** 읽기의 선택. 어댑터가 못 하는 것은 무시한다. */
export interface LwSpeakOptions {
  /** 빠르기. 1이 보통이다. 0.5~2 */
  readonly rate?: number;
  /** 엔진이 지금 읽는 자리를 알려 줄 때 부른다. 글자 위치(0부터), end는 그 자리를 넘지 않는 끝. 알려 주지 않는 엔진에서는 부르지 않는다 */
  readonly onRange?: (start: number, end: number) => void;
}

interface BrowserRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
type BrowserRecognitionCtor = new () => BrowserRecognition;

/**
 * 브라우저의 Web Speech API로 읽고 듣는다.
 * 듣기는 크롬 계열에만 있다(webkitSpeechRecognition). 없으면 canListen이 false라 화면이 버튼으로만 답하게 한다.
 */
export class BrowserSpeechAdapter implements LwSpeechPort {
  private recognition: BrowserRecognition | null = null;

  constructor(private readonly lang = 'ko-KR') {}

  private get synth(): SpeechSynthesis | null {
    return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  }

  private get recognitionCtor(): BrowserRecognitionCtor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { SpeechRecognition?: BrowserRecognitionCtor; webkitSpeechRecognition?: BrowserRecognitionCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }

  get canSpeak(): boolean {
    return this.synth !== null;
  }

  get canListen(): boolean {
    return this.recognitionCtor !== null;
  }

  speak(text: string, options?: LwSpeakOptions): Promise<void> {
    const synth = this.synth;
    if (!synth || !text) return Promise.resolve();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.lang;
      utterance.rate = options?.rate ?? 1;
      utterance.onboundary = (e) => {
        if (!options?.onRange) return;
        const start = e.charIndex;
        let end = start + (e.charLength || 0);
        if (end <= start) {
          const nextSpace = text.indexOf(' ', start);
          end = nextSpace === -1 ? text.length : nextSpace;
        }
        options.onRange(start, end);
      };
      // cancel()로 끊기면 onerror가 온다. 끊긴 것도 끝난 것으로 본다.
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synth.speak(utterance);
    });
  }

  listen(): Promise<string> {
    const Ctor = this.recognitionCtor;
    if (!Ctor) return Promise.resolve('');
    this.recognition?.abort();
    return new Promise((resolve) => {
      const recognition = new Ctor();
      let heard = '';
      recognition.lang = this.lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      // 후보를 모두 붙여 준다. 답을 고르는 쪽이 후보 중 하나라도 맞으면 알아듣게 하려고.
      recognition.onresult = (event) => {
        const first = event.results[0];
        heard = first ? Array.from(first).map((alt) => alt.transcript).join(' ') : '';
      };
      recognition.onerror = () => undefined;
      recognition.onend = () => {
        if (this.recognition === recognition) this.recognition = null;
        resolve(heard);
      };
      this.recognition = recognition;
      recognition.start();
    });
  }

  stop(): void {
    this.synth?.cancel();
    this.recognition?.abort();
  }
}

/**
 * 소리 포트. 안드로이드 셸이 읽기를 할 수 있으면 셸에게 맡기고, 아니면 브라우저 어댑터다.
 * 셸의 웹뷰에서는 브라우저의 듣기가 돌지 않는다(마이크 권한을 웹뷰에 주지 않는다). 그래서 셸 안에서는 늘 셸이 읽고 듣는다.
 * 앱은 어느 쪽인지 모른다.
 */
export const LW_SPEECH_PORT = new InjectionToken<LwSpeechPort>('LW_SPEECH_PORT', {
  providedIn: 'root',
  // speech.engines가 있는 셸은 엔진을 고를 수 있어, 지금 읽기가 없어도 고른 뒤에 생긴다. 그래서 셸에게 맡긴다.
  // speech.speak만 보는 것은 엔진 고르기가 없던 셸(W4)을 위해서다.
  factory: () => (nativeHasAction('speech.engines') || nativeHasAction('speech.speak') ? new NativeSpeechAdapter() : new BrowserSpeechAdapter()),
});
