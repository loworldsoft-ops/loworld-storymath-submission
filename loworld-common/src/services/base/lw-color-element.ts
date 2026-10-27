import { Directive, input } from '@angular/core';
import type { LwColor, LwSize } from '../tokens/global.tokens';
import { LwBaseComponent } from './lw-base.component';
import type { ILwSizeable, ILwDisableable, ILwVisible } from './lw-contracts';

/**
 * 색상 및 스타일 변형 요소 (Level 1 Color Foundation)
 * SRP / OCP: size, disabled, color 및 제네릭 TVariant 스타일 속성 전담.
 * 평탄화: LwBaseComponent 직접 상속으로 수직 상속 깊이 단축 (LSP/DIP 준수).
 */
@Directive()
export abstract class LwColorElement<TVariant extends string = string, TSize extends string = LwSize>
  extends LwBaseComponent
  implements ILwSizeable<TSize>, ILwDisableable, ILwVisible
{
  readonly size = input<TSize>('md' as TSize);
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null>(null);

  readonly color = input<LwColor>('primary');
  readonly variant = input<TVariant>('solid' as TVariant);

  protected override getComponentSize(): string {
    return this.size();
  }

  protected override isComponentDisabled(): boolean {
    return this.disabled();
  }

  protected override isComponentVisible(): boolean {
    return this.visible();
  }

  protected override getEffectiveTooltip(): string | null {
    return this.tooltip() || this.ariaLabel();
  }
}
