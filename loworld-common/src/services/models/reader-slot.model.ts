import type { ReaderSlot } from '../narrative/narrative.model';

/** 슬롯이 어디까지 왔는가. 다시 열었을 때 이어서 보여 주는 데 쓴다. */
export type ReaderSavedStage = 'prelude' | 'reading' | 'interlude' | 'interlude-reading';

export interface ReaderSavedEntry {
  readonly slot: ReaderSlot;
  readonly stage: ReaderSavedStage;
  /** 캐릭터를 만들 때 고른 초상. 예전에 저장된 슬롯에는 없다 */
  readonly portraitId?: string | null;
}

export interface ReaderSavedState {
  readonly version: 1;
  readonly activeSlotId: string | null;
  readonly entries: Readonly<Record<string, ReaderSavedEntry>>;
  readonly clientUpdatedAt?: string;
}
