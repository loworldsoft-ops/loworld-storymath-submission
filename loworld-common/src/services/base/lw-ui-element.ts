import { Directive, input } from '@angular/core';
import type { LwSize } from '../tokens/global.tokens';
import { LwBaseComponent } from './lw-base.component';
import type { ILwSizeable, ILwDisableable, ILwVisible } from './lw-contracts';

/**
 * 기본 시각 및 접근성 규격 요소 (Level 1 UI Foundation)
 * SRP: size, disabled, visible, ariaLabel 프레젠테이션 계약 전담.
 * OCP / LSP: LwBaseComponent를 상속받아 tooltip 및 테마 반응성 자동 보유.
 */
@Directive()
export abstract class LwUIElement<TSize extends string = LwSize> 
  extends LwBaseComponent 
  implements ILwSizeable<TSize>, ILwDisableable, ILwVisible
{
  /** 규격 및 상태 인풋 */
  readonly size = input<TSize>('md' as TSize);
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null>(null);

  protected override getComponentSize(): string {
    return this.size();
  }

  protected override isComponentDisabled(): boolean {
    return this.disabled();
  }

  protected override isComponentVisible(): boolean {
    return this.visible();
  }

  /** ariaLabel도 툴팁 폴백으로 자동 활용 */
  protected override getEffectiveTooltip(): string | null {
    return this.tooltip() || this.ariaLabel();
  }
}
