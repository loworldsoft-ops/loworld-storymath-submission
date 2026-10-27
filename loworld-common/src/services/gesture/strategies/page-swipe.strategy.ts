import type { ILwSwipeStrategy, LwSwipeCalculateResult } from '../swipe-strategy.contract';

/**
 * [LoworldUI Core Gesture] 전폭 1페이지(100% Width) 단위 스와이프 전략 (`LwPageSwipeStrategy`)
 * - 전자책 뷰어(Book Viewport), 스토리 배너 등 1화면 전체를 1페이지로 넘기는 뷰어 전용
 */
export class LwPageSwipeStrategy implements ILwSwipeStrategy {
  readonly mode = 'page';

  constructor(private readonly totalPagesFn?: () => number) {}

  private getTotalPages(track: HTMLElement): number {
    if (this.totalPagesFn) {
      return Math.max(1, this.totalPagesFn());
    }
    return Math.max(1, track.children.length);
  }

  calculateNext(currentScroll: number, track: HTMLElement, currentIndex: number): LwSwipeCalculateResult {
    const total = this.getTotalPages(track);
    const nextIndex = Math.min(total - 1, currentIndex + 1);
    return {
      targetScrollLeft: this.calculateScrollToIndex(nextIndex, track),
      newIndex: nextIndex,
    };
  }

  calculatePrev(currentScroll: number, track: HTMLElement, currentIndex: number): LwSwipeCalculateResult {
    const prevIndex = Math.max(0, currentIndex - 1);
    return {
      targetScrollLeft: this.calculateScrollToIndex(prevIndex, track),
      newIndex: prevIndex,
    };
  }

  calculateIndexFromScroll(currentScroll: number, track: HTMLElement): number {
    const pageWidth = track.clientWidth;
    if (pageWidth <= 0) return 0;
    const total = this.getTotalPages(track);
    const rawPage = Math.round(currentScroll / pageWidth);
    return Math.max(0, Math.min(total - 1, rawPage));
  }

  calculateScrollToIndex(index: number, track: HTMLElement): number {
    const pageWidth = track.clientWidth;
    if (pageWidth <= 0) return 0;
    const total = this.getTotalPages(track);
    const clampedIndex = Math.max(0, Math.min(total - 1, index));
    return clampedIndex * pageWidth;
  }
}
