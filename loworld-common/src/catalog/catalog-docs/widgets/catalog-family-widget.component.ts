import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Type, computed, inject } from '@angular/core';
import { LwCardComponent } from '../../../ui/data-display/card/card.component';
import { CatalogDocsStore } from '../catalog-docs.store';
import { BadgeFamilyDemoComponent } from './family-demos/badge-family-demo.component';
import { ButtonFamilyDemoComponent } from './family-demos/button-family-demo.component';
import { ChipFamilyDemoComponent } from './family-demos/chip-family-demo.component';

/** 패밀리 id → 실물 견본. 견본이 없는 패밀리는 본문 표만 보여 준다. */
const FAMILY_DEMOS: Readonly<Record<string, Type<unknown>>> = {
  buttons: ButtonFamilyDemoComponent,
  badges: BadgeFamilyDemoComponent,
  chips: ChipFamilyDemoComponent,
};

/** 디자인 시스템 패밀리 문서의 실물 견본 영역. */
@Component({
  selector: 'lw-catalog-family-widget',
  standalone: true,
  imports: [NgComponentOutlet, LwCardComponent],
  templateUrl: './catalog-family-widget.component.html',
  styleUrl: './catalog-family-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogFamilyWidgetComponent {
  private readonly store = inject(CatalogDocsStore);

  protected readonly demo = computed<Type<unknown> | null>(() => FAMILY_DEMOS[this.store.activeFamilyId() ?? ''] ?? null);
}
