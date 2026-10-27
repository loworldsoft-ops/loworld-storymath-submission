
import { CommonModule } from '@angular/common';
import { LwChipComponent } from '../../../../ui/data-display/chip/chip.component';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Folder } from '../../../../services/models/document.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwChipComponent],
  selector: 'lw-document-category-filter',
  standalone: true,
  templateUrl: './mobile-category-filter.component.html',
  styleUrl: './mobile-category-filter.component.scss',
})
export class LwDocumentCategoryFilterComponent {
  readonly folders = input<Folder[]>([]);
  readonly selectedFolderId = input<string | null>(null);
  readonly selectFolder = output<string | null>();
}