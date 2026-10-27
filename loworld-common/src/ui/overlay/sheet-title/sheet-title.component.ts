import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * 시트나 창의 머리에 놓는 제목 한 줄이다. 굵은 이름 옆에 작은 꼬리표를 몇 개 붙인다.
 * 꼬리표가 글자가 아니라 부품(역할 배지 등)이면 안에 넣는다(ng-content).
 */
@Component({
  selector: 'lw-sheet-title',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sheet-title.component.html',
  styleUrl: './sheet-title.component.scss',
})
export class LwSheetTitleComponent {
  readonly title = input.required<string>();
  /** 이름 옆의 작은 꼬리표. 빈 글자는 그리지 않는다. */
  readonly details = input<readonly (string | null | undefined)[]>([]);
}
