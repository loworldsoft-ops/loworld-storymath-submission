
import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { LwAvatarComponent } from '../../../../ui/data-display/avatar/avatar.component';
import { CurriculumRoom } from '../../../../services/models/curriculum.model';
import { studyRoomStatusBadge } from '../../../../services/utils/classroom-status-badge';
import { countryFlagEmoji } from '../../../../services/utils/country-flags';

/**
 * 학습실 정보와 단계 진행률을 표시하는 강의실 카드 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-classroom-card',
  standalone: true,
  imports: [LwBadgeComponent, LwCardComponent, LwAvatarComponent],
  templateUrl: './classroom-card.component.html',
  styleUrl: './classroom-card.component.scss',
})
export class LwClassroomCardComponent {
  readonly room = input.required<CurriculumRoom>();
  readonly selected = input(false);
  readonly select = output<string>();

  readonly progressCells = Array.from({ length: 16 }, (_, i) => i + 1);

  readonly completedCount = computed(() =>
    this.room().stages.filter(s => !!s.completedAt).length
  );

  readonly initial = computed(() =>
    this.room().menteeName.charAt(0) || '?'
  );

  readonly statusBadge = computed(() => studyRoomStatusBadge(this.room().status));

  /** 멤버(멘티)의 나라 국기 이모지 */
  readonly countryFlag = computed(() => countryFlagEmoji(this.room().groupId));
}

export { LwClassroomCardComponent as LwStudyRoomCardComponent };
