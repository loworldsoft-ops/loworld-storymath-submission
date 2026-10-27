import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwActionEvent } from '../../../services/models/action-event.model';
import { LwSize } from '../../../services/tokens/global.tokens';

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-titlebar-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './titlebar.component.html',
  styleUrl: './titlebar.component.scss',
})
export class LwTitlebarFrameComponent {
  readonly height = input<LwSize>('md');
  readonly showMenuButton = input(true);

  readonly actionEvent = output<LwActionEvent<void>>();
}
