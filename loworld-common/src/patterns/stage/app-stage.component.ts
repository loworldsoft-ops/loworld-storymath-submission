import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwSpinnerComponent } from '../../ui/feedback/spinner/spinner.component';

/**
 * 앱 화면의 무대다. 앱의 큰 틀(셸) 하나를 담고, 아래에 개발 도구를 둘 수 있다.
 * 창 안에서는 창을 가득 채우고, 혼자 떠 있을 때는 테두리가 있는 상자가 된다. 그 차이는 OS의 스타일이 정한다.
 * 앱 저장소의 화면이 이것을 맨 바깥에 놓는다. 앱마다 같은 일을 하던 뿌리 컴포넌트를 대신한다.
 */
@Component({
  selector: 'lw-app-stage',
  imports: [NgTemplateOutlet, LwSpinnerComponent],
  templateUrl: './app-stage.component.html',
  styleUrl: './app-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAppStageComponent {
  /** 담는 틀의 종류. 혼자 떠 있을 때의 상자 모양이 달라진다. */
  readonly frame = input<'desktop' | 'mobile'>('desktop');
  /** 준비되지 않았으면 내용 대신 기다림 표시를 보인다. */
  readonly loading = input(false);
  /** 상자 없이 셸이 무대를 그대로 채운다. 셸이 자기 테두리를 갖는 앱이 쓴다. */
  readonly bare = input(false);
}
