import { Injectable, Type, computed, signal } from '@angular/core';
import { DocArticle, DocNavNode, DocSearchEntry, DocSearchResult } from '../../patterns/collection/docs/docs.models';
import { createDocsNavigation } from '../../patterns/collection/docs/docs-navigation';
import { ComponentMeta, PlatformSupportType } from '../../services/models/os.types';
import { injectDocsUrlAdapter } from '../../patterns/collection/docs/docs-url.adapter';
import { ALL_CATALOG } from '../all-catalog';
import { buildCatalogArticle } from './data/catalog-article.builder';
import { CATALOG_FAMILIES } from './data/catalog-families';
import { textOf } from './data/catalog-html';
import { CatalogCategory, CatalogDomain, CatalogLayer } from './data/catalog-labels';
import { CATALOG_SECTIONS, CatalogFilter, CatalogSectionKey, NO_FILTER, buildCatalogTree, componentPath, familyPath, matchesFilter } from './data/catalog-nav.builder';
import { findCatalogPageKind } from './data/catalog-page-kinds';

const DEFAULT_PATH = '/overview';

/** 필터와 무관한 전체 목차. 폴더 펼침과 이전/다음의 기준으로 쓴다. */
const FULL_TREE: readonly DocNavNode[] = buildCatalogTree();

/** 컴포넌트 도감 상태. 셸 컴포넌트에 제공되어 창마다 따로 생긴다. */
@Injectable()
export class CatalogDocsStore {
  private readonly url = injectDocsUrlAdapter({ doc: 'cdoc', anchor: 'ch', defaultPath: DEFAULT_PATH });

  private readonly _filter = signal<CatalogFilter>(NO_FILTER);

  private readonly nav = createDocsNavigation({
    defaultPath: DEFAULT_PATH,
    tree: () => FULL_TREE,
    initialOpenIds: CATALOG_SECTIONS.map((s) => s.label),
    url: this.url,
    loadSearchIndex: () => Promise.resolve(buildSearchIndex()),
  });

  /** 주소에 문서 경로가 있어 그 문서로 시작했는지 */
  readonly startedFromUrl: boolean;

  readonly path = this.nav.path;
  readonly anchor = this.nav.anchor;
  readonly activeAnchor = this.nav.activeAnchor;
  readonly openFolderIds = this.nav.openFolderIds;
  readonly pager = this.nav.pager;
  readonly searchOpen = this.nav.searchOpen;
  readonly searchQuery = this.nav.searchQuery;
  readonly searchLoading = this.nav.searchLoading;
  readonly searchResults = this.nav.searchResults;
  readonly searchMinLength = this.nav.searchMinLength;
  readonly filter = this._filter.asReadonly();

  readonly section = computed<CatalogSectionKey>(() => {
    const key = this.path().split('/')[1];
    return CATALOG_SECTIONS.find((s) => s.key === key)?.key ?? 'overview';
  });

  readonly sectionFolder = computed(() => CATALOG_SECTIONS.find((s) => s.key === this.section())?.label ?? '');

  readonly visibleTree = computed<readonly DocNavNode[]>(() => {
    const tree = this.section() === 'components' ? buildCatalogTree(this._filter()) : FULL_TREE;
    return tree.find((n) => n.name === this.sectionFolder())?.children ?? [];
  });

  readonly article = computed<DocArticle | null>(() => buildCatalogArticle(this.path()));

  private readonly pageKind = computed(() => findCatalogPageKind(this.path()));
  /** 본문 위에 얹는 위젯 */
  readonly widget = computed<Type<unknown> | null>(() => this.pageKind()?.widget ?? null);
  /** 본문 최대 너비를 풀지 */
  readonly wide = computed<boolean>(() => this.pageKind()?.wide ?? false);

  /** 지금 보는 문서가 컴포넌트 문서이면 그 컴포넌트 */
  readonly activeComponent = computed<ComponentMeta | null>(() => {
    const [, root, id] = this.path().split('/');
    return root === 'components' && id && id !== 'category' ? (ALL_CATALOG.find((c) => c.id === id) ?? null) : null;
  });

  /** 지금 보는 문서가 분류 색인이면 그 분류 */
  readonly activeCategory = computed<CatalogCategory | null>(() => {
    const [, root, second, third] = this.path().split('/');
    return root === 'components' && second === 'category' && third ? (third as CatalogCategory) : null;
  });

  /** 지금 보는 문서가 디자인 시스템 패밀리이면 그 id */
  readonly activeFamilyId = computed<string | null>(() => {
    const [, root, id] = this.path().split('/');
    return root === 'systems' && id ? id : null;
  });

  /** 색인 문서에 보여 줄 컴포넌트: 필터와 (있다면) 분류를 적용한다. */
  readonly indexedComponents = computed<readonly ComponentMeta[]>(() => {
    const filter = this._filter();
    const category = this.activeCategory();
    return ALL_CATALOG.filter((c) => (!category || c.category === category) && matchesFilter(c, filter));
  });

  constructor() {
    const start = this.url.read();
    this.startedFromUrl = start !== null;
    this.nav.open(start?.path ?? DEFAULT_PATH, start?.anchor ?? '', false);
  }

  // ── 이동 ──
  open(path: string, anchor = ''): void {
    this.nav.open(path, anchor);
  }

  openSection(key: CatalogSectionKey): void {
    this.open(`/${key}`);
  }

  goToAnchor(anchor: string): void {
    this.nav.goToAnchor(anchor);
  }

  setActiveAnchor(anchor: string): void {
    this.nav.setActiveAnchor(anchor);
  }

  toggleFolder(id: string): void {
    this.nav.toggleFolder(id);
  }

  // ── 필터 ──
  setLayer(layer: 'all' | CatalogLayer): void {
    this._filter.update((f) => ({ ...f, layer }));
  }

  setPlatform(platform: 'all' | PlatformSupportType): void {
    this._filter.update((f) => ({ ...f, platform }));
  }

  setDomain(domain: 'all' | CatalogDomain): void {
    this._filter.update((f) => ({ ...f, domain }));
  }

  // ── 검색 ──
  toggleSearch(): void {
    this.nav.toggleSearch();
  }

  closeSearch(): void {
    this.nav.closeSearch();
  }

  setSearchQuery(query: string): void {
    this.nav.setSearchQuery(query);
  }

  pickSearchResult(result: DocSearchResult): void {
    const target = this.nav.pickSearchResult(result);
    this.open(target.path, target.anchor ?? '');
  }
}

function entryOf(path: string, extraText = ''): DocSearchEntry | null {
  const article = buildCatalogArticle(path);
  if (!article) return null;
  return {
    path,
    title: article.title,
    desc: article.desc ?? '',
    heads: article.toc.map((t) => [t.id, t.text] as const),
    text: `${extraText} ${textOf(article.html)}`,
  };
}

/** 검색 창을 처음 열 때 한 번 만든다: 고정 문서, 디자인 시스템 패밀리, 컴포넌트 문서. */
function buildSearchIndex(): DocSearchEntry[] {
  const fixed = FULL_TREE.flatMap((section) => (section.children ?? []).filter((n) => n.type === 'page').map((n) => n.url ?? ''));
  const paths = new Set([...fixed, ...CATALOG_FAMILIES.map((f) => familyPath(f.id))]);
  const entries = [...paths].map((p) => entryOf(p));
  const components = ALL_CATALOG.map((c) => entryOf(componentPath(c.id), `${c.selector} ${c.englishName ?? ''}`));
  return [...entries, ...components].filter((e): e is DocSearchEntry => e !== null);
}
