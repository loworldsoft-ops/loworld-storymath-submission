import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LwIconComponent } from '../../media/icon/icon.component';

export type LwAppIconVariant = 'springboard' | 'dock' | 'tile' | 'minimal';
export type LwAppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LwAppIconShape = 'squircle' | 'circle' | 'rounded' | 'square';

export const APP_ICON_PIXEL_SIZES: Readonly<Record<LwAppIconSize, number>> = {
  xs: 14,
  sm: 20,
  md: 28,
  lg: 36,
  xl: 44,
};

@Component({
  standalone: true,
  imports: [CommonModule, LwIconComponent],
  selector: 'lw-app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-icon.component.html',
  styleUrl: './app-icon.component.scss',
})
export class LwAppIconComponent {
  /** 칩스/아이콘 디스플레이 모드: 스프링보드(홈), 독 바, 타일(리스트), 미니멀(타이틀바) */
  readonly variant = input<LwAppIconVariant>('springboard');

  /** 규격 사이즈: xs(24px), sm(36px), md(48px), lg(60px), xl(72px) */
  readonly size = input<LwAppIconSize>('lg');

  /** 내부 아이콘 픽셀 크기 계산 */
  readonly computedIconPixelSize = computed(() => {
    return APP_ICON_PIXEL_SIZES[this.size()] ?? 32;
  });

  /** 아이콘 외곽 형태: 스퀘어클, 서클, 라운디드, 스퀘어 */
  readonly shape = input<LwAppIconShape>('squircle');

  /** 앱 명칭 */
  readonly label = input<string>('');

  /** 타일 모드용 보조 설명 텍스트 */
  readonly subtitle = input<string | null>(null);

  /** 이미지 URL */
  readonly iconSrc = input<string | null>(null);

  /** 단색 벡터/이모지 폴백 식별자 (예: 'desktop', 'mobile', 'rocket', 'finder', 'gear', 'folder' 또는 '🎓') */
  readonly icon = input<string | null>(null);

  /** 커스텀 인라인 SVG 패스(d 속성) 지원 */
  readonly svgPath = input<string | null>(null);

  /** 라벨 명시적 표시 여부 (dock 모드에서도 라벨 표시 가능) */
  readonly showLabel = input<boolean | null>(null);

  /** 아이콘 시각적 강조/위험 색조 톤 (예: 닫기/종료 액션용 danger) */
  readonly tone = input<'default' | 'danger' | 'primary' | 'warning' | 'success'>('default');

  /** 툴팁/액세서빌리티 보조 텍스트 */
  readonly title = input<string | null>(null);

  /** 누적 실행 횟수 또는 알림 뱃지 */
  readonly badge = input<string | number | null>(null);

  /** 뱃지 색조 */
  readonly badgeTone = input<'primary' | 'danger' | 'warning' | 'success'>('primary');

  /** 독 바 러닝 인디케이터 닷 표시 여부 */
  readonly running = input<boolean>(false);

  /** 독 실행/바운스 애니메이션 활성화 여부 */
  readonly bouncing = input<boolean>(false);

  /** 현재 선택/활성화 상태 */
  readonly active = input<boolean>(false);

  /** 상호작용 가능한 버튼 형태 여부 */
  readonly interactive = input<boolean>(true);

  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);

  /** 광택(Sheen/Gloss) 오버레이 활성화 여부 */
  readonly sheen = input<boolean>(true);

  /** 앱 클릭 이벤트 */
  readonly appClick = output<MouseEvent>();

  /** 이미지 로드 실패 상태 추적 */
  protected readonly imageFailed = signal<boolean>(false);

  /** 이미지 유효성 계산 */
  protected readonly hasValidImage = computed(() => {
    return !!this.iconSrc() && !this.imageFailed();
  });

  /** 라벨 표시 여부 계산 (springboard는 기본 표시, dock은 showLabel() true일 때 표시) */
  protected readonly shouldDisplayLabel = computed(() => {
    if (!this.label()) return false;
    if (this.showLabel() !== null) return !!this.showLabel();
    return this.variant() === 'springboard';
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }

  onClick(event: MouseEvent): void {
    if (this.disabled() || !this.interactive()) return;
    this.appClick.emit(event);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || !this.interactive()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.appClick.emit(event as unknown as MouseEvent);
    }
  }
}
