import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwIconComponent } from '../../../ui/media/icon/icon.component';
import { LwPipelineStepItem } from './pipeline.models';

@Component({
  selector: 'lw-pipeline-stepper',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './pipeline-stepper.component.html',
  styleUrl: './pipeline-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwPipelineStepperComponent {
  readonly steps = input.required<readonly LwPipelineStepItem[]>();
  readonly selectedStepId = input<string | null>(null);

  readonly stepSelect = output<LwPipelineStepItem>();
}
