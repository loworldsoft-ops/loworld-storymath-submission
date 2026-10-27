import { Signal, computed, signal } from '@angular/core';
import { searchDocs } from './docs-search';
import { DocLinkTarget, DocNavNode, DocPager, DocPagerItem, DocSearchEntry, DocSearchResult } from './docs.models';

const DEFAULT_SEARCH_MIN_LENGTH = 2;

/** 현재 문서를 주소에 남기고 되읽는 방법. 라우터를 쓰는 쪽에서 구현해 넘긴다. */
export interface DocsUrlAdapter {
  read(): DocLinkTarget | null;
  write(target: DocLinkTarget): void;
}

export interface DocsNavigationConfig {
  readonly defaultPath: string;
  /** 목차 전체(최상위 구획 폴더들). 폴더 펼침과 이전/다음의 기준이다. */
  readonly tree: () => readonly DocNavNode[];
  readonly initialOpenIds?: readonly string[];
  /** 이전/다음 순서. 생략하면 목차 순서를 따른다. 시그널을 읽으면 그에 맞춰 다시 계산된다. */
  readonly pages?: () => readonly DocPagerItem[];
  readonly url?: DocsUrlAdapter;
  readonly searchMinLength?: number;
  /** 검색 창을 처음 열 때 한 번 불린다. */
  readonly loadSearchIndex: () => Promise<readonly DocSearchEntry[]>;
}

export interface DocsNavigation {
  readonly path: Signal<string>;
  /** 이동을 요청한 제목 id */
  readonly anchor: Signal<string>;
  /** 스크롤 위치 기준 현재 제목 id */
  readonly activeAnchor: Signal<string>;
  readonly openFolderIds: Signal<ReadonlySet<string>>;
  readonly pager: Signal<DocPager>;
  readonly searchOpen: Signal<boolean>;
  readonly searchQuery: Signal<string>;
  readonly searchLoading: Signal<boolean>;
  readonly searchResults: Signal<readonly DocSearchResult[]>;
  readonly searchMinLength: number;
  /** 문서를 연다. 다른 문서로 바뀌었으면 true. */
  open(path: string, anchor?: string, syncUrl?: boolean): boolean;
  goToAnchor(anchor: string): void;
  setActiveAnchor(anchor: string): void;
  toggleFolder(id: string): void;
  openSearch(): void;
  closeSearch(): void;
  toggleSearch(): void;
  setSearchQuery(query: string): void;
  /** 검색 결과를 고르면 검색을 닫고 이동할 곳을 돌려준다. */
  pickSearchResult(result: DocSearchResult): DocLinkTarget;
}

/** 목차 순서대로 펼친 문서 목록. `allow`가 false를 돌려주는 문서는 뺀다. */
export function flattenDocPages(nodes: readonly DocNavNode[], allow: (url: string) => boolean = () => true, out: DocPagerItem[] = []): DocPagerItem[] {
  for (const node of nodes) {
    if (node.type === 'page') {
      if (node.url && allow(node.url)) out.push({ path: node.url, label: node.name });
      continue;
    }
    if (node.index && allow(node.index.url)) out.push({ path: node.index.url, label: node.index.name || node.name });
    flattenDocPages(node.children ?? [], allow, out);
  }
  return out;
}

/** 대상 문서까지 가는 폴더 id들. id 규칙은 `lw-docs-nav-tree`와 같다(상위 이름을 `/`로 이음). */
export function docAncestorFolderIds(nodes: readonly DocNavNode[], path: string): string[] {
  const walk = (list: readonly DocNavNode[], chain: string[]): string[] | null => {
    for (const node of list) {
      if (node.type === 'page') {
        if (node.url === path) return chain;
        continue;
      }
      const next = [...chain, chain.length ? `${chain[chain.length - 1]}/${node.name}` : node.name];
      if (node.index?.url === path) return next;
      const found = walk(node.children ?? [], next);
      if (found) return found;
    }
    return null;
  };
  return walk(nodes, []) ?? [];
}

/**
 * 문서 뷰어의 탐색 상태: 현재 문서와 제목 위치, 폴더 펼침, 이전/다음, 검색.
 * 주입 컨텍스트가 필요 없으므로 스토어 필드 초기화에서 바로 만들어 쓴다.
 */
export function createDocsNavigation(config: DocsNavigationConfig): DocsNavigation {
  const minLength = config.searchMinLength ?? DEFAULT_SEARCH_MIN_LENGTH;
  const path = signal<string>(config.defaultPath);
  const anchor = signal<string>('');
  const activeAnchor = signal<string>('');
  const openFolderIds = signal<ReadonlySet<string>>(new Set(config.initialOpenIds ?? []));
  const searchOpen = signal<boolean>(false);
  const searchQuery = signal<string>('');
  const searchIndex = signal<readonly DocSearchEntry[] | null>(null);
  let searchRequested = false;

  const writeUrl = (): void => config.url?.write({ path: path(), anchor: anchor() || undefined });

  const pager = computed<DocPager>(() => {
    const current = path();
    const pages = config.pages ? config.pages() : flattenDocPages(config.tree());
    const index = pages.findIndex((p) => p.path === current);
    return index < 0 ? {} : { prev: pages[index - 1], next: pages[index + 1] };
  });

  const closeSearch = (): void => {
    searchOpen.set(false);
    searchQuery.set('');
  };

  const openSearch = (): void => {
    searchOpen.set(true);
    if (searchRequested) return;
    searchRequested = true;
    config.loadSearchIndex().then(
      (entries) => searchIndex.set(entries),
      () => searchIndex.set([]),
    );
  };

  return {
    path: path.asReadonly(),
    anchor: anchor.asReadonly(),
    activeAnchor: activeAnchor.asReadonly(),
    openFolderIds: openFolderIds.asReadonly(),
    pager,
    searchOpen: searchOpen.asReadonly(),
    searchQuery: searchQuery.asReadonly(),
    searchLoading: computed(() => searchOpen() && searchIndex() === null),
    searchResults: computed(() => {
      const query = searchQuery().trim();
      const index = searchIndex();
      return index && query.length >= minLength ? searchDocs(index, query) : [];
    }),
    searchMinLength: minLength,

    open(target: string, targetAnchor = '', syncUrl = true): boolean {
      const next = target.startsWith('/') ? target : `/${target}`;
      const changed = next !== path();
      path.set(next);
      anchor.set(targetAnchor);
      activeAnchor.set(targetAnchor);
      openFolderIds.update((ids) => new Set([...ids, ...docAncestorFolderIds(config.tree(), next)]));
      if (syncUrl) writeUrl();
      return changed;
    },

    goToAnchor(id: string): void {
      anchor.set(id);
      activeAnchor.set(id);
      writeUrl();
    },

    setActiveAnchor(id: string): void {
      activeAnchor.set(id);
    },

    toggleFolder(id: string): void {
      openFolderIds.update((ids) => {
        const next = new Set(ids);
        if (!next.delete(id)) next.add(id);
        return next;
      });
    },

    openSearch,
    closeSearch,

    toggleSearch(): void {
      if (searchOpen()) closeSearch();
      else openSearch();
    },

    setSearchQuery(query: string): void {
      searchQuery.set(query);
    },

    pickSearchResult(result: DocSearchResult): DocLinkTarget {
      closeSearch();
      return { path: result.path, anchor: result.anchor };
    },
  };
}
