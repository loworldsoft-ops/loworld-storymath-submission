export type WorkspaceViewport = 'desktop' | 'mobile';

export type WorkspaceDensity = 'comfortable' | 'compact';

export type WorkspaceDesktopSlotId =
  | 'topbar'
  | 'sidebar'
  | 'collection'
  | 'detail'
  /** 본문 옆에 붙는 상세. 고른 것을 자세히 볼 때 쓴다. */
  | 'aside'
  | 'overlay';

export type WorkspaceMobileSlotId =
  | 'topbar'
  | 'header'
  | 'body'
  | 'dock'
  | 'sheet'
  | 'fullscreen'
  | 'toast';

export interface WorkspaceDesktopLayout {
  mode: 'desktop';
  density: WorkspaceDensity;
  sidebarCollapsed: boolean;
  collectionOpen: boolean;
  overlayActive: boolean;
  slotWidths: Partial<Record<'sidebar' | 'collection' | 'detail', number>>;
  visibleSlots: WorkspaceDesktopSlotId[];
}

export interface WorkspaceMobileLayout {
  mode: 'mobile';
  density: WorkspaceDensity;
  safeAreaAware: boolean;
  dockVisible: boolean;
  activeSheet: string | null;
  activeFullscreen: string | null;
  visibleSlots: WorkspaceMobileSlotId[];
}

export const DEFAULT_WORKSPACE_DESKTOP_LAYOUT: WorkspaceDesktopLayout = {
  mode: 'desktop',
  density: 'comfortable',
  sidebarCollapsed: false,
  collectionOpen: true,
  overlayActive: false,
  slotWidths: {
    sidebar: 256,
    collection: 280,
    detail: 1,
  },
  visibleSlots: ['topbar', 'sidebar', 'collection', 'detail'],
};

export const DEFAULT_WORKSPACE_MOBILE_LAYOUT: WorkspaceMobileLayout = {
  mode: 'mobile',
  density: 'comfortable',
  safeAreaAware: true,
  dockVisible: true,
  activeSheet: null,
  activeFullscreen: null,
  visibleSlots: ['topbar', 'body', 'dock'],
};