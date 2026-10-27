
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LwMenuComponent } from '../../../../ui/overlay/menu/menu.component';
import { LwMenuItemComponent } from '../../../../ui/overlay/menu/menu-item.component';
import { LwColorPickerComponent } from '../../../../ui/form/color-picker/color-picker.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-item-menu',
  standalone: true,
  imports: [LwMenuComponent, LwMenuItemComponent, LwColorPickerComponent],
  templateUrl: './schedule-item-menu.component.html',
  styleUrl: './schedule-item-menu.component.scss',})
export class LwScheduleItemMenuComponent {
showRename = input(false);
  showCopy = input(false);
  isCopied = input(false);
  deleteLabel = input('\uC0AD\uC81C');
  currentColor = input.required<string>();
  palette = input.required<string[]>();

  rename = output<void>();
  copyUrl = output<void>();
  changeColor = output<string>();
  deleteItem = output<void>();
}