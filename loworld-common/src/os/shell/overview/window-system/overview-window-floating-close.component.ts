import { LwCloseButtonComponent } from '../../../../ui/navigation/close-button/close-button.component';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/**
 * OS 윈도우 상단 모서리에 배치되는 플로팅 닫기 단추 컴포넌트입니다.
 */
@Component({
  standalone: true,
  imports: [LwCloseButtonComponent],
  selector: 'lw-os-window-floating-close',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-window-floating-close.component.html',
  styleUrl: './overview-window-floating-close.component.scss',
})
export class OverviewWindowFloatingCloseComponent {
  readonly componentName = 'OverviewWindowFloatingCloseComponent';

  readonly closeRequested = output<void>();

  protected onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.closeRequested.emit();
  }
}