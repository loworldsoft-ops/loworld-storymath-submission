import { ALL_CATALOG } from '../../all-catalog';
import { findCatalogFamily } from './catalog-families';

/** 예전 포털 탭 이름 → 문서 경로 */
const SECTION_PATHS: Readonly<Record<string, string>> = {
  landing: '/overview',
  components: '/components',
  'components-hub': '/components',
  gallery: '/components',
  systems: '/systems',
  'architecture-hub': '/foundation',
  guides: '/foundation',
  services: '/foundation/services',
  colors: '/foundation/colors',
  history: '/overview/history',
  matrix: '/stats/matrix',
  ranking: '/stats/ranking',
};

/** 상세 id가 컴포넌트를 가리키는 구획 */
const COMPONENT_SECTIONS = new Set(['audit', 'inspect', 'component']);

/**
 * 예전 주소(`/all-components/:section/:detailId`)를 문서 경로로 바꾼다.
 * 알 수 없는 값이면 null을 돌려준다.
 */
export function legacyRouteToPath(section: string | null | undefined, detailId: string | null | undefined): string | null {
  if (!section) return null;
  if (section === 'category' && detailId) return `/components/category/${detailId}`;
  if (COMPONENT_SECTIONS.has(section)) {
    const comp = detailId ? ALL_CATALOG.find((c) => c.id === detailId || c.selector === detailId) : undefined;
    return comp ? `/components/${comp.id}` : '/components';
  }
  if (findCatalogFamily(section)) return `/systems/${section}`;
  return SECTION_PATHS[section] ?? null;
}
