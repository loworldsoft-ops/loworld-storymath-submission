import { LwAppFrameComponent } from '../../../frame/app-frame/app-frame.component';
import { DEFAULT_WORKSPACE_DESKTOP_LAYOUT, type WorkspaceDesktopLayout } from '../../../../services/models/workspace-layout.model';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, TemplateRef, afterRenderEffect, computed, contentChild, inject, input, output, signal, viewChild } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwSidePanelComponent } from '../../../../ui/overlay/side-panel/side-panel.component';
import { LwTabItem, LwTabsComponent } from '../../../../ui/navigation/tabs/tabs.component';
import { DocNavNode, DocTocItem } from '../docs.models';
import { LwDocsNavTreeComponent } from '../nav-tree/lw-docs-nav-tree.component';
import { LwOnThisPageTocComponent } from '../toc/lw-on-this-page-toc.component';

/** 마지막으로 열었거나 만진 셸. 여러 창에 셸이 떠 있을 때 검색 단축키를 한 곳만 받게 한다. */
let activeShell: LwDocsShellComponent | null = null;

/**
 * 문서 뷰어 화면 틀: 상단 바와 구획 탭, 왼쪽 목차, 본문, 오른쪽 "이 페이지 목차".
 * 창 너비에 따라 3단 → 2단 → 1단으로 줄고, 1단에서는 목차를 서랍으로 연다.
 *
 * 투영: 기본 슬롯 = 본문, `[shellActions]` = 상단 바 오른쪽 버튼,
 * `<ng-template #shellFilters>` = 목차 위 필터(사이드바와 서랍 두 곳에 그려진다).
 */
@Component({
  selector: 'lw-docs-shell',
  standalone: true,
  imports: [LwAppFrameComponent, NgTemplateOutlet, LwButtonComponent, LwIconComponent, LwSidePanelComponent, LwTabsComponent, LwDocsNavTreeComponent, LwOnThisPageTocComponent],
  templateUrl: './lw-docs-shell.component.html',
  styleUrl: './lw-docs-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'markActive()',
    '(focusin)': 'markActive()',
    '(document:keydown.meta.k)': 'onSearchShortcut($event)',
    '(document:keydown.control.k)': 'onSearchShortcut($event)',
  },
})
export class LwDocsShellComponent {
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  /** 문서의 헤더, 목차, 본문, 이 페이지의 차례를 앱의 틀(lw-app-frame)의 자리에 놓는다. */
  protected readonly frameLayout: WorkspaceDesktopLayout = {
    ...DEFAULT_WORKSPACE_DESKTOP_LAYOUT,
    collectionOpen: false,
    slotWidths: { sidebar: 260, detail: 1 },
    visibleSlots: ['topbar', 'sidebar', 'detail', 'aside'],
  };
  protected readonly filters = contentChild<TemplateRef<unknown>>('shellFilters');

  readonly brand = input.required<string>();
  readonly brandIcon = input<string>('notebook');
  readonly sections = input<readonly LwTabItem[]>([]);
  readonly section = input<string>('');
  readonly tree = input<readonly DocNavNode[]>([]);
  readonly activePath = input<string>('');
  /** 이동을 요청한 제목. 비어 있으면 문서를 바꿀 때 본문을 맨 위로 올린다. */
  readonly anchor = input<string>('');
  readonly openIds = input<ReadonlySet<string>>(new Set<string>());
  /** 목차 최상위 폴더 id의 접두사(현재 구획 폴더 이름) */
  readonly treeChain = input<string>('');
  readonly toc = input<readonly DocTocItem[]>([]);
  readonly activeAnchor = input<string>('');
  /** 본문 최대 너비를 풀어 표·그리드를 넓게 쓴다. */
  readonly wide = input<boolean>(false);
  readonly dark = input<boolean>(false);

  readonly sectionChange = output<string>();
  readonly selectDoc = output<string>();
  readonly toggleFolder = output<string>();
  readonly anchorSelect = output<string>();
  readonly searchRequest = output<void>();
  readonly themeToggle = output<void>();
  readonly home = output<void>();

  protected readonly drawerOpen = signal<boolean>(false);
  protected readonly themeLabel = computed(() => (this.dark() ? '라이트 모드로 전환' : '다크 모드로 전환'));

  constructor() {
    activeShell = this;
    inject(DestroyRef).onDestroy(() => {
      if (activeShell === this) activeShell = null;
    });

    // 다른 문서로 옮기면 본문을 맨 위로. 제목 위치가 지정된 이동은 본문 뷰어가 그 제목으로 스크롤한다.
    afterRenderEffect(() => {
      this.activePath();
      if (!this.anchor()) this.scroller().nativeElement.scrollTop = 0;
    });
  }

  protected markActive(): void {
    activeShell = this;
  }

  protected onSearchShortcut(event: Event): void {
    if (activeShell !== this) return;
    event.preventDefault();
    this.searchRequest.emit();
  }

  protected onSelectDoc(path: string): void {
    this.drawerOpen.set(false);
    this.selectDoc.emit(path);
  }
}
