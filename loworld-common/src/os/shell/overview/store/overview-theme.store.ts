import { Injectable, computed, inject } from '@angular/core';
import { LwThemeStore } from '../../../../services/theme/lw-theme.store';
import { LW_STORAGE_PORT } from '../../../../services/ports/storage.port';
import type { OverviewThemeMode } from '../../../../services/models/os.types';

@Injectable({ providedIn: 'root' })
export class OverviewThemeStore {
  private readonly lwTheme = inject(LwThemeStore);
  private readonly storage = inject(LW_STORAGE_PORT);
  private readonly legacyStorageKey = 'loworld-ui.overview.theme';
  private readonly queryKey = 'theme';

  readonly themeMode = computed<OverviewThemeMode>(() => this.lwTheme.resolved());
  readonly playTheme = this.lwTheme.playTheme;
  readonly skin = this.lwTheme.skin;

  constructor() {
    const legacy = this.storage.getItem(this.legacyStorageKey);
    if (legacy === 'light' || legacy === 'dark') {
      this.lwTheme.setMode(legacy);
      this.storage.removeItem(this.legacyStorageKey);
    }
  }

  toggle(): void {
    this.lwTheme.toggle();
  }

  buildThemeAwareExternalHref(baseHref: string): string {
    const url = new URL(baseHref);
    url.searchParams.set(this.queryKey, this.themeMode());
    return url.toString();
  }
}