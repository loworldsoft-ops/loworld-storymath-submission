import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwUIElement } from '../../../services/base/lw-ui-element';

@Component({
  selector: 'lw-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class LwEmptyStateComponent extends LwUIElement {
  readonly message = input<string>('');
  readonly icon = input<string>('');
}
