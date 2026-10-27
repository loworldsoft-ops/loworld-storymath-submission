import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwAvatarComponent } from '../../data-display/avatar/avatar.component';

export interface UnifiedListItemVm {
  id: string;
  title: string;
  subTitle?: string;
  metaText?: string;
  badge?: string;
  avatarUrl?: string;
  iconName?: string;
  active?: boolean;
  disabled?: boolean;
}

/**
 * Single Unified Primitive List Item Component (Group H).
 * Consolidates LwFolderListItemComponent, LwInventoryItemRowComponent, LwChronicleEntryRowComponent, LwMemberListItemComponent, LwCalendarListItemComponent.
 */
@Component({
  selector: 'lw-unified-list-item',
  standalone: true,
  imports: [CommonModule, LwAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unified-list-item.component.html',
  styleUrl: './unified-list-item.component.scss',
})
export class LwUnifiedListItemComponent {
  readonly item = input.required<UnifiedListItemVm>();
  readonly selectRow = output<string>();
}
