import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { EVENT_LOGGER } from '../../../services/tokens/event-logger.token';

/**
 * 시스템 및 사용자 인터랙션 이벤트 발생 로그를 실시간으로 표시하는 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-event-log',
  standalone: true,
  styleUrl: './event-log.component.scss',
  templateUrl: './event-log.component.html',
})
export class EventLogComponent {
  protected readonly log = inject(EVENT_LOGGER);
}
