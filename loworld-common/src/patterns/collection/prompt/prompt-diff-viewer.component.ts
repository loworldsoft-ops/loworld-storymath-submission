import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { diffWords } from './prompt-diff';

@Component({
  selector: 'lw-prompt-diff-viewer',
  standalone: true,
  templateUrl: './prompt-diff-viewer.component.html',
  styleUrl: './prompt-diff-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwPromptDiffViewerComponent {
  readonly oldText = input<string>('');
  readonly newText = input<string>('');
  readonly label = input<string>('변경 비교');

  readonly diffSegments = computed(() => diffWords(this.oldText(), this.newText()));
  readonly addedCount = computed(() => this.diffSegments().filter((s) => s.type === 'added').length);
  readonly removedCount = computed(() => this.diffSegments().filter((s) => s.type === 'removed').length);
}
