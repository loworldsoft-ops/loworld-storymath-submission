import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { BUTTON_STYLE_FAMILIES } from '../../../button-system-catalog';
import { plain } from '../../data/catalog-html';

/** 버튼 패밀리 견본: 스타일 패밀리마다 실제 버튼을 그린다. */
@Component({
  selector: 'lw-button-family-demo',
  standalone: true,
  imports: [LwButtonComponent],
  templateUrl: './button-family-demo.component.html',
  styleUrl: './button-family-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonFamilyDemoComponent {
  protected readonly groups = BUTTON_STYLE_FAMILIES.map((family) => ({
    id: family.id,
    title: plain(family.nameKo),
    // 원형·정사각 버튼은 글자가 들어갈 자리가 없어 견본에서 뺀다.
    items: family.items.filter((item) => item.shape !== 'circle' && item.shape !== 'square').map((item) => ({ ...item, content: plain(item.content) || plain(item.name) })),
  }));
}
