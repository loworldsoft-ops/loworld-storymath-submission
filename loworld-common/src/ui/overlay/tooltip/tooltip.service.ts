import { Injectable, ApplicationRef, ComponentRef, EnvironmentInjector, Injector, createComponent, inject, OnDestroy, type Provider } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LW_TOOLTIP_SERVICE, setGlobalTooltipService, type ILwTooltipService, type LwTooltipShowOptions } from '../../../services/tokens/tooltip.tokens';
import { LW_VIEWPORT } from '../../../services/viewport/lw-viewport-context';
import { LwTooltipComponent } from './tooltip.component';
import type { LwTooltipPlacement, LwTooltipVariant, LwTooltipSize } from '../../../services/tokens/tooltip.tokens';

const OFFSET = 8;
const SCREEN_MARGIN = 8;

/**
 * 전역 툴팁 오버레이 서비스 프로바이더 헬퍼 함수.
 * LW_TOOLTIP_SERVICE 토큰과 LwTooltipService를 안전하게 바인딩합니다.
 */
export function provideLwTooltip(): Provider[] {
  return [
    LwTooltipService,
    { provide: LW_TOOLTIP_SERVICE, useExisting: LwTooltipService },
  ];
}

@Injectable({
  providedIn: 'root',
})
export class LwTooltipService implements ILwTooltipService, OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly viewport = inject(LW_VIEWPORT);

  private activeTooltipRef: ComponentRef<LwTooltipComponent> | null = null;
  private currentTarget: HTMLElement | null = null;
  private hideTimeoutId: any = null;

  constructor() {
    setGlobalTooltipService(this);
  }

  show(options: LwTooltipShowOptions): void {
    if (!options.content || !options.targetEl) return;

    this.clearHideTimeout();

    // If same target already has an active tooltip, update content
    if (this.activeTooltipRef && this.currentTarget === options.targetEl) {
      this.activeTooltipRef.setInput('content', options.content);
      if (options.title !== undefined) {
        this.activeTooltipRef.setInput('title', options.title);
      }
      this.activeTooltipRef.changeDetectorRef.detectChanges();
      const el = this.activeTooltipRef.location.nativeElement as HTMLElement;
      this.updatePosition(el, options.targetEl, (options.placement as LwTooltipPlacement) ?? 'top');
      return;
    }

    // Destroy existing tooltip if from another element
    if (this.activeTooltipRef) {
      this.destroyTooltip(this.activeTooltipRef);
      this.activeTooltipRef = null;
    }

    this.currentTarget = options.targetEl;
    const ref = createComponent(LwTooltipComponent, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector,
    });

    ref.setInput('content', options.content);
    ref.setInput('title', options.title);
    ref.setInput('variant', (options.variant as LwTooltipVariant) ?? 'dark');
    ref.setInput('size', (options.size as LwTooltipSize) ?? 'md');
    ref.setInput('arrow', options.arrow ?? true);
    ref.setInput('visible', false);

    const el = ref.location.nativeElement as HTMLElement;
    this.document.body.appendChild(el);
    this.appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();

    this.updatePosition(el, options.targetEl, (options.placement as LwTooltipPlacement) ?? 'top', ref);

    // Smooth Fade-in
    requestAnimationFrame(() => {
      if (this.activeTooltipRef === ref) {
        ref.setInput('visible', true);
        ref.changeDetectorRef.detectChanges();
      }
    });

    this.activeTooltipRef = ref;
  }

  hide(targetEl?: HTMLElement): void {
    if (targetEl && this.currentTarget !== targetEl) return;
    if (!this.activeTooltipRef) return;

    this.clearHideTimeout();
    const ref = this.activeTooltipRef;
    this.activeTooltipRef = null;
    this.currentTarget = null;

    ref.setInput('visible', false);
    ref.changeDetectorRef.detectChanges();

    this.hideTimeoutId = setTimeout(() => {
      this.destroyTooltip(ref);
    }, 180);
  }

  private updatePosition(
    tooltipEl: HTMLElement,
    targetEl: HTMLElement,
    initialPlacement: LwTooltipPlacement,
    ref?: ComponentRef<LwTooltipComponent>
  ): void {
    const hostRect = targetEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    let placement = initialPlacement;

    const win = this.document.defaultView;
    const scrollX = win ? (win.scrollX || win.pageXOffset || 0) : 0;
    const scrollY = win ? (win.scrollY || win.pageYOffset || 0) : 0;
    const vw = this.viewport.width();
    const vh = this.viewport.height();

    // Smart Flip (뷰포트 경계 반전)
    if (placement === 'top' && hostRect.top - tooltipRect.height - OFFSET < SCREEN_MARGIN) {
      placement = 'bottom';
    } else if (placement === 'bottom' && hostRect.bottom + tooltipRect.height + OFFSET > vh - SCREEN_MARGIN) {
      placement = 'top';
    } else if (placement === 'left' && hostRect.left - tooltipRect.width - OFFSET < SCREEN_MARGIN) {
      placement = 'right';
    } else if (placement === 'right' && hostRect.right + tooltipRect.width + OFFSET > vw - SCREEN_MARGIN) {
      placement = 'left';
    }

    if (ref) {
      ref.setInput('placement', placement);
    } else if (this.activeTooltipRef) {
      this.activeTooltipRef.setInput('placement', placement);
    }

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = hostRect.top + scrollY - tooltipRect.height - OFFSET;
        left = hostRect.left + scrollX + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + scrollY + OFFSET;
        left = hostRect.left + scrollX + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + scrollY + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left + scrollX - tooltipRect.width - OFFSET;
        break;
      case 'right':
        top = hostRect.top + scrollY + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + scrollX + OFFSET;
        break;
    }

    left = Math.max(SCREEN_MARGIN + scrollX, Math.min(scrollX + vw - tooltipRect.width - SCREEN_MARGIN, left));
    top = Math.max(SCREEN_MARGIN + scrollY, top);

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
  }

  private destroyTooltip(ref: ComponentRef<LwTooltipComponent>): void {
    if (ref) {
      this.appRef.detachView(ref.hostView);
      const el = ref.location.nativeElement as HTMLElement;
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
      ref.destroy();
    }
  }

  private clearHideTimeout(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearHideTimeout();
    if (this.activeTooltipRef) {
      this.destroyTooltip(this.activeTooltipRef);
      this.activeTooltipRef = null;
    }
  }
}
