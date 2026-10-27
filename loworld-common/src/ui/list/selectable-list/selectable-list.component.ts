import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input, output } from '@angular/core';
import type { LwActionEvent } from '../../../services/models/action-event.model';
import { LwListActionId, type LwListSelectPayload } from '../list-action.ids';
import type { LwListGap, LwListItemContext, LwListLayout } from '../list.types';

@Component({
  selector: 'lw-selectable-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './selectable-list.component.html',
  styleUrl: './selectable-list.component.scss',
})
export class LwSelectableListComponent<T, TId extends string = string> {
  readonly items = input.required<readonly T[]>();
  readonly trackBy = input<(item: T, index: number) => TId>(
    (item, index) => (item as { id?: TId }).id ?? (String(index) as TId),
  );
  readonly selectedId = input<TId | null>(null);
  readonly layout = input<LwListLayout>('vertical');
  readonly gap = input<LwListGap>('sm');
  readonly emptyTitle = input('항목이 없습니다');
  readonly emptyDescription = input<string | undefined>(undefined);
  readonly emptyIcon = input<string | undefined>(undefined);
  readonly itemTemplate = input.required<TemplateRef<LwListItemContext<T, TId>>>();

  readonly actionEvent = output<LwActionEvent<LwListSelectPayload<TId>>>();

  protected rowContext(item: T, index: number): LwListItemContext<T, TId> {
    const id = this.trackBy()(item, index);
    return {
      $implicit: item,
      index,
      selected: this.selectedId() === id,
      id,
    };
  }

  protected gapPx(): string {
    return this.gap() === 'md' ? '12px' : '8px';
  }

  emitItemSelect(item: T, index: number): void {
    const id = this.trackBy()(item, index);
    this.actionEvent.emit({
      actionId: LwListActionId.ITEM_SELECT,
      payload: { id, index },
      source: 'lw-selectable-list',
    });
  }
}
