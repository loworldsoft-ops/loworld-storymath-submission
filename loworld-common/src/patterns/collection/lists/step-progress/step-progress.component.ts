
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LwProgressBarComponent } from '../../../../ui/data-display/progress-bar/progress-bar.component';
import { Stage, STAGE_NUMBERS, StageNumber } from '../../../../services/models/curriculum.model';

/**
 * 다단계 진행 상황을 칸별 막대로 시각화하는 단계 진행 상태 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-step-progress',
  standalone: true,
  imports: [LwProgressBarComponent, LwButtonComponent],
  templateUrl: './step-progress.component.html',
  styleUrl: './step-progress.component.scss',
})
export class LwStepProgressComponent {
  readonly stages = input.required<Stage[]>();
  /** 표시할 단계 번호. 미지정 시 기본 16과. */
  readonly stageNumbers = input<readonly StageNumber[]>(STAGE_NUMBERS);
  readonly stageClick = output<StageNumber>();

  readonly resolvedStageNumbers = computed(() => [...this.stageNumbers()]);

  readonly completedCount = computed(() =>
    this.stages().filter((s: Stage) => !!s.completedAt).length
  );

  readonly maxSteps = computed(() => this.resolvedStageNumbers().length);

  isCompleted(n: StageNumber): boolean {
    return !!this.stages().find((s: Stage) => s.number === n)?.completedAt;
  }

  isCurrent(n: StageNumber): boolean {
    const done = this.completedCount();
    return n === done + 1;
  }

  getTitle(n: StageNumber): string {
    return this.stages().find((s: Stage) => s.number === n)?.title ?? `${n}단계`;
  }
}

export { LwStepProgressComponent as LwStudyStepProgressComponent };

