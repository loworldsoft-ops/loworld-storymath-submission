import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { AllComponentsQueryService } from '../../../../catalog/query/all-components-query.service';

interface FactoryMetric {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

/**
 * Loworld Factory 통계 패널. 메뉴 막대의 통계 단추를 눌렀을 때 그 아래에 뜬다.
 * 공통 컴포넌트의 개수와 재사용 지표를 보여 준다. 배경화면 설정은 배경화면 창에 있다.
 */
@Component({
  selector: 'lw-os-factory-panel',
  standalone: true,
  imports: [LwIconComponent, LwPressableDirective],
  templateUrl: './overview-factory-panel.component.html',
  styleUrl: './overview-factory-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': '$event.stopPropagation()' },
})
export class OverviewFactoryPanelComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewFactoryPanelComponent', 'OS');

  readonly windowCount = input<number>(0);
  readonly foldersCount = input<number>(0);
  readonly closeRequested = output<void>();

  private readonly query = inject(AllComponentsQueryService);

  protected readonly healthScore = this.query.factoryHealthScore;

  protected readonly metrics = computed<readonly FactoryMetric[]>(() => [
    { label: '공통 컴포넌트', value: String(this.query.totalCount), unit: '개' },
    { label: '평균 재사용', value: String(this.query.globalReuseIndex()), unit: '배' },
    { label: '중복 없음', value: String(this.query.zeroDuplicationRate()), unit: '%' },
    { label: '참조 호출', value: String(this.query.totalReferenceInvocations()), unit: '회' },
  ]);

  protected readonly layers = computed<readonly FactoryMetric[]>(() => [
    { label: '단일 소자', value: String(this.query.primitiveCount()), unit: '' },
    { label: '복합 부품', value: String(this.query.compositeCount()), unit: '' },
    { label: '컨테이너', value: String(this.query.containerCount()), unit: '' },
    { label: '셸', value: String(this.query.shellCount()), unit: '' },
  ]);
}
