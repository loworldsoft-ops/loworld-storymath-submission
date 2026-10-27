import { Component, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { LwUiFeedbackService } from '../../../../services/services/lw-ui-feedback.service';
import { Stage, StageCompletionInput } from '../../../../services/models/curriculum.model';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwTextareaComponent } from '../../../../ui/form/textarea/textarea.component';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';

/**
 * 단원 및 단계별 완료 상태를 나열하고 승인할 수 있는 단계 진행 목록 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-stage-progress-list',
  standalone: true,
  imports: [LwModalComponent, LwButtonComponent, LwInputComponent, LwTextareaComponent, LwTooltipDirective, LwFormFieldComponent],
  templateUrl: './stage-progress-list.component.html',
  styleUrl: './stage-progress-list.component.scss',
})
export class LwStageProgressListComponent {
  private readonly ui = inject(LwUiFeedbackService);

  readonly stages = input.required<Stage[]>();
  /** 멘토만 체크 버튼 표시 */
  readonly canCheck = input(false);
  /** 과제 순서 변경 가능 여부 */
  readonly canReorder = input(false);
  /** 데스크톱 등에서 CDK 드래그 사용 (모바일은 false) */
  readonly dragDropEnabled = input(false);
  /** true면 첫 미완료 단계만 완료 체크 가능 (퀘스트 스텝 등) */
  readonly sequentialMode = input(false);
  /** false면 완료 취소(uncheck) 불가 */
  readonly allowUncheck = input(true);
  /** true면 모달 확인창 없이 즉시 완료 토글 */
  readonly directCheck = input(false);

  readonly toggleStage = output<StageCompletionInput>();
  readonly memoClick = output<number>();
  readonly stageOrderChange = output<{ previousIndex: number; currentIndex: number }>();

  // ── 완료 체크 확인(컨펌) 모달 상태 ──────────────────────
  protected readonly confirmMode = signal<'complete' | null>(null);
  protected readonly targetStage = signal<Stage | null>(null);
  /** input[type=date] 값 (yyyy-MM-dd) */
  protected readonly inputDate = signal<string>('');
  protected readonly inputMemo = signal<string>('');

  /** 행 클릭 시 directCheck 모드면 즉시 체크 처리 */
  protected onRowClick(stage: Stage): void {
    if (this.canCheckStage(stage) && this.directCheck()) {
      this.onCheckClick(stage);
    }
  }

  /** check-btn 클릭 → 완료 확인 모달 또는 즉시 완료 */
  protected async onCheckClick(stage: Stage, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (!this.canCheckStage(stage)) {
      return;
    }

    if (this.directCheck()) {
      if (stage.completedAt) {
        if (this.allowUncheck()) {
          this.toggleStage.emit({
            number: stage.number,
            completed: false,
            completedAt: null,
            memo: null,
          });
        }
      } else {
        this.toggleStage.emit({
          number: stage.number,
          completed: true,
          completedAt: new Date().toISOString(),
          memo: null,
        });
      }
      return;
    }

    this.targetStage.set(stage);
    if (stage.completedAt) {
      const ok = await this.ui.confirm({
        title: '완료를 취소할까요?',
        message: `${stage.number}. ${stage.title}`,
        detail: '완료 처리와 기록된 메모가 제거됩니다.',
        confirmLabel: '완료 취소',
        tone: 'danger',
      });
      if (ok) {
        this.confirmUncheck();
      } else {
        this.targetStage.set(null);
      }
      return;
    }

    this.inputDate.set(this.toDateInput(stage.completedAt ?? new Date().toISOString()));
    this.inputMemo.set(stage.completionMemo ?? '');
    this.confirmMode.set('complete');
  }

  /** 완료 처리 확정 */
  protected confirmComplete(): void {
    const stage = this.targetStage();
    if (!stage) return;
    const date = this.inputDate();
    const completedAt = date
      ? new Date(`${date}T12:00:00`).toISOString()
      : new Date().toISOString();
    const memo = this.inputMemo().trim();
    this.toggleStage.emit({
      number: stage.number,
      completed: true,
      completedAt,
      memo: memo ? memo : null,
    });
    this.closeConfirm();
  }

  /** 완료 취소 확정 */
  protected confirmUncheck(): void {
    const stage = this.targetStage();
    if (!stage) return;
    this.toggleStage.emit({
      number: stage.number,
      completed: false,
      completedAt: null,
      memo: null,
    });
    this.closeConfirm();
  }

  protected closeConfirm(): void {
    this.confirmMode.set(null);
    this.targetStage.set(null);
    this.inputMemo.set('');
  }

  /** ISO → yyyy-MM-dd (date input 값) */
  private toDateInput(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  private draggedIndex: number | null = null;

  protected onDragStart(index: number, event: DragEvent): void {
    if (!this.dragDropEnabled() || !this.canReorder()) return;
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (this.draggedIndex === null) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  protected onRowDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
      this.draggedIndex = null;
      return;
    }
    this.stageOrderChange.emit({
      previousIndex: this.draggedIndex,
      currentIndex: targetIndex,
    });
    this.draggedIndex = null;
  }

  protected canCheckStage(stage: Stage): boolean {
    if (!this.canCheck()) {
      return false;
    }
    if (stage.completedAt) {
      return this.allowUncheck();
    }
    if (!this.sequentialMode()) {
      return true;
    }
    const firstIncomplete = this.stages().find((candidate) => !candidate.completedAt);
    return firstIncomplete?.number === stage.number;
  }
}

export { LwStageProgressListComponent as LwStudyStageListComponent };

