import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** 나무의 마디. 자식이 있으면 그 아래에 들여 그린다. */
export interface LwTreeNode {
  readonly id: string;
  readonly label: string;
  /** 이름 앞에 보일 글자(그림 글자). */
  readonly icon?: string;
  /** 이름 뒤에 보일 수나 짧은 글. */
  readonly badge?: string | number;
  readonly children?: readonly LwTreeNode[];
}

/**
 * 나무다. 조직, 폴더, 목차처럼 계층이 있는 것을 고르는 데 쓴다. 모든 앱의 나무가 이것 하나다.
 */
@Component({
  selector: 'lw-tree',
  imports: [NgTemplateOutlet],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwTreeComponent {
  readonly nodes = input.required<readonly LwTreeNode[]>();
  readonly selectedId = input<string | null>(null);
  readonly ariaLabel = input('목록');
  readonly nodeSelect = output<string>();
}
