
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LwActionEvent } from '../../../../services/models/action-event.model';

/**
 * [SRP] 호라드림의 함 연성 조합법 뷰 컴포넌트
 */
@Component({
  selector: 'lw-cube-recipe-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cube-recipe-view.component.html',
  styleUrl: './cube-recipe-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCubeRecipeViewComponent {
  readonly recipes = input<readonly any[]>([]);
  readonly selectRecipe = output<any>();
  readonly actionEvent = output<LwActionEvent<any>>();
}

export { LwCubeRecipeViewComponent as LwCubeRecipeGuideViewComponent };


