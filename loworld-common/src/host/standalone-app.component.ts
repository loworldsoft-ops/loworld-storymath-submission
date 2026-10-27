import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LwDialogHostComponent } from '../ui/overlay/dialog/lw-dialog-host.component';
import { LwSnackbarHostComponent } from '../ui/overlay/snackbar/lw-snackbar-host.component';

/**
 * 앱 단독 실행(standalone) 전용 초경량 루트 컴포넌트입니다.
 * OS 창 관리자, 작업표시줄, 시뮬레이터, 바탕화면 등의 OS 셸 의존성을 완전히 배제하고
 * 순수 앱 화면과 필수 오버레이(다이얼로그, 스낵바)만을 렌더링합니다.
 */
@Component({
  selector: 'lw-root',
  standalone: true,
  imports: [RouterOutlet, LwDialogHostComponent, LwSnackbarHostComponent],
  templateUrl: './standalone-app.component.html',
  styleUrl: './standalone-app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandaloneAppComponent {}
