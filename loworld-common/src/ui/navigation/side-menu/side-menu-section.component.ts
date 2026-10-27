import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'lw-side-menu-section',
  standalone: true,
  templateUrl: './side-menu-section.component.html',
  styleUrl: './side-menu-section.component.scss',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'lw-side-menu-section',
  },
})
export class LwSideMenuSectionComponent {
  readonly title = input<string>('');
}
