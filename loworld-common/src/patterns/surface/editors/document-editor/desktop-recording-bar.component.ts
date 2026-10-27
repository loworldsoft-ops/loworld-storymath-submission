
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { Component, OnDestroy, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Attachment } from '../../../../services/models/document.model';
import { AudioRecordingCoordinatorService } from '../services/audio-recording-coordinator.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-recording-bar',
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  providers: [AudioRecordingCoordinatorService],
  templateUrl: './desktop-recording-bar.component.html',
  styleUrl: './desktop-recording-bar.component.scss',
})
export class LwDesktopRecordingBarComponent implements OnDestroy {
  private readonly coordinator = inject(AudioRecordingCoordinatorService);

  readonly recorded = output<Attachment>();
  readonly close = output<void>();

  readonly status = this.coordinator.status;
  readonly levels = this.coordinator.levels;
  readonly durationSeconds = this.coordinator.durationSeconds;
  readonly errorMessage = this.coordinator.errorMessage;
  readonly currentLevel = this.coordinator.currentLevel;
  readonly currentSizeKB = this.coordinator.currentSizeKB;

  constructor() {

    queueMicrotask(() => {
      this.coordinator.startRecording({
        totalBars: 48,
        initialBarHeight: 20,
        onRecorded: (attachment) => this.recorded.emit(attachment),
        onClose: () => this.close.emit(),
      });
    });
  }

  ngOnDestroy(): void {
    this.coordinator.cleanup(false);
  }

  formattedDuration(): string {
    return this.coordinator.formattedDuration();
  }

  togglePause(): void {
    this.coordinator.togglePause();
  }

  stopRecording(): void {
    this.coordinator.stopRecording();
  }

  cancel(): void {
    this.coordinator.cancel();
  }
}

