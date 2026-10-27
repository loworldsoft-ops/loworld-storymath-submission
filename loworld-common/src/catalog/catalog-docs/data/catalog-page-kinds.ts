import { Type } from '@angular/core';
import { CatalogColorsWidgetComponent } from '../widgets/catalog-colors-widget.component';
import { CatalogFamilyWidgetComponent } from '../widgets/catalog-family-widget.component';
import { CatalogIndexWidgetComponent } from '../widgets/catalog-index-widget.component';
import { CatalogSandboxWidgetComponent } from '../widgets/catalog-sandbox-widget.component';
import { CatalogStatsWidgetComponent } from '../widgets/catalog-stats-widget.component';

export interface CatalogPageKind {
  readonly match: (path: string) => boolean;
  /** 본문 위에 얹는 위젯. 상태는 `CatalogDocsStore`에서 읽는다. */
  readonly widget?: Type<unknown>;
  /** 본문 최대 너비를 풀어 넓게 쓴다. */
  readonly wide?: boolean;
}

/**
 * 경로 → 위젯. 위에서부터 처음 맞는 항목을 쓴다.
 * 새 페이지 종류는 여기에 한 줄만 추가한다. 위젯도 넓은 본문도 필요 없는 문서는 적지 않는다.
 */
const PAGE_KINDS: readonly CatalogPageKind[] = [
  { match: (p) => p === '/components' || p.startsWith('/components/category/'), widget: CatalogIndexWidgetComponent, wide: true },
  { match: (p) => p.startsWith('/components/'), widget: CatalogSandboxWidgetComponent },
  { match: (p) => p.startsWith('/systems/'), widget: CatalogFamilyWidgetComponent, wide: true },
  { match: (p) => p === '/foundation/colors', widget: CatalogColorsWidgetComponent },
  { match: (p) => p === '/stats', widget: CatalogStatsWidgetComponent },
  { match: (p) => p.startsWith('/stats/'), wide: true },
];

export function findCatalogPageKind(path: string): CatalogPageKind | undefined {
  return PAGE_KINDS.find((kind) => kind.match(path));
}
