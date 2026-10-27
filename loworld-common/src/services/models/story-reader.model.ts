/** 책장에서 고를 수 있는 소설 한 권 */
export interface BookshelfBookItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly genre: string;
  readonly summary: string;
  readonly episodeCount: number;
  readonly isCompleted: boolean;
  readonly isAvailable: boolean;
  readonly badge?: string;
  readonly slotSummary?: string;
}
