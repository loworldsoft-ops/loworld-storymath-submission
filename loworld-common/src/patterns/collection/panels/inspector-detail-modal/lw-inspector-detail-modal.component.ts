
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';

/**
 * Inspector·플레이 셸에서 엔티티(캐릭터, 맵 zone 등) 상세를 보여줄 때 공통으로 쓰는 모달 프레임.
 * 내부적으로 단일 모달(lw-modal)을 사용한다.
 */
@Component({
  selector: 'lw-inspector-detail-modal',
  standalone: true,
  imports: [LwModalComponent],
  templateUrl: './lw-inspector-detail-modal.component.html',
  styleUrl: './lw-inspector-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInspectorDetailModalComponent {
  readonly open = input(false);
  readonly size = input<'sm' | 'md' | 'lg' | 'full'>('md');
  readonly closeOnOverlay = input(true);

  readonly close = output<void>();
}
