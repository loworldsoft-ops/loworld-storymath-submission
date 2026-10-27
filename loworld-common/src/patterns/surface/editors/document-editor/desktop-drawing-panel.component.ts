
import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { Component, ElementRef, viewChild, AfterViewInit, OnDestroy, output, signal, effect, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { injectTheme } from '../../../../services/theme/lw-theme.util';

interface Point { x: number; y: number; }
interface Stroke {
  points: Point[];
  color: string;
  size: number;
  isEraser: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  selector: 'lw-document-drawing-panel',
  
  templateUrl: './desktop-drawing-panel.component.html',
  styleUrl: './desktop-drawing-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDesktopDrawingPanelComponent implements AfterViewInit, OnDestroy {
  protected readonly theme = injectTheme();

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('containerRef');

  readonly insert = output<{ id: string, type: string, dataUrl: string, fileName: string, mimeType: string, size: number, createdAt: string, meta: any }>();
  readonly cancel = output<void>();

  readonly colors = ['#1a1a1a', '#fb3220', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  readonly sizes = [2, 4, 8];

  color = signal<string>(this.colors[0]);
  size = signal<number>(this.sizes[1]);
  isEraser = signal<boolean>(false);
  history = signal<Stroke[]>([]);

  private isDrawing = false;
  private currentStroke: Stroke | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {

    effect(() => {
      // Re-draw when history changes
      this.history();
      this.redrawCanvas();
    });
  }

  ngAfterViewInit() {
    const container = this.containerRef().nativeElement;
    const canvas = this.canvasRef().nativeElement;
    
    this.resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        this.redrawCanvas();
      }
    });
    
    this.resizeObserver.observe(container);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  setColor(c: string) {
    this.color.set(c);
    this.isEraser.set(false);
  }

  setSize(s: number) {
    this.size.set(s);
    this.isEraser.set(false);
  }

  toggleEraser() {
    this.isEraser.set(!this.isEraser());
  }

  undo() {
    const current = this.history();
    if (current.length > 0) {
      this.history.set(current.slice(0, -1));
    }
  }

  clear() {
    this.history.set([]);
  }

  onCancel() {
    this.cancel.emit();
  }

  onInsert() {
    const canvas = this.canvasRef().nativeElement;
    this.redrawCanvas();
    
    const dataUrl = canvas.toDataURL('image/png');
    const size = Math.round((dataUrl.length * 3) / 4);
    
    this.insert.emit({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      type: 'drawing',
      dataUrl,
      fileName: `drawing-${Date.now()}.png`,
      mimeType: 'image/png',
      size,
      createdAt: new Date().toISOString(),
      meta: { width: canvas.width, height: canvas.height }
    });
  }

  private getCoordinates(event: PointerEvent): Point {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onPointerDown(event: PointerEvent) {
    this.isDrawing = true;
    const canvas = this.canvasRef().nativeElement;
    canvas.setPointerCapture(event.pointerId);
    
    const point = this.getCoordinates(event);
    const sizeVal = this.size();
    
    this.currentStroke = {
      points: [point],
      color: this.color(),
      size: this.isEraser() ? sizeVal * 3 : sizeVal,
      isEraser: this.isEraser()
    };
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDrawing || !this.currentStroke) return;
    
    const point = this.getCoordinates(event);
    this.currentStroke.points.push(point);
    this.redrawCanvas(this.currentStroke);
  }

  onPointerUp() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    if (this.currentStroke && this.currentStroke.points.length > 1) {
      this.history.update(h => [...h, this.currentStroke!]);
    }
    this.currentStroke = null;
    this.redrawCanvas();
  }

  private redrawCanvas(activeStroke?: Stroke) {
    if (!this.canvasRef()) return;
    
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear & fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const strokesToDraw = [...this.history()];
    if (activeStroke) {
      strokesToDraw.push(activeStroke);
    }
    
    for (const stroke of strokesToDraw) {
      if (!stroke || !stroke.points || stroke.points.length < 2) continue;
      
      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = stroke.size;
      
      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }
      
      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
}
