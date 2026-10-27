
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Folder } from '../../../../services/models/document.model';

/**
 * 폴더 탐색기 내의 개별 폴더 항목을 표시하는 리스트 아이템 컴포넌트입니다.
 */
@Component({
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-folder-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './folder-list-item.component.html',
  styleUrl: './folder-list-item.component.scss',
})
export class LwFolderListItemComponent {
  readonly folder = input.required<Folder>();
  readonly current = input(false);
  readonly select = output<string>();
}
