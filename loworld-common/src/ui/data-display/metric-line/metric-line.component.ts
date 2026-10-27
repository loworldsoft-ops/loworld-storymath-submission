import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwColorElement } from '../../../services/base/lw-color-element';

@Component({
  selector: 'lw-metric-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metric-line.component.html',
  styleUrl: './metric-line.component.scss',
})
export class LwMetricLineComponent extends LwColorElement {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly mono = input(false);
  readonly hasProjectedContent = input(false);
}
