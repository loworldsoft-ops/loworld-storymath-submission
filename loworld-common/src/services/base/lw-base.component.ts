import { Directive, DestroyRef, inject, ChangeDetectorRef, ElementRef, input, computed } from '@angular/core';
import { injectTheme } from '../theme/lw-theme.util';
import { LwComponentConfigStore } from '../services/stores/component-config.store';
import { LwScreenRatioService } from './lw-screen-ratio.service';
import type { ILwThemeAware, ILwTooltipAware } from './lw-contracts';
import { LW_TOOLTIP_SERVICE, type LwTooltipPlacement, type LwTooltipVariant } from '../tokens/tooltip.tokens';
import { LwTooltipManager } from './lw-tooltip-manager';

let nextComponentId = 0;

/**
 * LoworldUI 최상위 베이스 컴포넌트 (Level 0 Root Core)
 * SRP(단일 책임 원칙): 고유 UID 관리, DestroyRef 생명주기 관리, 전역 테마 동기화, 전사 반응형 모바일 감지 일원화.
 * OCP / LSP: LoworldUI의 모든 컴포넌트가 isMobile(), [tooltip], [title], [aria-label] 기능을 표준 계약으로 상속.
 * Template Method Pattern(LSP): onBaseInit() 및 onBaseDestroy() 훅을 제공하여 상속 수명주기 계약 보장.
 */
@Directive({
  host: {
    '[class.is-mobile]': 'resolveIsMobile()',
  },
})
export abstract class LwBaseComponent implements ILwThemeAware, ILwTooltipAware {
  /** 각 컴포넌트 인스턴스 고유 식별자 */
  readonly uid = `lw-cmp-${++nextComponentId}`;

  /** 전사 화면 비율 및 반응형 모바일 감지 엔진 (SRP / LSP) */
  private readonly _baseScreenRatio = inject(LwScreenRatioService, { optional: true });
  readonly isMobileScreen = computed<boolean>(() => this._baseScreenRatio?.isMobile() ?? false);

  /**
   * 📱 모바일 뷰포트 오버라이드 인풋 (LSP 준수: 정식 Signal 계약)
   * 부모가 자식을 런타임에 다운캐스팅 및 덕타이핑으로 역검사하지 않고,
   * 모바일 강제 설정이 필요한 경우 [isMobileOverride]를 통해 명시적으로 주입받음.
   */
  readonly isMobileOverride = input<boolean | null>(null);

  /** 자식 클래스가 필요시 호스트 is-mobile 평가를 재정의할 수 있는 확장 훅 (Template Method Pattern / LSP) */
  protected isMobileHostActive(): boolean {
    const override = this.isMobileOverride();
    return override !== null && override !== undefined ? override : this.isMobileScreen();
  }

  /**
   * 📱 전사 호스트 is-mobile 클래스 동적 해석기 (LSP / OCP)
   */
  resolveIsMobile(): boolean {
    return this.isMobileHostActive();
  }

  /** 전역 테마 엔진 연동 */
  private readonly _themeContext = injectTheme();
  protected readonly themeStore = this._themeContext.themeStore;
  readonly themeMode = this._themeContext.themeMode;
  readonly resolvedTheme = this._themeContext.resolvedTheme;
  readonly isDark = this._themeContext.isDark;

  /** 전역 컴포넌트 설정 스토어 (툴팁 및 콘솔 로깅 제어) */
  protected readonly componentConfigStore = inject(LwComponentConfigStore, { optional: true });

  /** 유니버설 툴팁 Signal 인풋 (전사 모든 컴포넌트 자동 상속) */
  readonly tooltip = input<string | null>(null);
  readonly tooltipPlacement = input<LwTooltipPlacement>('top');
  readonly tooltipVariant = input<LwTooltipVariant>('dark');
  readonly tooltipDelay = input<number>(100);

  /** Angular DI 유틸리티 */
  protected readonly destroyRef: DestroyRef = (() => {
    try {
      return inject(DestroyRef, { optional: true }) ?? ({ onDestroy: () => () => {} } as unknown as DestroyRef);
    } catch {
      return { onDestroy: () => () => {} } as unknown as DestroyRef;
    }
  })();
  protected readonly cdr: ChangeDetectorRef = (() => {
    try {
      return inject(ChangeDetectorRef, { optional: true }) ?? ({
        markForCheck: () => {},
        detectChanges: () => {},
        checkNoChanges: () => {},
        detach: () => {},
        reattach: () => {},
      } as unknown as ChangeDetectorRef);
    } catch {
      return {
        markForCheck: () => {},
        detectChanges: () => {},
        checkNoChanges: () => {},
        detach: () => {},
        reattach: () => {},
      } as unknown as ChangeDetectorRef;
    }
  })();
  protected readonly hostElementRef = inject(ElementRef<HTMLElement>, { optional: true });
  private readonly _injectedTooltipService = inject(LW_TOOLTIP_SERVICE, { optional: true });

  /** 공통 호스트 클래스 매핑 */
  protected readonly baseHostClasses = computed(() => ({
    'is-dark': this.isDark(),
    'is-light': !this.isDark(),
  }));

  /** 툴팁 라이프사이클 전담 매니저 (SRP 준수 및 불필요한 DOM 리스너 생성 방지) */
  protected readonly tooltipManager = new LwTooltipManager({
    hostElementRef: this.hostElementRef,
    destroyRef: this.destroyRef,
    componentConfigStore: this.componentConfigStore,
    injectedTooltipService: this._injectedTooltipService,
    getEffectiveTooltip: () => this.getEffectiveTooltip(),
    getTooltipPlacement: () => this.tooltipPlacement(),
    getTooltipVariant: () => this.tooltipVariant(),
    getTooltipDelay: () => this.tooltipDelay(),
    getSize: () => this.getComponentSize(),
    isDisabled: () => this.isComponentDisabled(),
    isVisible: () => this.isComponentVisible(),
  });

  /**
   * 🛡️ 서브클래스 전용 안전한 초기화 훅 (LSP / Template Method Pattern)
   */
  protected onBaseInit(): void {}

  /**
   * 🛡️ 서브클래스 전용 안전한 소멸 훅 (LSP / Template Method Pattern)
   */
  protected onBaseDestroy(): void {}

  /** 자식 클래스가 안전하게 오버라이드할 수 있는 규격 및 상태 접근자 (Template Method Pattern / LSP) */
  protected getComponentSize(): string {
    return 'md';
  }

  protected isComponentDisabled(): boolean {
    return false;
  }

  protected isComponentVisible(): boolean {
    return true;
  }

  protected getResolvedTooltip(): string | null {
    return null;
  }

  /**
   * 자식 클래스에서 툴팁 텍스트 계산을 커스터마이징할 수 있는 확장 훅
   * [tooltip] -> getResolvedTooltip() -> HTML title 속성 -> HTML aria-label 속성 순으로 스마트 폴백
   */
  protected getEffectiveTooltip(): string | null {
    const explicit = this.tooltip();
    if (explicit !== null && explicit !== undefined && explicit.trim().length > 0) {
      return explicit;
    }

    const childTooltip = this.getResolvedTooltip();
    if (childTooltip && typeof childTooltip === 'string' && childTooltip.trim().length > 0) {
      return childTooltip;
    }

    const el = this.hostElementRef?.nativeElement;
    if (el) {
      const titleAttr = el.getAttribute('title') || el.dataset['lwNativeTitle'];
      if (titleAttr && titleAttr.trim().length > 0) return titleAttr;

      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.trim().length > 0) return ariaLabel;
    }
    return null;
  }
}
