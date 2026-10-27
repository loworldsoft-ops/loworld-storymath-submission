import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';

/** LLMOps 화면 공통 레이아웃: 제목 줄, 도구 줄, 스크롤 본문. */
@Component({
  selector: 'lw-console-page',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './lw-console-page.component.html',
  styleUrl: './lw-console-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwConsolePageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
  /** 본문 여백과 스크롤을 끄고 자식이 영역을 직접 채우게 한다. */
  readonly flush = input<boolean>(false);
}

