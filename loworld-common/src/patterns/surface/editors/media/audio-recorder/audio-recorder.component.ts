import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { Component, OnDestroy, output, inject, ChangeDetectionStrategy } from '@angular/core';
import type { Attachment } from '../../../../../services/models/document.model';
import { AudioRecordingCoordinatorService } from '../../../../../services/media/audio-recording-coordinator.service';

/**
 * 🎙️ 실시간 파형(Waveform) 시각화 및 오디오 녹음 제어 컴포넌트.
 * 마이크를 통해 음성을 녹음하고 완료 시 오디오 Attachment를 방출합니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent],
  providers: [AudioRecordingCoordinatorService],
  selector: 'lw-audio-recorder',
  standalone: true,
  templateUrl: './audio-recorder.component.html',
  styleUrl: './audio-recorder.component.scss',
})
export class LwAudioRecorderComponent implements OnDestroy {
  private readonly coordinator = inject(AudioRecordingCoordinatorService);

  readonly recorded = output<Attachment>();
  readonly close = output<void>();

  readonly status = this.coordinator.status;
  readonly levels = this.coordinator.levels;
  readonly durationSeconds = this.coordinator.durationSeconds;
  readonly errorMessage = this.coordinator.errorMessage;

  constructor() {
    queueMicrotask(() => this.startRecording());
  }

  ngOnDestroy(): void {
    this.coordinator.cleanup(false);
  }

  statusMessage(): string {
    return this.coordinator.statusMessage();
  }

  formattedDuration(): string {
    return this.coordinator.formattedDuration();
  }

  startRecording(): Promise<void> {
    return this.coordinator.startRecording({
      totalBars: 24,
      initialBarHeight: 16,
      onRecorded: (attachment) => this.recorded.emit(attachment),
      onClose: () => this.close.emit(),
    });
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
