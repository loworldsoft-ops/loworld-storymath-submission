export const LwListActionId = {
  ITEM_SELECT: 'LIST_ITEM_SELECT',
  ITEM_ACTION: 'LIST_ITEM_ACTION',
  FILTER_CHANGE: 'LIST_FILTER_CHANGE',
  PAGE_CHANGE: 'LIST_PAGE_CHANGE',
} as const;

export type LwListActionId = (typeof LwListActionId)[keyof typeof LwListActionId];

export interface LwListSelectPayload<TId = string> {
  id: TId;
  index: number;
}
