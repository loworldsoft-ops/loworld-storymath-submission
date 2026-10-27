import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterRenderEffect, computed, inject, input, output, viewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocLinkTarget } from '../docs.models';

/** 화면 위쪽 이 비율 안에 들어온 제목을 "현재 위치"로 본다. */
const SPY_ROOT_MARGIN = '0px 0px -70% 0px';

/**
 * 문서 본문 뷰어. 본문 HTML 안의 링크, 앵커, 탭, 코드 복사, 내려받기를 처리하고
 * 스크롤 위치에 맞는 제목을 알려 준다.
 *
 * 본문 스타일은 이 컴포넌트가 갖지 않는다. 사용하는 쪽이 `.lw-docs-prose` 범위의 CSS를 제공한다.
 */
@Component({
  selector: 'lw-docs-article-viewer',
  standalone: true,
  templateUrl: './lw-docs-article-viewer.component.html',
  styleUrl: './lw-docs-article-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDocsArticleViewerComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly doc = inject(DOCUMENT);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  /**
   * 본문 HTML. 그대로 DOM에 넣으므로 **신뢰할 수 있는 출처**(저장소에 포함된 문서)만 넘겨야 한다.
   * 외부 입력이 섞이면 넘기기 전에 정화해야 한다.
   */
  readonly html = input<string>('');
  /** 스크롤해 보여 줄 제목 id */
  readonly anchor = input<string>('');
  readonly dark = input<boolean>(false);
  /** `static/...` 같은 상대 경로 내려받기 링크 앞에 붙일 경로 */
  readonly assetBase = input<string>('');

  readonly navigate = output<DocLinkTarget>();
  readonly anchorSelect = output<string>();
  readonly activeAnchorChange = output<string>();
  readonly codeCopied = output<boolean>();

  readonly safeHtml = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.html()));

  private observer: IntersectionObserver | null = null;

  constructor() {
    // 본문이 바뀔 때마다 내려받기 경로를 고치고 제목 추적을 다시 건다.
    afterRenderEffect(() => {
      this.html();
      const root = this.content().nativeElement;
      this.fixAssetLinks(root);
      this.watchHeadings(root);
    });

    afterRenderEffect(() => {
      this.html();
      const anchor = this.anchor();
      if (anchor) this.scrollToAnchor(anchor, false);
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  scrollToAnchor(id: string, smooth = true): void {
    const target = this.content().nativeElement.querySelector(`[id="${CSS.escape(id)}"]`);
    target?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }

  /** 보이는 본문 텍스트(숨은 탭 패널 제외) */
  visibleText(): string {
    return this.content().nativeElement.innerText;
  }

  onClick(event: MouseEvent): void {
    const target = event.target as Element;

    const tab = target.closest('[role="tab"]');
    if (tab) {
      this.activateTab(tab);
      return;
    }

    const copyButton = target.closest('figure button[aria-label="Copy Text"]');
    if (copyButton) {
      this.copyCode(copyButton);
      return;
    }

    const link = target.closest('a[href]');
    const href = link?.getAttribute('href') ?? '';
    if (!href.startsWith('#')) return; // 외부 링크, mailto, 내려받기는 브라우저에 맡긴다.

    event.preventDefault();
    if (href.startsWith('#/')) {
      // "#/경로#제목" → 다른 문서
      const [path, anchor] = decodeURIComponent(href.slice(1)).split('#');
      this.navigate.emit({ path, anchor: anchor || undefined });
    } else {
      const id = decodeURIComponent(href.slice(1));
      this.scrollToAnchor(id);
      this.anchorSelect.emit(id);
    }
  }

  private activateTab(tab: Element): void {
    const list = tab.closest('[role="tablist"]');
    if (!list) return;
    for (const item of Array.from(list.querySelectorAll('[role="tab"]'))) {
      const on = item === tab;
      item.setAttribute('data-state', on ? 'active' : 'inactive');
      item.setAttribute('aria-selected', String(on));
      const panelId = item.getAttribute('aria-controls');
      const panel = panelId ? this.doc.getElementById(panelId) : null;
      if (panel) {
        panel.setAttribute('data-state', on ? 'active' : 'inactive');
        panel.toggleAttribute('hidden', !on);
      }
    }
  }

  private copyCode(button: Element): void {
    const code = button.closest('figure')?.querySelector('pre')?.innerText ?? '';
    const clipboard = this.doc.defaultView?.navigator.clipboard;
    if (!clipboard || !code) {
      this.codeCopied.emit(false);
      return;
    }
    clipboard.writeText(code).then(
      () => this.codeCopied.emit(true),
      () => this.codeCopied.emit(false),
    );
  }

  private fixAssetLinks(root: HTMLElement): void {
    const base = this.assetBase();
    if (!base) return;
    for (const link of Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="static/"]'))) {
      const name = link.getAttribute('href') ?? '';
      link.setAttribute('href', `${base.replace(/\/$/, '')}/${name}`);
      link.setAttribute('download', name.split('/').pop() ?? '');
    }
  }

  private watchHeadings(root: HTMLElement): void {
    this.observer?.disconnect();
    const headings = Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
    const View = this.doc.defaultView;
    if (headings.length === 0 || !View || !('IntersectionObserver' in View)) return;

    const visible = new Set<string>();
    this.observer = new View.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // 문서 순서상 가장 위에 보이는 제목을 현재 위치로 삼는다.
        const current = headings.find((h) => visible.has(h.id));
        if (current) this.activeAnchorChange.emit(current.id);
      },
      { rootMargin: SPY_ROOT_MARGIN },
    );
    headings.forEach((h) => this.observer?.observe(h));
  }
}
