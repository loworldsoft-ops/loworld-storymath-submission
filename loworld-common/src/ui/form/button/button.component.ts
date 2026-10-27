import { ChangeDetectionStrategy, Component, computed, inject, input, signal, effect, NgZone, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwInteractiveElement } from '../../../services/base/lw-interactive-element';
import { LwComponentConfigStore } from '../../../services/services/stores/component-config.store';
import type { LwButtonVariant, LwButtonShape, LwButtonType } from './button.types';
import { LwTooltipService } from '../../overlay/tooltip/tooltip.service';
import type { LwTooltipPlacement } from '../../../services/tokens/tooltip.tokens';

@Component({
  selector: 'lw-button, button[lw-button], a[lw-button]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lw-btn]': 'true',
    '[class.lw-btn--primary]': 'variant() === "primary"',
    '[class.lw-btn--secondary]': 'variant() === "secondary"',
    '[class.lw-btn--outline]': 'variant() === "outline"',
    '[class.lw-btn--ghost]': 'variant() === "ghost"',
    '[class.lw-btn--danger]': 'variant() === "danger"',
    '[class.lw-btn--novel]': 'variant() === "novel"',

    // 크기 클래스 (LwUIElement 시그널 상속)
    '[class.lw-btn--xs]': 'size() === "xs"',
    '[class.lw-btn--sm]': 'size() === "sm"',
    '[class.lw-btn--md]': 'size() === "md"',
    '[class.lw-btn--lg]': 'size() === "lg"',

    // 형태 클래스
    '[class.lw-btn--pill]': 'shape() === "pill"',
    '[class.lw-btn--circle]': 'shape() === "circle"',
    '[class.lw-btn--square]': 'shape() === "square"',
    '[class.lw-btn--icon-only]': 'isIconOnly()',

    // 상태 클래스
    '[class.lw-btn--loading]': 'loading()',
    '[class.lw-btn--active]': 'selected()',
    '[class.lw-btn--block]': 'block()',
    '[class.lw-btn--hidden]': '!visible()',
    '[class.lw-btn--disabled]': 'isDisabled()',

    // 접근성 및 네이티브 속성
    '[attr.role]': 'isNativeButton() || isAnchor() ? null : "button"',
    '[attr.tabindex]': 'isNativeButton() || isAnchor() ? null : (isDisabled() ? -1 : 0)',
    '[attr.disabled]': 'isNativeButton() && isDisabled() ? true : null',
    '[attr.aria-disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading()',
    '[attr.aria-label]': 'ariaLabel() || tooltip() || null',
    '[attr.title]': 'hasRichTooltip() ? null : resolvedTooltip()',
    '[attr.type]': 'isNativeButton() ? type() : null',
    '(click)': 'handleClick($event)',
    '(keydown.enter)': 'handleKeydown($event)',
    '(keydown.space)': 'handleKeydown($event)',
  },
})
export class LwButtonComponent extends LwInteractiveElement<LwButtonVariant> implements OnInit, OnDestroy {
  readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly _tooltipService = inject(LwTooltipService, { optional: true });
  private readonly _ngZone = inject(NgZone);
  private _cleanupTooltipListeners?: () => void;

  constructor() {
    super();
    // 툴팁이 존재하는 경우에만 Zone.js 외부에서 마우스/포커스 리스너를 동적 연결
    // 불필요한 전역 Dirty Check 순회를 원천 차단
    effect(() => {
      const tip = this.tooltip();
      const el = this.elementRef?.nativeElement;
      this._cleanupTooltipListeners?.();
      this._cleanupTooltipListeners = undefined;

      if (!tip || !this._tooltipService || !el) {
        return;
      }

      this._ngZone.runOutsideAngular(() => {
        const onEnter = () => this.handleMouseEnter();
        const onLeave = () => this.handleMouseLeave();

        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        el.addEventListener('focusin', onEnter);
        el.addEventListener('focusout', onLeave);

        this._cleanupTooltipListeners = () => {
          el.removeEventListener('mouseenter', onEnter);
          el.removeEventListener('mouseleave', onLeave);
          el.removeEventListener('focusin', onEnter);
          el.removeEventListener('focusout', onLeave);
        };
      });
    });
  }

  ngOnInit(): void {
    if (!this.label()) {
      const rawText = this.elementRef.nativeElement.textContent?.trim();
      if (rawText) {
        this._fallbackText.set(rawText);
      }
    }
  }

  // LwButton 특화 Inputs (variant 오버라이드 및 확장)
  override readonly variant = input<LwButtonVariant>('secondary');
  readonly shape = input<LwButtonShape>('default');
  readonly type = input<LwButtonType>('button');
  readonly block = input<boolean>(false);
  readonly iconOnly = input<boolean>(false);
  override readonly tooltipPlacement = input<LwTooltipPlacement>('top');

