import { ChangeDetectionStrategy, Component, computed, input, NO_ERRORS_SCHEMA } from '@angular/core';

@Component({
  selector: 'g[lw-bezier-edge]',
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './bezier-edge.component.html',
  styleUrl: './bezier-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwBezierEdgeComponent {
  readonly x1 = input.required<number>();
  readonly y1 = input.required<number>();
  readonly x2 = input.required<number>();
  readonly y2 = input.required<number>();

  readonly animated = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly label = input<string>('');
  readonly color = input<string>('var(--lw-text-muted)');

  readonly strokeColor = computed(() => (this.selected() ? 'var(--lw-color-primary)' : this.color()));
  readonly strokeWidth = computed(() => (this.selected() ? 2.5 : 2));
  readonly dashArray = computed(() => (this.animated() ? '6 4' : 'none'));

  readonly pathData = computed(() => {
    const startX = this.x1();
    const startY = this.y1();
    const endX = this.x2();
    const endY = this.y2();

    const dx = Math.abs(endX - startX) * 0.5;
    const curvature = Math.max(dx, 40);

    const c1x = startX + curvature;
    const c1y = startY;
    const c2x = endX - curvature;
    const c2y = endY;

    return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
  });

  readonly labelTransform = computed(() => {
    const midX = (this.x1() + this.x2()) / 2;
    const midY = (this.y1() + this.y2()) / 2;
    return `translate(${midX}, ${midY})`;
  });
}
