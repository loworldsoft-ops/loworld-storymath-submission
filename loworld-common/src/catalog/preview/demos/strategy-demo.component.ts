import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ComponentMeta } from '../../../services/models/os.types';
import { findWbsNodeById, firstSelectableWbsNodeId } from '../../../services/utils/strategy-wbs.utils';
import { LwStackComponent } from '../../../ui/layout/stack/stack.component';
import { STRATEGY_DEMO_WBS } from './data/strategy-demo.data';
import { LwWbsTreeComponent } from '../../../patterns/collection/lists/wbs-tree/wbs-tree.component';
import { LwStrategySpecPanelComponent } from '../../../patterns/surface/panels/strategy-spec-panel/strategy-spec-panel.component';

/** Plan의 부품(WBS 나무, 기능정의서)을 본보기 자료로 보인다. 화면 전체는 앱 저장소(loworld-app-plan)에 있다. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-strategy-demo',
  standalone: true,
  imports: [LwStackComponent, LwWbsTreeComponent, LwStrategySpecPanelComponent],
  templateUrl: './strategy-demo.component.html',
  styleUrl: './strategy-demo.component.scss',
})
export class StrategyDemoComponent {
  readonly comp = input.required<ComponentMeta>();

  protected readonly wbs = signal(STRATEGY_DEMO_WBS);
  protected readonly selectedNodeId = signal<string | null>(firstSelectableWbsNodeId(this.wbs()));
  protected readonly selectedNode = computed(() => {
    const id = this.selectedNodeId();
    return id ? findWbsNodeById(this.wbs(), id) : null;
  });
}

export const PlanDemoComponent = StrategyDemoComponent;

