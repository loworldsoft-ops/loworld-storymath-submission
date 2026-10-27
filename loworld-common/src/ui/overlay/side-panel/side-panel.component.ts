import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { LwUIBehaviorDirective } from '../../../services/base/lw-ui-behavior.directive';
import { LwActionEvent } from '../../../services/models/action-event.model';

@Component({
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-side-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss',
  hostDirectives: [
    {
      directive: LwUIBehaviorDirective,
      inputs: ['disabled', 'visible'],
    },
  ],
})
export class LwSidePanelComponent {
  private readonly uiBehavior = inject(LwUIBehaviorDirective);

  readonly disabled = this.uiBehavior.disabled;
  readonly visible = this.uiBehavior.visible;

  readonly open = input<boolean>(false);
  readonly position = input<'left' | 'right'>('left');
  readonly title = input<string>('');
  readonly showClose = input<boolean>(true);
  readonly backdropBlur = input<boolean>(true);
  readonly closeOnOverlay = input<boolean>(true);

  readonly close = output<void>();
  readonly actionEvent = output<LwActionEvent<any>>();

  protected onBackdropClick(): void {
    if (this.closeOnOverlay() && !this.disabled()) {
      this.close.emit();
      this.actionEvent.emit({
        actionId: 'SIDE_PANEL_CLOSED_BY_BACKDROP',
        payload: null,
        source: 'lw-side-panel',
      });
    }
  }
}
