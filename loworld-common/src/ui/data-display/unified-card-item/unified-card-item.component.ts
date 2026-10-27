import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwCardComponent } from '../card/card.component';

export interface UnifiedCardItemVm {
  id: string;
  title: string;
  subTitle?: string;
  contentSnippet?: string;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  timestamp?: string;
  iconUrl?: string;
  iconName?: string;
  selected?: boolean;
}

/**
 * Single Unified Primitive Card Item Component (Group G).
 * Consolidates LwNoteCardComponent, LwTrashCardComponent, LwMobileNoteCardComponent, LwSavedLibraryItemComponent, LwHomeworkRoomCardComponent.
 */
@Component({
  selector: 'lw-unified-card-item',
  standalone: true,
  imports: [CommonModule, LwCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unified-card-item.component.html',
  styleUrl: './unified-card-item.component.scss',
})
export class LwUnifiedCardItemComponent {
  readonly item = input.required<UnifiedCardItemVm>();
  readonly selectItem = output<string>();
}
