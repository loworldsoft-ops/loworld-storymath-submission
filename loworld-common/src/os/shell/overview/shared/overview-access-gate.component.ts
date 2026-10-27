import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * OS 접근 권한 제한 안내 및 로그인 유도를 제공하는 게이트 컴포넌트입니다.
 */
@Component({
  standalone: true,
  imports: [LwButtonComponent],
  selector: 'lw-os-access-gate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-access-gate.component.html',
  styleUrl: './overview-access-gate.component.scss',
})
export class OverviewAccessGateComponent {
  badgeLabel = input('Access Restricted');
  title = input.required<string>();
  description = input.required<string>();
  ctaLabel = input('로그인');

  ctaRequested = output<void>();
}