
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { CertMapMarker, CountryRankItem, DEFAULT_HW_STATUS_LABELS, RoomStatus } from '../../../../services/models/curriculum.model';
import { HW_MAP_RENDERER } from '../../../../services/tokens/map-renderer.token';
import { countryFlagEmoji } from '../../../../services/utils/country-flags';

import { LwSelectComponent } from '../../../../ui/form/select/select.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';

/**
 * 학습 월드 스테이지 진행도를 지도 형태로 탐색하는 월드 맵 컴포넌트입니다.
 */
@Component({
  selector: 'lw-stage-world-map',
  standalone: true,
  imports: [LwSelectComponent, LwCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stage-world-map.component.html',
  styleUrl: './stage-world-map.component.scss',
})
export class LwStageWorldMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  readonly markers        = input.required<CertMapMarker[]>();
  readonly listOpen       = input<boolean>(true);
  readonly selectedRoomId = input<string | null>(null);
  readonly availableYears = input<number[]>([]);
  readonly panelOpen      = input<boolean>(false);

  readonly yearFilter    = output<number | null>();
  readonly roomSelected  = output<string>();
  readonly panelToggle   = output<void>();

  protected readonly selectedYear = signal<number | null>(null);
  protected readonly selMarker    = signal<CertMapMarker | null>(null);
  protected readonly selCountry   = signal<string | null>(null);

  protected readonly totalCount = computed(() => this.markers().length);
  protected readonly countryCount = computed(() =>
    new Set(this.markers().map(m => m.countryCode)).size
  );
  protected readonly countryRanking = computed<CountryRankItem[]>(() => {
    const map = new Map<string, CountryRankItem>();
    for (const m of this.markers()) {
      const ex = map.get(m.countryCode);
      if (ex) ex.count++;
      else map.set(m.countryCode, {
        countryCode: m.countryCode,
        countryNameKo: m.countryNameKo,
        regionLabel: m.regionLabel,
        count: 1,
      });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  });

  private readonly renderer = inject(HW_MAP_RENDERER, { optional: true });
  private mapReady = false;

  constructor() {

    effect(() => {
      const markers = this.markers();
      if (this.mapReady) {
        this.renderer?.setMarkers(markers, (m: any) => this.onMarkerSelect(m));
      }
    });

    effect(() => {
      // 목록 패널 토글 시 지도 사이즈 갱신
      this.listOpen();
      if (this.mapReady) {
        setTimeout(() => {
          this.renderer?.invalidateSize?.();
        }, 350);
      }
    });

    effect(() => {
      // 선택된 방 id가 변경되면 마커 강조 및 부드럽게 이동
      const roomId = this.selectedRoomId();
      if (this.mapReady) {
        this.renderer?.selectMarker?.(roomId);
        if (roomId) {
          const m = this.markers().find((x: any) => x.roomId === roomId);
          if (m) {
            this.renderer?.flyTo(m.lat, m.lng, 6);
          }
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.renderer) {
      this.renderer.init(this.mapEl.nativeElement, { center: [25, 105], zoom: 3, minZoom: 2 });
      this.renderer.setMarkers(this.markers(), (m: any) => this.onMarkerSelect(m));
      this.mapReady = true;
      // 초기 상태 반영
      this.renderer.selectMarker?.(this.selectedRoomId());
      const initialId = this.selectedRoomId();
      if (initialId) {
          const m = this.markers().find((x: any) => x.roomId === initialId);
          if (m) this.renderer?.flyTo(m.lat, m.lng, 6);
      }
    }
  }

  ngOnDestroy(): void {
    this.renderer?.destroy();
  }

  private onMarkerSelect(m: CertMapMarker & { roomId?: string }): void {
    this.selMarker.set(m);
    this.selCountry.set(m.countryCode);
    if (m.roomId) {
      this.roomSelected.emit(m.roomId);
    }
  }

  protected focusCountry(code: string): void {
    this.selCountry.set(code);
    const m = this.markers().find(x => x.countryCode === code);
    if (m) this.renderer?.flyTo(m.lat, m.lng, 5);
  }

  protected onYearChange(ev: Event): void {
    const val = (ev.target as HTMLSelectElement).value;
    const year = val ? Number(val) : null;
    this.selectedYear.set(year);
    this.yearFilter.emit(year);
    this.selMarker.set(null);
    this.selCountry.set(null);
  }

  protected barPct(count: number): number {
    const max = this.countryRanking()[0]?.count ?? 1;
    return Math.round((count / max) * 100);
  }

  protected flag(code: string): string {
    return countryFlagEmoji(code);
  }

  protected fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  protected roomStatusLabel(status?: RoomStatus | string): string {
    if (!status) return '—';
    return DEFAULT_HW_STATUS_LABELS[status as RoomStatus] ?? String(status);
  }
}

export { LwStageWorldMapComponent as LwStudyWorldMapComponent };

