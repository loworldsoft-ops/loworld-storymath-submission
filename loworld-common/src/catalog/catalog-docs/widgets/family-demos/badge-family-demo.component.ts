import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { BADGE_STYLE_FAMILIES } from '../../../badge-system-catalog';
import { plain } from '../../data/catalog-html';

/** 배지 패밀리 견본: 스타일 패밀리마다 실제 배지를 그린다. */
@Component({
  selector: 'lw-badge-family-demo',
  standalone: true,
  imports: [LwBadgeComponent],
  templateUrl: './badge-family-demo.component.html',
  styleUrl: './badge-family-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeFamilyDemoComponent {
  protected readonly groups = BADGE_STYLE_FAMILIES.map((family) => ({
    id: family.id,
    title: plain(family.nameKo),
    items: family.items.map((item) => ({ ...item, content: plain(item.content) || plain(item.name) })),
  }));
}
