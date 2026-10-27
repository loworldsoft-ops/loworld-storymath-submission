/**
 * 100% 높이로 신장되는 중간 래퍼(.lw-panel-bottom-sheet__body, .sheet__body, lw-bottom-sheet-content 등)를
 * 언래핑하여 실제 높이를 측정해야 하는 핵심 컨텐츠 요소를 탐색합니다.
 */
export function findRealContentContainer(bodyEl: HTMLElement): HTMLElement {
  if (!bodyEl) return bodyEl;

  const wrapper =
    typeof bodyEl.querySelector === 'function'
      ? bodyEl.querySelector<HTMLElement>('.lw-panel-bottom-sheet__body, .sheet__body, lw-bottom-sheet-content')
      : null;

  if (wrapper) {
    // 래퍼 내부에 또 다른 중첩 래퍼가 있는 경우 심층 탐색
    const nestedWrapper =
      typeof wrapper.querySelector === 'function'
        ? wrapper.querySelector<HTMLElement>('lw-bottom-sheet-content, .lw-panel-bottom-sheet__body')
        : null;
    const targetWrapper = nestedWrapper || wrapper;

    const innerContent = targetWrapper.firstElementChild as HTMLElement;
    if (innerContent) {
      return innerContent;
    }
    return targetWrapper;
  }

  return bodyEl;
}

export interface ContentHeightMeasurementResult {
  totalNeededHeight: number;
  maxNestedScrollHeight: number;
}

/**
 * 바텀시트 내부 컨텐츠의 실제 필요 높이를 심층 측정합니다.
 */
export function calculateContentNeededHeight(
  handleEl: HTMLElement | null | undefined,
  headerEl: HTMLElement | null | undefined,
  bodyEl: HTMLElement | null | undefined
): ContentHeightMeasurementResult | null {
  if (!bodyEl) return null;

  const handleHeight = handleEl ? handleEl.offsetHeight : 25;
  const headerHeight = headerEl ? headerEl.offsetHeight : 45;

  const contentContainer = findRealContentContainer(bodyEl);

  let maxNestedScrollHeight = 0;

  // 1. 내부 중첩 스크롤/바디 컨테이너 검색 (패널 본문, 슬라이더 페이지 등)
  if (typeof contentContainer.querySelectorAll === 'function') {
    const nestedTargets = contentContainer.querySelectorAll<HTMLElement>(
      '.pm-slider-page--main, .storage-subpage-container, [data-sheet-scroll]'
    );
    nestedTargets.forEach((el) => {
      if (el.scrollHeight > maxNestedScrollHeight) {
        maxNestedScrollHeight = el.scrollHeight;
      }
    });
  }

  // 2. 내부 실제 자식들의 높이 총합 또는 자체 scrollHeight
  let sumChildren = 0;
  if (contentContainer.children && contentContainer.children.length > 0) {
    for (let i = 0; i < contentContainer.children.length; i++) {
      const child = contentContainer.children[i] as HTMLElement;
      const childScroll = child.scrollHeight ?? 0;
      const childOffset = child.offsetHeight ?? 0;
      sumChildren += Math.max(childScroll, childOffset);
      if (childScroll > maxNestedScrollHeight) {
        maxNestedScrollHeight = childScroll;
      }
    }
  } else {
    sumChildren = Math.max(contentContainer.scrollHeight ?? 0, contentContainer.offsetHeight ?? 0);
    if (sumChildren > maxNestedScrollHeight) {
      maxNestedScrollHeight = sumChildren;
    }
  }

  const containerScroll = contentContainer.scrollHeight ?? 0;
  let bodyContentHeight = Math.max(maxNestedScrollHeight, containerScroll, sumChildren);

  // 본문 padding-top + padding-bottom 보정
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    try {
      const style = window.getComputedStyle(contentContainer);
      const paddingTop = parseFloat(style?.paddingTop) || 0;
      const paddingBottom = parseFloat(style?.paddingBottom) || 0;
      bodyContentHeight += paddingTop + paddingBottom;

      const wrapper = bodyEl.querySelector<HTMLElement>('.lw-panel-bottom-sheet__body, .sheet__body');
      if (wrapper && wrapper !== contentContainer) {
        const wStyle = window.getComputedStyle(wrapper);
        bodyContentHeight += (parseFloat(wStyle?.paddingTop) || 0) + (parseFloat(wStyle?.paddingBottom) || 0);
      }
    } catch {
      // 무시
    }
  }

  const totalNeededHeight = Math.ceil(handleHeight + headerHeight + bodyContentHeight);
  return { totalNeededHeight, maxNestedScrollHeight };
}
