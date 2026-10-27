import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import type { ReaderOriginVm, ReaderPortraitVm, ReaderSlotSummaryVm } from './story-reader.model';

/** 캐릭터 선택. 슬롯 하나가 소설 한 편이다. 빈 슬롯에서는 이름을 정하고 초상과 전생의 갈래를 고른다. */
@Component({
  selector: 'lw-reader-slot-select',
  standalone: true,
  imports: [LwButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader-slot-select.component.html',
  styleUrl: './reader-slot-select.component.scss',
  host: { '[class.is-dark]': 'dark()' },
})
export class LwReaderSlotSelectComponent {
  readonly title = input('');
  readonly slots = input<readonly ReaderSlotSummaryVm[]>([]);
  readonly origins = input<readonly ReaderOriginVm[]>([]);
  /** 고를 수 있는 초상. 비어 있으면 초상을 고르는 칸을 보이지 않는다 */
  readonly portraits = input<readonly ReaderPortraitVm[]>([]);
  readonly defaultName = input('');
  readonly dark = input(false);
  /** 기획자용: 슬롯 지우기 버튼 */
  readonly devTools = input(false);

  readonly resume = output<string>();
  readonly create = output<{ slotId: string; name: string; originId: string; portraitId: string | null }>();
  readonly remove = output<string>();
  readonly backToBookshelf = output<void>();
  readonly inspect = output<string>();

  protected readonly creatingSlotId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly originId = signal<string | null>(null);
  protected readonly portraitId = signal<string | null>(null);

  protected open(slot: ReaderSlotSummaryVm): void {
    if (!slot.empty) {
      this.resume.emit(slot.id);
      return;
    }
    this.creatingSlotId.set(slot.id);
    this.name.set('');
    this.originId.set(null);
    this.portraitId.set(this.portraits()[0]?.id ?? null);
  }

  protected cancel(): void {
    this.creatingSlotId.set(null);
  }

  protected confirm(): void {
    const slotId = this.creatingSlotId();
    const originId = this.originId();
    if (!slotId || !originId) return;
    this.create.emit({ slotId, name: this.name().trim() || this.defaultName(), originId, portraitId: this.portraitId() });
    this.creatingSlotId.set(null);
  }

  protected onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }
}
