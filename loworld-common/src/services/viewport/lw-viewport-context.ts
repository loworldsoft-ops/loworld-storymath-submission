import { DestroyRef, Injectable, InjectionToken, Provider, Signal, computed, inject, signal } from '@angular/core';
import { WINDOW } from '../tokens/window.token';
import { LwFormFactor, formFactorOf } from './lw-breakpoints';

const FALLBACK_WIDTH = 1440;
const FALLBACK_HEIGHT = 900;

/**
 * "지금 이 컴포넌트가 놓인 화면"에 대한 답.
 *
 * 루트에서는 브라우저 창이 답하고, 시뮬레이터나 미리보기 안에서는 그 요소가 답한다.
 * 컴포넌트는 `inject(LW_VIEWPORT)`만 하면 되고 자기가 시뮬레이터 안인지 알 필요가 없다.
 */
export interface LwViewportContext {
  readonly width: Signal<number>;
  readonly height: Signal<number>;
  readonly formFactor: Signal<LwFormFactor>;
  /** 주 입력 장치가 터치인가 */
  readonly coarsePointer: Signal<boolean>;
  readonly canHover: Signal<boolean>;
  /** 실제 창이 아니라 화면 안의 가상 화면(시뮬레이터, 미리보기)인가 */
  readonly simulated: Signal<boolean>;
  /** 띄우는 UI(모달, 바텀시트)를 붙일 요소. 루트에서는 body, 가상 화면에서는 그 요소다. */
  overlayHost(): HTMLElement | null;
}

/** 미디어 쿼리 결과를 시그널로 만든다. 값이 바뀔 때만 갱신된다. */
function mediaSignal(win: Window | null, query: string, fallback: boolean, onDestroy: (fn: () => void) => void): Signal<boolean> {
  const list = typeof win?.matchMedia === 'function' ? win.matchMedia(query) : null;
  const state = signal<boolean>(list ? list.matches : fallback);
  if (list) {
    const listener = (event: MediaQueryListEvent): void => state.set(event.matches);
    list.addEventListener('change', listener);
    onDestroy(() => list.removeEventListener('change', listener));
  }
  return state.asReadonly();
}

/**
 * 브라우저 창을 기준으로 한 뷰포트. 앱 전체에서 `resize`를 듣는 곳은 여기 하나다.
 * 폭·높이는 프레임당 한 번만 갱신하고, `formFactor`는 경계를 넘을 때만 바뀐다.
 */
export function createWindowViewport(win: Window | null, onDestroy: (fn: () => void) => void = () => undefined): LwViewportContext {
  const width = signal<number>(win?.innerWidth ?? FALLBACK_WIDTH);
  const height = signal<number>(win?.innerHeight ?? FALLBACK_HEIGHT);

  if (win) {
    let frame: number | null = null;
    const onResize = (): void => {
      if (frame !== null) return;
      frame = win.requestAnimationFrame(() => {
        frame = null;
        width.set(win.innerWidth);
        height.set(win.innerHeight);
      });
    };
    win.addEventListener('resize', onResize, { passive: true });
    onDestroy(() => {
      win.removeEventListener('resize', onResize);
      if (frame !== null) win.cancelAnimationFrame(frame);
    });
  }

  return {
    width: width.asReadonly(),
    height: height.asReadonly(),
    formFactor: computed(() => formFactorOf(width())),
    coarsePointer: mediaSignal(win, '(pointer: coarse)', false, onDestroy),
    canHover: mediaSignal(win, '(hover: hover)', true, onDestroy),
    simulated: signal(false).asReadonly(),
    overlayHost: () => win?.document.body ?? null,
  };
}

export const LW_VIEWPORT = new InjectionToken<LwViewportContext>('LW_VIEWPORT', {
  providedIn: 'root',
  factory: () => {
    const destroyRef = inject(DestroyRef);
    return createWindowViewport(inject(WINDOW), (fn) => destroyRef.onDestroy(fn));
  },
});

/**
 * 요소 하나를 가상 화면으로 삼는 뷰포트. 시뮬레이터처럼 화면 안에 화면을 그리는 컴포넌트가 제공한다.
 * `simulate()`를 부르기 전이나 `release()` 뒤에는 바깥 뷰포트의 값을 그대로 전한다.
 */
@Injectable()
export class LwScopedViewport implements LwViewportContext {
  private readonly parent = inject(LW_VIEWPORT, { skipSelf: true });

  private readonly element = signal<HTMLElement | null>(null);
  private readonly measuredWidth = signal<number>(0);
  private readonly measuredHeight = signal<number>(0);
  private readonly touch = signal<boolean>(true);
  private observer: ResizeObserver | null = null;

  /** 요소가 붙어 있고 크기를 한 번이라도 잰 뒤에만 가상 화면으로 답한다. */
  readonly simulated = computed(() => this.element() !== null && this.measuredWidth() > 0);
  readonly width = computed(() => (this.simulated() ? this.measuredWidth() : this.parent.width()));
  readonly height = computed(() => (this.simulated() ? this.measuredHeight() : this.parent.height()));
  readonly formFactor = computed(() => formFactorOf(this.width()));
  readonly coarsePointer = computed(() => (this.simulated() ? this.touch() : this.parent.coarsePointer()));
  readonly canHover = computed(() => (this.simulated() ? !this.touch() : this.parent.canHover()));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  overlayHost(): HTMLElement | null {
    return this.element() ?? this.parent.overlayHost();
  }

  /** `element`를 가상 화면으로 삼는다. `touch`는 그 화면을 터치 기기로 취급할지다. */
  simulate(element: HTMLElement, touch = true): void {
    if (this.element() === element) {
      this.touch.set(touch);
      return;
    }
    this.release();
    this.touch.set(touch);
    this.measure(element);
    const Observer = element.ownerDocument.defaultView?.ResizeObserver;
    if (Observer) {
      this.observer = new Observer(() => this.measure(element));
      this.observer.observe(element);
    }
    this.element.set(element);
  }

  /** 가상 화면을 풀고 바깥 뷰포트로 돌아간다. */
  release(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.element.set(null);
  }

  private measure(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    this.measuredWidth.set(Math.round(rect.width));
    this.measuredHeight.set(Math.round(rect.height));
  }
}

/** 호스트 컴포넌트의 `providers`에 넣는다. 호스트는 `LwScopedViewport`를 주입받아 `simulate()`를 부른다. */
export function provideScopedViewport(): Provider[] {
  return [LwScopedViewport, { provide: LW_VIEWPORT, useExisting: LwScopedViewport }];
}
