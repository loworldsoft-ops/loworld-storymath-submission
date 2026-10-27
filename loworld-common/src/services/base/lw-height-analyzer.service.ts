import { Injectable, ElementRef, NgZone, inject, signal, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type LwHeightRole = 'container' | 'header' | 'footer' | 'content';

export interface LwHeightElement {
  id: string;
  element: HTMLElement;
  role: LwHeightRole;
  offset: number;
  useWindowHeight?: boolean;
}

export interface LwHeightDebugElement {
  id: string;
  tagName: string;
  role: LwHeightRole;
  offset: number;
  measuredHeight: number;      // getBoundingClientRect().height (실제 물리 높이)
  useWindowHeight?: boolean;   // 브라우저 뷰포트 강제 적용 여부
}

export interface LwHeightDebugGroup {
  groupId: string;
  elements: LwHeightDebugElement[];
  computedHeight: number;      // Content 역할 요소에 적용된 실시간 계산 픽셀 높이
}

@Injectable({
  providedIn: 'root'
})
export class LwHeightAnalyzerService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly doc = inject(DOCUMENT, { optional: true });

  private get _win(): Window | null {
    return this.doc?.defaultView ?? null;
  }

  private resizeObserver?: ResizeObserver;
  private isWindowListenerAttached = false;
  private readonly onWindowResizeBound = () => this.handleWindowResize();
  
  // 컨테이너 그룹별 요소 저장소 (Group ID -> Element List)
  private readonly groups = new Map<string, LwHeightElement[]>();
  
  // 각 Content 역할 엘리먼트별 계산된 높이 신호 (Element ID -> Signal)
  private readonly computedHeights = new Map<string, ReturnType<typeof signal<number>>>();

  constructor() {
    this.initResizeObserver();
    this.initWindowResizeListener();
  }

  /**
   * 현재 관리 중인 모든 레이아웃 그룹과 하위 요소들의 실시간 물리적 높이 측정치 스냅샷을 반환합니다.
   */
  getDebugSnapshot(): LwHeightDebugGroup[] {
    const snapshot: LwHeightDebugGroup[] = [];

    for (const [groupId, items] of this.groups.entries()) {
      const elements: LwHeightDebugElement[] = items.map(item => {
        const rect = item.element?.getBoundingClientRect();
        return {
          id: item.id,
          tagName: item.element?.tagName?.toLowerCase() || 'unknown',
          role: item.role,
          offset: item.offset,
          measuredHeight: rect ? Math.round(rect.height) : 0,
          useWindowHeight: item.useWindowHeight
        };
      });

      // Content에 할당된 실시간 계산 높이 조회
      const contentItem = items.find(item => item.role === 'content');
      let computedHeight = 0;
      if (contentItem) {
        const sig = this.computedHeights.get(contentItem.id);
        if (sig) {
          computedHeight = sig();
        }
      }

      snapshot.push({
        groupId,
        elements,
        computedHeight
      });
    }

    return snapshot;
  }

  /**
   * 요소 등록 및 관찰 시작
   */
  register(
    groupId: string, 
    id: string, 
    elementRef: ElementRef<HTMLElement>, 
    role: LwHeightRole, 
    offset: number = 0,
    useWindowHeight: boolean = false
  ): void {
    const element = elementRef.nativeElement;
    if (!element) return;

    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, []);
    }

    const group = this.groups.get(groupId)!;
    
    // 중복 제거 후 추가
    const index = group.findIndex(item => item.id === id);
    const item: LwHeightElement = { id, element, role, offset, useWindowHeight };
    if (index > -1) {
      group[index] = item;
    } else {
      group.push(item);
    }

    // 높이 시그널 초기화
    if (role === 'content' && !this.computedHeights.has(id)) {
      this.computedHeights.set(id, signal<number>(0));
    }

    // ResizeObserver 관찰 등록
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver?.observe(element);
    });

    // 등록 시 최초 계산 수행
    this.calculateGroupHeight(groupId);
  }

  /**
   * 요소 해제
   */
  unregister(groupId: string, id: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    const index = group.findIndex(item => item.id === id);
    if (index > -1) {
      const [removed] = group.splice(index, 1);
      if (removed.element) {
        this.resizeObserver?.unobserve(removed.element);
      }
    }

    this.computedHeights.delete(id);

    if (group.length === 0) {
      this.groups.delete(groupId);
    } else {
      this.calculateGroupHeight(groupId);
    }
  }

  /**
   * 특정 Content ID의 실시간 높이 시그널 가져오기
   */
  getHeightSignal(id: string) {
    return this.computedHeights.get(id);
  }

  private readonly pendingGroupCalculations = new Set<string>();
  private isFrameScheduled = false;

  /**
   * 특정 그룹의 높이를 강제로 재계산합니다.
   */
  recalculateGroup(groupId: string): void {
    this.scheduleGroupCalculation(groupId);
  }

  /**
   * 프레임 단위로 그룹 계산을 일괄 스케줄링 (rAF Debouncing & Layout Thrashing 방지)
   */
  private scheduleGroupCalculation(groupId: string): void {
    this.pendingGroupCalculations.add(groupId);
    if (!this.isFrameScheduled) {
      this.isFrameScheduled = true;
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          this.ngZone.run(() => {
            this.flushPendingGroupCalculations();
          });
        });
      });
    }
  }

  private flushPendingGroupCalculations(): void {
    this.isFrameScheduled = false;
    const groupIds = Array.from(this.pendingGroupCalculations);
    this.pendingGroupCalculations.clear();
    for (const groupId of groupIds) {
      this.calculateGroupHeight(groupId);
    }
  }

  /**
   * ResizeObserver 초기화 (Zone 외부에서 구동하여 불필요한 CD 사이클 방지)
   */
  private initResizeObserver(): void {
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver((entries) => {
        const uniqueGroups = new Set<string>();
        
        for (const entry of entries) {
          for (const [groupId, items] of this.groups.entries()) {
            if (items.some(item => item.element === entry.target)) {
              uniqueGroups.add(groupId);
            }
          }
        }

        if (uniqueGroups.size > 0) {
          uniqueGroups.forEach(groupId => this.scheduleGroupCalculation(groupId));
        }
      });
    });
  }

  /**
   * 브라우저 창 크기 조절(Resize) 감지기 초기화
   */
  private initWindowResizeListener(): void {
    const win = this._win;
    if (!win) return;
    this.ngZone.runOutsideAngular(() => {
      win.addEventListener('resize', this.onWindowResizeBound);
      this.isWindowListenerAttached = true;
    });
  }

  private handleWindowResize(): void {
    // window 크기가 바뀔 때 useWindowHeight 옵션을 사용하는 container가 포함된 모든 그룹을 재연산
    const targetGroups: string[] = [];
    for (const [groupId, items] of this.groups.entries()) {
      const hasWindowHeightContainer = items.some(
        item => item.role === 'container' && item.useWindowHeight
      );
      if (hasWindowHeightContainer) {
        targetGroups.push(groupId);
      }
    }

    if (targetGroups.length > 0) {
      targetGroups.forEach(groupId => this.scheduleGroupCalculation(groupId));
    }
  }

  /**
   * 정밀 높이 계산 로직
   * 공식: Content 높이 = Container 높이 - (모든 Header 높이 합 + 모든 Footer 높이 합) - Offset 합
   */
  private calculateGroupHeight(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    const containerItem = group.find(item => item.role === 'container');
    const contentItems = group.filter(item => item.role === 'content');
    
    if (!containerItem || contentItems.length === 0) return;

    // 1. 기준 컨테이너의 실제 렌더링된 크기 측정 (useWindowHeight 활성화 시 window.innerHeight 강제)
    let containerHeight = containerItem.element.getBoundingClientRect().height;
    if (containerItem.useWindowHeight && this._win) {
      containerHeight = this._win.innerHeight;
    }

    // 2. 헤더 및 푸터의 실제 높이 합산
    let subtractHeight = 0;
    const headerFooters = group.filter(item => item.role === 'header' || item.role === 'footer');
    
    for (const item of headerFooters) {
      const rect = item.element.getBoundingClientRect();
      subtractHeight += rect.height;
    }

    // 3. 남은 가용 높이 배분 및 시그널 업데이트
    for (const content of contentItems) {
      const finalHeight = Math.max(0, containerHeight - subtractHeight - content.offset);
      
      const sig = this.computedHeights.get(content.id);
      if (sig) {
        sig.set(finalHeight);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.isWindowListenerAttached && this._win) {
      this._win.removeEventListener('resize', this.onWindowResizeBound);
      this.isWindowListenerAttached = false;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.groups.clear();
    this.computedHeights.clear();
    this.pendingGroupCalculations.clear();
  }
}
