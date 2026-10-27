import { Directive, input, model } from '@angular/core';
import type { LwColor, LwSize } from '../tokens/global.tokens';
import { LwBaseComponent } from './lw-base.component';
import type { ILwValueControl, ILwSizeable, ILwDisableable, ILwVisible } from './lw-contracts';

/**
 * 폼 값 입력 및 양방향 상태 동기화 요소 (Level 2 Value Layer)
 * SRP / LSP: size, color, value 모델, placeholder, readonly 계약 전담.
 * 평탄화: LwBaseComponent 직접 상속으로 4단계 상속 체인을 1단계로 단축.
 */
@Directive()
export abstract class LwValueElement<T, TVariant extends string = string, TSize extends string = LwSize>
  extends LwBaseComponent
  implements ILwValueControl<T>, ILwSizeable<TSize>, ILwDisableable, ILwVisible
{
  readonly size = input<TSize>('md' as TSize);
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null>(null);

  readonly color = input<LwColor>('primary');
  readonly variant = input<TVariant>('solid' as TVariant);

  readonly value = model<T | null>(null);
  readonly placeholder = input<string>('');
  readonly readonly = input(false);
  readonly required = input(false);

  protected override getEffectiveTooltip(): string | null {
    return this.tooltip() || this.ariaLabel();
  }

  protected updateValue(next: T | null): void {
    if (this.disabled() || this.readonly()) return;
    this.value.set(next);
  }
}
