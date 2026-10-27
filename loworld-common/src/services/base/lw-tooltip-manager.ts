import { DestroyRef, ElementRef, afterNextRender } from '@angular/core';
import { LW_TOOLTIP_SERVICE, getGlobalTooltipService, type ILwTooltipService, type LwTooltipPlacement, type LwTooltipVariant } from '../tokens/tooltip.tokens';
import type { LwComponentConfigStore } from '../services/stores/component-config.store';

export interface LwTooltipHostContext {
  hostElementRef?: ElementRef<HTMLElement> | ElementRef<any> | null;
  destroyRef?: DestroyRef | null;
  componentConfigStore?: LwComponentConfigStore | null;
  injectedTooltipService?: ILwTooltipService | null;
  getEffectiveTooltip: () => string | null;
  getTooltipPlacement: () => LwTooltipPlacement;
  getTooltipVariant: () => LwTooltipVariant;
  getTooltipDelay: () => number;
  getSize?: () => string;
  isDisabled?: () => boolean;
  isVisible?: () => boolean;
}

/**
 * 💡 LwTooltipManager
 * 
 * LwBaseComponent에서 툴팁 라이프사이클, DOM 리스너, 타이머 제어를 전담 분리한 매니저 (SRP 준수).
 * 툴팁이 없는 컴포넌트에서는 DOM 리스너 부착을 생략하여 성능 오버헤드를 원천 차단합니다.
 */
export class LwTooltipManager {
  private _tooltipTimer: any = null;
  private _tooltipListenersAttached = false;

  constructor(private readonly ctx: LwTooltipHostContext) {
    this._initAutoPropagation();
  }

  private _getTooltipService(): ILwTooltipService | null {
    return this.ctx.injectedTooltipService || getGlobalTooltipService();
  }

  private _initAutoPropagation(): void {
    try {
      afterNextRender(() => {
        const el = this.ctx.hostElementRef?.nativeElement;
        if (!el || typeof el.addEventListener !== 'function') return;

        // Lazy On-demand: Only attach DOM listeners if component has effective tooltip, title, or aria-label
        const hasTooltip =
          Boolean(this.ctx.getEffectiveTooltip()) ||
          Boolean(el.getAttribute('title')) ||
          Boolean(el.getAttribute('aria-label'));
        if (!hasTooltip) return;

        this._tooltipListenersAttached = true;
        el.addEventListener('mouseenter', this._onHostMouseEnter);
        el.addEventListener('mouseleave', this._onHostMouseLeave);
        el.addEventListener('focusin', this._onHostMouseEnter);
        el.addEventListener('focusout', this._onHostMouseLeave);
      });
    } catch {
      // Safely ignore in SSR or test environments
    }

    this.ctx.destroyRef?.onDestroy(() => {
      this.destroy();
    });
  }

  destroy(): void {
    this._clearTooltipTimer();
    const el = this.ctx.hostElementRef?.nativeElement;
    if (el) {
      if (el.dataset['lwNativeTitle']) {
        el.setAttribute('title', el.dataset['lwNativeTitle']);
        delete el.dataset['lwNativeTitle'];
      }
      this._getTooltipService()?.hide(el);
      if (this._tooltipListenersAttached && typeof el.removeEventListener === 'function') {
        el.removeEventListener('mouseenter', this._onHostMouseEnter);
        el.removeEventListener('mouseleave', this._onHostMouseLeave);
        el.removeEventListener('focusin', this._onHostMouseEnter);
        el.removeEventListener('focusout', this._onHostMouseLeave);
        this._tooltipListenersAttached = false;
      }
    }
  }

  private readonly _onHostMouseEnter = (): void => {
    const config = this.ctx.componentConfigStore;
    const masterEnabled = config ? config.tooltipsEnabled() : false;
    const buttonTooltipsEnabled = config ? config.buttonTooltipsEnabled() : false;

    const el = this.ctx.hostElementRef?.nativeElement;
    if (!el) return;

    if (!masterEnabled || !buttonTooltipsEnabled) {
      const nativeTitle = el.getAttribute('title');
      if (nativeTitle) {
        el.dataset['lwNativeTitle'] = nativeTitle;
        el.removeAttribute('title');
      }
      return;
    }

    const text = this.ctx.getEffectiveTooltip();
    const isDisabled = this.ctx.isDisabled ? this.ctx.isDisabled() : false;
    const isVisible = this.ctx.isVisible ? this.ctx.isVisible() : true;
    if (!text || isDisabled || !isVisible) {
      return;
    }

    const service = this._getTooltipService();
    if (service) {
      const nativeTitle = el.getAttribute('title');
      if (nativeTitle) {
        el.dataset['lwNativeTitle'] = nativeTitle;
        el.removeAttribute('title');
      }

      this._clearTooltipTimer();
      const delay = this.ctx.getTooltipDelay();

      if (delay <= 0) {
        this._triggerShowTooltip(el, text);
      } else {
        this._tooltipTimer = setTimeout(() => {
          this._triggerShowTooltip(el, text);
        }, delay);
      }
    } else {
      if (!el.getAttribute('title') && text) {
        el.setAttribute('title', text);
      }
    }
  };

  private readonly _onHostMouseLeave = (): void => {
    this._clearTooltipTimer();
    const el = this.ctx.hostElementRef?.nativeElement;
    if (el) {
      if (el.dataset['lwNativeTitle']) {
        el.setAttribute('title', el.dataset['lwNativeTitle']);
        delete el.dataset['lwNativeTitle'];
      }
      this._getTooltipService()?.hide(el);
    }
  };

  private _triggerShowTooltip(el: HTMLElement, text: string): void {
    const service = this._getTooltipService();
    if (!service) return;
    const size = this.ctx.getSize ? this.ctx.getSize() : 'md';
    service.show({
      content: text,
      targetEl: el,
      placement: this.ctx.getTooltipPlacement(),
      variant: this.ctx.getTooltipVariant(),
      size: (size as any) || 'md',
    });
  }

  private _clearTooltipTimer(): void {
    if (this._tooltipTimer) {
      clearTimeout(this._tooltipTimer);
      this._tooltipTimer = null;
    }
  }
}
