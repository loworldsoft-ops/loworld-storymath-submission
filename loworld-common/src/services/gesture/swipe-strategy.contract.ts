/**
 * [LoworldUI Core Gesture] 스와이프 계산 결과 모델
 */
export interface LwSwipeCalculateResult {
  /** 트랙 요소의 목표 scrollLeft 픽셀 위치 */
  readonly targetScrollLeft: number;
  /** 이동 후 활성화될 새 인덱스 (0-based) */
  readonly newIndex: number;
}

/**
 * [LoworldUI Core Gesture] 스와이프 스크롤 및 인덱스 계산 전략 인터페이스 (Strategy Pattern)
 * - OCP / LSP: 카드 아이템 단위, 전폭 1페이지 단위, 무한 롤링 등 스와이프 동작 방식을 독립적으로 확장/교체 가능
 */
export interface ILwSwipeStrategy {
  /** 스와이프 모드 식별자 */
  readonly mode: 'item' | 'page';

  /** 다음 슬라이드/아이템으로 이동할 목표 좌표 및 인덱스 계산 */
  calculateNext(currentScroll: number, track: HTMLElement, currentIndex: number): LwSwipeCalculateResult;

  /** 이전 슬라이드/아이템으로 이동할 목표 좌표 및 인덱스 계산 */
  calculatePrev(currentScroll: number, track: HTMLElement, currentIndex: number): LwSwipeCalculateResult;

  /** 현재 트랙의 scrollLeft 위치를 기반으로 활성 인덱스 역산출 */
  calculateIndexFromScroll(currentScroll: number, track: HTMLElement): number;

  /** 특정 목표 인덱스로 스크롤하기 위한 targetScrollLeft 위치 계산 */
  calculateScrollToIndex(index: number, track: HTMLElement): number;
}
