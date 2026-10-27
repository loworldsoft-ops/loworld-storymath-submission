import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { DocTocItem } from '../docs.models';

/** 현재 문서의 소제목 목차. 스크롤 처리는 본문 뷰어가 맡고 여기서는 선택만 알린다. */
@Component({
  selector: 'lw-on-this-page-toc',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './lw-on-this-page-toc.component.html',
  styleUrl: './lw-on-this-page-toc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwOnThisPageTocComponent {
  readonly items = input<readonly DocTocItem[]>([]);
  readonly activeId = input<string>('');
  readonly title = input<string>('On this page');

  readonly anchorSelect = output<string>();
}
