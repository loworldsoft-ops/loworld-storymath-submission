import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwSearchInputComponent } from '../../../../ui/form/search-input/search-input.component';
import { highlightParts, searchTerms } from '../docs-search';
import { DocSearchResult } from '../docs.models';

/** 문서 검색 대화상자. ↑↓로 고르고 Enter로 연다. */
@Component({
  selector: 'lw-docs-search-modal',
  standalone: true,
  imports: [LwEmptyStateComponent, LwIconComponent, LwModalComponent, LwSearchInputComponent],
  templateUrl: './lw-docs-search-modal.component.html',
  styleUrl: './lw-docs-search-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDocsSearchModalComponent {
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  readonly open = input<boolean>(false);
  readonly query = input<string>('');
  readonly results = input<readonly DocSearchResult[]>([]);
  readonly loading = input<boolean>(false);
  readonly minLength = input<number>(2);

  readonly queryChange = output<string>();
  readonly selectResult = output<DocSearchResult>();
  readonly close = output<void>();

  readonly selectedIndex = signal<number>(0);
  readonly terms = computed(() => searchTerms(this.query()));
  readonly rows = computed(() =>
    this.results().map((result) => ({ result, title: highlightParts(result.title, this.terms()), sub: highlightParts(result.sub, this.terms()) })),
  );

  constructor() {
    // 결과가 바뀌면 선택을 맨 위로 되돌린다.
    effect(() => {
      this.results();
      untracked(() => this.selectedIndex.set(0));
    });

    // 열릴 때 입력창에 포커스, 선택이 바뀌면 그 항목이 보이게 스크롤.
    afterRenderEffect(() => {
      const body = this.body()?.nativeElement;
      if (!this.open() || !body) return;
      const index = this.selectedIndex();
      if (untracked(() => this.query()) === '') body.querySelector<HTMLInputElement>('input')?.focus();
      body.querySelectorAll('.lw-docs-search__result')[index]?.scrollIntoView({ block: 'nearest' });
    });
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown' && count > 0) {
      event.preventDefault();
      this.selectedIndex.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && count > 0) {
      event.preventDefault();
      this.selectedIndex.update((i) => (i - 1 + count) % count);
    } else if (event.key === 'Enter' && !event.isComposing) {
      const picked = this.results()[this.selectedIndex()];
      if (picked) {
        event.preventDefault();
        this.selectResult.emit(picked);
      }
    }
  }
}
