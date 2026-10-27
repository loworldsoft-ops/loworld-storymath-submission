import { injectTheme } from '../../../services/theme/lw-theme.util';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { LwDialogService } from '../../../services/services/lw-dialog.service';
import { LwModalComponent } from '../modal/modal.component';

@Component({
  selector: 'lw-dialog-host',
  standalone: true,
  imports: [LwModalComponent],
  templateUrl: './lw-dialog-host.component.html',
  styleUrl: './lw-dialog-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-lw-theme]': 'resolvedTheme()',
    '[class.is-dark]': 'isDark()',
  },
})
export class LwDialogHostComponent implements OnInit, OnDestroy {
  // 테마는 상속이 아니라 주입으로 받는다.
  private readonly themeContext = injectTheme();
  readonly themeMode = this.themeContext.themeMode;
  readonly resolvedTheme = this.themeContext.resolvedTheme;
  readonly isDark = this.themeContext.isDark;

  protected readonly dialog = inject(LwDialogService);
  protected readonly hostId = `dialog-host-${Math.random().toString(36).slice(2, 9)}`;
  private unregisterHost: (() => void) | null = null;

  /** 여러 셸/컴포넌트에 중복 마운트되더라도 오직 최초(Primary) 등록된 1개 호스트만 렌더링 */
  protected readonly shouldRender = computed(() => {
    return this.dialog.primaryHostId() === this.hostId && this.dialog.active() !== null;
  });

  ngOnInit(): void {
    const reg = this.dialog.registerHost(this.hostId);
    this.unregisterHost = reg.unregister;
  }

  ngOnDestroy(): void {
    this.unregisterHost?.();
    this.unregisterHost = null;
  }

  protected onCancel(): void {
    this.dialog.resolve(false);
  }

  protected onConfirm(): void {
    this.dialog.resolve(true);
  }
}
