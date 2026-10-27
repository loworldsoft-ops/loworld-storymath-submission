import { LwButtonComponent } from '../button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwValueElement } from '../../../services/base/lw-value-element';

/**
 * 모노레포 공통 슬라이드 토글 스위치 프리미티브 컴포넌트 (`lw-slide-switch`).
 * WAI-ARIA switch 롤 및 On/Off 애니메이션을 지원합니다.
 */
@Component({
  selector: 'lw-slide-switch',
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  templateUrl: './slide-switch.component.html',
  styleUrl: './slide-switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-checked]': 'checked() || value() === true',
  },
})
export class LwSlideSwitchComponent extends LwValueElement<boolean> {
  readonly checked = input<boolean>(false);
  readonly toggle = output<Event>();

  onToggle(event: Event): void {
    event.stopPropagation();
    const current = this.value() ?? this.checked();
    this.updateValue(!current);
    this.toggle.emit(event);
  }
}
