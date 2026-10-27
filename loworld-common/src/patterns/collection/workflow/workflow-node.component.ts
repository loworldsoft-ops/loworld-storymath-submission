import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LwIconComponent } from '../../../ui/media/icon/icon.component';
import { LwWorkflowNode, LwWorkflowPort, WORKFLOW_NODE_THEMES } from './workflow.models';

export interface LwWorkflowPortEvent {
  readonly node: LwWorkflowNode;
  readonly port: LwWorkflowPort;
  readonly direction: 'input' | 'output';
}

@Component({
  selector: 'lw-workflow-node',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './workflow-node.component.html',
  styleUrl: './workflow-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwWorkflowNodeComponent {
  readonly node = input.required<LwWorkflowNode>();
  readonly selected = input<boolean>(false);
  /** 연결을 시작한(출력) 포트 id. 이 노드의 포트가 아니면 null */
  readonly pendingPortId = input<string | null>(null);
  /** 다른 노드에서 연결이 시작되어 입력 포트를 고를 수 있는 상태 */
  readonly connectable = input<boolean>(false);

  readonly select = output<LwWorkflowNode>();
  readonly portSelect = output<LwWorkflowPortEvent>();

  readonly theme = computed(() => WORKFLOW_NODE_THEMES[this.node().type]);

  onPortClick(event: Event, port: LwWorkflowPort, direction: 'input' | 'output'): void {
    event.stopPropagation();
    this.portSelect.emit({ node: this.node(), port, direction });
  }
}
