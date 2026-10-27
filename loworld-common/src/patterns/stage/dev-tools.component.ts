import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LwButtonComponent } from '../../ui/form/button/button.component';
import { EVENT_LOGGER } from '../../services/tokens/event-logger.token';
import { EventLogComponent } from '../../ui/feedback/event-log/event-log.component';

/**
 * 개발 도구다. 이벤트 기록과, 저장된 자료를 지우는 단추를 보인다.
 * 무엇을 지우는지는 앱이 안다. 이 컴포넌트는 눌렸다는 것만 알린다.
 */
@Component({
  selector: 'lw-dev-tools',
  imports: [EventLogComponent, LwButtonComponent],
  templateUrl: './dev-tools.component.html',
  styleUrl: './dev-tools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDevToolsComponent {
  protected readonly log = inject(EVENT_LOGGER);
  /** 자료를 되돌리는 단추의 글자. */
  readonly resetLabel = input('🗑 DB 초기화');
  /** 단추에 풀이(툴팁)를 붙일지. */
  readonly hints = input(true);
  /** 앱의 자료를 처음 상태로 되돌려 달라는 요청. */
  readonly resetData = output<void>();
  /** 브라우저에 저장한 것을 지워 달라는 요청. */
  readonly clearStorage = output<void>();
}
