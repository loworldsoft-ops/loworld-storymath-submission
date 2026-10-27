import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../button/button.component';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LwValueElement } from '../../../services/base/lw-value-element';
import { LwActionEvent } from '../../../services/models/action-event.model';

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class LwSearchInputComponent extends LwValueElement<string> {
  readonly query = input('');
  override readonly placeholder = input('검색');
  readonly showClear = input(true);

  readonly actionEvent = output<LwActionEvent<string>>();

  readonly _focused = signal(false);

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateValue(value);
    this.actionEvent.emit({ actionId: 'SEARCH_QUERY_CHANGE', payload: value, source: this.uid });
  }

  clear(): void {
    this.updateValue('');
    this.actionEvent.emit({ actionId: 'SEARCH_QUERY_CHANGE', payload: '', source: this.uid });
  }
}
