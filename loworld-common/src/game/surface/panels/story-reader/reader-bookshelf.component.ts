import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import type { BookshelfBookItem } from './story-reader.model';

/**
 * 리더 앱의 첫 화면인 책장 (서고).
 * 사용자가 읽을 소설을 선택할 수 있으며, 준비 중인 작품 목록도 함께 조망할 수 있습니다.
 */
@Component({
  selector: 'lw-reader-bookshelf',
  standalone: true,
  imports: [LwButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader-bookshelf.component.html',
  styleUrl: './reader-bookshelf.component.scss',
  host: { '[class.is-dark]': 'dark()' },
})
export class LwReaderBookshelfComponent {
  readonly books = input<readonly BookshelfBookItem[]>([]);
  readonly dark = input(false);

  readonly selectBook = output<string>();

  protected onOpenBook(book: BookshelfBookItem): void {
    if (!book.isAvailable) return;
    this.selectBook.emit(book.id);
  }
}
