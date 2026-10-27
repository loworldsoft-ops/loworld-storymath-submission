import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwInputComponent } from '../../../../ui/form/input/input.component';
import { LwSidePanelComponent } from '../../../../ui/overlay/side-panel/side-panel.component';
import { LwTabsComponent, LwTabItem } from '../../../../ui/navigation/tabs/tabs.component';
import { ConsoleModel, MODEL_SCOPE_LABELS, MODEL_TYPE_TONES, ModelParamSettings, ModelUsageRef } from '../console.models';

export type ModelDrawerTab = 'overview' | 'settings' | 'usage';

@Component({
  selector: 'lw-model-detail-drawer',
  standalone: true,
  imports: [
    LwBadgeComponent,
    LwButtonComponent,
    LwEmptyStateComponent,
    LwIconComponent,
    LwInputComponent,
    LwSidePanelComponent,
    LwTabsComponent,
  ],
  templateUrl: './lw-model-detail-drawer.component.html',
  styleUrl: './lw-model-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'closeDrawer.emit()' },
})
export class LwModelDetailDrawerComponent {
  readonly model = input<ConsoleModel | null>(null);
  readonly activeTab = input<ModelDrawerTab>('overview');
  readonly usages = input<readonly ModelUsageRef[]>([]);

  readonly closeDrawer = output<void>();
  readonly changeTab = output<ModelDrawerTab>();
  readonly saveSettings = output<ModelParamSettings>();

  readonly tabs: readonly LwTabItem[] = [
    { key: 'overview', label: '개요' },
    { key: 'settings', label: '설정' },
    { key: 'usage', label: '사용처' },
  ];
  readonly scopeLabels = MODEL_SCOPE_LABELS;
  readonly typeTones = MODEL_TYPE_TONES;

  readonly isEditing = signal<boolean>(false);
  readonly editTemp = signal<number>(0.7);
  readonly editTopP = signal<number>(0.9);
  readonly editMaxTokens = signal<number>(4096);

  constructor() {
    // 다른 모델로 바뀌면 편집 상태를 버린다.
    effect(() => {
      this.model()?.idx;
      untracked(() => this.isEditing.set(false));
    });
  }

  onTab(key: string): void {
    this.changeTab.emit(key as ModelDrawerTab);
  }

  startEdit(model: ConsoleModel): void {
    this.editTemp.set(model.temperature ?? 0.7);
    this.editTopP.set(model.topP ?? 0.9);
    this.editMaxTokens.set(model.maxTokens ?? 4096);
    this.isEditing.set(true);
  }

  onSave(model: ConsoleModel): void {
    this.saveSettings.emit({
      idx: model.idx,
      temperature: Number(this.editTemp()),
      topP: Number(this.editTopP()),
      maxTokens: Number(this.editMaxTokens()),
    });
    this.isEditing.set(false);
  }

  usagesOf(kind: ModelUsageRef['kind']): readonly ModelUsageRef[] {
    return this.usages().filter((u) => u.kind === kind);
  }
}
