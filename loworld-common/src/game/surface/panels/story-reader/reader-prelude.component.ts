import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import type { ReaderCardVm } from './story-reader.model';

export interface ReaderPreludeLineVm {
  readonly step: string;
  readonly text: string;
}

/**
 * 화를 여는 과정. 독자는 고르지 않고 지켜본다.
 *
 * 카드 셋이 나오고 그중 하나가 뽑힌다. 이어서 달라진 것, 사람들의 태도, 겨루기의 결과,
 * 엮인 본문의 요약이 한 줄씩 나온다. 줄에는 실제 값이 들어간다.
 * 화면을 누르면 기다리지 않고 모두 보여 준다.
 */
@Component({
  selector: 'lw-reader-prelude',
  standalone: true,
  imports: [LwButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader-prelude.component.html',
  styleUrl: './reader-prelude.component.scss',
  host: {
    '[class.is-dark]': 'dark()',
    '[class.is-settled]': 'settled()',
    '(click)': 'settled.set(true)',
  },
})
export class LwReaderPreludeComponent {
  readonly kicker = input('');
  readonly title = input('');
  /** 뽑힌 후보들. 비어 있으면 카드 자리를 그리지 않는다(막간) */
  readonly cards = input<readonly ReaderCardVm[]>([]);
  /** 그중 뽑힌 카드 */
  readonly pickedCardId = input<string | null>(null);
  readonly lines = input<readonly ReaderPreludeLineVm[]>([]);
  readonly readLabel = input('읽는다');
  readonly dark = input(false);

  readonly read = output<void>();

  /** 화면을 눌러 연출을 건너뛰었는가 */
  protected readonly settled = signal(false);

  /** 카드가 나오고 하나가 뽑힐 때까지의 시간(ms). 줄은 그 뒤에 나온다 */
  protected linesDelay(): number {
    return this.cards().length > 0 ? 1500 : 0;
  }

  protected stepLabel(step: string): string {
    switch (step) {
      case 'draw': return '뽑힌 것';
      case 'change': return '달라진 것';
      case 'people': return '사람들';
      case 'clash': return '겨루기';
      case 'bound': return '엮였다';
      default: return '';
    }
  }

  /** 앞 줄과 단계가 다르면 단계 이름을 보여 준다 */
  protected showStep(index: number): boolean {
    const lines = this.lines();
    return index === 0 || lines[index - 1].step !== lines[index].step;
  }
}
