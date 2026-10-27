import { InjectionToken } from '@angular/core';
import type { ReaderSavedState } from '../models/reader-slot.model';

export interface ReaderSlotPort {
  getCurrentUid(): string | null;
  load(packId: string): ReaderSavedState;
  loadWithCloudSync(packId: string): Promise<ReaderSavedState>;
  save(state: ReaderSavedState, packId?: string): void;
}

export const READER_SLOT_PORT = new InjectionToken<ReaderSlotPort>('READER_SLOT_PORT');
