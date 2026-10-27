import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LwInteractiveElement } from '../../../services/base/lw-interactive-element';

/**
 * 드롭다운 및 컨텍스트 메뉴를 구성하는 개별 메뉴 액션 버튼 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-menu-item',
  standalone: true,
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.scss',
})
export class LwMenuItemComponent extends LwInteractiveElement {
  readonly danger = input(false);
  readonly action = output<MouseEvent>();
}