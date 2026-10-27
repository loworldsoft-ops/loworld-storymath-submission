import { Injectable, NgZone, inject, signal, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { LwWidthRole } from './lw-width-analyzer.model';

export interface LwWidthElement {
  id: string;
  element: HTMLElement;
  role: LwWidthRole;
  offset: number;
}

export interface LwWidthDebugElement {
  id: string;
  tagName: string;
  role: LwWidthRole;
  offset: number;
  measuredWidth: number;
}

export interface LwWidthDebugGroup {
  groupId: string;
  elements: LwWidthDebugElement[];
  computedWidth: number;
}

/**
 * LwHeightAnalyzerService와 대칭 — 가용 **너비**를 그룹 단위로 계산한다.
 * SRP: 높이 연산과 분리하여 폭 전용 ResizeObserver·시그널을 관리한다.
 *
 * 공식: Content 너비 = Container 너비 − (Leading + Trailing 합) − Offset
 */
@Injectable({ providedIn: 'root' })
export class LwWidthAnalyzerService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly doc = inject(DOCUMENT, { optional: true });
  private resizeObserver?: ResizeObserver;

  private readonly groups = new Map<string, LwWidthElement[]>();
  private readonly computedWidths = new Map<string, ReturnType<typeof signal<number>>>();
  private readonly pendingGroupCalculations = new Set<string>();
  private isFrameScheduled = false;

  constructor() {
    this.initResizeObserver();
  }

  getDebugSnapshot(): LwWidthDebugGroup[] {
    const snapshot: LwWidthDebugGroup[] = [];

    for (const [groupId, items] of this.groups.entries()) {
      const elements: LwWidthDebugElement[] = items.map((item) => {
        const rect = item.element?.getBoundingClientRect();
        return {
          id: item.id,
          tagName: item.element?.tagName?.toLowerCase() || 'unknown',
          role: item.role,
          offset: item.offset,
          measuredWidth: rect ? Math.round(rect.width) : 0,
        };
      });

      const contentItem = items.find((item) => item.role === 'content');
      let computedWidth = 0;
      if (contentItem) {
        computedWidth = this.computedWidths.get(contentItem.id)?.() ?? 0;
      }

      snapshot.push({ groupId, elements, computedWidth });
    }

    return snapshot;
  }

  register(
    groupId: string,
    id: string,
    element: HTMLElement,
    role: LwWidthRole,
    offset = 0,
  ): void {
    if (!element) {
      return;
    }

    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, []);
    }

    const group = this.groups.get(groupId)!;
    const item: LwWidthElement = { id, element, role, offset };
    const index = group.findIndex((entry) => entry.id === id);
    if (index > -1) {
      group[index] = item;
    } else {
      group.push(item);
    }

    if (role === 'content' && !this.computedWidths.has(id)) {
      this.computedWidths.set(id, signal(0));
    }

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver?.observe(element);
    });

    this.calculateGroupWidth(groupId);
  }

  unregister(groupId: string, id: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      return;
    }

    const index = group.findIndex((item) => item.id === id);
    if (index > -1) {
      const [removed] = group.splice(index, 1);
      if (removed.element) {
        this.resizeObserver?.unobserve(removed.element);
      }
    }

    this.computedWidths.delete(id);

    if (group.length === 0) {
      this.groups.delete(groupId);
    } else {
      this.calculateGroupWidth(groupId);
    }
  }

  getWidthSignal(id: string) {
    return this.computedWidths.get(id);
  }

  recalculateGroup(groupId: string): void {
    this.scheduleGroupCalculation(groupId);
  }

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
      this.calculateGroupWidth(groupId);
    }
  }

  private initResizeObserver(): void {
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver((entries) => {
        const uniqueGroups = new Set<string>();

        for (const entry of entries) {
          for (const [groupId, items] of this.groups.entries()) {
            if (items.some((item) => item.element === entry.target)) {
              uniqueGroups.add(groupId);
            }
          }
        }

        if (uniqueGroups.size > 0) {
          uniqueGroups.forEach((groupId) => this.scheduleGroupCalculation(groupId));
        }
      });
    });
  }

  private calculateGroupWidth(groupId: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      return;
    }

    const containerItem = group.find((item) => item.role === 'container');
    const contentItems = group.filter((item) => item.role === 'content');
    if (contentItems.length === 0) {
      return;
    }

    let containerWidth = 0;
    if (containerItem) {
      containerWidth = containerItem.element.getBoundingClientRect().width;
    } else {
      containerWidth = this.doc?.defaultView?.innerWidth ?? 1080;
    }

    let subtractWidth = 0;
    const fixedSiblings = group.filter((item) => item.role === 'leading' || item.role === 'trailing');
    for (const item of fixedSiblings) {
      subtractWidth += item.element.getBoundingClientRect().width;
    }

    for (const content of contentItems) {
      const finalWidth = Math.max(320, containerWidth - subtractWidth - content.offset);
      const sig = this.computedWidths.get(content.id);
      sig?.set(Math.round(finalWidth));
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
    this.groups.clear();
    this.computedWidths.clear();
    this.pendingGroupCalculations.clear();
  }
}