  readonly actionId = input<string | undefined>(undefined);
  readonly actionPayload = input<any>(undefined);

  // Icon Inputs
  readonly prefixIcon = input<string | undefined>(undefined);
  readonly suffixIcon = input<string | undefined>(undefined);
  readonly label = input<string | undefined>(undefined);
  private readonly _fallbackText = signal<string>('');

  readonly displayLabel = computed(() => {
    return this.label() ?? this._fallbackText();
  });

  readonly isIconOnly = computed(() => {
    if (this.iconOnly()) return true;
    if (this.label()) return false;
    return this.shape() === 'circle' || this.shape() === 'square';
  });

  // 계산된 비활성화 상태
  readonly isDisabled = computed(() => this.disabled() || this.loading());

  // 태그 타입 감지
  readonly isNativeButton = computed(() => {
    return this.elementRef.nativeElement.tagName.toLowerCase() === 'button';
  });

  readonly isAnchor = computed(() => {
    return this.elementRef.nativeElement.tagName.toLowerCase() === 'a';
  });

  // 마우스 호버 시 툴팁(버튼 기능 설명 및 컴포넌트 메타정보) 분리 생성
  readonly resolvedTooltip = computed<string | null>(() => {
    const config = this.componentConfigStore;
    const masterEnabled = config ? config.tooltipsEnabled() : false;
    if (!masterEnabled) return null;

    const showButtonTooltip = config ? config.buttonTooltipsEnabled() : false;
    const showComponentTooltip = config ? config.componentTooltipsEnabled() : false;

    const custom = showButtonTooltip ? (this.tooltip() || this.ariaLabel()) : null;
    const meta = showComponentTooltip
      ? `[LwButton] variant: ${this.variant()} | size: ${this.size()} | shape: ${this.shape()}${this.actionId() ? ' | action: ' + this.actionId() : ''}${this.disabled() ? ' (disabled)' : ''}${this.loading() ? ' (loading)' : ''}`
      : null;

    if (custom && meta) {
      return `${custom}\n${meta}`;
    }
    return custom || meta || null;
  });

  handleKeydown(event: Event): void {
    if (this.isNativeButton() || this.isAnchor()) return;
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const kbEvent = event as KeyboardEvent;
    if (kbEvent.key === ' ' || kbEvent.key === 'Enter') {
      event.preventDefault();
      this.handleClick(event as unknown as MouseEvent);
    }
  }

  handleClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const label = this.ariaLabel() || this.elementRef.nativeElement.textContent?.trim() || 'Button';

    // ── [Loworld Button Telemetry] 콘솔 로깅 ──
    const isLogEnabled = this.componentConfigStore ? this.componentConfigStore.consoleLogsEnabled() : false;
    if (isLogEnabled) {
      console.log(
        `%c[Loworld Button]%c ${label} %c(${this.variant()} / ${this.size()})`,
        'background: #6366f1; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
        'color: #0ea5e9; font-weight: bold;',
        'color: #94a3b8; font-size: 11px;',
        {
          label,
          variant: this.variant(),
          size: this.size(),
          shape: this.shape(),
          actionId: this.actionId(),
          actionPayload: this.actionPayload(),
          selected: this.selected(),
          disabled: this.disabled(),
          loading: this.loading(),
          timestamp: new Date().toISOString(),
        }
      );
    }

    if (this.actionId()) {
      this.dispatchAction(this.actionId()!, this.actionPayload());
    }

    // ── [Form 상호작용 지원] Custom Element <lw-button>인 경우 ──
    if (!this.isNativeButton()) {
      const hostEl = this.elementRef.nativeElement;
      const form = hostEl.closest('form');
      if (form) {
        if (this.type() === 'submit') {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        } else if (this.type() === 'reset') {
          form.reset();
        }
      }
    }
  }

  // ── [LwTooltip 통합] 공통 디자인 시스템 툴팁 자동 트리거 ──
  readonly hasRichTooltip = computed(() => {
    return !!this._tooltipService && !!this.tooltip();
  });


  handleMouseEnter(): void {
    if (this.isDisabled() || !this.tooltip() || !this._tooltipService) return;
    this._tooltipService.show({
      content: this.tooltip()!,
      targetEl: this.elementRef.nativeElement,
      placement: this.tooltipPlacement(),
    });
  }

  handleMouseLeave(): void {
    if (this._tooltipService) {
      this._tooltipService.hide(this.elementRef.nativeElement);
    }
  }

  handleFocusIn(): void {
    this.handleMouseEnter();
  }

  handleFocusOut(): void {
    this.handleMouseLeave();
  }

  ngOnDestroy(): void {
    this._cleanupTooltipListeners?.();
    if (this._tooltipService) {
      this._tooltipService.hide(this.elementRef.nativeElement);
    }
  }
}

