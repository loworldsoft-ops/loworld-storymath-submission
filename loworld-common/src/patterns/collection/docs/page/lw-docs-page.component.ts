import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output, viewChild } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwDocsArticleViewerComponent } from '../article-viewer/lw-docs-article-viewer.component';
import { DocArticle, DocLinkTarget, DocPager } from '../docs.models';

/**
 * 문서 한 편: 제목, 도구(복사·이전·다음), 위젯 슬롯, 본문, 하단 이전/다음.
 *
 * 본문은 `[innerHTML]`로 들어와 컴포넌트 캡슐화가 닿지 않으므로 캡슐화를 끈다.
 * 스타일시트의 모든 규칙은 호스트 클래스 `.lw-docs-page` 아래로 한정되어 있다.
 * `basicProse`를 켜면 제목·표·코드의 기본 타이포그래피를 입힌다. 본문 전용 CSS를 따로 가진 쪽은 끈 채로 쓴다.
 */
@Component({
  selector: 'lw-docs-page',
  standalone: true,
  imports: [LwButtonComponent, LwIconComponent, LwDocsArticleViewerComponent],
  templateUrl: './lw-docs-page.component.html',
  styleUrl: './lw-docs-page.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'lw-docs-page', '[class.lw-docs-page--prose]': 'basicProse()' },
})
export class LwDocsPageComponent {
  private readonly viewer = viewChild.required(LwDocsArticleViewerComponent);

  readonly article = input.required<DocArticle>();
  readonly pager = input<DocPager>({});
  readonly anchor = input<string>('');
  readonly dark = input<boolean>(false);
  readonly assetBase = input<string>('');
  readonly basicProse = input<boolean>(false);

  readonly navigate = output<DocLinkTarget>();
  readonly anchorSelect = output<string>();
  readonly activeAnchorChange = output<string>();
  readonly copyPage = output<string>();
  readonly codeCopied = output<boolean>();

  protected onCopyPage(): void {
    const article = this.article();
    // 화면에 보이는 본문만 복사한다(숨은 탭 패널 제외).
    this.copyPage.emit(`# ${article.title}\n\n${article.desc ? article.desc + '\n\n' : ''}${this.viewer().visibleText()}`);
  }
}
