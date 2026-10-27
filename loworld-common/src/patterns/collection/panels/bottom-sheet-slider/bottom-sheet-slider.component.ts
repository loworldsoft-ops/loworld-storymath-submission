import { Component, ChangeDetectionStrategy, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';


import { LwButtonComponent } from '../../../../ui/form/button/button.component';

@Component({
  selector: 'lw-bottom-sheet-slider',
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  templateUrl: './bottom-sheet-slider.component.html',
  styleUrl: './bottom-sheet-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwBottomSheetSliderComponent {
  /** 📱 서브페이지 개폐 상태 (양방향 model) */
  readonly isSubpageOpen = model<boolean>(false);

  /** 서브페이지 헤더 제목 */
  readonly subpageTitle = input<string>('착용 장비 10개 슬롯 로드아웃');

  /** 서브페이지 상단 키커 텍스트 */
  readonly subpageKicker = input<string>('');

  /** 서브페이지 뒤로가기 버튼 라벨 */
  readonly backButtonText = input<string>('돌아가기');

  /** 서브페이지 상단 내비게이션 바 표시 여부 */
  readonly showSubpageNav = input<boolean>(true);

  /** 서브페이지 닫기/복귀 이벤트 */
  readonly subpageClose = output<void>();

  closeSubpage(): void {
    this.isSubpageOpen.set(false);
    this.subpageClose.emit();
  }

  openSubpage(): void {
    this.isSubpageOpen.set(true);
  }
}
