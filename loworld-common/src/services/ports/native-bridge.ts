/**
 * 안드로이드 셸(LoworldUI-AOS)이 웹뷰에 붙여 주는 통로(`loworldNative`)다. 소리 포트와 엔진 고르기가 함께 쓴다.
 *
 *  - 웹 → 셸: `loworldNative.postMessage(JSON 글자)`. JSON은 `{ action, ... }`.
 *  - 셸 → 웹: `window.onLoworldNativeMessage({ type, data })`. 받는 곳은 하나뿐이라 `onNativeMessage`로 이어 건다.
 *  - 웹 → 셸(바로 답함): `loworldNative.hasAction(동작)`. 셸이 그 동작을 지금 할 수 있는지 동기로 답한다.
 */
interface NativeBridge {
  postMessage(json: string): void;
  hasAction?(action: string): boolean;
}

export interface NativeMessage {
  readonly type: string;
  readonly data?: Readonly<Record<string, unknown>>;
}

type NativeWindow = Window & {
  loworldNative?: NativeBridge;
  onLoworldNativeMessage?: (message: NativeMessage) => void;
};

const win = (): NativeWindow | null => (typeof window === 'undefined' ? null : (window as NativeWindow));

/** 셸이 이 동작을 할 수 있나. 셸 밖(브라우저)이면 false다. */
export function nativeHasAction(action: string): boolean {
  const bridge = win()?.loworldNative;
  try {
    return typeof bridge?.hasAction === 'function' && bridge.hasAction(action) === true;
  } catch {
    return false;
  }
}

/** 셸에게 보낸다. 셸 밖이면 버린다. */
export function postNative(message: Readonly<Record<string, unknown>>): void {
  win()?.loworldNative?.postMessage(JSON.stringify(message));
}

/** 셸이 보내는 말을 받는다. 받는 곳은 하나뿐이라, 앞서 걸린 것이 있으면 그것도 부른다. */
export function onNativeMessage(handler: (message: NativeMessage) => void): void {
  const w = win();
  if (!w) return;
  const previous = w.onLoworldNativeMessage;
  w.onLoworldNativeMessage = (message: NativeMessage) => {
    previous?.(message);
    handler(message);
  };
}
