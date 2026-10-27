import { Directive, input } from '@angular/core';
import type { LwSize } from '../tokens/global.tokens';
import { LwBaseComponent } from './lw-base.component';
import type { ILwSizeable, ILwDisableable, ILwVisible } from './lw-contracts';

export type LwElevation = 'none' | 'sm' | 'md' | 'lg' | 'glass';
export type LwPadding = 'none' | 'compact' | 'md' | 'spacious';

/**
 * 컨테이너 및 레이아웃 박스 요소 (Level 1 Container Foundation)
 * SRP: size, elevation, padding, rounded, backdropBlur 레이아웃 속성 전담.
 * 평탄화: LwBaseComponent 직접 상속으로 3단계 상속 체인을 1단계로 단축.
 */
@Directive()
export abstract class LwContainerElement<TSize extends string = LwSize>
  extends LwBaseComponent
  implements ILwSizeable<TSize>, ILwDisableable, ILwVisible
{
  readonly size = input<TSize>('md' as TSize);
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null>(null);

  readonly elevation = input<LwElevation>('none');
  readonly padding = input<LwPadding>('md');
  readonly rounded = input<boolean>(true);
  readonly backdropBlur = input<boolean>(false);

  protected override getEffectiveTooltip(): string | null {
    return this.tooltip() || this.ariaLabel();
  }
}
