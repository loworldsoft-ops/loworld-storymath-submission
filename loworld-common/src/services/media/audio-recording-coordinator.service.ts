import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Attachment } from '../models/document.model';

export type RecordingStatus = 'idle' | 'starting' | 'recording' | 'paused' | 'error';

/**
 * 🎙️ 브라우저 MediaRecorder 및 Web Audio API를 활용한 오디오 녹음 코디네이터 서비스.
 * 마이크 스트림 캡처, 실시간 파형(Waveform) 레벨 분석 및 Audio Attachment 생성을 총괄합니다.
 */
@Injectable({ providedIn: 'root' })
export class AudioRecordingCoordinatorService implements OnDestroy {
  private readonly document = inject(DOCUMENT);

  readonly status = signal<RecordingStatus>('idle');
  readonly levels = signal<number[]>([]);
  readonly currentLevel = signal<number>(0);
  readonly durationSeconds = signal<number>(0);
  readonly currentSizeKB = signal<number>(0);
  readonly errorMessage = signal<string>('');

  readonly isRecording = computed(() => this.status() === 'recording');

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private animationFrameId = 0;
  private timerId: any = null;
  private startedAt = 0;
  private pausedAt = 0;
  private pausedDuration = 0;
  private shouldEmitRecording = false;
  private byteCount = 0;
  private totalBars = 32;

  private onRecordedCallback?: (attachment: Attachment) => void;
  private onCloseCallback?: () => void;

  ngOnDestroy(): void {
    this.cleanup(false);
  }

  statusMessage(): string {
    switch (this.status()) {
      case 'starting':
        return '마이크 권한을 확인하고 있습니다.';
      case 'recording':
        return '녹음 중입니다. 중요한 내용을 자유롭게 말해보세요.';
      case 'paused':
        return '녹음이 일시정지되었습니다.';
      case 'error':
        return '녹음을 시작하지 못했습니다.';
      default:
        return '새 오디오 첨부를 생성합니다.';
    }
  }

  formattedDuration(): string {
    const total = this.durationSeconds();
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(total % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  async startRecording(options: {
    totalBars?: number;
    initialBarHeight?: number;
    onRecorded?: (attachment: Attachment) => void;
    onClose?: () => void;
  } = {}): Promise<void> {
    if (this.status() === 'starting' || this.status() === 'recording' || this.status() === 'paused') {
      return;
    }

    this.totalBars = options.totalBars ?? 32;
    const initialBarHeight = options.initialBarHeight ?? 16;
    this.onRecordedCallback = options.onRecorded;
    this.onCloseCallback = options.onClose;

    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const win = this.document.defaultView;

    if (!nav?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || !win) {
      this.errorMessage.set('이 브라우저는 녹음 기능을 지원하지 않습니다.');
      this.status.set('error');
      return;
    }

    this.errorMessage.set('');
    this.status.set('starting');
    this.shouldEmitRecording = false;
    this.chunks = [];
    this.byteCount = 0;
    this.durationSeconds.set(0);
    this.currentSizeKB.set(0);
    this.pausedDuration = 0;
    this.startedAt = Date.now();
    this.levels.set(Array.from({ length: this.totalBars }, () => initialBarHeight));

    try {
      this.mediaStream = await nav.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = win.AudioContext || (win as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.75;
      source.connect(this.analyser);

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      }
      this.mediaRecorder = mimeType ? new MediaRecorder(this.mediaStream, { mimeType }) : new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.byteCount += event.data.size;
          this.currentSizeKB.set(this.byteCount / 1024);
        }
      };
      this.mediaRecorder.onstop = () => void this.finishRecording();
      this.mediaRecorder.start(1000);
      this.status.set('recording');
      this.shouldEmitRecording = true;
      this.startTicking();
      this.startWaveformLoop();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : '마이크 권한이 필요합니다.');
      this.status.set('error');
      this.cleanup(false);
    }
  }

  togglePause(): void {
    if (!this.mediaRecorder) return;
    const win = this.document.defaultView;
    if (this.status() === 'recording') {
      this.mediaRecorder.pause();
      this.status.set('paused');
      this.pausedAt = Date.now();
      this.stopTicking();
      if (win) win.cancelAnimationFrame(this.animationFrameId);
    } else if (this.status() === 'paused') {
      this.mediaRecorder.resume();
      this.status.set('recording');
      this.pausedDuration += Date.now() - this.pausedAt;
      this.startTicking();
      this.startWaveformLoop();
    }
  }

  stopRecording(): void {
    if (!this.mediaRecorder || this.status() === 'idle') return;
    this.shouldEmitRecording = true;
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup(false);
  }

  cancel(): void {
    this.shouldEmitRecording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup(false);
    this.onCloseCallback?.();
  }

  private startTicking(): void {
    this.stopTicking();
    const win = this.document.defaultView;
    if (!win) return;
    this.timerId = win.setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startedAt - this.pausedDuration) / 1000);
      this.durationSeconds.set(Math.max(elapsed, 0));
      if (elapsed >= 300) {
        this.stopRecording();
      }
    }, 250);
  }

  private stopTicking(): void {
    const win = this.document.defaultView;
    if (this.timerId !== null && win) {
      win.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startWaveformLoop(): void {
    const analyser = this.analyser;
    const win = this.document.defaultView;
    if (!analyser || !win) return;

    const values = new Uint8Array(analyser.frequencyBinCount);
    const bars = this.totalBars;
    const render = () => {
      analyser.getByteFrequencyData(values);
      let sum = 0;
      const nextLevels = Array.from({ length: bars }, (_, index) => {
        const bucket = values[Math.min(index * 2, values.length - 1)] || 0;
        sum += bucket;
        return Math.max(12, Math.round((bucket / 255) * 100));
      });
      const avg = sum / bars;
      this.currentLevel.set(Math.min(100, Math.round((avg / 255) * 100 * 1.5)));
      this.levels.set(nextLevels);

      if (this.status() === 'recording') {
        this.animationFrameId = win.requestAnimationFrame(render);
      }
    };
    this.animationFrameId = win.requestAnimationFrame(render);
  }

  private async finishRecording(): Promise<void> {
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const duration = this.durationSeconds();
    const blob = new Blob(this.chunks, { type: mimeType });
    this.cleanup(true);

    if (!this.shouldEmitRecording || blob.size === 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const attachment: Attachment = {
        id,
        type: 'audio',
        dataUrl,
        fileName: `recording-${Date.now()}.webm`,
        mimeType,
        size: blob.size,
        createdAt: new Date().toISOString(),
        meta: { duration },
      };
      this.onRecordedCallback?.(attachment);
      this.onCloseCallback?.();
    };
    reader.readAsDataURL(blob);
  }

  cleanup(resetState: boolean): void {
    this.stopTicking();
    const win = this.document.defaultView;
    if (win) {
      win.cancelAnimationFrame(this.animationFrameId);
    }
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.analyser = null;
    void this.audioContext?.close();
    this.audioContext = null;
    this.mediaRecorder = null;
    if (resetState) {
      this.status.set('idle');
      this.levels.set(Array.from({ length: this.totalBars }, () => 16));
      this.currentLevel.set(0);
      this.currentSizeKB.set(0);
    }
  }
}
