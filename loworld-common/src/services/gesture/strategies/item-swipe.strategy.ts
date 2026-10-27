import type { ILwSwipeStrategy, LwSwipeCalculateResult } from '../swipe-strategy.contract';

/**
 * [LoworldUI Core Gesture] 아이템/카드 단위 스와이프 전략 (`LwItemSwipeStrategy`)
 * - 카드 캐러셀, 슬롯 트레이 등 한 화면에 여러 아이템이 존재할 때 각 요소의 offsetLeft를 기반으로 시작점 정렬 스냅 이동
 */
export class LwItemSwipeStrategy implements ILwSwipeStrategy {
  readonly mode = 'item';

  constructor(private readonly itemSelector: string = ':scope > *') {}

  private getItems(track: HTMLElement): HTMLElement[] {
    try {
      return Array.from(track.querySelectorAll(this.itemSelector)) as HTMLElement[];
    } catch {
      return Array.from(track.children) as HTMLElement[];
    }
  }

  calculateNext(currentScroll: number, track: HTMLElement, currentIndex: number): LwSwipeCalculateResult {
    const items = this.getItems(track);
    if (items.length === 0) {
      return { targetScrollLeft: 0, newIndex: 0 };
    }

    const nextIndex = Math.min(items.length - 1, currentIndex + 1);
    return {
      targetScrollLeft: this.calculateScrollToIndex(nextIndex, track),
      newIndex: nextIndex,
    };
  }

  calculatePrev(currentScroll: number, track: HTMLElement, currentIndex: number): LwSwipeCalculateResult {
    const items = this.getItems(track);
    if (items.length === 0) {
      return { targetScrollLeft: 0, newIndex: 0 };
    }

    const prevIndex = Math.max(0, currentIndex - 1);
    return {
      targetScrollLeft: this.calculateScrollToIndex(prevIndex, track),
      newIndex: prevIndex,
    };
  }

  calculateIndexFromScroll(currentScroll: number, track: HTMLElement): number {
    const items = this.getItems(track);
    if (items.length === 0) return 0;

    const firstItem = items[0];
    const baseOffset = firstItem ? firstItem.offsetLeft : 0;

    let bestIndex = 0;
    let minDistance = Infinity;

    items.forEach((item, idx) => {
      const itemRelativePos = item.offsetLeft - baseOffset;
      const distance = Math.abs(itemRelativePos - currentScroll);
      if (distance < minDistance) {
        minDistance = distance;
        bestIndex = idx;
      }
    });

    return bestIndex;
  }

  calculateScrollToIndex(index: number, track: HTMLElement): number {
    const items = this.getItems(track);
    if (items.length === 0) return 0;

    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    if (clampedIndex === 0) return 0;

    const targetItem = items[clampedIndex];
    const firstItem = items[0];
    if (!targetItem || !firstItem) return 0;

    return Math.max(0, targetItem.offsetLeft - firstItem.offsetLeft);
  }
}
