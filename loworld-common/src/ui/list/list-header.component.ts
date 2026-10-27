import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🏷️ LoworldUI Common List Header Component (`<lw-list-header>`)
 * Top column label bar for `<lw-list>`.
 */
@Component({
  selector: 'lw-list-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-header.component.html',
  styleUrl: './list-header.component.scss',
})
export class LwListHeaderComponent {}
