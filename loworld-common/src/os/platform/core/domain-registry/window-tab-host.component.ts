import { AfterViewInit, ChangeDetectionStrategy, Component, ComponentRef, DestroyRef, Injector, OnChanges, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef, inject, input, output } from '@angular/core';
import type { Subscription } from 'rxjs';
import { LW_FRAME_APP_DEFAULTS, type LwFrameSettings } from '../../../../services/settings/lw-frame-settings';

/**
 * 🪟 WindowTabHostComponent
 *
 * Angular의 `*ngComponentOutlet`이 지원하지 못하는 `@Output()` 이벤트 바인딩과
 * 반응형 `inputs` 전달을 완벽하게 브릿지하는 동적 윈도우 컴포넌트 호스트.
 *
 * - OCP(개방-폐쇄 원칙)를 유지하면서 동적 컴포넌트의 라이프사이클을 안전하게 관리
 * - `loginRequested`, `logoutRequested`, `accountRequested`, `openNav`, `toggleTheme` 등
 *   셸 통합 이벤트를 자동 감지하여 상위 호스트(`App`)로 전달
 */
@Component({
  selector: 'lw-window-tab-host',
  standalone: true,
  templateUrl: './window-tab-host.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './window-tab-host.component.scss',
})
export class WindowTabHostComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  readonly component = input<Type<unknown> | null | undefined>(null);
  readonly loadComponent = input<(() => Promise<Type<unknown>>) | null | undefined>(null);
  readonly inputs = input<Record<string, unknown>>({});
  /** 이 창의 앱이 정한 틀의 기본값. 창 안의 틀(lw-app-frame)이 이것을 받는다. */
  readonly frameDefaults = input<Partial<LwFrameSettings> | null | undefined>(null);

  // ── 셸 공통 Output 브릿지 ──────────────────────────────────
  readonly loginRequested = output<void>();
  readonly logoutRequested = output<void>();
  readonly accountRequested = output<void>();
  readonly openNav = output<void>();
  readonly toggleTheme = output<void>();
  readonly navigateTo = output<string>();
  readonly routeStateChange = output<unknown>();
  readonly closeRequested = output<void>();
  readonly mobileSidebarCloseRequested = output<void>();
  readonly navigateRequested = output<unknown>();
  readonly launchRequested = output<unknown>();

  @ViewChild('outlet', { read: ViewContainerRef })
  private outletRef?: ViewContainerRef;

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private componentRef: ComponentRef<unknown> | null = null;
  private currentComponentType: Type<unknown> | null = null;
  private eventSubscriptions: Subscription[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  ngOnInit(): void {
    // 뷰 초기화 이전 시점이므로 ngAfterViewInit에서 outletRef 확정 후 초기화
  }

  ngAfterViewInit(): void {
    this.syncComponent();
  }

  ngOnChanges(): void {
    this.syncComponent();
  }

  /**
   * 컴포넌트 인스턴스를 생성하거나 인풋 프로퍼티를 갱신합니다.
   * 비동기 loadComponent가 전달된 경우 온디맨드 청크를 동적 로드합니다.
   */
  public syncComponent(): void {
    const vcr = this.outletRef;
    if (!vcr) {
      return;
    }

    const loader = this.loadComponent();
    const compType = this.component();
    const inputMap = this.inputs();

    if (loader) {
      loader().then((loadedType) => {
        if (!this.componentRef || this.currentComponentType !== loadedType) {
          this.instantiateComponent(loadedType);
        }
        if (this.componentRef && inputMap) {
          for (const [key, value] of Object.entries(inputMap)) {
            this.componentRef.setInput(key, value);
          }
        }
      });
      return;
    }

    if (!compType) return;

    // 컴포넌트 타입이 바뀌었거나 아직 생성되지 않았으면 새로 생성
    if (!this.componentRef || this.currentComponentType !== compType) {
      this.instantiateComponent(compType);
    }

    // 인풋 프로퍼티 동기화
    if (this.componentRef && inputMap) {
      for (const [key, value] of Object.entries(inputMap)) {
        this.componentRef.setInput(key, value);
      }
    }
  }

  private instantiateComponent(compType: Type<unknown>): void {
    const vcr = this.outletRef;
    if (!vcr) return;

    this.cleanup();

    this.currentComponentType = compType;
    const frameDefaults = this.frameDefaults();
    this.componentRef = vcr.createComponent(compType, {
      injector: frameDefaults
        ? Injector.create({ providers: [{ provide: LW_FRAME_APP_DEFAULTS, useValue: frameDefaults }], parent: this.injector })
        : this.injector,
    });

    this.attachOutputListeners(this.componentRef.instance);
  }

  /**
   * 동적으로 생성된 컴포넌트 인스턴스의 Output / EventEmitter를 검사하여
   * 상위 호스트로 전달할 브릿지 리스너를 바인딩합니다.
   */
  private attachOutputListeners(instance: unknown): void {
    if (!instance || typeof instance !== 'object') return;
    const target = instance as Record<string, unknown>;

    const bindOutput = (key: string, handler: (val?: unknown) => void) => {
      const prop = target[key];
      if (prop && typeof prop === 'object' && 'subscribe' in prop && typeof prop.subscribe === 'function') {
        const sub = (prop.subscribe as (next: (v?: unknown) => void) => Subscription)(handler);
        this.eventSubscriptions.push(sub);
      }
    };

    // 1. loginRequested
    bindOutput('loginRequested', () => this.loginRequested.emit());

    // 2. logoutRequested
    bindOutput('logoutRequested', () => this.logoutRequested.emit());

    // 3. accountRequested
    bindOutput('accountRequested', () => this.accountRequested.emit());

    // 4. openNav
    bindOutput('openNav', () => this.openNav.emit());

    // 5. toggleTheme
    bindOutput('toggleTheme', () => this.toggleTheme.emit());

    // 6. navigateTo
    bindOutput('navigateTo', (val) => {
      if (typeof val === 'string') {
        this.navigateTo.emit(val);
      }
    });

    // 7. routeStateChange
    bindOutput('routeStateChange', (val) => this.routeStateChange.emit(val));

    // 8. closeRequested
    bindOutput('closeRequested', () => this.closeRequested.emit());

    // 9. mobileSidebarCloseRequested
    bindOutput('mobileSidebarCloseRequested', () => this.mobileSidebarCloseRequested.emit());

    // 10. navigateRequested
    bindOutput('navigateRequested', (val) => this.navigateRequested.emit(val));

    // 11. launchRequested
    bindOutput('launchRequested', (val) => this.launchRequested.emit(val));
  }

  private cleanup(): void {
    for (const sub of this.eventSubscriptions) {
      sub.unsubscribe();
    }
    this.eventSubscriptions = [];

    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    this.outletRef?.clear();
    this.currentComponentType = null;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
