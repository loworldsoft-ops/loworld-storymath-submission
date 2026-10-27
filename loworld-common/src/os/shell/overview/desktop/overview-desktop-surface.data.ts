import { OverviewExplorerFolder, OverviewExplorerItem } from '../../../../services/models/os.types';

export type DesktopSurfaceEntry =
  | { kind: 'app'; item: OverviewExplorerItem }
  | { kind: 'folder'; folder: OverviewExplorerFolder };

export interface OverviewDesktopAppPage {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  entries: readonly DesktopSurfaceEntry[];
}

export type DesktopSortCriterion = 'default' | 'name' | 'type' | 'items';
export type DesktopSortDirection = 'asc' | 'desc';
export type DesktopViewMode = 'large' | 'tiles' | 'details' | 'list';
