import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LwBadgeComponent } from '../../../ui/data-display/badge/badge.component';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import { LwEmptyStateComponent } from '../../../ui/data-display/empty-state/empty-state.component';
import { LwIconComponent } from '../../../ui/media/icon/icon.component';
import { CatalogDocsStore } from '../catalog-docs.store';
import { DEFAULT_LAYER, DOMAIN_LABELS, LAYER_LABELS } from '../data/catalog-labels';
import { componentPath } from '../data/catalog-nav.builder';

/** 색인 문서의 컴포넌트 카드 목록. 왼쪽 필터와 (분류 색인이면) 분류를 따른다. */
@Component({
  selector: 'lw-catalog-index-widget',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwCardComponent, LwEmptyStateComponent, LwIconComponent],
  templateUrl: './catalog-index-widget.component.html',
  styleUrl: './catalog-index-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogIndexWidgetComponent {
  protected readonly store = inject(CatalogDocsStore);

  protected readonly cards = computed(() =>
    this.store.indexedComponents().map((c) => ({
      id: c.id,
      path: componentPath(c.id),
      name: c.name,
      selector: `<${c.selector}>`,
      description: c.description,
      layer: LAYER_LABELS[c.layer ?? DEFAULT_LAYER],
      domain: DOMAIN_LABELS[c.domain],
      usage: c.usedIn?.length ?? 0,
    })),
  );
}
