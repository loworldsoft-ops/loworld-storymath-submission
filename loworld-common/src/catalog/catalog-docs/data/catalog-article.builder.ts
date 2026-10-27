import { DocArticle, DocTocItem } from '../../../patterns/collection/docs/docs.models';
import { APP_LABELS, AppId, ComponentMeta } from '../../../services/models/os.types';
import { ALL_CATALOG } from '../../all-catalog';
import { CATEGORY_INTERSECTION_MATRIX, CENSUS_SUMMARY_STATS } from '../../all-components-census-data';
import { getPlatformSupportType, resolvePlatformSpec } from '../../all-components-platform-census';
import { ARCHITECTURE_GUIDES_CATALOG } from '../../architecture-guides-catalog';
import { COLOR_TOKENS_CATALOG } from '../../color-tokens-catalog';
import { CORE_SERVICES_CATALOG } from '../../core-services-catalog';
import { resolveDesignSystemPrimitives } from '../../query/all-components-query.service';
import { WORK_HISTORY_CATALOG } from '../../work-history-catalog';
import { CATALOG_FAMILIES, CatalogFamilySpec, findCatalogFamily } from './catalog-families';
import { autoTable, code, codeBlock, docLink, esc, keyValueTable, list, table } from './catalog-html';
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS, CATEGORY_ORDER, CatalogCategory, CatalogLayer, DEFAULT_LAYER, DOMAIN_LABELS, LAYER_LABELS, PLATFORM_LABELS } from './catalog-labels';
import { CATALOG_SECTIONS, categoryPath, componentPath, familyPath } from './catalog-nav.builder';

interface Section {
  readonly id: string;
  readonly title: string;
  readonly html: string;
  readonly depth?: 2 | 3;
}

/** 섹션 목록을 본문 HTML과 "이 페이지 목차"로 만든다. 빈 섹션은 뺀다. */
function article(path: string, title: string, desc: string, sections: readonly (Section | null)[]): DocArticle {
  const used = sections.filter((s): s is Section => s !== null && s.html !== '');
  const toc: DocTocItem[] = used.map((s) => ({ id: s.id, depth: s.depth ?? 2, text: s.title }));
  const html = used.map((s) => `<h${s.depth ?? 2} id="${s.id}">${esc(s.title)}</h${s.depth ?? 2}>${s.html}`).join('');
  return { path, title, desc, toc, html };
}

const para = (text: string): string => `<p>${text}</p>`;
const layerOf = (comp: ComponentMeta): CatalogLayer => comp.layer ?? DEFAULT_LAYER;
const usageCount = (comp: ComponentMeta): number => comp.usedIn?.length ?? 0;
const appCoverage = (comp: ComponentMeta): number => new Set((comp.usedIn ?? []).map((u) => u.app)).size;
const appLabel = (app: AppId): string => APP_LABELS[app] ?? app;
const componentLink = (comp: ComponentMeta): string => docLink(componentPath(comp.id), comp.name);

/** 셀렉터나 이름으로 카탈로그 항목을 찾아 링크로 만든다. 없으면 코드 표기만 한다. */
function referenceLink(ref: string): string {
  const target = ALL_CATALOG.find((c) => c.selector === ref || c.id === ref || c.name === ref);
  return target ? componentLink(target) : code(ref);
}

