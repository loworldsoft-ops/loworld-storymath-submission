import type { ComponentMeta, DesignSystemFamily } from '../../services/models/os.types';
import { COMPONENT_INTERSECTION_CENSUS_MAP } from '../all-components-census-data';

export function resolveDesignSystemFamily(comp: ComponentMeta): DesignSystemFamily {
  if (comp.designSystemFamily) return comp.designSystemFamily;
  const id = comp.id.toLowerCase();
  const sel = comp.selector.toLowerCase();
  if (id.includes('avatar')) return 'avatars';
  if (id.includes('button') || id.includes('fab') || sel.includes('button')) return 'buttons';
  if (id.includes('badge') || id.includes('progress')) return 'badges';
  if (id.includes('card') || id.includes('tile') || id.includes('panel') || id.includes('item') || id.includes('row')) return 'cards';
  if (id.includes('modal') || id.includes('dialog') || id.includes('tooltip') || id.includes('window')) return 'modals';
  if (id.includes('sheet') || id.includes('filter')) return 'sheets';
  if (id.includes('chip')) return 'chips';
  if (id.includes('icon')) return 'app-icons';
  if (id.includes('list') || sel.includes('list')) return 'lists';
  if (id.includes('grid') || id.includes('tree')) return 'grids';
  if (id.includes('shell') || id.includes('header') || id.includes('sidebar') || id.includes('taskbar') || id.includes('titlebar')) return 'navigation';
  if (comp.category === 'buttons') return 'buttons';
  if (comp.category === 'cards') return 'cards';
  if (comp.category === 'popups') return 'modals';
  if (comp.category === 'layout') return 'grids';
  if (comp.category === 'forms') return 'forms';
  return 'cards';
}

const DESIGN_SYSTEM_PRIMITIVES_REGISTRY: Record<DesignSystemFamily, readonly string[]> = {
  avatars: ['lw-avatar'],
  buttons: ['lw-button'],
  badges: ['lw-badge'],
  cards: ['lw-card', 'lw-badge'],
  modals: ['lw-modal', 'lw-button'],
  sheets: ['lw-bottom-sheet'],
  chips: ['lw-chip'],
  'app-icons': ['lw-app-icon'],
  grids: ['lw-grid'],
  lists: ['lw-list', 'lw-list-item'],
  swipes: ['lw-bottom-sheet-slider'],
  'side-menus': ['lw-side-menu-item', 'lw-side-menu-section'],
  navigation: ['lw-app-titlebar', 'lw-button'],
  forms: ['lw-button', 'lw-badge'],
  'data-view': ['lw-data-grid', 'lw-table'],
};

const FAMILY_MATCH_STRATEGY: Record<
  DesignSystemFamily,
  (prims: string[], comp: ComponentMeta) => boolean
> = {
  avatars: (prims, comp) => prims.includes('lw-avatar') || comp.designSystemFamily === 'avatars',
  buttons: (prims) => prims.includes('lw-button'),
  badges: (prims) => prims.includes('lw-badge') || prims.includes('lw-progress-bar'),
  cards: (prims, comp) => prims.includes('lw-card') || comp.category === 'cards',
  modals: (prims) => prims.includes('lw-modal') || prims.includes('lw-tooltip'),
  sheets: (prims) => prims.includes('lw-bottom-sheet'),
  chips: (prims) => prims.includes('lw-chip'),
  'app-icons': (prims) => prims.includes('lw-app-icon'),
  grids: (prims, comp) => prims.includes('lw-grid') || comp.category === 'layout',
  lists: (prims, comp) => prims.includes('lw-list') || comp.designSystemFamily === 'lists',
  swipes: (prims, comp) => prims.includes('lw-bottom-sheet-slider') || comp.designSystemFamily === 'swipes',
  'side-menus': (prims, comp) =>
    prims.includes('lw-side-menu-item') ||
    prims.includes('lw-side-menu-section') ||
    comp.designSystemFamily === 'side-menus',
  navigation: (prims) =>
    prims.includes('lw-app-titlebar') ||
    prims.includes('lw-side-panel'),
  forms: (prims, comp) => comp.category === 'forms' || prims.includes('lw-button'),
  'data-view': (prims, comp) => comp.category === 'data' || comp.designSystemFamily === 'data-view',
};

export function resolveDesignSystemPrimitives(comp: ComponentMeta): string[] {
  if (comp.designSystemPrimitives && comp.designSystemPrimitives.length > 0) {
    return comp.designSystemPrimitives;
  }
  const censusPrims = COMPONENT_INTERSECTION_CENSUS_MAP[comp.id];
  if (censusPrims && censusPrims.length > 0) {
    return censusPrims;
  }
  const family = resolveDesignSystemFamily(comp);
  return [...(DESIGN_SYSTEM_PRIMITIVES_REGISTRY[family] ?? ['lw-card'])];
}

export function matchesDesignSystemFamily(
  family: DesignSystemFamily,
  primitives: string[],
  comp: ComponentMeta
): boolean {
  if (resolveDesignSystemFamily(comp) === family) return true;
  const matcher = FAMILY_MATCH_STRATEGY[family];
  return matcher ? matcher(primitives, comp) : false;
}
