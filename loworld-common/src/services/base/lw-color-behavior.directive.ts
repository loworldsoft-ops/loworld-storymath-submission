import { Directive, input } from '@angular/core';
import type { LwColor } from '../tokens/global.tokens';

@Directive({
  selector: '[lwColorBehavior]',
  standalone: true,
})
export class LwColorBehaviorDirective {
  readonly color = input<LwColor>('primary');
}
