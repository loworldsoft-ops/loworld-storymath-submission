import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { LwButtonComponent } from '../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../ui/media/icon/icon.component';
import { LwBezierEdgeComponent } from './bezier-edge.component';
import { LwWorkflowNodeComponent, LwWorkflowPortEvent } from './workflow-node.component';
import { LwCanvasTransform, LwWorkflowConnection, LwWorkflowEdge, LwWorkflowNode } from './workflow.models';

const NODE_WIDTH = 240;
const NODE_PORT_Y = 40;
const NODE_HEIGHT = 110;
const GRID = 24;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.5;
const clampZoom = (zoom: number): number => Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);

interface PendingPort {
  readonly nodeId: string;
  readonly portId: string;
}

/**
 * 워크플로우 캔버스. 이동·확대·화면 맞춤은 내부 상태이고,
 * 노드 위치·선택·연결은 상위가 소유한다(이벤트로 요청).
 */
@Component({
  selector: 'lw-workflow-canvas',
  standalone: true,
  imports: [LwButtonComponent, LwIconComponent, LwWorkflowNodeComponent, LwBezierEdgeComponent],
  templateUrl: './workflow-canvas.component.html',
  styleUrl: './workflow-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwWorkflowCanvasComponent {
  private readonly canvasRoot = viewChild.required<ElementRef<HTMLElement>>('canvasRoot');

  readonly nodes = input<readonly LwWorkflowNode[]>([]);
  readonly edges = input<readonly LwWorkflowEdge[]>([]);
  readonly selectedNodeId = input<string | null>(null);
  readonly readonly = input<boolean>(false);

  readonly nodeSelect = output<string | null>();
  readonly edgeSelect = output<string | null>();
  readonly nodeDragStart = output<string>();
  readonly nodePositionChange = output<{ id: string; position: { x: number; y: number } }>();
  readonly connect = output<LwWorkflowConnection>();
  readonly deleteNode = output<string>();
  readonly deleteEdge = output<string>();
  readonly canvasStateChange = output<LwCanvasTransform>();

  readonly patternId = 'lw-wf-grid-' + Math.random().toString(36).substring(2, 8);

  readonly zoom = signal<number>(1);
  readonly panX = signal<number>(40);
  readonly panY = signal<number>(40);
  readonly selectedEdgeId = signal<string | null>(null);
  readonly isPanning = signal<boolean>(false);
  readonly pendingPort = signal<PendingPort | null>(null);

  private panStart = { x: 0, y: 0 };
  private initialPan = { x: 0, y: 0 };
  private draggingNodeId: string | null = null;
  private dragNodeOffset = { x: 0, y: 0 };
  private dragAnnounced = false;

  readonly viewportTransform = computed(() => `translate3d(${this.panX()}px, ${this.panY()}px, 0) scale(${this.zoom()})`);
  readonly svgViewportTransform = computed(() => `translate(${this.panX()}, ${this.panY()}) scale(${this.zoom()})`);
  readonly patternTransform = computed(() => `translate(${this.panX() % GRID}, ${this.panY() % GRID}) scale(${this.zoom()})`);
  readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  /** 엣지 좌표를 한 번에 계산해 템플릿에서 메서드 호출을 피한다. */
  readonly edgeViews = computed(() => {
    const byId = new Map(this.nodes().map((n) => [n.id, n]));
    return this.edges().flatMap((edge) => {
      const source = byId.get(edge.sourceNodeId);
      const target = byId.get(edge.targetNodeId);
      if (!source || !target) return [];
      return [
        {
          edge,
          x1: source.position.x + NODE_WIDTH,
          y1: source.position.y + NODE_PORT_Y,
          x2: target.position.x,
          y2: target.position.y + NODE_PORT_Y,
        },
      ];
    });
  });

  onCanvasMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest('.lw-wf-node-wrapper, .lw-wf-canvas__controls, [lw-bezier-edge]')) return;
    this.isPanning.set(true);
    this.panStart = { x: event.clientX, y: event.clientY };
    this.initialPan = { x: this.panX(), y: this.panY() };
    this.pendingPort.set(null);
    this.selectedEdgeId.set(null);
    this.edgeSelect.emit(null);
    this.nodeSelect.emit(null);
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (this.isPanning()) {
      this.panX.set(this.initialPan.x + event.clientX - this.panStart.x);
      this.panY.set(this.initialPan.y + event.clientY - this.panStart.y);
      return;
    }
    if (!this.draggingNodeId || this.readonly()) return;
    if (!this.dragAnnounced) {
      // 실제로 움직이기 시작할 때 한 번만 알려 되돌리기 지점을 만든다.
      this.dragAnnounced = true;
      this.nodeDragStart.emit(this.draggingNodeId);
    }
    const z = this.zoom();
    this.nodePositionChange.emit({
      id: this.draggingNodeId,
      position: {
        x: Math.round((event.clientX - this.dragNodeOffset.x - this.panX()) / z),
        y: Math.round((event.clientY - this.dragNodeOffset.y - this.panY()) / z),
      },
    });
  }

  endInteraction(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
      this.emitCanvasState();
    }
    this.draggingNodeId = null;
    this.dragAnnounced = false;
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    this.zoomBy(event.deltaY < 0 ? 1.1 : 0.9);
  }

  onNodeMouseDown(event: MouseEvent, node: LwWorkflowNode): void {
    if (this.readonly() || event.button !== 0) return;
    const z = this.zoom();
    this.draggingNodeId = node.id;
    this.dragNodeOffset = {
      x: event.clientX - (node.position.x * z + this.panX()),
      y: event.clientY - (node.position.y * z + this.panY()),
    };
  }

  onSelectNode(node: LwWorkflowNode): void {
    this.selectedEdgeId.set(null);
    this.nodeSelect.emit(node.id);
  }

  onEdgeClick(event: Event, edge: LwWorkflowEdge): void {
    event.stopPropagation();
    this.selectedEdgeId.set(edge.id);
    this.nodeSelect.emit(null);
    this.edgeSelect.emit(edge.id);
  }

  /** 출력 포트를 누르면 연결을 시작하고, 다른 노드의 입력 포트를 누르면 연결을 만든다. */
  onPortSelected(info: LwWorkflowPortEvent): void {
    if (this.readonly()) return;
    const pending = this.pendingPort();
    if (info.direction === 'output') {
      const same = pending?.nodeId === info.node.id && pending.portId === info.port.id;
      this.pendingPort.set(same ? null : { nodeId: info.node.id, portId: info.port.id });
      return;
    }
    if (!pending || pending.nodeId === info.node.id) return;
    this.connect.emit({
      sourceNodeId: pending.nodeId,
      sourcePortId: pending.portId,
      targetNodeId: info.node.id,
      targetPortId: info.port.id,
    });
    this.pendingPort.set(null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.pendingPort.set(null);
      return;
    }
    if (this.readonly() || (event.key !== 'Delete' && event.key !== 'Backspace')) return;
    if ((event.target as Element).closest('input, textarea, select')) return;
    const edgeId = this.selectedEdgeId();
    const nodeId = this.selectedNodeId();
    if (edgeId) {
      this.selectedEdgeId.set(null);
      this.deleteEdge.emit(edgeId);
    } else if (nodeId) {
      this.deleteNode.emit(nodeId);
    }
  }

  zoomBy(factor: number): void {
    this.zoom.update((z) => clampZoom(z * factor));
    this.emitCanvasState();
  }

  /** 모든 노드가 보이도록 배율과 위치를 맞춘다. */
  fitView(): void {
    const nodes = this.nodes();
    const rect = this.canvasRoot().nativeElement.getBoundingClientRect();
    if (nodes.length === 0 || rect.width === 0) {
      this.zoom.set(1);
      this.panX.set(40);
      this.panY.set(40);
    } else {
      const margin = 48;
      const minX = Math.min(...nodes.map((n) => n.position.x));
      const minY = Math.min(...nodes.map((n) => n.position.y));
      const maxX = Math.max(...nodes.map((n) => n.position.x + NODE_WIDTH));
      const maxY = Math.max(...nodes.map((n) => n.position.y + NODE_HEIGHT));
      const zoom = clampZoom(Math.min((rect.width - margin * 2) / (maxX - minX), (rect.height - margin * 2) / (maxY - minY), 1));
      this.zoom.set(zoom);
      this.panX.set(Math.round((rect.width - (maxX - minX) * zoom) / 2 - minX * zoom));
      this.panY.set(Math.round((rect.height - (maxY - minY) * zoom) / 2 - minY * zoom));
    }
    this.emitCanvasState();
  }

  private emitCanvasState(): void {
    this.canvasStateChange.emit({ zoom: this.zoom(), panX: this.panX(), panY: this.panY() });
  }
}
