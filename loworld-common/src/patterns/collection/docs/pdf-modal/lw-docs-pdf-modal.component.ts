import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCheckboxComponent } from '../../../../ui/form/checkbox/checkbox.component';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { DocPdfItem, DocPdfRequest } from '../docs.models';

interface PdfGroup {
  readonly name: string;
  readonly items: readonly DocPdfItem[];
}

/** PDF 내보내기 대화상자. 고른 항목 하나가 PDF 한 개이고, "한 파일로 묶기"를 켜면 한 번만 저장한다. */
@Component({
  selector: 'lw-docs-pdf-modal',
  standalone: true,
  imports: [LwButtonComponent, LwCheckboxComponent, LwModalComponent],
  templateUrl: './lw-docs-pdf-modal.component.html',
  styleUrl: './lw-docs-pdf-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDocsPdfModalComponent {
  readonly open = input<boolean>(false);
  readonly items = input<readonly DocPdfItem[]>([]);
  readonly busy = input<boolean>(false);

  readonly export = output<DocPdfRequest>();
  readonly close = output<void>();

  readonly selected = signal<readonly string[]>([]);
  readonly merge = signal<boolean>(false);

  readonly groups = computed<readonly PdfGroup[]>(() => {
    const groups: PdfGroup[] = [];
    for (const item of this.items()) {
      const name = item.group ?? '';
      const group = groups.find((g) => g.name === name);
      if (group) (group.items as DocPdfItem[]).push(item);
      else groups.push({ name, items: [item] });
    }
    return groups;
  });
  readonly allSelected = computed(() => this.items().length > 0 && this.selected().length === this.items().length);
  readonly someSelected = computed(() => this.selected().length > 0 && !this.allSelected());
  readonly fileCount = computed(() => (this.selected().length === 0 ? 0 : this.merge() ? 1 : this.selected().length));

  constructor() {
    // 열 때마다 선택을 비운다.
    effect(() => {
      if (this.open()) {
        untracked(() => {
          this.selected.set([]);
          this.merge.set(false);
        });
      }
    });
  }

  toggle(key: string): void {
    this.selected.update((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  }

  toggleAll(): void {
    this.selected.set(this.allSelected() ? [] : this.items().map((i) => i.key));
  }

  submit(): void {
    if (this.selected().length === 0 || this.busy()) return;
    // 화면에 보이는 순서대로 내보낸다.
    const keys = this.items().map((i) => i.key).filter((k) => this.selected().includes(k));
    this.export.emit({ keys, merge: this.merge() });
  }
}
