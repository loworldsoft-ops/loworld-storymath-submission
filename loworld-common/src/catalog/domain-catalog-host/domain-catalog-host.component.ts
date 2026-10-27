import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../ui/form/button/button.component';
import { ComponentTileGridComponent } from '../component-tile-grid/component-tile-grid.component';
import { ComponentDetailComponent } from '../component-detail/component-detail.component';
import type { ComponentMeta, OverviewThemeMode } from '../../services/models/os.types';

/**
 * 🏛️ DomainCatalogHostComponent (OCP & DRY)
 *
 * 각 도메인(Note, Calendar, Study, Novel, DB, Plan, Showcase)의 컴포넌트 도감 타일 그리드와
 * 상세 뷰(ComponentDetail) 전환을 표준화하여 템플릿 코드 중복을 제거하고 개방-폐쇄 원칙을 확립합니다.
 */
@Component({
  selector: 'lw-domain-catalog-host',
  standalone: true,
  imports: [CommonModule, LwButtonComponent, ComponentTileGridComponent, ComponentDetailComponent],
  templateUrl: './domain-catalog-host.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainCatalogHostComponent {
  readonly components = input.required<readonly ComponentMeta[]>();
  readonly selectedComponent = input<ComponentMeta | null>(null);
  readonly domain = input.required<ComponentMeta['domain']>();
  readonly themeMode = input<OverviewThemeMode>('light');

  readonly componentSelect = output<string>();
  readonly resetSelection = output<void>();
  readonly openNav = output<void>();
}
