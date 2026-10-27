import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwDocumentSettingsDialogComponent } from '../../../../patterns/surface/dialogs/document-settings-dialog/document-settings-dialog.component';
import type { LwModalWindowStyle } from '../../../../ui/overlay/modal/modal.types';

/**
 * OS 모양 및 테마 설정 대화상자를 호스팅하는 컴포넌트입니다.
 */
@Component({
  selector: 'lw-os-settings-dialog-host',
  standalone: true,
  imports: [LwDocumentSettingsDialogComponent],
  templateUrl: './overview-settings-dialog-host.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewSettingsDialogHostComponent {
  readonly presentation = input<'modal' | 'sheet' | 'content' | 'embedded' | 'auto'>('auto');
  readonly mode = input<string>('document');
  readonly brandName = input<string | null>(null);
  readonly windowLaunchMode = input<'normal' | 'maximized' | null>(null);
  readonly hideWindowMode = input<boolean>(false);
  readonly showWallpaperSetting = input<boolean>(false);
  readonly windowControls = input<boolean>(true);
  readonly windowStyle = input<LwModalWindowStyle>('os-desktop');
  readonly draggable = input<boolean>(true);

  readonly windowLaunchModeChange = output<'normal' | 'maximized'>();
  readonly wallpaperRequested = output<void>();
  readonly close = output<void>();
}