// ── 개요 ──
function overviewArticle(path: string): DocArticle {
  const sectionRows = CATALOG_SECTIONS.filter((s) => s.key !== 'overview').map((s) => [docLink(`/${s.key}`, s.label), esc(SECTION_SUMMARIES[s.key] ?? '')]);
  return article(path, 'LoworldUI 컴포넌트 도감', '모노레포의 공통 컴포넌트와 디자인 시스템 소자를 한곳에서 찾아보는 문서.', [
    {
      id: 'about',
      title: '이 도감은',
      html:
        para(`카탈로그에 등록된 컴포넌트 <strong>${ALL_CATALOG.length.toLocaleString()}개</strong>와 디자인 시스템 패밀리 <strong>${CATALOG_FAMILIES.length}종</strong>의 규격, 사용 현황, 미리보기를 담고 있다.`) +
        para('왼쪽 목차에서 문서를 고르거나 <code>⌘K</code>로 이름·셀렉터를 검색한다.'),
    },
    { id: 'sections', title: '구획', html: table([{ label: '구획' }, { label: '내용' }], sectionRows) },
    {
      id: 'layers',
      title: '컴포넌트 계층',
      html: table(
        [{ label: '계층' }, { label: '개수', numeric: true }],
        (Object.keys(LAYER_LABELS) as CatalogLayer[]).map((layer) => [esc(LAYER_LABELS[layer]), ALL_CATALOG.filter((c) => layerOf(c) === layer).length.toLocaleString()]),
      ),
    },
  ]);
}

const SECTION_SUMMARIES: Readonly<Record<string, string>> = {
  components: '분류별 컴포넌트 목록과 컴포넌트마다의 규격·미리보기 문서',
  systems: '버튼, 배지, 카드 등 디자인 시스템 패밀리의 스타일 체계와 사용처',
  foundation: '아키텍처 규칙, 코어 서비스, 색상 토큰',
  stats: '계층·분류 분포, 사용 랭킹, 소자 채택 현황',
};

function historyArticle(path: string): DocArticle {
  return article(
    path,
    '작업 이력',
    '컴포넌트 라이브러리의 단계별 작업 기록.',
    WORK_HISTORY_CATALOG.map((h, i) => ({
      id: `phase-${i}`,
      title: `${h.phase} · ${h.title}`,
      html: para(`${esc(h.period)} · ${esc(h.statusLabel)}`) + para(esc(h.summary)) + list(h.keyDeliverables.map(esc)) + para(`문서: ${code(h.docPath)}`),
    })),
  );
}

// ── 컴포넌트 ──
/** 색인 문서는 제목과 설명만 갖는다. 목록은 색인 위젯이 그린다. */
function indexArticle(path: string, category: CatalogCategory | null): DocArticle {
  if (category) return article(path, CATEGORY_LABELS[category], CATEGORY_DESCRIPTIONS[category], []);
  return article(path, '전체 컴포넌트', `카탈로그에 등록된 컴포넌트 ${ALL_CATALOG.length.toLocaleString()}개. 왼쪽 필터(계층, 플랫폼, 도메인)로 좁혀 볼 수 있다.`, []);
}

function usageSnippet(comp: ComponentMeta): string {
  const attrs = [...comp.inputs.map((i) => `  [${i.name}]="${i.name}"`), ...comp.outputs.map((o) => `  (${o.name})="on${o.name.charAt(0).toUpperCase()}${o.name.slice(1)}($event)"`)];
  return attrs.length ? `<${comp.selector}\n${attrs.join('\n')} />` : `<${comp.selector} />`;
}

function platformSection(comp: ComponentMeta): Section | null {
  const spec = resolvePlatformSpec(comp);
  const rows: string[][] = [];
  if (spec.desktopSpec) rows.push(['데스크톱', code(spec.desktopSpec.presenterComponent), esc(spec.desktopSpec.layoutType), spec.desktopSpec.interactions.map(esc).join('<br>')]);
  if (spec.mobileSpec) rows.push(['모바일', code(spec.mobileSpec.presenterComponent), esc(spec.mobileSpec.layoutType), spec.mobileSpec.interactions.map(esc).join('<br>')]);
  const differences = spec.keyDifferences ?? [];
  if (rows.length === 0 && differences.length === 0) return null;
  return {
    id: 'platform',
    title: '플랫폼별 차이',
    html:
      para(`지원 유형: <strong>${esc(PLATFORM_LABELS[spec.supportType])}</strong>${spec.headlessController ? ` · 공통 로직: ${code(spec.headlessController)}` : ''}`) +
      (rows.length ? table([{ label: '플랫폼' }, { label: '화면 컴포넌트' }, { label: '레이아웃' }, { label: '상호작용' }], rows) : '') +
      list(differences.map(esc)),
  };
}

