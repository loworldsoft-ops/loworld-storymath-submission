import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * 글자다. 크기와 굵기는 종류(variant)가 정하고 색은 어조(tone)가 정한다.
 * 앱의 화면은 h1, p, span을 쓰지 못하므로 글자는 모두 이것으로 쓴다. 그래서 모든 앱의 제목과 본문이 같은 모양이다.
 */
@Component({
  selector: 'lw-text',
  templateUrl: './text.component.html',
  styleUrl: './text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-truncate]': 'truncate() ? "" : null',
    '[attr.role]': 'variant() === "title" || variant() === "heading" ? "heading" : null',
    '[attr.aria-level]': 'variant() === "title" ? 1 : variant() === "heading" ? 2 : null',
  },
})
export class LwTextComponent {
  readonly variant = input<'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption' | 'code' | 'display' | 'reading'>('body');
  readonly tone = input<'default' | 'muted' | 'accent' | 'danger' | 'success' | 'warning' | 'info'>('default');
  /** 한 줄로 자르고 넘치는 부분을 말줄임표로 보인다. */
  readonly truncate = input(false);
}
