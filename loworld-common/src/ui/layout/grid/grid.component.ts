import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LwGridGap, LwGridAlign, LwGridJustify, LwGridFlow } from './grid.types';
import { LW_GRID_GAP_MAP } from './grid.types';

@Component({
  selector: 'lw-grid, [lw-grid], [lwGrid]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lw-grid]': 'true',
    '[class.lw-grid--container]': 'container()',
    '[style]': 'computedHostStyles()',
  },
})
export class LwGridComponent {
  // 컬럼 구성 (기본 1 ~ 12 또는 템플릿 문자열)
  readonly cols = input<number | string>(1);

  // 반응형 브레이크포인트 컬럼 제어 (모바일 우선)
  readonly colsSm = input<number | string | undefined>(1); // <= 640px 모바일
  readonly colsMd = input<number | string | undefined>(undefined); // 641px ~ 960px 태블릿
  readonly colsLg = input<number | string | undefined>(undefined); // 961px ~ 1280px 데스크톱
  readonly colsXl = input<number | string | undefined>(undefined); // > 1280px 와이드 데스크톱

  // 자동 채우기 minmax 지원 (모바일 화면 폭 초과 방지 min(100%, ...) 내장)
  readonly minItemWidth = input<string | undefined>(undefined);
  readonly autoFit = input<boolean>(false);
  readonly autoFill = input<boolean>(false);

  // 간격(Gap)
  readonly gap = input<LwGridGap | string>('md');
  readonly rowGap = input<string | undefined>(undefined);
  readonly colGap = input<string | undefined>(undefined);

  // 정렬 및 흐름 제어
  readonly align = input<LwGridAlign>('stretch');
  readonly justify = input<LwGridJustify>('stretch');
  readonly flow = input<LwGridFlow>('row');

  // 컨테이너 쿼리 지원 여부 (기본 true: 부모 컨테이너 폭에 반응)
  readonly container = input<boolean>(true);

  private formatCols(value: number | string | undefined): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') {
      return `repeat(${value}, minmax(0, 1fr))`;
    }
    const trimmed = value.trim();
    if (!isNaN(Number(trimmed))) {
      return `repeat(${trimmed}, minmax(0, 1fr))`;
    }
    return trimmed;
  }

  private resolveGap(value: LwGridGap | string | undefined): string {
    if (!value) return '16px';
    if (value in LW_GRID_GAP_MAP) {
      return LW_GRID_GAP_MAP[value as LwGridGap];
    }
    return value;
  }

  readonly computedHostStyles = computed(() => {
    const styles: Record<string, string> = {};

    // 1. 기본 컬럼
    const minW = this.minItemWidth();
    if (minW) {
      const mode = this.autoFit() ? 'auto-fit' : 'auto-fill';
      // min(100%, minW)로 모바일 화면 폭보다 minItemWidth가 큰 경우에도 붕괴되지 않도록 방어
      styles['--lw-grid-cols-base'] = `repeat(${mode}, minmax(min(100%, ${minW}), 1fr))`;
    } else {
      styles['--lw-grid-cols-base'] = this.formatCols(this.cols()) || '1fr';
    }

    // 2. 모바일 컬럼 (--lw-grid-cols-sm)
    if (this.colsSm() !== undefined) {
      styles['--lw-grid-cols-sm'] = this.formatCols(this.colsSm())!;
    } else {
      styles['--lw-grid-cols-sm'] = '1fr';
    }

    // 3. 태블릿 및 데스크톱 컬럼
    if (this.colsMd() !== undefined) {
      styles['--lw-grid-cols-md'] = this.formatCols(this.colsMd())!;
    }
    if (this.colsLg() !== undefined) {
      styles['--lw-grid-cols-lg'] = this.formatCols(this.colsLg())!;
    }
    if (this.colsXl() !== undefined) {
      styles['--lw-grid-cols-xl'] = this.formatCols(this.colsXl())!;
    }

    // 4. 간격
    const baseGap = this.resolveGap(this.gap());
    styles['--lw-grid-gap'] = baseGap;
    styles['--lw-grid-gap-sm'] = this.gap() === 'xl' || this.gap() === 'lg' ? '14px' : baseGap;

    if (this.rowGap()) {
      styles['--lw-grid-row-gap'] = this.resolveGap(this.rowGap());
    }
    if (this.colGap()) {
      styles['--lw-grid-col-gap'] = this.resolveGap(this.colGap());
    }

    // 5. 정렬 및 흐름
    styles['--lw-grid-align'] = this.align();
    styles['--lw-grid-justify'] = this.justify();
    styles['--lw-grid-flow'] = this.flow();

    return styles;
  });
}
