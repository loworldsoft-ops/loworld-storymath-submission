import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input } from '@angular/core';

export type LwStackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 안의 것을 한 줄로(세로나 가로로) 늘어놓는다. 앱의 화면은 HTML 요소와 클래스를 쓰지 못하므로 배치는 이것으로 한다.
 * 간격과 정렬은 입력으로 고르고, 값은 토큰의 단계다. 임의의 수치를 받지 않는다.
 */
@Component({
  selector: 'lw-stack',
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-direction]': 'direction()',
    '[attr.data-gap]': 'gap()',
    '[attr.data-align]': 'align()',
    '[attr.data-justify]': 'justify()',
    '[attr.data-padding]': 'padding()',
    '[attr.data-wrap]': 'wrap() ? "" : null',
    '[attr.data-collapse]': 'collapse() === "none" ? null : collapse()',
    '[attr.data-fill]': 'fill() ? "" : null',
    '[attr.data-scroll]': 'scroll() ? "" : null',
    '[attr.data-surface]': 'surface()',
  },
})
export class LwStackComponent {
  readonly direction = input<'column' | 'row'>('column');
  readonly gap = input<LwStackGap>('md');
  readonly align = input<'stretch' | 'start' | 'center' | 'end' | 'baseline'>('stretch');
  readonly justify = input<'start' | 'center' | 'end' | 'between'>('start');
  readonly padding = input<LwStackGap>('none');
  /** 한 줄에 다 못 들어가면 줄을 바꾼다. */
  readonly wrap = input(false);
  /** 가로 줄일 때, 화면 폭이 이 단계(sm 640px, md 960px)보다 좁으면 세로로 쌓는다. 세로로 든 폰에서 두 칸이 짓눌리지 않게 한다. */
  readonly collapse = input<'none' | 'sm' | 'md'>('none');
  /** 부모의 남은 자리를 다 차지한다. */
  readonly fill = input(false);
  /** 넘치면 이 안에서 스크롤한다. */
  readonly scroll = input(false);
  /** 바탕. 없음, 화면 바탕, 한 단 올라온 면. */
  readonly surface = input<'none' | 'ground' | 'raised'>('none');
  /** 이 값이 바뀌면 스크롤을 맨 위로 올린다. 내용이 통째로 바뀌는 화면(다음 쪽, 다른 보기)에 준다. */
  readonly scrollKey = input<unknown>(undefined);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    effect(() => {
      this.scrollKey();
      host.scrollTo?.({ top: 0 });
    });
  }
}
