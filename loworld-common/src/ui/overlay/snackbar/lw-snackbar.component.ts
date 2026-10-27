import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { SaveFeedbackKind } from '../../../services/services/save-feedback.model';

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-snackbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lw-snackbar.component.html',
  styleUrl: './lw-snackbar.component.scss',
})
export class LwSnackbarComponent {
  readonly kind = input.required<SaveFeedbackKind>();
  readonly message = input.required<string>();
  readonly dismiss = output<void>();
}
