import { Directive, input, output } from '@angular/core';
import type { LwColor, LwSize } from '../tokens/global.tokens';
import { LwBaseComponent } from './lw-base.component';
import type { ILwSizeable, ILwDisableable, ILwVisible, ILwInteractive, ILwActionEmitter } from './lw-contracts';
import type { LwActionEvent } from '../models/action-event.model';

/**
 * 사용자 상호작용 소자 (Level 2 Semantic & Interaction Layer)
 * SRP / LSP: size, color, selected, interactive, loading 상태 및 액션 디스패치 계약 완벽 캡슐화.
 * 평탄화: LwBaseComponent 직접 상속으로 4단계 상속 체인을 1단계로 단축.
 */
@Directive()
export abstract class LwInteractiveElement<
  TVariant extends string = string,
  TPayload = any,
  TAction extends string = string,
  TSize extends string = LwSize
>
  extends LwBaseComponent
  implements
    ILwSizeable<TSize>,
    ILwDisableable,
    ILwVisible,
    ILwInteractive,
    ILwActionEmitter<TPayload, TAction>
{
  /** UI & Visual 규격 */
  readonly size = input<TSize>('md' as TSize);
  readonly disabled = input(false);
  readonly visible = input(true);
  readonly ariaLabel = input<string | null>(null);

  /** Color & Variant */
  readonly color = input<LwColor>('primary');
  readonly variant = input<TVariant>('solid' as TVariant);

  /** ILwInteractive 구현 */
  readonly selected = input(false);
  readonly interactive = input(true);
  readonly loading = input(false);

  /** ILwActionEmitter 구현 (LSP: 제네릭 타입 계약 지원) */
  readonly actionEvent = output<LwActionEvent<TPayload, TAction>>();

  protected override getComponentSize(): string {
    return this.size();
  }

  protected override isComponentDisabled(): boolean {
    return this.disabled() || this.loading() || !this.interactive();
  }

  protected override isComponentVisible(): boolean {
    return this.visible();
  }

  protected override getEffectiveTooltip(): string | null {
    return this.tooltip() || this.ariaLabel();
  }

  /** LSP 준수: 하위 클래스가 안전하게 호출하는 표준 액션 트리거 */
  protected dispatchAction(actionId: TAction, payload?: TPayload): void {
    if (this.disabled() || this.loading() || !this.interactive()) return;
    if (this.componentConfigStore ? this.componentConfigStore.consoleLogsEnabled() : false) {
      // 액션 이벤트 디스패치
    }
    this.actionEvent.emit({
      actionId,
      payload: payload as TPayload,
      source: this.uid,
      timestamp: Date.now(),
    });
  }

  /** 포커스 위임 */
  public focus(): void {
    this.hostElementRef?.nativeElement?.focus?.();
  }
}
