import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwUIElement } from '../../../services/base/lw-ui-element';

@Component({
  selector: 'lw-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
})
export class LwSectionHeaderComponent extends LwUIElement {
  /** 아이브로우 소제목 영문/태그 (예: 'Badge Style Taxonomy & Share Breakdown') */
  readonly subtitle = input<string>('');

  /** 메인 섹션 제목 (예: '📊 6대 정보성 배지 패밀리 분석 & 분포') */
  readonly title = input<string>('');

  /** 섹션 상세 설명 */
  readonly description = input<string>('');

  /** 타이틀 앞 아이콘 (옵션) */
  readonly icon = input<string>('');

  /** 카운트나 상태를 나타내는 배지 (옵션) */
  readonly badge = input<string>('');

  /** 레이아웃 정렬 옵션 */
  readonly align = input<'left' | 'center' | 'between'>('left');
}
