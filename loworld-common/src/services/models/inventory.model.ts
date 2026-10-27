import { Item } from './item.model';

export interface Inventory {
  items: Item[];
  gold: number;
  maxSlots: number;
}