function componentArticle(path: string, comp: ComponentMeta): DocArticle {
  const primitives = resolveDesignSystemPrimitives(comp);
  const usage = comp.usedIn ?? [];
  return article(path, comp.name, comp.description, [
    {
      id: 'spec',
      title: '기본 정보',
      html: table(
        [{ label: '항목' }, { label: '값' }],
        [
          ['셀렉터', code(`<${comp.selector}>`)],
          ['분류', docLink(categoryPath(comp.category), CATEGORY_LABELS[comp.category])],
          ['계층', esc(LAYER_LABELS[layerOf(comp)])],
          ['도메인', esc(DOMAIN_LABELS[comp.domain])],
          ['플랫폼', esc(PLATFORM_LABELS[getPlatformSupportType(comp)])],
          ['재사용 지수', String(comp.reusabilityIndex ?? usage.length)],
        ],
      ),
    },
    { id: 'inputs', title: '입력', html: table([{ label: '이름' }, { label: '타입' }], comp.inputs.map((i) => [code(i.name), code(i.type)]), '입력이 없습니다.') },
    { id: 'outputs', title: '출력', html: table([{ label: '이름' }, { label: '타입' }], comp.outputs.map((o) => [code(o.name), code(o.type)]), '출력이 없습니다.') },
    { id: 'usage', title: '사용 예', html: codeBlock(usageSnippet(comp)) },
    {
      id: 'used-in',
      title: `사용 현황 (${usage.length})`,
      html: table(
        [{ label: '앱' }, { label: '역할' }, { label: '기능' }, { label: '사용 방식' }],
        usage.map((u) => [esc(appLabel(u.app)), esc(u.role), esc(u.feature ?? '-'), u.direct ? '직접 import' : '셸을 통해 간접 사용']),
        '등록된 사용처가 없습니다.',
      ),
    },
    primitives.length ? { id: 'primitives', title: '사용한 디자인 시스템 소자', html: list(primitives.map(referenceLink)) } : null,
    comp.dependencies?.length ? { id: 'dependencies', title: '의존하는 컴포넌트', html: list(comp.dependencies.map(referenceLink)) } : null,
    comp.referencedBy?.length ? { id: 'referenced-by', title: '이 컴포넌트를 쓰는 곳', html: list(comp.referencedBy.map(referenceLink)) } : null,
    platformSection(comp),
  ]);
}

// ── 디자인 시스템 ──
function systemsArticle(path: string): DocArticle {
  const total = CATALOG_FAMILIES.reduce((sum, f) => sum + f.metrics.totalCount, 0);
  return article(path, '디자인 시스템', `공통 소자 패밀리 ${CATALOG_FAMILIES.length}종의 스타일 체계와 전수조사 결과.`, [
    {
      id: 'families',
      title: '패밀리',
      html:
        para(`전수조사로 집계한 사용 인스턴스는 모두 <strong>${total.toLocaleString()}건</strong>이다.`) +
        table(
          [{ label: '패밀리' }, { label: '대표 소자' }, { label: '건수', numeric: true }, { label: '설명' }],
          CATALOG_FAMILIES.map((f) => [docLink(familyPath(f.id), f.title), code(f.selector), f.metrics.totalCount.toLocaleString(), esc(f.desc)]),
        ),
    },
    {
      id: 'rules',
      title: '사용 수칙',
      html: list([
        '공통 컴포넌트 태그에 <code>padding</code>·<code>border</code>·<code>background</code>를 다시 주지 않는다. 입력(<code>variant</code>, <code>size</code>)으로 조절한다.',
        '하위 컴포넌트를 나눌 때는 <code>.ts</code>·<code>.html</code>·<code>.scss</code> 세 파일을 함께 둔다.',
        '모든 호스트에 <code>display: block; width: 100%; min-width: 0;</code>을 선언한다.',
      ]),
    },
  ]);
}

