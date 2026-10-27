import { TemplateRef } from '@angular/core';
import { WorkspaceDesktopSlotId, WorkspaceMobileSlotId } from './workspace-layout.model';

export type WorkspaceSlotId = WorkspaceDesktopSlotId | WorkspaceMobileSlotId;

export interface WorkspaceSlotContext<TSlotId extends WorkspaceSlotId = WorkspaceSlotId> {
  $implicit: TSlotId;
  slotId: TSlotId;
  selected: boolean;
}

export type WorkspaceDesktopSlotTemplates = Partial<
  Record<WorkspaceDesktopSlotId, TemplateRef<WorkspaceSlotContext<WorkspaceDesktopSlotId>>>
>;

export type WorkspaceMobileSlotTemplates = Partial<
  Record<WorkspaceMobileSlotId, TemplateRef<WorkspaceSlotContext<WorkspaceMobileSlotId>>>
>;