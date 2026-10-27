import { LW_VIEWPORT } from '../../../services/viewport/lw-viewport-context';
import { LwContainerElement } from '../../../services/base/lw-container-element';
import { LwStoryPlayThemeService } from '../../../services/services/story-play-theme.service';
import { LwScreenRatioService } from '../../../services/base/lw-screen-ratio.service';
import { WINDOW } from '../../../services/tokens/window.token';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, NgZone, OnDestroy, PLATFORM_ID, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { LwButtonComponent } from '../../form/button/button.component';
import { LwInputComponent } from '../../form/input/input.component';
import { LwFormFieldComponent } from '../../form/form-field/form-field.component';
import { LwSelectComponent } from '../../form/select/select.component';
import { LwTextareaComponent } from '../../form/textarea/textarea.component';
import { LwCloseButtonComponent } from '../../navigation/close-button/close-button.component';
import { LwModalFormField, LwModalSelectionItem, LwModalSettingsTab, LwModalSize, LwModalTone, LwModalVariant, LwModalWindowStyle, LwModalWizardStep } from './modal.types';
import { LW_MODAL_PRESENTATION, type LwModalPresentation } from './modal.tokens';

const GLOBAL_MODAL_HOST_ID = 'lw-global-modal-host';
/** 모달을 그 안에 가두는 영역 */
const LOCAL_OVERLAY_CONTAINER_SELECTOR = '[data-lw-simulator], [data-lw-simulator-stage], [data-lw-mobile-surface], [data-lw-overlay-container]';
const MOBILE_SURFACE_SELECTOR = '[data-lw-simulator-stage], [data-lw-mobile-surface], [data-lw-simulator="true"]';

