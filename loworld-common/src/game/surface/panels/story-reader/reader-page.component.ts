import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { withJosa } from '../../../../services/narrative/narrative-util';
import { type BoundEpisode } from '../../../../services/narrative/narrative.model';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import type { ReaderTraitVm } from './story-reader.model';

/** 읽는 화면. 글과 메뉴 버튼 하나만 있다. */
@Component({
  selector: 'lw-reader-page',
  standalone: true,
  imports: [LwButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader-page.component.html',
  styleUrl: './reader-page.component.scss',
  host: { '[class.is-dark]': 'dark()' },
})
export class LwReaderPageComponent {
  readonly bound = input<BoundEpisode | null>(null);
  readonly kicker = input('');
  readonly nextLabel = input('다음 화');
  /** 이 화를 읽고 얻은 것. 화의 끝에 이름과 한 줄로 보여 준다 */
  readonly gains = input<readonly ReaderTraitVm[]>([]);
  readonly dark = input(false);
  /** 기획자용: 독자 때문에 고른 문장에 옅은 표시를 한다 */
  readonly markPersonal = input(false);

  readonly next = output<void>();
  readonly menu = output<void>();

  protected gainLabel(kind: string): string {
    return `${withJosa(kind, '을/를')} 얻었다`;
  }
}
