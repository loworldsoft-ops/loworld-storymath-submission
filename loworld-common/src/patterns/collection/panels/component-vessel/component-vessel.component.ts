
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { Component, input, output, signal, computed, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwUIBehaviorDirective } from '../../../../services/base/lw-ui-behavior.directive';
import { LwColorBehaviorDirective } from '../../../../services/base/lw-color-behavior.directive';
import { LwActionEvent } from '../../../../services/models/action-event.model';
import { LwVesselMenuItem, LwVesselConfig, LwVesselLayoutMode } from './component-vessel.model';

@Component({
  selector: 'lw-component-vessel',
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwCardComponent],
  templateUrl: './component-vessel.component.html',
  styleUrl: './component-vessel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: LwUIBehaviorDirective, inputs: ['disabled', 'visible'] },
    { directive: LwColorBehaviorDirective, inputs: ['color'] }
  ]
})
export class LwComponentVesselComponent {
  
  // ── 1. 시그널 인풋 바인딩 ──
  readonly menuItems = input.required<LwVesselMenuItem[]>();
  readonly config = input<LwVesselConfig>({
    title: 'Loworld UI Sandbox Vessel',
    layoutMode: 'split',
    showMenu: true,
    menuPosition: 'left'
  });

  // ── 2. 단일 액션 이벤트 채널 ──
  readonly actionEvent = output<LwActionEvent<any>>();

  // ── 3. 로컬 시그널 상태 ──
  protected readonly activeMenuId = signal<string>('main');
  protected readonly layoutMode = signal<LwVesselLayoutMode>('split');
  protected readonly isOverlayOpen = signal<boolean>(false);

  // Host Directives 주입을 통해 호스트 상태 노출 제어
  protected readonly _disabled = inject(LwUIBehaviorDirective).disabled;
  protected readonly _visible = inject(LwUIBehaviorDirective).visible;

  constructor() {

    // config 인풋이 변경되면 로컬 레이아웃 모드 동기화
    effect(() => {
      const initialLayout = this.config().layoutMode;
      this.layoutMode.set(initialLayout);
    });
  }

  // ── 4. 계산된 파생 신호 (computed) ──
  // 어떤 슬롯들이 현재 뷰포트에 노출되어야 하는지 판별
  protected isSlotVisible(slotId: string): boolean {
    const mode = this.layoutMode();
    const currentActive = this.activeMenuId();

    if (mode === 'grid') {
      // 그리드 모드에서는 다중 컴포넌트 상시 노출
      return true;
    }
    
    if (mode === 'split') {
      // 분할 모드에서는 메인(소설)과, 현재 선택된 서브 컴포넌트 1개만 동시 노출
      if (slotId === 'main') return true;
      return currentActive === slotId;
    }

    if (mode === 'single') {
      // 단일 모드에서는 현재 활성화된 것만 노출
      return currentActive === slotId;
    }

    if (mode === 'overlay') {
      // 오버레이 모드에서 서브 컴포넌트는 오버레이 모달 내부에 그려지므로 그리드에서는 숨김
      return slotId === 'main';
    }

    return false;
  }

  // ── 5. 이벤트 핸들링 메서드 ──
  
  protected onMenuSelect(menuId: string): void {
    const targetItem = this.menuItems().find(item => item.id === menuId);
    if (targetItem?.disabled) return;

    this.activeMenuId.set(menuId);

    // 오버레이 모드일 때 서브 컴포넌트를 클릭하면 오버레이 팝업을 연다
    if (this.layoutMode() === 'overlay' && menuId !== 'main') {
      this.isOverlayOpen.set(true);
    }

    // 외부에 메뉴 클릭 액션 알림
    this.actionEvent.emit({
      actionId: 'VESSEL_MENU_CLICKED',
      payload: { id: menuId },
      source: 'LwComponentVesselComponent'
    });
  }

  protected updateLayoutMode(mode: LwVesselLayoutMode): void {
    this.layoutMode.set(mode);
    if (mode !== 'overlay') {
      this.isOverlayOpen.set(false);
    }

    this.actionEvent.emit({
      actionId: 'VESSEL_LAYOUT_CHANGED',
      payload: { mode },
      source: 'LwComponentVesselComponent'
    });
  }

  protected closeOverlay(): void {
    this.isOverlayOpen.set(false);
    this.activeMenuId.set('main'); // 오버레이를 닫으면 메인(소설) 활성화로 복귀

    this.actionEvent.emit({
      actionId: 'VESSEL_OVERLAY_CLOSED',
      payload: undefined,
      source: 'LwComponentVesselComponent'
    });
  }
}
