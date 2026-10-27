import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';

export type LwSideMenuItemVariant = 'default' | 'sub' | 'parent';

@Component({
  selector: 'lw-side-menu-item, button[lw-side-menu-item]',
  standalone: true,
  templateUrl: './side-menu-item.component.html',
  styleUrl: './side-menu-item.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-side-menu-item',
    '[class.nav-item--sub]': 'variant() === "sub"',
    '[class.nav-item--tree-parent]': 'variant() === "parent"',
    '[class.active]': 'active()',
    '[attr.title]': 'routePath() ? ("라우터: " + routePath()) : label()',
    '[attr.disabled]': 'disabled() ? true : null',
    'type': 'button',
    '(click)': 'onItemClick($event)',
  },
})
export class LwSideMenuItemComponent {
  readonly label = input.required<string>();
  readonly icon = input<string | undefined>(undefined);
  readonly badge = input<string | number | undefined>(undefined);
  readonly active = input<boolean>(false);
  readonly variant = input<LwSideMenuItemVariant>('default');
  readonly routeTag = input<string | undefined>(undefined);
  readonly routePath = input<string | undefined>(undefined);
  readonly showRouteBadge = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly itemClick = output<MouseEvent>();
  readonly routeTagClick = output<MouseEvent>();

  onItemClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.itemClick.emit(event);
  }

  onRouteTagClick(event: MouseEvent): void {
    event.stopPropagation();
    this.routeTagClick.emit(event);
  }
}
