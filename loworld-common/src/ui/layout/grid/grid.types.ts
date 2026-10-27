import type { LwSize } from '../../../services/tokens/global.tokens';

export type LwGridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LwGridAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type LwGridJustify = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
export type LwGridFlow = 'row' | 'column' | 'dense' | 'row dense' | 'column dense';

export const LW_GRID_GAP_MAP: Record<LwGridGap, string> = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};
