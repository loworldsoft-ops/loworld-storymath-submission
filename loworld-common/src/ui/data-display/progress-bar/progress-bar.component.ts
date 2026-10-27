import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LwColorElement } from '../../../services/base/lw-color-element';
import { LW_COLOR_MAP } from '../../../services/tokens/global.tokens';

@Component({
  selector: 'lw-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
})
export class LwProgressBarComponent extends LwColorElement {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly label = input<string>('');
  readonly showLabel = input(true);
  readonly look = input<'bar' | 'segments' | 'dots'>('bar');

  readonly effectiveLook = computed<'bar' | 'segments' | 'dots'>(() => {
    const l = this.look();
    if (l !== 'bar' && this.max() > 30) return 'bar';
    return l;
  });

  readonly items = computed<{ filled: boolean }[]>(() => {
    const count = Math.max(0, this.max());
    const val = this.value();
    const result: { filled: boolean }[] = [];
    for (let i = 0; i < count; i++) {
      result.push({ filled: i < val });
    }
    return result;
  });

  /** Custom fill color — takes precedence over color preset. */
  readonly customColor = input('');

  /** Optional gradient string, e.g. 'linear-gradient(90deg, #d15a52, #f1a479)'. */
  readonly gradient = input('');

  readonly percent = computed(() => {
    const m = this.max();
    if (m <= 0) return 0;
    return Math.min(100, Math.max(0, (this.value() / m) * 100));
  });

  readonly fillColor = computed(() => {
    if (this.gradient()) return this.gradient();
    if (this.customColor()) return this.customColor();
    const colorKey = this.color();
    const preset = (colorKey && LW_COLOR_MAP[colorKey]) ? LW_COLOR_MAP[colorKey] : LW_COLOR_MAP.primary;
    return preset.bg;
  });

  readonly resolvedAriaLabel = computed(() => this.ariaLabel() || `${this.label()} ${this.value()} / ${this.max()}`);
}
