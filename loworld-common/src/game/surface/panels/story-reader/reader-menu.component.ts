import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCodexCardComponent } from '../../../../ui/data-display/codex-card/lw-codex-card.component';
import {
  READER_MENU_TABS,
  type ReaderBeadVm,
  type ReaderCodexCategoryVm,
  type ReaderCodexEntryVm,
  type ReaderLogEntryVm,
  type ReaderMenuTab,
  type ReaderMenuVm,
  type ReaderTraitVm,
} from './story-reader.model';

// 장비 인형의 배치. 세 칸씩 네 줄. 빈 글은 빈 자리다. 시안 Gear.dc.html
const GEAR_LAYOUT: readonly string[] = ['', 'helmet', 'amulet', 'weapon', 'armor', 'offhand', 'gloves', 'belt', 'boots', 'ring1', '', 'ring2'];

/**
 * 독자의 메뉴. 전체 화면으로 열린다. 탭은 일곱까지다: 인물, 장비, 함, 무공, 여정, 도감, 기록.
 * 함 탭은 팩에 구슬이 있을 때만 보인다(vm.beads).
 * 아래에 "이야기로"와 "다음 화" 버튼 줄이 늘 있다. 메뉴는 화와 화 사이이고, 나가는 길은 다음 화다.
 * 왼쪽에 목록, 오른쪽에 고른 것의 설명을 둔다. 좁은 화면에서는 위아래로 놓인다.
 */
@Component({
  selector: 'lw-reader-menu',
  standalone: true,
  imports: [LwButtonComponent, LwCodexCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reader-menu.component.html',
  styleUrl: './reader-menu.component.scss',
  host: {
    '[class.is-dark]': 'dark()',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': '메뉴',
    '(keydown.escape)': 'close.emit()',
  },
})
export class LwReaderMenuComponent {
  readonly vm = input.required<ReaderMenuVm>();
  /** 탭의 이름. 팩의 용어집에서 온다 */
  readonly tabLabels = input<Readonly<Record<string, string>>>({});
  readonly dark = input(false);
  /** 다음 화로 가는 버튼의 글. 빈 글이면 버튼을 보이지 않는다(읽는 중이 아닐 때) */
  readonly nextLabel = input('');

  readonly close = output<void>();
  /** 메뉴를 닫고 다음 화로 간다 */
  readonly next = output<void>();
  readonly equip = output<{ readonly traitId: string; readonly slot?: string }>();
  readonly unequip = output<string>();
  readonly buy = output<string>();
  readonly sell = output<string>();
  /** 구슬 (W9) */
  readonly absorb = output<string>();
  readonly fuse = output<string>();
  readonly socket = output<{ readonly itemId: string; readonly beadId: string }>();

  /** 인형의 칸. 배치에 없는 자리는 null */
  protected readonly gearCells = computed(() => {
    const bySlot = new Map(this.vm().equipment.map((entry) => [entry.slot, entry]));
    return GEAR_LAYOUT.map((slot, index) => ({ key: `${index}:${slot}`, entry: slot ? bySlot.get(slot) ?? null : null }));
  });

  protected readonly tabs = computed(() => READER_MENU_TABS.filter((tab) => tab !== 'beads' || !!this.vm().beads));
  protected readonly selectedBeadId = signal<string | null>(null);
  protected readonly selectedBead = computed<ReaderBeadVm | null>(() => this.vm().beads?.find((bead) => bead.id === this.selectedBeadId()) ?? null);
  protected readonly tab = signal<ReaderMenuTab>('cast');
  protected readonly selectedTrait = signal<ReaderTraitVm | null>(null);
  protected readonly selectedLogId = signal<string | null>(null);
  protected readonly selectedZoneId = signal<string | null>(null);
  protected readonly selectedCodex = signal<ReaderCodexCategoryVm | null>(null);
  protected readonly selectedCodexEntry = signal<ReaderCodexEntryVm | null>(null);

  protected readonly selectedLog = computed<ReaderLogEntryVm | null>(() => {
    const log = this.vm().log;
    return log.find((entry) => entry.id === this.selectedLogId()) ?? log[log.length - 1] ?? null;
  });

  protected readonly selectedZone = computed(() => {
    const zones = this.vm().zones;
    return zones.find((zone) => zone.id === this.selectedZoneId()) ?? zones.find((zone) => zone.current) ?? null;
  });

  /** 지도의 길: 이웃한 구역을 잇는 선. 같은 길을 두 번 그리지 않는다 */
  protected readonly mapRoutes = computed(() => {
    const zones = this.vm().zones;
    const byId = new Map(zones.map((zone) => [zone.id, zone]));
    return zones.flatMap((zone) =>
      zone.adjacent
        .filter((otherId) => zone.id < otherId && byId.has(otherId))
        .map((otherId) => {
          const other = byId.get(otherId)!;
          return { id: `${zone.id}:${otherId}`, x1: zone.x, y1: zone.y, x2: other.x, y2: other.y, walked: zone.visited && other.visited };
        }),
    );
  });

  protected tabLabel(tab: ReaderMenuTab): string {
    const fallback: Record<ReaderMenuTab, string> = { cast: '인물', gear: '장비', beads: '함', arts: '무공', journey: '여정', codex: '도감', log: '기록' };
    return this.tabLabels()[`menu.${tab}`] || fallback[tab];
  }

  protected wordOf(key: string, fallback: string): string {
    return this.tabLabels()[key] || fallback;
  }

  protected selectTab(tab: ReaderMenuTab): void {
    this.tab.set(tab);
    this.selectedTrait.set(null);
    this.selectedCodex.set(null);
    this.selectedCodexEntry.set(null);
  }

  protected selectCodexCategory(cat: ReaderCodexCategoryVm): void {
    this.selectedCodex.set(cat);
    this.selectedCodexEntry.set(null);
  }

  protected selectCodexEntry(entry: ReaderCodexEntryVm): void {
    if (entry.state === 'unknown') return;
    this.selectedCodexEntry.set(entry);
  }

  /** 성품 좌표(-100~100)를 평면 위의 위치(0~100%)로 */
  protected planePosition(value: number, invert = false): number {
    const percent = (value + 100) / 2;
    return invert ? 100 - percent : percent;
  }

  protected unequipFromTrait(trait: ReaderTraitVm): void {
    const entry = this.vm().equipment.find((e) => e.item?.id === trait.id);
    if (entry) {
      this.unequip.emit(entry.slot);
    }
  }
}
