import { Injectable, inject, DestroyRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ShowcaseWindowManagerService } from './showcase-window-manager.service';
import { OverviewWindowStore } from '../store/overview-window.store';

export interface ShowcaseHotkeyHandlers {
  onSearch?: () => void;
  onCloseActive?: () => void;
  onToggleDesktop?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ShowcaseHotkeyService {
  private readonly document = inject(DOCUMENT);
  private readonly windowManager = inject(ShowcaseWindowManagerService);
  private readonly windowStore = inject(OverviewWindowStore);
  private handlers: ShowcaseHotkeyHandlers = {};
  private listenerAttached = false;

  init(handlers: ShowcaseHotkeyHandlers, destroyRef?: DestroyRef): void {
    this.handlers = handlers;
    const win = this.document?.defaultView;
    if (!win || this.listenerAttached) return;

    const keyListener = (e: KeyboardEvent) => this.handleKeyDown(e);
    win.addEventListener('keydown', keyListener);
    this.listenerAttached = true;

    destroyRef?.onDestroy(() => {
      win.removeEventListener('keydown', keyListener);
      this.listenerAttached = false;
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // 1. Meta+K / Ctrl+K: Open Search / Catalog
    if (modKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      this.handlers.onSearch?.();
      return;
    }

    // 2. Escape: Close active window / popup if not in an input/textarea
    if (e.key === 'Escape') {
      const activeElement = this.document?.activeElement;
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
      if (!isInput) {
        this.handlers.onCloseActive?.();
      }
      return;
    }

    // 3. Meta+D / Ctrl+D: Show desktop / Minimize all
    if (modKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      this.handlers.onToggleDesktop?.();
      return;
    }
  }
}
