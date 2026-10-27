import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LwInfoBadgeVariant, LwInfoBadgeTone, LwInfoBadgeSize } from './informational-badge.types';

@Component({
  selector: 'lw-informational-badge, lw-info-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informational-badge.component.html',
  styleUrls: ['./informational-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInformationalBadgeComponent {
  /** 뱃지 텍스트 라벨 */
  readonly label = input<string>('');

  /** 앞단 아이콘 (이모지 또는 심볼) */
  readonly icon = input<string>('');

  /** 뒷단 보조 아이콘 */
  readonly trailingIcon = input<string>('');

  /** 시각적 변형 형태 */
  readonly variant = input<LwInfoBadgeVariant>('stream');

  /** 감성/상태 색상 톤 */
  readonly tone = input<LwInfoBadgeTone>('accent');

  /** 크기 규격 (기본 md) */
  readonly size = input<LwInfoBadgeSize>('md');

  /** 클릭 가능 여부 */
  readonly clickable = input<boolean>(false);

  /** 로딩 상태 여부 */
  readonly loading = input<boolean>(false);

  /** 클릭 이벤트 핸들러 */
  readonly badgeClick = output<void>();

  handleClick(): void {
    if (this.clickable() && !this.loading()) {
      this.badgeClick.emit();
    }
  }
}
