import { DestroyRef } from '@angular/core';

/**
 * 컴포넌트 수명주기(DestroyRef)와 결합된 안전한 setTimeout 래퍼.
 * 컴포넌트 파괴 시 등록된 타이머 핸들을 자동으로 clearTimeout 하여
 * 좀비 콜백 실행 및 ChangeDetectorRef 메모리 누수를 원천 차단합니다.
 *
 * @param destroyRef Angular 인젝션 컨텍스트의 DestroyRef (inject(DestroyRef))
 * @param callback 타이머 만료 시 실행할 함수
 * @param delayMs 지연 시간 (밀리초)
 * @returns 수동 취소 함수 (필요 시 조기 취소 가능)
 */
export function safeTimeout(
  destroyRef?: DestroyRef | null,
  callback: () => void = () => {},
  delayMs = 0
): () => void {
  const timerHandle = setTimeout(() => {
    callback();
  }, delayMs);

  const unregister =
    destroyRef && typeof destroyRef.onDestroy === 'function'
      ? destroyRef.onDestroy(() => {
          clearTimeout(timerHandle);
        })
      : undefined;

  return () => {
    clearTimeout(timerHandle);
    if (typeof unregister === 'function') {
      unregister();
    }
  };
}
