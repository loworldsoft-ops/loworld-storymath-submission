import { Directive, input } from '@angular/core';
import type { LwSize } from '../tokens/global.tokens';

@Directive({
  selector: '[lwUIBehavior]',
  standalone: true,
})
export class LwUIBehaviorDirective {
  readonly size = input<LwSize>('md');
  readonly disabled = input(false);
  readonly visible = input(true);
}
