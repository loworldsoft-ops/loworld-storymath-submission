import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type LwSize } from '../../../services/tokens/global.tokens';
import { LwIconComponent } from '../../media/icon/icon.component';
import { LwTooltipDirective } from '../../overlay/tooltip/tooltip.directive';

export type LwCloseButtonVariant = 'default' | 'subtle' | 'ghost' | 'filled' | 'floating';

/**
 * 전사 표준 통합 닫기 버튼 컴포넌트 (`<lw-close-button>`).
 * 모달(Modal), 바텀시트(Bottom Sheet), 설정 대화상자(Settings Dialog), OS 윈도우 프레임 등
 * 시스템 전반의 닫기 인터페이스를 통일된 디자인과 애니메이션으로 제공합니다.
 */
export const CLOSE_BUTTON_PIXEL_SIZES: Readonly<Record<string, number>> = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
};

/**
 * 전사 표준 통합 닫기 버튼 컴포넌트입니다. 모달 및 패널의 닫기 인터페이스를 제공합니다.
 */
@Component({
  selector: 'lw-close-button',
  standalone: true,
  imports: [CommonModule, LwIconComponent, LwTooltipDirective],
  templateUrl: './close-button.component.html',
  styleUrl: './close-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCloseButtonComponent {
  /** 버튼 크기 ('xs' | 'sm' | 'md' | 'lg', 기본: 'sm') */
  readonly size = input<LwSize>('sm');

  /** 시각적 스타일 변형 ('default' | 'subtle' | 'ghost' | 'filled' | 'floating' | 'traffic', 기본: 'default') */
  readonly variant = input<LwCloseButtonVariant>('default');

  /** 스크린리더용 접근성 라벨 */
  readonly ariaLabel = input<string>('닫기');

  /** 툴팁 텍스트 (null 또는 빈 문자열 시 표시 안 함) */
  readonly tooltip = input<string | null>('닫기');

  /** 주의 집중 펄스 비콘 링 효과 활성화 여부 */
  readonly pulse = input<boolean>(false);

  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);

  /** 클릭 시 상위 전파 차단 여부 (기본: true) */
  readonly stopPropagation = input<boolean>(true);

  /** 닫기 클릭 이벤트 방출 */
  readonly closeClick = output<MouseEvent>();

  /** 크기별 아이콘 픽셀 크기 계산 */
  protected readonly iconPixelSize = computed<number>(() => {
    return CLOSE_BUTTON_PIXEL_SIZES[this.size()] ?? 13;
  });

  protected handleClick(event: MouseEvent): void {
    if (this.stopPropagation()) {
      event.stopPropagation();
    }
    if (this.disabled()) {
      return;
    }
    this.closeClick.emit(event);
  }
}