@Component({
  selector: 'lw-modal',
  standalone: true,
  imports: [
    CommonModule,
    LwButtonComponent,
    LwCloseButtonComponent,
    LwInputComponent,
    LwFormFieldComponent,
    LwSelectComponent,
    LwTextareaComponent,
  ],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwModalComponent extends LwContainerElement<LwModalSize> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly storyPlayThemeService = inject(LwStoryPlayThemeService, { optional: true });
  private readonly screenRatioService = inject(LwScreenRatioService, { optional: true });
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly win = inject(WINDOW, { optional: true });
  private readonly viewport = inject(LW_VIEWPORT);
  private readonly defaultPresentation = inject(LW_MODAL_PRESENTATION, { optional: true }) ?? 'window';

  /** 전역 최상위 DOM 포탈(#lw-global-modal-host) 마운트 여부 (기본: true - 부모 CSS transform/overflow 스태킹 컨텍스트 탈출) */
  readonly teleport = input<boolean>(true);

  private placeholderAnchor: Comment | null = null;
  private isTeleported = false;

  // ── 공통 기본 인프라 ──
  readonly open = model<boolean>(false);
  readonly isOpen = input<boolean | undefined>(undefined);
  readonly effectiveOpen = computed(() => this.isOpen() ?? this.open());

  readonly variant = input<LwModalVariant>('custom');
  override readonly size = input<LwModalSize>('md');
  readonly tone = input<LwModalTone>('default');
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly subtitle = input<string>('');
  readonly message = input<string>('');
  readonly effectiveSubtitle = computed(() => this.subtitle() || this.description() || this.message());

  readonly showClose = input<boolean>(true);
  override readonly backdropBlur = input<boolean>(true);
  readonly paddingless = input<boolean>(false);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnBackdropClick = input<boolean | undefined>(undefined);
  readonly effectiveCloseOnBackdrop = computed(() => this.closeOnBackdropClick() ?? this.closeOnBackdrop());
  readonly closeOnEsc = input<boolean>(true);
  readonly playTheme = input<string | null>(null);

  /** 모달 테마 명시 지정 ('auto' | 'light' | 'dark') */
  readonly theme = input<'auto' | 'light' | 'dark'>('auto');
  /** 테마와 무관하게 밝은 창으로 고정할지. 기본은 테마를 따른다. */
  readonly lightBackground = input<boolean>(false);
  readonly forceLight = input<boolean>(false);

  readonly effectivePlayTheme = computed(() => {
    return this.playTheme() ?? this.storyPlayThemeService?.activeTheme() ?? null;
  });

  readonly effectiveLightBackground = computed(() => {
    return this.lightBackground() || this.forceLight() || this.theme() === 'light';
  });

  readonly effectiveTheme = computed(() => {
    const t = this.theme();
    if (t !== 'auto') return t;
    if (this.effectiveLightBackground()) return 'light';
    return this.resolvedTheme();
  });

  readonly isEffectiveDark = computed(() => {
    if (this.theme() === 'light' || this.effectiveLightBackground()) {
      return false;
    }
    if (this.theme() === 'dark') {
      return true;
    }
    return this.isDark() || this.effectivePlayTheme() === 'dark';
  });

  // ── Variant: confirm 전용 Inputs ──
  readonly detail = input<string>('');
  readonly confirmLabel = input<string>('확인');
  readonly cancelLabel = input<string>('취소');
  readonly showCancel = input<boolean>(true);

  // ── Variant: form 전용 Inputs & State ──
  readonly fields = input<LwModalFormField[]>([]);
  readonly submitLabel = input<string>('확인 및 제출');
  readonly formValues = signal<Record<string, any>>({});

  // ── Variant: selection 전용 Inputs & State ──
  readonly items = input<LwModalSelectionItem[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly selectedItemId = signal<string | null>(null);

  // ── Variant: wizard 전용 Inputs & State ──
  readonly steps = input<LwModalWizardStep[]>([]);
  readonly currentStep = model<number>(0);
  readonly currentStepIndex = signal<number>(0);

  // ── Variant: settings 전용 Inputs & State ──
  readonly tabs = input<LwModalSettingsTab[]>([]);
  readonly activeTab = model<string>('');
  readonly activeTabId = signal<string>('');

  /** 띄우는 모양. 'auto'면 앱 기본값(`LW_MODAL_PRESENTATION`)을 따른다. */
  readonly presentation = input<LwModalPresentation | 'auto'>('auto');
  readonly isSheet = computed(() => {
    const presentation = this.presentation();
    return (presentation === 'auto' ? this.defaultPresentation : presentation) === 'sheet';
  });

  // ── Desktop OS 윈도우 스타일 & 제어 ──
  readonly showHeader = input<boolean>(true);
  readonly windowStyle = input<LwModalWindowStyle>('os-desktop');
  /** 바텀시트는 창 장식(창 단추, 끌어 옮기기, 최대화)을 쓰지 않는다. */
  readonly effectiveWindowStyle = computed<LwModalWindowStyle>(() => (this.isSheet() ? 'standard' : this.windowStyle()));
  readonly windowControls = input<boolean>(true);
  readonly allowMaximize = input<boolean>(true);
  readonly isMaximized = model<boolean>(false);
  readonly titleAlign = input<'center' | 'left'>('center');
  readonly draggable = input<boolean>(true);
  readonly glassmorphism = input<boolean>(true);

  // ── 드래그 제어 State ──
  readonly dragOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  readonly isDragging = signal<boolean>(false);
  readonly dragTransform = computed(() => {
    if (this.isMaximized()) return 'none';
    const { x, y } = this.dragOffset();
    if (x === 0 && y === 0) return '';
    return `translate3d(${x}px, ${y}px, 0)`;
  });

  // ── 시뮬레이터 / 로컬 컨테이너 격리 상태 (시뮬레이터 내부일 때 전역 body 탈출 방지) ──
  readonly isSimulatorScoped = signal<boolean>(false);

  // ── 통합 Outputs ──
  readonly close = output<void>();
  readonly closeClick = output<void>();
  readonly minimize = output<void>();
  readonly maximizeChange = output<boolean>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
  readonly formSubmit = output<Record<string, any>>();
  readonly itemSelect = output<string>();
  readonly stepChange = output<number>();
  readonly wizardComplete = output<void>();
  readonly tabChange = output<string>();

  constructor() {
    super();

    // fields 초기화 동기화
    effect(() => {
      const fList = this.fields();
      const initial: Record<string, any> = {};
      for (const f of fList) {
        if (f.value !== undefined) {
          initial[f.id] = f.value;
        }
      }
      this.formValues.set(initial);
    });

    // selectedId 동기화
    effect(() => {
      this.selectedItemId.set(this.selectedId() ?? null);
    });

    // currentStep 동기화
    effect(() => {
      this.currentStepIndex.set(this.currentStep());
    });

    // activeTab 동기화
    effect(() => {
      const tabs = this.tabs();
      const direct = this.activeTab();
      if (direct) {
        this.activeTabId.set(direct);
      } else if (tabs.length > 0 && !this.activeTabId()) {
        this.activeTabId.set(tabs[0].id);
      }
    });

    // 전역 DOM 포탈 텔레포트 및 Body scroll-lock 제어 (시뮬레이터 내부일 경우 body 스크롤락 억제)
    effect(() => {
      const isOpen = this.effectiveOpen();
      if (!isPlatformBrowser(this.platformId)) return;

      if (isOpen) {
        if (this.teleport()) {
          this.teleportToHost();
        }
        if (!this.isSimulatorScoped()) {
          this.document.body.style.overflow = 'hidden';
        }
      } else {
        if (this.teleport() && this.isTeleported) {
          this.restoreFromHost();
        }
        if (!this.isSimulatorScoped()) {
          this.document.body.style.overflow = '';
        }
      }
    });

    // 드래그 위치 리셋 동기화 (창이 닫히거나 최대화될 때)
    effect(() => {
      if (!this.effectiveOpen() || this.isMaximized()) {
        this.dragOffset.set({ x: 0, y: 0 });
        this.isDragging.set(false);
      }
    });
  }

  // ── 키보드 ESC 닫기 핸들러 ──
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (this.effectiveOpen() && this.closeOnEsc()) {
      event.stopPropagation();
      this.handleClose();
    }
  }

  // ── 백드롭 클릭 핸들러 ──
  onOverlayClick(): void {
    if (this.effectiveCloseOnBackdrop()) {
      this.handleClose();
    }
  }

  handleClose(): void {
    this.open.set(false);
    this.close.emit();
    this.closeClick.emit();
  }

  toggleMaximize(): void {
    if (!this.allowMaximize()) return;
    const next = !this.isMaximized();
    this.isMaximized.set(next);
    this.maximizeChange.emit(next);
  }

  handleMinimize(): void {
    this.minimize.emit();
  }

  onTitleBarDblClick(): void {
    if (this.effectiveWindowStyle() === 'os-desktop' && this.allowMaximize()) {
      this.toggleMaximize();
    }
  }

  // ── 헤더 잡고 드래그 (Window Header Dragging) ──
  private activePointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private dragOriginX = 0;
  private dragOriginY = 0;

  onHeaderPointerDown(event: PointerEvent): void {
    if (!this.draggable() || this.isMaximized() || this.isSheet()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, .traffic-btn, [data-no-drag]')) {
      return;
    }

    this.isDragging.set(true);
    this.activePointerId = event.pointerId;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.dragOriginX = this.dragOffset().x;
    this.dragOriginY = this.dragOffset().y;

    if (this.win) {
      this.ngZone.runOutsideAngular(() => {
        this.win?.addEventListener('pointermove', this.onPointerMove, { passive: false });
        this.win?.addEventListener('pointerup', this.onPointerUp);
        this.win?.addEventListener('pointercancel', this.onPointerUp);
      });
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging()) return;
    event.preventDefault();

    const deltaX = event.clientX - this.pointerStartX;
    const deltaY = event.clientY - this.pointerStartY;

    let nextX = this.dragOriginX + deltaX;
    let nextY = this.dragOriginY + deltaY;

    // Viewport bound constraints (화면 밖으로 완전히 사라지지 않도록 가둠)
    const currentW = this.viewport.width();
    const currentH = this.viewport.height();
    const boundX = Math.max(100, currentW / 2 - 60);
    const boundY = Math.max(80, currentH / 2 - 60);
    nextX = Math.max(-boundX, Math.min(boundX, nextX));
    nextY = Math.max(-boundY, Math.min(boundY, nextY));

    this.dragOffset.set({ x: Math.round(nextX), y: Math.round(nextY) });
  };

  private readonly onPointerUp = (): void => {
    this.ngZone.run(() => {
      this.isDragging.set(false);
    });
    this.activePointerId = null;
    if (this.win) {
      this.win.removeEventListener('pointermove', this.onPointerMove);
      this.win.removeEventListener('pointerup', this.onPointerUp);
      this.win.removeEventListener('pointercancel', this.onPointerUp);
    }
  };

  ngOnDestroy(): void {
    if (this.win) {
      this.win.removeEventListener('pointermove', this.onPointerMove);
      this.win.removeEventListener('pointerup', this.onPointerUp);
      this.win.removeEventListener('pointercancel', this.onPointerUp);
    }

    if (this.isTeleported) {
      const el = this.elementRef.nativeElement as HTMLElement;
      el?.remove();
      if (this.placeholderAnchor) {
        this.placeholderAnchor.remove();
        this.placeholderAnchor = null;
      }
      this.isTeleported = false;
    }

    if (isPlatformBrowser(this.platformId) && this.effectiveOpen() && !this.isSimulatorScoped()) {
      this.document.body.style.overflow = '';
    }
  }

  /**
   * 모달을 가둘 컨테이너를 찾는다: 가장 가까운 `[data-lw-overlay-container]` 조상,
   * 없으면 문서의 모바일 화면 영역(`[data-lw-simulator-stage]`, `[data-lw-mobile-surface]`).
   * 찾으면 모달은 body가 아니라 그 안에 붙는다. 앱은 클래스 이름이 아니라 이 속성으로 영역을 알린다.
   */
  private findAncestorContainer(startEl: HTMLElement): HTMLElement | null {
    const ancestor = startEl.parentElement?.closest<HTMLElement>(LOCAL_OVERLAY_CONTAINER_SELECTOR) ?? null;
    if (ancestor && ancestor !== this.document.body && ancestor !== this.document.documentElement) {
      return ancestor;
    }
    return this.screenRatioService?.isMobile() ? this.document.querySelector<HTMLElement>(MOBILE_SURFACE_SELECTOR) : null;
  }

  private getOrCreatePortalHost(startEl: HTMLElement): HTMLElement {
    const ancestor = this.findAncestorContainer(startEl);
    if (ancestor) {
      this.isSimulatorScoped.set(true);
      let localHost = ancestor.querySelector(':scope > .lw-local-modal-host') as HTMLElement | null;
      if (!localHost) {
        localHost = this.document.createElement('div');
        localHost.className = 'lw-local-modal-host';
        localHost.setAttribute('data-lw-local-modal-host', 'true');
        ancestor.appendChild(localHost);
      }
      return localHost;
    }

    this.isSimulatorScoped.set(false);
    let host = this.document.getElementById(GLOBAL_MODAL_HOST_ID);
    if (!host) {
      host = this.document.createElement('div');
      host.id = GLOBAL_MODAL_HOST_ID;
      host.className = 'lw-global-modal-host';
      host.setAttribute('data-lw-overlay-container', 'true');
      this.document.body.appendChild(host);
    }
    return host;
  }

  private teleportToHost(): void {
    if (!isPlatformBrowser(this.platformId) || !this.teleport()) return;
    const el = this.elementRef.nativeElement as HTMLElement;
    if (!el || !el.parentNode) return;

    // 원래 앵커가 없으면 먼저 현재 위치를 기록
    const searchTarget = this.placeholderAnchor?.parentElement ? (this.placeholderAnchor.parentElement as HTMLElement) : el;
    const portalHost = this.getOrCreatePortalHost(searchTarget);
    if (el.parentNode === portalHost) return;

    if (!this.placeholderAnchor) {
      this.placeholderAnchor = this.document.createComment('lw-modal-anchor');
    }
    el.parentNode.insertBefore(this.placeholderAnchor, el);
    portalHost.appendChild(el);
    this.isTeleported = true;
  }

  private restoreFromHost(): void {
    if (!isPlatformBrowser(this.platformId) || !this.isTeleported) return;
    const el = this.elementRef.nativeElement as HTMLElement;
    if (!el) return;

    if (this.placeholderAnchor && this.placeholderAnchor.parentNode) {
      this.placeholderAnchor.parentNode.insertBefore(el, this.placeholderAnchor);
      this.placeholderAnchor.remove();
      this.placeholderAnchor = null;
    }
    this.isSimulatorScoped.set(false);
    this.isTeleported = false;
  }

  handleConfirm(): void {
    this.confirm.emit();
    this.handleClose();
  }

  handleCancel(): void {
    this.cancel.emit();
    this.handleClose();
  }

  onFieldChange(fieldId: string, value: any): void {
    this.formValues.update((prev) => ({ ...prev, [fieldId]: value }));
  }

  handleFormSubmit(): void {
    this.formSubmit.emit(this.formValues());
    this.handleClose();
  }

  onSelectItem(id: string): void {
    this.selectedItemId.set(id);
  }

  handleSelectionConfirm(): void {
    const sel = this.selectedItemId();
    if (sel) {
      this.itemSelect.emit(sel);
      this.handleClose();
    }
  }

  onStepClick(idx: number): void {
    this.currentStepIndex.set(idx);
    this.currentStep.set(idx);
    this.stepChange.emit(idx);
  }

  prevStep(): void {
    const prev = Math.max(0, this.currentStepIndex() - 1);
    this.onStepClick(prev);
  }

  nextStep(): void {
    const next = Math.min(this.steps().length - 1, this.currentStepIndex() + 1);
    this.onStepClick(next);
  }

  completeWizard(): void {
    this.wizardComplete.emit();
    this.handleClose();
  }

  onTabClick(id: string): void {
    this.activeTabId.set(id);
    this.activeTab.set(id);
    this.tabChange.emit(id);
  }

  protected readonly currentTabMeta = computed(() => {
    const id = this.activeTabId();
    return this.tabs().find((t) => t.id === id) ?? null;
  });
}
