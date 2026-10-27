export type LwListDensity = 'compact' | 'standard' | 'spacious';
export type LwListVariant = 'default' | 'bordered' | 'card' | 'cards' | 'ghost' | 'flat';

export type LwListLayout = 'vertical' | 'grid-2' | 'grid-auto';
export type LwListGap = 'sm' | 'md';

/** ng-template context for lw-list-view / lw-selectable-list rows */
export interface LwListItemContext<T, TId = string> {
  $implicit: T;
  index: number;
  selected: boolean;
  id: TId;
}

/** Alias used in design docs */
export type LwSelectableListContext<T, TId = string> = LwListItemContext<T, TId>;
