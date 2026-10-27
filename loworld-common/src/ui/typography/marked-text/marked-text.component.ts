import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** 글의 한 조각. `mark`가 있으면 그 조각을 칠하고, `state`는 읽는 자리의 상태('past' | 'now' | 'ahead')를 나타낸다. */
export interface LwMarkedSegment {
  readonly text: string;
  readonly mark?: string | null;
  readonly state?: 'past' | 'now' | 'ahead';
}

/**
 * 줄바꿈을 그대로 살려 글을 보이고, 일부 조각을 칠해 강조한다.
 * code 모양은 검색 결과나 달라진 곳에 쓰고, reading 모양은 소리 내어 읽는 본문의 낱말 밝힘에 쓴다.
 */
@Component({
  selector: 'lw-marked-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './marked-text.component.html',
  styleUrl: './marked-text.component.scss',
  host: {
    '[class.lw-marked-text--compact]': 'compact()',
    '[attr.data-look]': 'look()',
    '[attr.data-align]': 'align()',
  },
})
export class LwMarkedTextComponent {
  readonly segments = input.required<readonly LwMarkedSegment[]>();
  /** 낮게 그린다(폼 안의 미리 보기). */
  readonly compact = input(false);
  readonly look = input<'code' | 'reading'>('code');
  readonly align = input<'start' | 'center'>('start');
}
