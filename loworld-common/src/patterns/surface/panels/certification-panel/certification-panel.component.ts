
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Certification, CurriculumRoom } from '../../../../services/models/curriculum.model';

/**
 * 수료증 확인 및 인증 심사 요청/승인을 처리하는 인증 패널 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-certification-panel',
  standalone: true,
  templateUrl: './certification-panel.component.html',
  styleUrl: './certification-panel.component.scss',
})
export class LwCertificationPanelComponent {
  readonly room = input.required<CurriculumRoom>();
  readonly certification = input<Certification | null>(null);
  /** ADMIN만 승인 버튼 표시 */
  readonly canApprove = input(false);

  readonly requestCert = output<string>();   // roomId
  readonly approveCert = output<string>();   // roomId
  readonly downloadCert = output<string>();  // certId

  readonly allStagesDone = computed(() =>
    this.room().stages.every(s => !!s.completedAt)
  );

  formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }
}

export { LwCertificationPanelComponent as LwStudyCertificationPanelComponent };

