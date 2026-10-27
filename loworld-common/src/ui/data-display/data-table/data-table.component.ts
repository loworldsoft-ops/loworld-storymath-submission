import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, TemplateRef, computed, contentChildren, inject, input, output } from '@angular/core';

/** 표의 열. 값은 행에서 `key`로 꺼낸다. 칸을 다르게 그리려면 `lwCell` 템플릿을 준다. */
export interface LwTableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: 'start' | 'center' | 'end';
  /** 폭. `auto`는 내용만큼, `fill`은 남은 자리 전부다. */
  readonly width?: 'auto' | 'fill';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LwCellContext { $implicit: any; value: any; index: number }

/**
 * 한 열의 칸을 그리는 템플릿이다. `<ng-template lwCell="status" let-row let-value="value">…</ng-template>`
 * 앱의 화면이 칸에 배지나 단추를 넣을 때 쓴다.
 */
@Directive({ selector: 'ng-template[lwCell]' })
export class LwCellDirective {
  readonly key = input.required<string>({ alias: 'lwCell' });
  readonly template = inject<TemplateRef<LwCellContext>>(TemplateRef);

  // 행의 타입은 표마다 다르다. 템플릿 안에서 행의 필드를 바로 읽을 수 있게 any로 둔다.
  static ngTemplateContextGuard(_dir: LwCellDirective, _ctx: unknown): _ctx is LwCellContext {
    return true;
  }
}

/**
 * 표다. 모든 앱의 표가 이것 하나다. 열의 선언과 행의 배열을 받아 그린다.
 * 행을 고를 수 있고, 비었을 때의 글을 보인다.
 */
@Component({
  selector: 'lw-data-table',
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDataTableComponent<T extends object = Record<string, unknown>> {
  readonly columns = input.required<readonly LwTableColumn[]>();
  readonly rows = input.required<readonly T[]>();
  /** 행을 구분하는 키. 고른 행을 가리킬 때도 쓴다. */
  readonly rowKey = input('id');
  readonly selectedKey = input<unknown>(null);
  readonly selectable = input(false);
  readonly dense = input(false);
  readonly caption = input('');
  readonly emptyMessage = input('표시할 항목이 없습니다.');
  readonly rowSelect = output<T>();

  private readonly cells = contentChildren(LwCellDirective);
  protected readonly cellByKey = computed(() => new Map(this.cells().map((c) => [c.key(), c.template])));

  protected valueOf(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  protected keyOf(row: T, index: number): unknown {
    return this.valueOf(row, this.rowKey()) ?? index;
  }

  protected select(row: T): void {
    if (this.selectable()) this.rowSelect.emit(row);
  }
}
