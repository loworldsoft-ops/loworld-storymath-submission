import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { LwActionEvent } from '../../../services/models/action-event.model';
import { LwSearchInputComponent } from '../../form/search-input/search-input.component';

/**
 * 검색창과 항목 수 카운트, 페이지네이션을 포함한 필터 가능 리스트 셸 컴포넌트입니다.
 */
@Component({
  selector: 'lw-filterable-list-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LwSearchInputComponent],
  templateUrl: './filterable-list-shell.component.html',
  styleUrl: './filterable-list-shell.component.scss',
})
export class LwFilterableListShellComponent {
  readonly title = input<string | undefined>(undefined);
  readonly count = input<number | undefined>(undefined);
  readonly showSearch = input(false);
  readonly searchQuery = input('');
  readonly searchPlaceholder = input('검색');
  readonly showPagination = input(false);

  readonly searchQueryChange = output<string>();
  readonly actionEvent = output<LwActionEvent<unknown>>();

  protected onSearchAction(event: LwActionEvent<string>): void {
    if (event.actionId === 'SEARCH_QUERY_CHANGE') {
      this.searchQueryChange.emit(event.payload ?? '');
    }
  }
}
