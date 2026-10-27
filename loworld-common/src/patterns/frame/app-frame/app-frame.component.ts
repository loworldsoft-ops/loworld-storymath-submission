import { LwFrameDirective } from '../../../services/settings/lw-frame.directive';
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { LwResizeHandleComponent } from '../../../ui/gesture/lw-resize-handle.component';
import { DEFAULT_WORKSPACE_DESKTOP_LAYOUT, WorkspaceDesktopLayout, WorkspaceDesktopSlotId } from '../../../services/models/workspace-layout.model';
import { LwHeightTargetDirective } from '../../../services/base/lw-height-target.directive';
import { WorkspaceDesktopSlotTemplates, WorkspaceSlotContext } from '../../../services/models/workspace-slot.model';

@Component({
  hostDirectives: [LwFrameDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // lw-app-frame이 정식 이름이다. 예전 이름은 그 이름으로 쓰던 곳을 위해 남겨 둔다.
  selector: 'lw-app-frame, lw-workspace-desktop-layout',
  imports: [NgTemplateOutlet, LwHeightTargetDirective, LwResizeHandleComponent],
  templateUrl: './app-frame.component.html',
  styleUrl: './app-frame.component.scss',
})
/**
 * 앱의 틀이다. 모든 앱의 헤더, 사이드 메뉴, 목록, 본문, 상세가 이 하나의 부품에 놓인다.
 * 자리(슬롯)마다 템플릿을 받아 그리고, 틀의 설정(LwFrameSettings)을 읽어 헤더와 사이드 메뉴를 옮기거나 숨긴다.
 * 틀을 고치면 이것을 쓰는 모든 앱이 함께 바뀐다.
 */
export class LwAppFrameComponent {
  readonly layout = input<WorkspaceDesktopLayout>(DEFAULT_WORKSPACE_DESKTOP_LAYOUT);
  readonly selectedSlotId = input<WorkspaceDesktopSlotId | null>(null);
  readonly slotTemplates = input<WorkspaceDesktopSlotTemplates>({});

  /** collection 패널 폭을 끌어서 조절할 수 있게 한다. 폭은 저장하지 않고 `collectionWidthChange`로 알린다. */
  readonly collectionResizable = input(false);
  readonly collectionMinWidth = input(240);
  readonly collectionMaxWidth = input(480);

  readonly slotSelected = output<WorkspaceDesktopSlotId>();
  readonly collectionWidthChange = output<number>();
  readonly collectionWidthReset = output<void>();
  protected readonly resizing = signal(false);
  readonly visibleSlots = computed(() => new Set(this.layout().visibleSlots));

  sidebarWidth(): number {
    if (this.layout().sidebarCollapsed) {
      return 60;
    }
    return this.layout().slotWidths.sidebar ?? 256;
  }

  collectionWidth(): number {
    if (!this.layout().collectionOpen) {
      return 0;
    }
    return this.layout().slotWidths.collection ?? 280;
  }

  hasSlot(slotId: WorkspaceDesktopSlotId): boolean {
    return this.visibleSlots().has(slotId);
  }

  isSelected(slotId: WorkspaceDesktopSlotId): boolean {
    return this.selectedSlotId() === slotId;
  }

  selectSlot(slotId: WorkspaceDesktopSlotId): void {
    this.slotSelected.emit(slotId);
  }

  slotTemplate(slotId: WorkspaceDesktopSlotId) {
    return this.slotTemplates()[slotId] ?? null;
  }

  slotContext(slotId: WorkspaceDesktopSlotId): WorkspaceSlotContext<WorkspaceDesktopSlotId> {
    return {
      $implicit: slotId,
      slotId,
      selected: this.isSelected(slotId),
    };
  }
}