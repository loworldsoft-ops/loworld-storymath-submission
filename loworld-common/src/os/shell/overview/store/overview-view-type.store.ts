import { Injectable, effect, inject, signal } from '@angular/core';
import { LW_STORAGE_PORT } from '../../../../services/ports/storage.port';

type OverviewViewType = 'grid' | 'list';

@Injectable({ providedIn: 'root' })
export class OverviewViewTypeStore {
  private readonly storage = inject(LW_STORAGE_PORT);
  private readonly storageKey = 'lw_overview_view_type';

  readonly viewType = signal<OverviewViewType>('grid');

  constructor() {
    const savedViewType = this.storage.getItem(this.storageKey);
    if (savedViewType === 'list') {
      this.viewType.set('list');
    }

    effect(() => {
      this.storage.setItem(this.storageKey, this.viewType());
    });
  }

  setViewType(type: OverviewViewType): void {
    this.viewType.set(type);
  }
}