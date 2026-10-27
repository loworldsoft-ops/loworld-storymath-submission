import { DocNavNode } from '../../../patterns/collection/docs/docs.models';
import { ComponentMeta, PlatformSupportType } from '../../../services/models/os.types';
import { ALL_CATALOG } from '../../all-catalog';
import { getPlatformSupportType } from '../../all-components-platform-census';
import { CATALOG_FAMILIES } from './catalog-families';
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, CATEGORY_ORDER, CatalogCategory, CatalogDomain, CatalogLayer, DEFAULT_LAYER } from './catalog-labels';

export type CatalogSectionKey = 'overview' | 'components' | 'systems' | 'foundation' | 'stats';

export interface CatalogSection {
  readonly key: CatalogSectionKey;
  /** 구획 탭 라벨이자 목차 최상위 폴더 이름 */
  readonly label: string;
}

export const CATALOG_SECTIONS: readonly CatalogSection[] = [
  { key: 'overview', label: '개요' },
  { key: 'components', label: '컴포넌트' },
  { key: 'systems', label: '디자인 시스템' },
  { key: 'foundation', label: '기반' },
  { key: 'stats', label: '통계' },
];

export interface CatalogFilter {
  readonly layer: 'all' | CatalogLayer;
  readonly platform: 'all' | PlatformSupportType;
  readonly domain: 'all' | CatalogDomain;
}

export const NO_FILTER: CatalogFilter = { layer: 'all', platform: 'all', domain: 'all' };

export function matchesFilter(comp: ComponentMeta, filter: CatalogFilter): boolean {
  if (filter.layer !== 'all' && (comp.layer ?? DEFAULT_LAYER) !== filter.layer) return false;
  if (filter.domain !== 'all' && comp.domain !== filter.domain) return false;
  if (filter.platform !== 'all' && getPlatformSupportType(comp) !== filter.platform) return false;
  return true;
}

export const componentPath = (id: string): string => `/components/${id}`;
export const categoryPath = (category: CatalogCategory): string => `/components/category/${category}`;
export const familyPath = (id: string): string => `/systems/${id}`;

const page = (name: string, url: string, desc?: string): DocNavNode => ({ type: 'page', name, url, desc });

function componentNodes(filter: CatalogFilter): DocNavNode[] {
  const nodes: DocNavNode[] = [page('전체 컴포넌트', '/components')];
  for (const category of CATEGORY_ORDER) {
    const items = ALL_CATALOG.filter((c) => c.category === category && matchesFilter(c, filter)).sort((a, b) => a.name.localeCompare(b.name));
    if (items.length === 0) continue;
    nodes.push({
      type: 'folder',
      name: `${CATEGORY_LABELS[category]} (${items.length})`,
      index: { url: categoryPath(category), name: CATEGORY_LABELS[category], desc: CATEGORY_DESCRIPTIONS[category] },
      children: items.map((c) => page(c.name, componentPath(c.id), c.description)),
    });
  }
  return nodes;
}

const STATIC_NODES: Readonly<Record<Exclude<CatalogSectionKey, 'components'>, readonly DocNavNode[]>> = {
  overview: [page('소개', '/overview'), page('작업 이력', '/overview/history')],
  systems: [page('디자인 시스템 개요', '/systems'), ...CATALOG_FAMILIES.map((f) => page(`${f.title} (${f.metrics.totalCount.toLocaleString()})`, familyPath(f.id), f.desc))],
  foundation: [page('아키텍처 규칙', '/foundation'), page('코어 서비스', '/foundation/services'), page('색상 토큰', '/foundation/colors')],
  stats: [page('지표 요약', '/stats'), page('분류 × 계층 매트릭스', '/stats/matrix'), page('사용 랭킹', '/stats/ranking'), page('소자 채택 현황', '/stats/adoption')],
};

/** 목차 전체. 최상위는 구획 폴더이고, 컴포넌트 구획만 필터를 탄다. */
export function buildCatalogTree(filter: CatalogFilter = NO_FILTER): DocNavNode[] {
  return CATALOG_SECTIONS.map((section) => ({
    type: 'folder' as const,
    name: section.label,
    index: { url: `/${section.key}`, name: section.label },
    children: section.key === 'components' ? componentNodes(filter) : STATIC_NODES[section.key],
  }));
}
