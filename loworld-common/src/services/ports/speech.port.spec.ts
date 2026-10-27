import { describe, expect, it, vi } from 'vitest';
import { BrowserSpeechAdapter } from './speech.port';

describe('BrowserSpeechAdapter', () => {
  it('듣기가 없는 브라우저에서는 canListen이 false이고 listen이 빈 글을 준다', async () => {
    const adapter = new BrowserSpeechAdapter();
    expect(adapter.canListen).toBe(false);
    await expect(adapter.listen()).resolves.toBe('');
  });

  it('읽기가 없으면 speak가 바로 끝나고, stop이 실패하지 않는다', async () => {
    const adapter = new BrowserSpeechAdapter();
    if (!adapter.canSpeak) await expect(adapter.speak('하나')).resolves.toBeUndefined();
    expect(() => adapter.stop()).not.toThrow();
  });

  it('synth가 있으면 utterance의 onboundary에서 onRange를 부른다', async () => {
    let capturedUtterance: { text: string; onboundary?: (e: unknown) => void } | null = null;
    class MockUtterance {
      lang = '';
      rate = 1;
      onboundary: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {
        capturedUtterance = this;
      }
    }
    (globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = MockUtterance;
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      speak: () => undefined,
      cancel: () => undefined,
    };
    try {
      const adapter = new BrowserSpeechAdapter();
      const onRange = vi.fn();
      void adapter.speak('안녕 세상', { onRange });
      expect(capturedUtterance).not.toBeNull();
      capturedUtterance!.onboundary?.({ charIndex: 0, charLength: 2 });
      expect(onRange).toHaveBeenCalledWith(0, 2);
      capturedUtterance!.onboundary?.({ charIndex: 3, charLength: 0 });
      expect(onRange).toHaveBeenCalledWith(3, 5);
    } finally {
      delete (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
      delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    }
  });
});
