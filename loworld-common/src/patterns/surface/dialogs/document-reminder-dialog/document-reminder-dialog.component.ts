
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { Component, ElementRef, viewChild, input, output, signal, effect, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';

const ITEM_H = 48;

/**
 * 시간 및 숫자 선택을 위한 스크롤 휠 드럼 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-drum',
  standalone: true,
  templateUrl: './document-reminder-dialog.component.html',
  styleUrl: './drum.component.scss',
})
export class LwDrumComponent implements OnDestroy {
  readonly items = input.required<string[]>();
  readonly selected = input.required<string>();
  readonly width = input(64);
  readonly select = output<string>();

  private readonly elRef = viewChild<ElementRef<HTMLDivElement>>('el');
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _userScrolling = false;

  constructor() {

    effect(() => {
      const ref = this.elRef();
      const sel = this.selected();
      if (!ref) return;
      const idx = this.items().indexOf(sel);
      if (idx < 0) return;
      if (!this._userScrolling) {
        ref.nativeElement.scrollTop = idx * ITEM_H;
      }
    });
  }

  onScroll(): void {
    this._userScrolling = true;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      const el = this.elRef()?.nativeElement;
      if (!el) return;
      const idx = Math.max(0, Math.min(this.items().length - 1, Math.round(el.scrollTop / ITEM_H)));
      el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
      if (this.items()[idx] !== this.selected()) {
        this.select.emit(this.items()[idx]);
      }
      setTimeout(() => { this._userScrolling = false; }, 100);
    }, 80);
  }

  ngOnDestroy(): void {
    if (this._timer) clearTimeout(this._timer);
  }
}

/**
 * 문서 알림 및 리마인더 일정을 설정하는 모달 다이얼로그 컴포넌트입니다.
 */
@Component({
  selector: 'lw-document-reminder-dialog',
  standalone: true,
  imports: [LwDrumComponent, LwModalComponent, LwButtonComponent],
  templateUrl: './lw-document-reminder-dialog.html',
  styleUrl: './document-reminder-dialog.component.scss',
})
export class LwDocumentReminderDialogComponent {
  readonly value = input<string | undefined>(undefined);
  readonly save = output<string | undefined>();
  readonly close = output();

  readonly ampm = signal<'오전' | '오후'>('오전');
  readonly hour = signal('06');
  readonly minute = signal('00');
  readonly repeat = signal<'once' | 'repeat'>('once');
  readonly selectedDays = signal<string[]>(['월', '화', '수', '목', '금', '토', '일']);
  readonly showDayPicker = signal(false);
  readonly draftDays = signal<string[]>([]);

  readonly ampmItems = ['오전', '오후'];
  readonly hourItems = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  readonly minuteItems = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  readonly days = ['월', '화', '수', '목', '금', '토', '일'];

  readonly repeatLabel = computed(() => {
    const sel = this.selectedDays();
    if (sel.length === 0) return '';
    if (sel.length === 7) return '매일';
    return this.days.filter(d => sel.includes(d)).join(', ');
  });

  constructor() {
    effect(() => {
      const v = this.value();
      const now = v ? new Date(v) : new Date();
      const h = now.getHours();
      this.ampm.set(h >= 12 ? '오후' : '오전');
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      this.hour.set(String(h12).padStart(2, '0'));
      this.minute.set(String(now.getMinutes()).padStart(2, '0'));
      this.repeat.set('once');
    });
  }

  onRepeatClick(): void {
    this.repeat.set('repeat');
    this.draftDays.set([...this.selectedDays()]);
    this.showDayPicker.set(true);
  }

  toggleDraftDay(day: string): void {
    const days = this.draftDays();
    this.draftDays.set(days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
  }

  confirmDays(): void {
    this.selectedDays.set([...this.draftDays()]);
    this.showDayPicker.set(false);
  }

  confirm(): void {
    let h = parseInt(this.hour());
    if (this.ampm() === '오후' && h !== 12) h += 12;
    else if (this.ampm() === '오전' && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, parseInt(this.minute()), 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    this.save.emit(d.toISOString());
  }
}
