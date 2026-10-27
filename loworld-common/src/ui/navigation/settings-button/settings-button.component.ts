import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type LwActionEvent } from '../../../services/models/action-event.model';
import { type LwSize } from '../../../services/tokens/global.tokens';
import { LwButtonComponent } from '../../form/button/button.component';
import type { LwButtonShape, LwButtonVariant } from '../../form/button/button.types';

/**
 * 전사 표준 설정 버튼 컴포넌트 (`<lw-settings-button>`).
 * 타이틀바, 작업표시줄, 셸 상단 바 등에서 일관된 톱니바퀴 아이콘과 토글 동작을 제공합니다.
 */
@Component({
  selector: 'lw-settings-button',
  standalone: true,
  imports: [CommonModule, LwButtonComponent],
  templateUrl: './settings-button.component.html',
  styleUrl: './settings-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwSettingsButtonComponent {
  /** 설정창 열림(활성화) 상태 */
  readonly active = input<boolean>(false);
  /** 텍스트 라벨 표시 여부 (기본값 true) */
  readonly showLabel = input<boolean>(true);
  /** 버튼 라벨 텍스트 */
  readonly label = input<string>('설정');
  /** 버튼 시각 변형 */
  readonly variant = input<LwButtonVariant>('secondary');
  /** 버튼 크기 */
  readonly size = input<LwSize>('md');
  /** 버튼 형상 */
  readonly shape = input<LwButtonShape>('default');
  /** 비활성화 여부 */
  readonly disabled = input<boolean>(false);
  /** 커스텀 클래스 */
  readonly customClass = input<string>('');

  /** 설정 토글 이벤트 방출 */
  readonly toggle = output<void>();
  /** 타이틀바 호환 표준 액션 이벤트 방출 */
  readonly actionEvent = output<LwActionEvent<void>>();

  protected readonly resolvedTitle = computed(() => this.label());

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.toggle.emit();
    this.actionEvent.emit({
      actionId: 'TOGGLE_SETTINGS',
      payload: undefined,
      source: 'lw-settings-button',
    });
  }
}
