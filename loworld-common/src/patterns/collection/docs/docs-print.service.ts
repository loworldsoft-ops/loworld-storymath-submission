import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { DocArticle } from './docs.models';

export interface LwDocsPrintJob {
  /** 인쇄 창의 문서 제목(= 저장 파일 이름) */
  readonly fileName: string;
  readonly parts: readonly { readonly heading: string; readonly articles: readonly DocArticle[] }[];
}

const PRINT_ROOT_ID = 'lw-docs-print';
const PRINTING_CLASS = 'lw-docs-printing';

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch] ?? ch);

/**
 * 문서를 인쇄 전용 영역에 모아 브라우저 인쇄(PDF로 저장)를 띄운다.
 * 인쇄 중에는 `html.lw-docs-printing`이 붙고, 가이드 본문 CSS가 나머지 화면을 숨긴다.
 */
@Injectable()
export class LwDocsPrintService {
  private readonly doc = inject(DOCUMENT);

  print(jobs: readonly LwDocsPrintJob[]): void {
    const view = this.doc.defaultView;
    if (!view) return;
    const root = this.doc.createElement('div');
    root.id = PRINT_ROOT_ID;
    this.doc.body.appendChild(root);
    const previousTitle = this.doc.title;
    this.doc.documentElement.classList.add(PRINTING_CLASS);
    try {
      for (const job of jobs) {
        // 본문은 저장소에 포함된 정적 문서다(뷰어와 같은 신뢰 전제).
        root.innerHTML = job.parts.map((part) => this.partHtml(part.heading, part.articles)).join('');
        this.doc.title = job.fileName;
        view.print(); // 대부분의 브라우저에서 대화상자가 닫힐 때까지 멈춘다.
      }
    } finally {
      this.doc.title = previousTitle;
      this.doc.documentElement.classList.remove(PRINTING_CLASS);
      root.remove();
    }
  }

  private partHtml(heading: string, articles: readonly DocArticle[]): string {
    const cover = `<section class="lw-docs-print__page lw-docs-print__cover"><h1>${escapeHtml(heading)}</h1><p>문서 ${articles.length}개</p></section>`;
    const pages = articles
      .map(
        (a) =>
          `<section class="lw-docs-print__page"><h1>${escapeHtml(a.title)}</h1>${a.desc ? `<p class="lw-docs-print__desc">${escapeHtml(a.desc)}</p>` : ''}<div class="lw-docs-prose">${a.html}</div></section>`,
      )
      .join('');
    return cover + pages;
  }
}
