import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { Component, ElementRef, OnDestroy, output, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import type { Attachment } from '../../../../../services/models/document.model';
import { injectTheme } from '../../../../../services/theme/lw-theme.util';

interface DrawPoint {
  x: number;
  y: number;
}

interface DrawStroke {
  points: DrawPoint[];
  color: string;
  size: number;
  eraser: boolean;
}

function dataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

function createDrawingAttachment(dataUrl: string, width: number, height: number): Attachment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'drawing',
    dataUrl,
    fileName: `drawing-${Date.now()}.png`,
    mimeType: 'image/png',
    size: dataUrlSize(dataUrl),
    createdAt: new Date().toISOString(),
    meta: { width, height },
  };
}

/**
 * 🎨 터치 및 포인터 입력을 지원하는 손글씨/스케치 캔버스 드로잉 패드 컴포넌트.
 * 스케치 데이터를 PNG Attachment 객체로 변환하여 삽입 이벤트를 방출합니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-drawing-pad',
  standalone: true,
  templateUrl: './drawing-pad.component.html',
  styleUrl: './drawing-pad.component.scss',
})
export class LwDrawingPadComponent implements OnDestroy {
  protected readonly theme = injectTheme();

  readonly inserted = output<Attachment>();
  readonly close = output<void>();

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  readonly containerRef = viewChild<ElementRef<HTMLDivElement>>('container');
  readonly selectedColor = signal('#111827');
  readonly selectedSize = signal(4);
  readonly eraser = signal(false);
  readonly strokes = signal<DrawStroke[]>([]);

  readonly colors = ['#111827', '#fb3220', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  readonly strokeSizes = [2, 4, 8];

  private resizeObserver: ResizeObserver | null = null;
  private currentStroke: DrawStroke | null = null;
  private drawing = false;

  constructor() {
    queueMicrotask(() => this.initializeCanvas());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
    this.eraser.set(false);
  }

  undo(): void {
    this.strokes.update(items => items.slice(0, -1));
    this.render();
  }

  clearCanvas(): void {
    this.strokes.set([]);
    this.render();
  }

  onPointerDown(event: PointerEvent): void {
    const point = this.getPoint(event);
    if (!point) {
      return;
    }
    this.drawing = true;
    this.currentStroke = {
      points: [point],
      color: this.selectedColor(),
      size: this.eraser() ? this.selectedSize() * 3 : this.selectedSize(),
      eraser: this.eraser(),
    };
    this.canvasRef()?.nativeElement.setPointerCapture(event.pointerId);
    this.render();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing || !this.currentStroke) {
      return;
    }
    const point = this.getPoint(event);
    if (!point) {
      return;
    }
    this.currentStroke.points.push(point);
    this.render(this.currentStroke);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.drawing || !this.currentStroke) {
      return;
    }
    this.drawing = false;
    this.strokes.update(items => [...items, this.currentStroke!]);
    this.currentStroke = null;
    this.canvasRef()?.nativeElement.releasePointerCapture(event.pointerId);
    this.render();
  }

  insertDrawing(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    this.inserted.emit(createDrawingAttachment(dataUrl, canvas.width, canvas.height));
    this.close.emit();
  }

  private initializeCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const container = this.containerRef()?.nativeElement;
    if (!canvas || !container) {
      return;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(Math.floor(rect.width), 320);
      canvas.height = Math.max(Math.floor(rect.height), 260);
      this.render();
    };

    resize();
    this.resizeObserver = new ResizeObserver(() => resize());
    this.resizeObserver.observe(container);
  }

  private getPoint(event: PointerEvent): DrawPoint | null {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private render(activeStroke?: DrawStroke): void {
    const canvas = this.canvasRef()?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of this.strokes()) {
      this.drawStroke(context, stroke);
    }
    if (activeStroke) {
      this.drawStroke(context, activeStroke);
    }
  }

  private drawStroke(context: CanvasRenderingContext2D, stroke: DrawStroke): void {
    if (stroke.points.length < 1) {
      return;
    }
    context.save();
    context.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    if (stroke.points.length === 1) {
      context.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y + 0.01);
    } else {
      for (let index = 1; index < stroke.points.length; index += 1) {
        context.lineTo(stroke.points[index].x, stroke.points[index].y);
      }
    }
    context.stroke();
    context.restore();
  }
}
