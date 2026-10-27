import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';

/**
 * 막대에서 내려오는 메뉴 패널. 여는 단추 바로 아래에 붙는다.
 * 부모 요소가 `position: relative`여야 한다.
 */
@Component({
  selector: 'lw-os-menu',
  standalone: true,
  templateUrl: './lw-os-menu.html',
  styleUrl: './os-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-align]': 'align()' },
})
export class OsMenuComponent {
  readonly label = input<string>('');
  readonly align = input<'start' | 'end'>('start');
}

@Component({
  selector: 'lw-os-menu-item',
  standalone: true,
  imports: [LwPressableDirective],
  templateUrl: './lw-os-menu-item.html',
  styleUrl: './os-menu-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsMenuItemComponent {
  readonly danger = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  /** 오른쪽에 흐리게 붙는 글자. 실제로 연결된 단축키만 적는다. */
  readonly hint = input<string>('');
  readonly select = output<void>();
}

@Component({
  selector: 'lw-os-menu-divider',
  standalone: true,
  templateUrl: './lw-os-menu-divider.html',
  styleUrl: './lw-os-menu-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'separator' },
})
export class OsMenuDividerComponent {}
