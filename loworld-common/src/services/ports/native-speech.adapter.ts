import { nativeHasAction, onNativeMessage, postNative, type NativeMessage } from './native-bridge';
import type { LwSpeakOptions, LwSpeechPort } from './speech.port';

/**
 * 셸에게 읽기와 듣기를 맡긴다. 셸은 고른 엔진(안드로이드 기본, Pleos …)으로 한다. 어느 엔진인지 웹은 모른다.
 *
 * 주고받는 말:
 *  - 웹 → 셸: `{ action: 'speech.speak', id, text, rate }`, `{ action: 'speech.listen', id }`, `{ action: 'speech.stop' }`
 *  - 셸 → 웹: `{ type: 'speech.spoken', data: { id } }`, `{ type: 'speech.heard', data: { id, text } }`, `{ type: 'speech.range', data: { id, start, end } }`
 * 요청마다 번호(id)를 붙여, 늦게 온 답이 다음 요청을 끝내지 않게 한다.
 */
export class NativeSpeechAdapter implements LwSpeechPort {
  private nextId = 1;
  private readonly spoken = new Map<number, () => void>();
  private readonly heard = new Map<number, (text: string) => void>();
  private readonly ranges = new Map<number, (start: number, end: number) => void>();

  constructor() {
    onNativeMessage((message) => this.receive(message));
  }

  get canSpeak(): boolean {
    return nativeHasAction('speech.speak');
  }

  get canListen(): boolean {
    return nativeHasAction('speech.listen');
  }

  speak(text: string, options?: LwSpeakOptions): Promise<void> {
    if (!text || !this.canSpeak) return Promise.resolve();
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.spoken.set(id, resolve);
      if (options?.onRange) this.ranges.set(id, options.onRange);
      postNative({ action: 'speech.speak', id, text, rate: options?.rate ?? 1 });
    });
  }

  listen(): Promise<string> {
    if (!this.canListen) return Promise.resolve('');
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.heard.set(id, resolve);
      postNative({ action: 'speech.listen', id });
    });
  }

  stop(): void {
    // 셸의 답을 기다리지 않고 지금 끝낸다. 셸이 늦게 보내는 답은 번호가 없어 버려진다.
    for (const resolve of this.spoken.values()) resolve();
    for (const resolve of this.heard.values()) resolve('');
    this.spoken.clear();
    this.heard.clear();
    this.ranges.clear();
    postNative({ action: 'speech.stop' });
  }

  private receive(message: NativeMessage): void {
    const id = message?.data?.['id'];
    if (typeof id !== 'number') return;
    if (message.type === 'speech.range') {
      const start = message.data?.['start'];
      const end = message.data?.['end'];
      if (typeof start === 'number' && typeof end === 'number') {
        this.ranges.get(id)?.(start, end);
      }
    } else if (message.type === 'speech.spoken') {
      this.spoken.get(id)?.();
      this.spoken.delete(id);
      this.ranges.delete(id);
    } else if (message.type === 'speech.heard') {
      const text = message.data?.['text'];
      this.heard.get(id)?.(typeof text === 'string' ? text : '');
      this.heard.delete(id);
    }
  }
}
