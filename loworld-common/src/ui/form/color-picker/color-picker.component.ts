import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../button/button.component';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LwValueElement } from '../../../services/base/lw-value-element';

/**
 * 색상 팔레트 목록에서 원하는 색상을 선택할 수 있는 폼 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-color-picker',
  standalone: true,
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.scss',
})
export class LwColorPickerComponent extends LwValueElement<string> {
  readonly currentColor = input.required<string>();
  readonly palette = input<string[]>([
    '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b',
    '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#84cc16',
    '#e11d48', '#64748b', '#4285F4', '#2dd4bf', '#a855f7'
  ]);
  readonly colorSelect = output<string>();

  onColorSelect(color: string, e: Event): void {
    e.stopPropagation();
    this.updateValue(color);
    this.colorSelect.emit(color);
  }
}