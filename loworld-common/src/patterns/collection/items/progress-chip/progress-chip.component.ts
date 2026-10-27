
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwStoryPlayThemeService } from '../../../../services/services/story-play-theme.service';
import { LwUIBehaviorDirective } from '../../../../services/base/lw-ui-behavior.directive';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import type { ProgressChipVm } from './progress-chip.model';

export * from './progress-chip.model';

/**
 * 실시간 진행 상황 및 상태 수치 칩 공통 컴포넌트 (`lw-progress-chip`).
 * 라벨, 수치, 아이콘, 미니 프로그레스바, 톤 컬러를 캡슐화하여 렌더링합니다.
 */
@Component({
  selector: 'lw-progress-chip',
  standalone: true,
  imports: [CommonModule, LwTooltipDirective],
  templateUrl: './progress-chip.component.html',
  styleUrl: './progress-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'chip().tone || "default"',
    '[attr.data-lw-play-theme]': 'playThemeService.activeTheme()',
  },
  hostDirectives: [
    { directive: LwUIBehaviorDirective, inputs: ['disabled', 'visible'] },
  ],
})
export class LwProgressChipComponent {
  readonly tooltip = input<string | null>(null);
  protected readonly playThemeService = inject(LwStoryPlayThemeService);

  readonly chip = input.required<ProgressChipVm>();

  /** 진행 상황 칩 수치/힌트 툴팁 자동 생성 */
  protected getEffectiveTooltip(): string | null {
    const custom = this.tooltip();
    if (custom) return custom;
    const c = this.chip();
    if (!c) return null;
    const parts: string[] = [c.label];
    if (c.value != null) parts.push(String(c.value));
    if (c.progressPercent != null) parts.push(`(${c.progressPercent}%)`);
    return parts.join(' ');
  }
}