function familyArticle(path: string, family: CatalogFamilySpec): DocArticle {
  const distribution = (family.metrics as { appDistribution?: readonly object[] }).appDistribution ?? [];
  return article(path, `${family.title} (${family.selector})`, family.desc, [
    { id: 'metrics', title: '전수조사 지표', html: keyValueTable(family.metrics) },
    distribution.length ? { id: 'distribution', title: '앱별 분포', html: autoTable(distribution) } : null,
    ...family.groups.map((group, i) => ({ id: `group-${i}`, title: group.title, html: autoTable(group.rows) })),
    family.snippet ? { id: 'snippet', title: '사용 예', html: codeBlock(family.snippet) } : null,
  ]);
}

// ── 기반 ──
function foundationArticle(path: string): DocArticle {
  return article(
    path,
    '아키텍처 규칙',
    '컴포넌트 계층, 패키지 수출 구조, 시그널, 테마에 관한 규칙.',
    ARCHITECTURE_GUIDES_CATALOG.map((g) => ({ id: g.id, title: g.title, html: para(`${esc(g.categoryLabel)} · ${esc(g.summary)}`) + list(g.guidelines.map(esc)) })),
  );
}

function servicesArticle(path: string): DocArticle {
  return article(
    path,
    '코어 서비스',
    `화면 높이, 테마, 대화상자, 피드백 등 공통 서비스 ${CORE_SERVICES_CATALOG.length}종.`,
    CORE_SERVICES_CATALOG.map((s) => ({
      id: s.id,
      title: s.name,
      html: para(`${esc(s.categoryLabel)} · ${esc(s.description)}`) + list(s.keyFeatures.map(esc)) + codeBlock(`${s.importedFrom}\n\n${s.codeSnippet}`),
    })),
  );
}

function colorsArticle(path: string): DocArticle {
  const rowsOf = (category: 'semantic' | 'domain'): string[][] =>
    COLOR_TOKENS_CATALOG.filter((t) => t.category === category).map((t) => [code(t.token), esc(t.name), code(t.lightValue), code(t.darkValue), esc(t.description)]);
  const columns = [{ label: '토큰' }, { label: '이름' }, { label: '라이트' }, { label: '다크' }, { label: '용도' }];
  return article(path, '색상 토큰', '컴포넌트는 색을 직접 쓰지 않고 아래 토큰을 참조한다. 위 견본은 라이트/다크 값을 나란히 보여 준다.', [
    { id: 'semantic', title: '시맨틱 토큰', html: table(columns, rowsOf('semantic')) },
    { id: 'domain', title: '도메인 토큰', html: table(columns, rowsOf('domain')) },
  ]);
}

// ── 통계 ──
function statsArticle(path: string): DocArticle {
  const domains = Object.entries(DOMAIN_LABELS)
    .map(([domain, label]) => [esc(label), ALL_CATALOG.filter((c) => c.domain === domain).length])
    .filter(([, count]) => (count as number) > 0)
    .map(([label, count]) => [label as string, (count as number).toLocaleString()]);
  const platforms = Object.entries(PLATFORM_LABELS).map(([type, label]) => [esc(label), ALL_CATALOG.filter((c) => getPlatformSupportType(c) === type).length.toLocaleString()]);
  return article(path, '지표 요약', '카탈로그 등록 기준 컴포넌트 수와 분포.', [
    { id: 'domains', title: '도메인별 컴포넌트 수', html: table([{ label: '도메인' }, { label: '개수', numeric: true }], domains) },
    { id: 'platforms', title: '플랫폼 지원 유형', html: table([{ label: '유형' }, { label: '개수', numeric: true }], platforms) },
  ]);
}

