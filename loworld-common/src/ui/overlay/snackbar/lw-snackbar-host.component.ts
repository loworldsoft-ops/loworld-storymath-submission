import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SaveFeedbackService } from '../../../services/services/save-feedback.service';
import { LwSnackbarComponent } from './lw-snackbar.component';

@Component({
  selector: 'lw-snackbar-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LwSnackbarComponent],
  templateUrl: './lw-snackbar-host.component.html',
  styleUrl: './lw-snackbar-host.component.scss',
})
export class LwSnackbarHostComponent {
  protected readonly feedback = inject(SaveFeedbackService);
}
