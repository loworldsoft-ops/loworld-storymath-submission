import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LwBadgeComponent } from '../../../../ui/data-display/badge/badge.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import { DeviceMode } from './device-mode.policy';
import { DeviceModeService } from './device-mode.service';

/**
 * 데스크톱 화면에서 스마트폰 모드를 볼 때 쓰는 기종 프레임과 제어 바.
 *
 * 모바일 OS 화면은 콘텐츠로 받아 프레임 안에 그린다. 실제 모바일 화면에서는 이 컴포넌트를 만들지 않는다.
 */
@Component({
  selector: 'lw-device-simulator',
  standalone: true,
  imports: [LwButtonComponent, LwBadgeComponent, LwTooltipDirective],
  templateUrl: './device-simulator.component.html',
  styleUrl: './device-simulator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceSimulatorComponent {
  protected readonly device = inject(DeviceModeService);

  /** 프레임 뒤에 흐리게 까는 배경 이미지 주소 */
  readonly backdropUrl = input.required<string>();
  readonly backdropBlur = input<number>(0);
  readonly statusLabel = input<string>('');
  /** 열린 앱이 없는 상태 */
  readonly idle = input<boolean>(false);

  readonly homeRequested = output<void>();
  readonly deviceModeChange = output<DeviceMode>();
  readonly wallpaperRequested = output<void>();
  readonly settingsRequested = output<void>();

  protected readonly backdropImage = computed(() => `url(${this.backdropUrl()})`);
  protected readonly backdropFilter = computed(() => `blur(${this.backdropBlur()}px)`);
  protected readonly presetClass = computed(() => `is-preset-${this.device.selectedPresetId()}`);
  protected readonly cutout = computed(() => this.device.activePreset().cutout);

  /** 기종 버튼 목록. 종류(휴대폰, 태블릿, 전체)가 바뀌는 자리에 구분선을 둔다. */
  protected readonly presetButtons = this.device.presets.map((preset, index, all) => ({
    preset,
    dividerBefore: index > 0 && all[index - 1].category !== preset.category,
  }));
}
