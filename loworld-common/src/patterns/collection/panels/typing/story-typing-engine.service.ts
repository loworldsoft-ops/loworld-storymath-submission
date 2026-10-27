import { Injectable, signal, computed, inject } from '@angular/core';
import { StoryAutoPlayService } from '../../../../services/services/story-auto-play.service';
import { LW_STORAGE_PORT } from '../../../../services/ports/storage.port';

export interface TypingSpeedPresetVm {
  readonly value: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: string;
}

export const TYPING_SPEED_PRESETS: readonly TypingSpeedPresetVm[] = [
  { value: 0.5, label: '0.5x (느림)', shortLabel: '0.5x', icon: '🐢' },
  { value: 1.0, label: '1.0x (표준)', shortLabel: '1.0x', icon: '▶' },
  { value: 1.5, label: '1.5x (빠름)', shortLabel: '1.5x', icon: '⚡' },
  { value: 2.0, label: '2.0x (2배속)', shortLabel: '2.0x', icon: '🚀' },
  { value: 3.0, label: '3.0x (3배속)', shortLabel: '3.0x', icon: '🔥' },
  { value: 5.0, label: '즉시 출력 (Instant)', shortLabel: '즉시', icon: '⚡⚡' },
];

const STORAGE_KEY_TYPING_SPEED = 'lw_novel_typing_speed';

/**
 * Novel Play 전용 본문 서사 타이핑 연출 및 진행 상태 머신 서비스 (SRP).
 */
@Injectable({ providedIn: 'root' })
export class LwStoryTypingEngineService {
  private readonly autoPlayService = inject(StoryAutoPlayService);
  private readonly storagePort = inject(LW_STORAGE_PORT);

  readonly currentNarrativeIndex = signal<number>(0);
  readonly displayedNarratives = signal<string[]>([]);
  readonly currentTypedText = signal<string>('');
  readonly isTypingActive = signal<boolean>(false);

  /** 타이핑 속도 배속 (기본 1.0x) */
  readonly typingSpeedMultiplier = signal<number>(this._loadSavedTypingSpeed());

  readonly currentSpeedPreset = computed<TypingSpeedPresetVm>(() => {
    const val = this.typingSpeedMultiplier();
    return TYPING_SPEED_PRESETS.find((p) => p.value === val) ?? TYPING_SPEED_PRESETS[1];
  });

  private streamTimerId: any = null;

  private _loadSavedTypingSpeed(): number {
    try {
      const raw = this.storagePort.getItem(STORAGE_KEY_TYPING_SPEED);
      if (!raw) return 1.0;
      const parsed = parseFloat(raw);
      return isNaN(parsed) ? 1.0 : parsed;
    } catch {
      return 1.0;
    }
  }

  /**
   * 타이핑 배속 설정 및 스토리지 저장
   */
  setTypingSpeedMultiplier(speed: number): void {
    this.typingSpeedMultiplier.set(speed);
    try {
      this.storagePort.setItem(STORAGE_KEY_TYPING_SPEED, speed.toString());
    } catch {
      // ignore
    }
  }

  /**
   * 글자당 타이핑 딜레이 (ms) 계산
   */
  getCharDelayMs(): number {
    const mult = this.typingSpeedMultiplier();
    if (mult >= 5.0) return 0;
    return Math.max(4, Math.round(25 / mult));
  }

  /**
   * 텍스트 타이핑 스트림 실행기
   */
  typeStreamText(
    text: string,
    onUpdate: (partialText: string) => void,
    onComplete?: () => void
  ): void {
    this.clearStreamTimer();
    const delay = this.getCharDelayMs();

    if (delay === 0 || !text) {
      onUpdate(text);
      this.isTypingActive.set(false);
      onComplete?.();
      return;
    }

    this.isTypingActive.set(true);
    let charIdx = 0;
    const totalChars = text.length;

    const step = () => {
      charIdx++;
      onUpdate(text.slice(0, charIdx));
      if (charIdx < totalChars) {
        this.streamTimerId = setTimeout(step, delay);
      } else {
        this.clearStreamTimer();
        this.isTypingActive.set(false);
        onComplete?.();
      }
    };

    this.streamTimerId = setTimeout(step, delay);
  }

  clearStreamTimer(): void {
    if (this.streamTimerId != null) {
      clearTimeout(this.streamTimerId);
      this.streamTimerId = null;
    }
  }

  /**
   * 씬 서사 전체가 모두 출력되었는지 여부
   */
  isSceneFinished(totalNarrativesCount: number): boolean {
    return this.currentNarrativeIndex() >= totalNarrativesCount;
  }

  /**
   * 즉시 전체 서사 출력 및 씬 상태 초기화
   */
  resetSceneState(narratives: readonly string[]): void {
    this.autoPlayService.clearTypingTimer();
    this.clearStreamTimer();
    this.currentNarrativeIndex.set(narratives.length);
    this.displayedNarratives.set([...narratives]);
    this.currentTypedText.set('');
    this.isTypingActive.set(false);
  }

  /**
   * 타이핑 연출 즉시 건너뛰고 전체 서사 출력 완료
   */
  skipToEnd(narratives?: readonly string[]): void {
    this.autoPlayService.clearTypingTimer();
    this.clearStreamTimer();
    if (narratives) {
      this.currentNarrativeIndex.set(narratives.length);
      this.displayedNarratives.set([...narratives]);
    }
    this.currentTypedText.set('');
    this.isTypingActive.set(false);
  }

  /**
   * 서사 텍스트 초기화
   */
  clear(): void {
    this.clearStreamTimer();
    this.currentNarrativeIndex.set(0);
    this.displayedNarratives.set([]);
    this.currentTypedText.set('');
    this.isTypingActive.set(false);
  }
}