function matrixArticle(path: string): DocArticle {
  const layers = Object.keys(LAYER_LABELS) as CatalogLayer[];
  const rows = CATEGORY_ORDER.map((category) => {
    const items = ALL_CATALOG.filter((c) => c.category === category);
    return { category, items };
  })
    .filter((r) => r.items.length > 0)
    .map((r) => [docLink(categoryPath(r.category), CATEGORY_LABELS[r.category]), ...layers.map((l) => r.items.filter((c) => layerOf(c) === l).length.toLocaleString()), r.items.length.toLocaleString()]);
  return article(path, '분류 × 계층 매트릭스', '분류마다 계층별로 몇 개의 컴포넌트가 있는지 보여 준다.', [
    { id: 'matrix', title: '매트릭스', html: table([{ label: '분류' }, ...layers.map((l) => ({ label: LAYER_LABELS[l], numeric: true })), { label: '합계', numeric: true }], rows) },
  ]);
}

function rankingArticle(path: string): DocArticle {
  const ranked = [...ALL_CATALOG].sort((a, b) => usageCount(b) - usageCount(a) || a.name.localeCompare(b.name));
  return article(path, '사용 랭킹', '사용처가 많은 순서. 재사용 지수는 카탈로그에 적힌 값이고, 없으면 사용처 수로 대신한다.', [
    {
      id: 'ranking',
      title: `전체 ${ranked.length.toLocaleString()}개`,
      html: table(
        [{ label: '순위', numeric: true }, { label: '컴포넌트' }, { label: '셀렉터' }, { label: '사용처', numeric: true }, { label: '사용 앱', numeric: true }, { label: '재사용 지수', numeric: true }],
        ranked.map((c, i) => [String(i + 1), componentLink(c), code(c.selector), String(usageCount(c)), String(appCoverage(c)), String(c.reusabilityIndex ?? usageCount(c))]),
      ),
    },
  ]);
}

function adoptionArticle(path: string): DocArticle {
  return article(path, '소자 채택 현황', '컴포넌트가 디자인 시스템 소자를 몇 종이나 조합해 쓰는지 집계한 결과.', [
    { id: 'summary', title: '요약', html: keyValueTable(CENSUS_SUMMARY_STATS) },
    { id: 'intersection', title: '분류별 교차 현황', html: autoTable(CATEGORY_INTERSECTION_MATRIX) },
  ]);
}

/** 고정 경로 문서 */
const STATIC_ARTICLES: Readonly<Record<string, (path: string) => DocArticle>> = {
  '/overview': overviewArticle,
  '/overview/history': historyArticle,
  '/components': (path) => indexArticle(path, null),
  '/systems': systemsArticle,
  '/foundation': foundationArticle,
  '/foundation/services': servicesArticle,
  '/foundation/colors': colorsArticle,
  '/stats': statsArticle,
  '/stats/matrix': matrixArticle,
  '/stats/ranking': rankingArticle,
  '/stats/adoption': adoptionArticle,
};

const cache = new Map<string, DocArticle | null>();

function build(path: string): DocArticle | null {
  const fixed = STATIC_ARTICLES[path];
  if (fixed) return fixed(path);
  const [, root, second, third] = path.split('/');
  if (root === 'components' && second === 'category') {
    return third && third in CATEGORY_LABELS ? indexArticle(path, third as CatalogCategory) : null;
  }
  if (root === 'components' && second) {
    const comp = ALL_CATALOG.find((c) => c.id === second);
    return comp ? componentArticle(path, comp) : null;
  }
  if (root === 'systems' && second) {
    const family = findCatalogFamily(second);
    return family ? familyArticle(path, family) : null;
  }
  return null;
}

/** 경로에 해당하는 문서. 카탈로그는 정적 데이터라 한 번 만든 문서는 다시 만들지 않는다. */
export function buildCatalogArticle(path: string): DocArticle | null {
  if (!cache.has(path)) cache.set(path, build(path));
  return cache.get(path) ?? null;
}
