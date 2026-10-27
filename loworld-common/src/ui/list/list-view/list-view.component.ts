import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input } from '@angular/core';
import type { LwListGap, LwListItemContext, LwListLayout } from '../list.types';

/**
 * 제네릭 데이터 렌더링과 커스텀 템플릿, 빈 상태를 지원하는 리스트 뷰 컴포넌트입니다.
 */
@Component({
  selector: 'lw-list-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss',
})
export class LwListViewComponent<T, TId = string> {
  readonly items = input.required<readonly T[]>();
  readonly trackBy = input<(item: T, index: number) => TId>(
    (item, index) => (item as { id?: TId }).id ?? (index as unknown as TId),
  );
  readonly layout = input<LwListLayout>('vertical');
  readonly gap = input<LwListGap>('sm');
  readonly emptyTitle = input('항목이 없습니다');
  readonly emptyDescription = input<string | undefined>(undefined);
  readonly emptyIcon = input<string | undefined>(undefined);
  readonly itemTemplate = input.required<TemplateRef<LwListItemContext<T, TId>>>();

  protected rowContext(item: T, index: number): LwListItemContext<T, TId> {
    const id = this.trackBy()(item, index);
    return {
      $implicit: item,
      index,
      selected: false,
      id,
    };
  }

  protected gapPx(): string {
    return this.gap() === 'md' ? '12px' : '8px';
  }
}
