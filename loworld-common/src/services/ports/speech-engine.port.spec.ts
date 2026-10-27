import { afterEach, describe, expect, it } from 'vitest';
import { NativeSpeechEngineAdapter, NoSpeechEngineChoice } from './speech-engine.port';

type TestWindow = Window & { loworldNative?: unknown; onLoworldNativeMessage?: (m: unknown) => void };
const w = window as TestWindow;

/** 셸 흉내. 받은 말을 모아 둔다. */
function fakeShell() {
  const sent: Record<string, unknown>[] = [];
  w.loworldNative = {
    postMessage: (json: string) => sent.push(JSON.parse(json) as Record<string, unknown>),
    hasAction: (action: string) => action === 'speech.engines',
  };
  const reply = (type: string, data: Record<string, unknown>) => w.onLoworldNativeMessage?.({ type, data });
  return { sent, reply };
}

afterEach(() => {
  delete w.loworldNative;
  delete w.onLoworldNativeMessage;
});

describe('NativeSpeechEngineAdapter', () => {
  it('만들어지면 셸에게 엔진을 묻고, 답을 받아 둔다', () => {
    const shell = fakeShell();
    const engines = new NativeSpeechEngineAdapter();
    expect(shell.sent[0]).toEqual({ action: 'speech.engines' });
    expect(engines.speak()).toBeNull();
    shell.reply('speech.engines', {
      speak: { selected: 'auto', active: 'android', options: [{ id: 'android', label: '안드로이드 기본' }] },
      listen: { selected: 'pleos', active: null, options: [{ id: 'pleos', label: 'Pleos' }, { id: 7 }] },
    });
    expect(engines.speak()).toEqual({ selected: 'auto', active: 'android', options: [{ id: 'android', label: '안드로이드 기본' }] });
    // 모양이 틀린 고르기는 버린다.
    expect(engines.listen()).toEqual({ selected: 'pleos', active: null, options: [{ id: 'pleos', label: 'Pleos' }] });
  });

  it('고르면 셸에게 보낸다', () => {
    const shell = fakeShell();
    new NativeSpeechEngineAdapter().choose('listen', 'android-ondevice');
    expect(shell.sent.at(-1)).toEqual({ action: 'speech.chooseEngine', kind: 'listen', id: 'android-ondevice' });
  });

  it('다른 말은 무시한다', () => {
    const shell = fakeShell();
    const engines = new NativeSpeechEngineAdapter();
    shell.reply('speech.heard', { id: 1, text: '돌' });
    expect(engines.speak()).toBeNull();
  });
});

describe('NoSpeechEngineChoice', () => {
  it('고를 것이 없다', () => {
    const engines = new NoSpeechEngineChoice();
    expect(engines.choosable).toBe(false);
    expect(engines.speak()).toBeNull();
    expect(() => engines.choose()).not.toThrow();
  });
});
