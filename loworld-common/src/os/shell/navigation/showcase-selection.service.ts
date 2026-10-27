import { Injectable } from '@angular/core';
import type { ComponentMeta, OverviewWindowTab } from '../../../services/models/os.types';

@Injectable({ providedIn: 'root' })
export class ShowcaseSelectionService {
  resolveSelection(tab: string, detailId: string | undefined, _catalogs?: ShowcaseSelectionCatalogs): string {
    return detailId ?? tab;
  }

  resolveOverviewSelection(tab: OverviewWindowTab, detailId: string | undefined, catalogs?: ShowcaseSelectionCatalogs): string | null {
    return this.resolveSelection(tab, detailId, catalogs);
  }
}

export type ShowcaseSelectionCatalogs = Record<string, readonly ComponentMeta[]>;