import { Injectable, OnDestroy } from '@angular/core';

/** story-play auto-choice·typing·battle-setup 타이머 SSOT (SRP) */
@Injectable({ providedIn: 'root' })
export class StoryAutoPlayService implements OnDestroy {
  private typingTimerId: ReturnType<typeof setTimeout> | null = null;
  private autoPlayTimerId: ReturnType<typeof setTimeout> | null = null;
  private randomChoiceTimerId: ReturnType<typeof setTimeout> | null = null;
  private randomChoiceCountdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private randomChoiceConfirmTimerId: ReturnType<typeof setTimeout> | null = null;
  private randomBattleSetupTimerId: ReturnType<typeof setTimeout> | null = null;

  clearTypingTimer(): void {
    this.clearTimeout(this.typingTimerId);
    this.typingTimerId = null;
    this.clearTimeout(this.autoPlayTimerId);
    this.autoPlayTimerId = null;
  }

  clearRandomChoiceTimer(): void {
    this.clearTimeout(this.randomChoiceTimerId);
    this.randomChoiceTimerId = null;
  }

  clearRandomChoiceCountdownInterval(): void {
    this.clearInterval(this.randomChoiceCountdownIntervalId);
    this.randomChoiceCountdownIntervalId = null;
  }

  clearRandomChoiceConfirmTimer(): void {
    this.clearTimeout(this.randomChoiceConfirmTimerId);
    this.randomChoiceConfirmTimerId = null;
  }

  clearRandomBattleSetupTimer(): void {
    this.clearTimeout(this.randomBattleSetupTimerId);
    this.randomBattleSetupTimerId = null;
  }

  clearAutoChoiceCountdownPhase(): void {
    this.clearRandomChoiceTimer();
    this.clearRandomChoiceCountdownInterval();
  }

  cancelAutoChoiceFlow(): void {
    this.clearAutoChoiceCountdownPhase();
    this.clearRandomChoiceConfirmTimer();
  }

  scheduleRandomChoiceCountdown(onTick: () => void, ms: number): ReturnType<typeof setInterval> {
    this.clearRandomChoiceCountdownInterval();
    const id = setInterval(onTick, ms);
    this.randomChoiceCountdownIntervalId = id;
    return id;
  }

  scheduleRandomChoiceApply(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    this.clearRandomChoiceTimer();
    const id = setTimeout(() => {
      this.randomChoiceTimerId = null;
      callback();
    }, ms);
    this.randomChoiceTimerId = id;
    return id;
  }

  scheduleRandomChoiceConfirm(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    this.clearRandomChoiceConfirmTimer();
    const id = setTimeout(() => {
      this.randomChoiceConfirmTimerId = null;
      callback();
    }, ms);
    this.randomChoiceConfirmTimerId = id;
    return id;
  }

  scheduleRandomBattleSetup(callback: () => void, ms: number): ReturnType<typeof setTimeout> {
    this.clearRandomBattleSetupTimer();
    const id = setTimeout(() => {
      this.randomBattleSetupTimerId = null;
      callback();
    }, ms);
    this.randomBattleSetupTimerId = id;
    return id;
  }

  cancelAll(): void {
    this.clearTypingTimer();
    this.cancelAutoChoiceFlow();
    this.clearRandomBattleSetupTimer();
  }

  ngOnDestroy(): void {
    this.cancelAll();
  }

  private clearTimeout(id: ReturnType<typeof setTimeout> | null): void {
    if (id != null) {
      clearTimeout(id);
    }
  }

  private clearInterval(id: ReturnType<typeof setInterval> | null): void {
    if (id != null) {
      clearInterval(id);
    }
  }
}
