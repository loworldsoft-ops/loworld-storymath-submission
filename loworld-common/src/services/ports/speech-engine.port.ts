import { InjectionToken, type Signal, signal } from '@angular/core';
import { nativeHasAction, onNativeMessage, postNative, type NativeMessage } from './native-bridge';

/** 읽기(speak)와 듣기(listen)는 엔진을 따로 고른다. 차의 목소리에 폰의 듣기를 붙일 수도 있다. */
export type LwSpeechKind = 'speak' | 'listen';

/** 셸이 알아서 고르게 하는 값. 셸은 좋은 엔진부터 준비해 보고 처음 준비된 것을 쓴다. */
export const LW_SPEECH_AUTO = 'auto';

/** 고를 수 있는 엔진 하나. id와 이름은 셸이 정한다. 웹은 엔진의 종류를 모른다. */
export interface LwSpeechEngineOption {
  readonly id: string;
  readonly label: string;
}

export interface LwSpeechEngineChoice {
  /** 고른 것. `LW_SPEECH_AUTO`이거나 options의 id 하나다 */
  readonly selected: string;
  /** 지금 쓰는 엔진의 id. 고른 것이 준비되지 않으면 다른 것을 쓰므로 selected와 다를 수 있다. 쓸 수 있는 것이 없으면 null */
  readonly active: string | null;
  /** 좋은 것부터. 자동은 이 순서로 준비해 본다 */
  readonly options: readonly LwSpeechEngineOption[];
}

/**
 * 소리 엔진을 고르는 길이다. 읽고 듣는 일은 `LW_SPEECH_PORT`가 하고, 이것은 어느 엔진으로 할지만 정한다.
 * 고를 수 있는 엔진은 띄우는 쪽(셸)이 안다. 브라우저에서는 고를 것이 없다.
 */
export interface LwSpeechEnginePort {
  /** 엔진을 고를 수 있나. 셸 밖(브라우저)에서는 false다 */
  readonly choosable: boolean;
  /** 셸이 아직 답하지 않았으면 null */
  readonly speak: Signal<LwSpeechEngineChoice | null>;
  readonly listen: Signal<LwSpeechEngineChoice | null>;
  /** 셸에게 지금 상태를 다시 묻는다. 설정 화면을 열 때 부른다 */
  refresh(): void;
  /** 엔진을 고른다. 셸이 엔진을 바꾸고 준비를 마친 뒤 새 상태를 보낸다. 고른 것은 셸이 기억한다 */
  choose(kind: LwSpeechKind, id: string): void;
}

const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

/** 셸이 보낸 것을 읽는다. 모양이 틀리면 null이다. */
function toChoice(raw: unknown): LwSpeechEngineChoice | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isText(r['selected']) || !Array.isArray(r['options'])) return null;
  const options = r['options'].flatMap((o: unknown) => {
    const opt = o as Record<string, unknown> | null;
    return opt && isText(opt['id']) && isText(opt['label']) ? [{ id: opt['id'], label: opt['label'] }] : [];
  });
  return { selected: r['selected'], active: isText(r['active']) ? r['active'] : null, options };
}

/**
 * 셸에게 엔진을 묻고 고른다.
 *  - 웹 → 셸: `{ action: 'speech.engines' }`, `{ action: 'speech.chooseEngine', kind, id }`
 *  - 셸 → 웹: `{ type: 'speech.engines', data: { speak: 고르기, listen: 고르기 } }`. 묻거나 고를 때마다 보낸다
 */
export class NativeSpeechEngineAdapter implements LwSpeechEnginePort {
  readonly choosable = true;
  private readonly speakChoice = signal<LwSpeechEngineChoice | null>(null);
  private readonly listenChoice = signal<LwSpeechEngineChoice | null>(null);
  readonly speak = this.speakChoice.asReadonly();
  readonly listen = this.listenChoice.asReadonly();

  constructor() {
    onNativeMessage((message) => this.receive(message));
    this.refresh();
  }

  refresh(): void {
    postNative({ action: 'speech.engines' });
  }

  choose(kind: LwSpeechKind, id: string): void {
    postNative({ action: 'speech.chooseEngine', kind, id });
  }

  private receive(message: NativeMessage): void {
    if (message?.type !== 'speech.engines') return;
    this.speakChoice.set(toChoice(message.data?.['speak']));
    this.listenChoice.set(toChoice(message.data?.['listen']));
  }
}

/** 고를 것이 없다(브라우저). */
export class NoSpeechEngineChoice implements LwSpeechEnginePort {
  readonly choosable = false;
  readonly speak = signal<LwSpeechEngineChoice | null>(null).asReadonly();
  readonly listen = signal<LwSpeechEngineChoice | null>(null).asReadonly();

  refresh(): void {}

  choose(): void {}
}

/** 엔진 고르기. 셸이 엔진 고르기를 할 수 있으면 셸에게 묻고, 아니면 고를 것이 없다. 앱은 어느 쪽인지 모른다. */
export const LW_SPEECH_ENGINE_PORT = new InjectionToken<LwSpeechEnginePort>('LW_SPEECH_ENGINE_PORT', {
  providedIn: 'root',
  factory: () => (nativeHasAction('speech.engines') ? new NativeSpeechEngineAdapter() : new NoSpeechEngineChoice()),
});
