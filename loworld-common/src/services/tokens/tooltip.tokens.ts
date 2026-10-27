import { InjectionToken, inject } from '@angular/core';

export type LwTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type LwTooltipVariant = 'dark' | 'glass' | 'novel' | 'light';
export type LwTooltipSize = 'sm' | 'md' | 'lg';

export interface LwTooltipShowOptions {
  content: string;
  title?: string;
  targetEl: HTMLElement;
  placement?: LwTooltipPlacement;
  variant?: LwTooltipVariant;
  size?: LwTooltipSize;
  arrow?: boolean;
}

export interface ILwTooltipService {
  show(options: LwTooltipShowOptions): void;
  hide(targetEl?: HTMLElement): void;
}

let _globalTooltipService: ILwTooltipService | null = null;

export function setGlobalTooltipService(service: ILwTooltipService): void {
  _globalTooltipService = service;
}

export function getGlobalTooltipService(): ILwTooltipService | null {
  return _globalTooltipService;
}

export const LW_TOOLTIP_SERVICE = new InjectionToken<ILwTooltipService>('LW_TOOLTIP_SERVICE');

export function injectTooltipService(): ILwTooltipService | null {
  try {
    const service = inject(LW_TOOLTIP_SERVICE, { optional: true });
    return service || getGlobalTooltipService();
  } catch {
    return getGlobalTooltipService();
  }
}
