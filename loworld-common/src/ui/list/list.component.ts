import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LwListDensity, LwListVariant } from './list.types';

/**
 * 📋 LoworldUI Common List Container Component (`<lw-list>`)
 * High-performance, accessible list container supporting compact, standard, and spacious densities.
 */
@Component({
  selector: 'lw-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class LwListComponent {
  readonly density = input<LwListDensity>('compact');
  readonly variant = input<LwListVariant>('default');
  readonly divided = input<boolean>(true);
  readonly hoverable = input<boolean>(true);
  readonly rounded = input<boolean>(true);
}
