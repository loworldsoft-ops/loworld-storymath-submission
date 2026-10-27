import { afterEach, describe, expect, it, vi } from 'vitest';
import { nativeHasAction } from './native-bridge';
import { NativeSpeechAdapter } from './native-speech.adapter';

type TestWindow = Window & { loworldNative?: unknown; onLoworldNativeMessage?: (m: unknown) => void };
const w = window as TestWindow;

/** 셸 흉내. 받은 말을 모아 두고, 할 수 있는 동작을 정한다. */
function fakeShell(actions: string[]) {
  const sent: Record<string, unknown>[] = [];
  w.loworldNative = {
    postMessage: (json: string) => sent.push(JSON.parse(json) as Record<string, unknown>),
    hasAction: (action: string) => actions.includes(action),
  };
  const reply = (type: string, data: Record<string, unknown>) => w.onLoworldNativeMessage?.({ type, data });
  return { sent, reply };
}

afterEach(() => {
  delete w.loworldNative;
  delete w.onLoworldNativeMessage;
});

describe('NativeSpeechAdapter', () => {
  it('셸 밖에서는 아무 동작도 없다', () => {
    expect(nativeHasAction('speech.speak')).toBe(false);
    const adapter = new NativeSpeechAdapter();
    expect(adapter.canSpeak).toBe(false);
    expect(adapter.canListen).toBe(false);
  });

  it('읽기를 셸에 보내고, 같은 번호의 답이 오면 끝난다', async () => {
    const shell = fakeShell(['speech.speak', 'speech.listen']);
    const adapter = new NativeSpeechAdapter();
    const done = vi.fn();
    void adapter.speak('하나', { rate: 0.8 }).then(done);
    expect(shell.sent[0]).toEqual({ action: 'speech.speak', id: 1, text: '하나', rate: 0.8 });
    shell.reply('speech.spoken', { id: 99 });
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    shell.reply('speech.spoken', { id: 1 });
    await Promise.resolve();
    expect(done).toHaveBeenCalled();
  });

  it('들은 글을 받는다', async () => {
    const shell = fakeShell(['speech.speak', 'speech.listen']);
    const adapter = new NativeSpeechAdapter();
    const heard = adapter.listen();
    expect(shell.sent[0]).toEqual({ action: 'speech.listen', id: 1 });
    shell.reply('speech.heard', { id: 1, text: '돌' });
    await expect(heard).resolves.toBe('돌');
  });

  it('멈추면 기다리던 읽기와 듣기가 바로 끝나고 셸에 멈춤을 보낸다', async () => {
    const shell = fakeShell(['speech.speak', 'speech.listen']);
    const adapter = new NativeSpeechAdapter();
    const spoken = adapter.speak('하나');
    const heard = adapter.listen();
    adapter.stop();
    await expect(spoken).resolves.toBeUndefined();
    await expect(heard).resolves.toBe('');
    expect(shell.sent.at(-1)).toEqual({ action: 'speech.stop' });
  });

  it('앞서 걸린 받는 곳도 부른다', () => {
    const previous = vi.fn();
    w.onLoworldNativeMessage = previous;
    fakeShell(['speech.speak']);
    new NativeSpeechAdapter();
    w.onLoworldNativeMessage?.({ type: 'executionMode', data: { mode: 'LOCAL_ASSET' } });
    expect(previous).toHaveBeenCalled();
  });

  it('(가) 셸이 speech.range를 보내면 onRange가 그 값으로 불린다', async () => {
    const shell = fakeShell(['speech.speak']);
    const adapter = new NativeSpeechAdapter();
    const onRange = vi.fn();
    void adapter.speak('안녕 세상', { onRange });
    shell.reply('speech.range', { id: 1, start: 0, end: 2 });
    expect(onRange).toHaveBeenCalledWith(0, 2);
  });

  it('(나) speech.spoken 뒤에 온 speech.range는 버린다', async () => {
    const shell = fakeShell(['speech.speak']);
    const adapter = new NativeSpeechAdapter();
    const onRange = vi.fn();
    const done = adapter.speak('안녕 세상', { onRange });
    shell.reply('speech.spoken', { id: 1 });
    await done;
    shell.reply('speech.range', { id: 1, start: 3, end: 5 });
    expect(onRange).not.toHaveBeenCalled();
  });

  it('(다) 다른 id의 것은 버린다', async () => {
    const shell = fakeShell(['speech.speak']);
    const adapter = new NativeSpeechAdapter();
    const onRange = vi.fn();
    void adapter.speak('안녕 세상', { onRange });
    shell.reply('speech.range', { id: 99, start: 0, end: 2 });
    expect(onRange).not.toHaveBeenCalled();
  });
});
