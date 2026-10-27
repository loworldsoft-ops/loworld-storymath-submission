import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { DocNavNode } from '../docs.models';

/** 문서 목차 트리. 폴더는 자기 자신을 다시 그려 깊이 제한 없이 펼친다. */
@Component({
  selector: 'lw-docs-nav-tree',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './lw-docs-nav-tree.component.html',
  styleUrl: './lw-docs-nav-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-level]': 'level()' },
})
export class LwDocsNavTreeComponent {
  readonly nodes = input<readonly DocNavNode[]>([]);
  readonly activePath = input<string>('');
  readonly openIds = input<ReadonlySet<string>>(new Set<string>());
  readonly level = input<number>(1);
  /** 상위 폴더 이름을 이은 경로. 폴더 id의 접두사로 쓴다. */
  readonly chain = input<string>('');

  readonly selectDoc = output<string>();
  readonly toggleFolder = output<string>();

  folderId(node: DocNavNode): string {
    return this.chain() ? `${this.chain()}/${node.name}` : node.name;
  }
}
