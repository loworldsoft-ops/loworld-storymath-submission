import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 그리드 레이아웃 내에서 열/행 span 및 순서를 제어하는 아이템 컴포넌트입니다.
 */
@Component({
  selector: 'lw-grid-item, [lw-grid-item], [lwGridItem]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.lw-grid-item]': 'true',
    '[style]': 'computedHostStyles()',
  },
})
export class LwGridItemComponent {
  readonly colSpan = input<number | string>(1);
  readonly colSpanSm = input<number | string | undefined>(undefined);
  readonly rowSpan = input<number | string>(1);
  readonly order = input<number | undefined>(undefined);

  private formatSpan(val: number | string | undefined): string | null {
    if (val === undefined || val === null) return null;
    if (val === 'full' || val === '-1') return '1 / -1';
    if (typeof val === 'number') {
      return val > 1 ? `span ${val}` : 'auto';
    }
    const trimmed = val.trim();
    if (!isNaN(Number(trimmed))) {
      const num = Number(trimmed);
      return num > 1 ? `span ${num}` : 'auto';
    }
    return trimmed;
  }

  readonly computedHostStyles = computed(() => {
    const styles: Record<string, string> = {};

    const span = this.formatSpan(this.colSpan());
    if (span) styles['--lw-item-col-span'] = span;

    if (this.colSpanSm() !== undefined) {
      const smSpan = this.formatSpan(this.colSpanSm());
      if (smSpan) styles['--lw-item-col-span-sm'] = smSpan;
    }

    const rSpan = this.formatSpan(this.rowSpan());
    if (rSpan) styles['--lw-item-row-span'] = rSpan;

    if (this.order() !== undefined) {
      styles['--lw-item-order'] = String(this.order());
    }

    return styles;
  });
}
