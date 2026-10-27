import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LwBadgeComponent } from '../../../ui/data-display/badge/badge.component';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import { LwIconComponent } from '../../../ui/media/icon/icon.component';
import { LwProgressBarComponent } from '../../../ui/data-display/progress-bar/progress-bar.component';
import { ALL_CATALOG } from '../../all-catalog';
import { CatalogDocsStore } from '../catalog-docs.store';
import { CATALOG_FAMILIES } from '../data/catalog-families';
import { CATEGORY_LABELS, CatalogLayer, DEFAULT_LAYER, LAYER_LABELS } from '../data/catalog-labels';
import { componentPath } from '../data/catalog-nav.builder';

const TOP_RANK_COUNT = 10;

// 카탈로그는 정적 데이터이므로 한 번만 집계한다.
const LAYER_COUNTS = ALL_CATALOG.reduce<Record<CatalogLayer, number>>(
  (counts, c) => ({ ...counts, [c.layer ?? DEFAULT_LAYER]: counts[c.layer ?? DEFAULT_LAYER] + 1 }),
  { primitive: 0, composite: 0, container: 0, shell: 0 },
);

/** 컴포넌트·디자인 시스템 지표 요약. */
@Component({
  selector: 'lw-catalog-stats-widget',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwCardComponent, LwIconComponent, LwProgressBarComponent],
  templateUrl: './catalog-stats-widget.component.html',
  styleUrl: './catalog-stats-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogStatsWidgetComponent {
  protected readonly store = inject(CatalogDocsStore);

  protected readonly total = ALL_CATALOG.length;

  protected readonly kpis = [
    { icon: 'components', label: '총 컴포넌트 수', value: ALL_CATALOG.length.toLocaleString(), sub: '카탈로그 등록 기준' },
    { icon: 'layers', label: '디자인 시스템 인스턴스', value: CATALOG_FAMILIES.reduce((sum, f) => sum + f.metrics.totalCount, 0).toLocaleString(), sub: `${CATALOG_FAMILIES.length}개 패밀리` },
    { icon: 'box', label: 'L1 단일 소자', value: LAYER_COUNTS.primitive.toLocaleString(), sub: '기본 소자' },
    { icon: 'layout', label: 'L2·L3 조립품', value: (LAYER_COUNTS.composite + LAYER_COUNTS.container + LAYER_COUNTS.shell).toLocaleString(), sub: '복합 부품, 컨테이너, 셸' },
  ];

  protected readonly layers = (Object.keys(LAYER_LABELS) as CatalogLayer[]).map((layer) => ({ layer, label: LAYER_LABELS[layer], count: LAYER_COUNTS[layer] }));

  protected readonly topRanked = [...ALL_CATALOG]
    .sort((a, b) => (b.reusabilityIndex ?? 0) - (a.reusabilityIndex ?? 0))
    .slice(0, TOP_RANK_COUNT)
    .map((c, i) => ({ rank: i + 1, path: componentPath(c.id), name: c.name, selector: `<${c.selector}>`, category: CATEGORY_LABELS[c.category] }));
}
