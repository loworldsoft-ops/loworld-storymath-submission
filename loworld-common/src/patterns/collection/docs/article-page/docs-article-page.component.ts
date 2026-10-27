import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { DocArticle, DocLinkTarget, DocPager } from '../docs.models';
import { LwDocsPageComponent } from '../page/lw-docs-page.component';

/**
 * 가이드 문서 한 편. 화면은 공용 `lw-docs-page`가 그리고, 여기서는 가이드 본문 전용 CSS를 싣는다.
 *
 * 본문은 `[innerHTML]`로 들어와 컴포넌트 캡슐화가 닿지 않으므로 이 컴포넌트는 캡슐화를 끈다.
 * 스타일시트의 모든 규칙은 `.guide-article`, `.lw-docs-prose`, 인쇄 전용 영역으로 범위가 한정되어 있다.
 */
@Component({
  selector: 'lw-docs-article-page',
  standalone: true,
  imports: [LwDocsPageComponent],
  templateUrl: './docs-article-page.component.html',
  styleUrl: './docs-article-page.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'guide-article' },
})
export class LwDocsArticlePageComponent {
  readonly article = input.required<DocArticle>();
  readonly pager = input<DocPager>({});
  readonly anchor = input<string>('');
  readonly dark = input<boolean>(false);
  readonly assetBase = input<string>('');

  readonly navigate = output<DocLinkTarget>();
  readonly anchorSelect = output<string>();
  readonly activeAnchorChange = output<string>();
  readonly copyPage = output<string>();
  readonly codeCopied = output<boolean>();
}
