import { Injectable, computed, inject, signal } from '@angular/core';
import { LW_VIEWPORT } from '../../../../services/viewport/lw-viewport-context';
import { injectLocalStorage } from '../../../../services/utils/storage.util';
import { DeviceMode, preferenceFor, resolveAutoDeviceMode, shouldSimulate } from './device-mode.policy';

export type MobileDevicePresetId =
  | 'fold-cover'
  | 'android-slim'
  | 'iphone-mini'
  | 'iphone-pro'
  | 'galaxy-ultra'
  | 'iphone-max'
  | 'tablet-mini'
  | 'tablet-pro'
  | 'full';

export interface MobileDevicePreset {
  id: MobileDevicePresetId;
  label: string;
  badge: string;
  /** 제어 바에서 묶어 보여 주는 종류. 화면 치수는 시뮬레이터 스타일의 기종별 클래스가 가진다. */
  category: 'phone' | 'tablet' | 'full';
  tooltip: string;
  cutout: 'island' | 'island-max' | 'punch-hole' | 'compact' | 'punch-hole-slim' | 'tablet-cam';
}

export const MOBILE_DEVICE_PRESETS: readonly MobileDevicePreset[] = [
  {
    id: 'fold-cover',
    category: 'phone',
    label: 'Galaxy Z Fold 커버',
    badge: '344',
    tooltip: 'Fold 커버 스크린 (344 × 882 - 초슬림 21:9)',
    cutout: 'punch-hole-slim',
  },
  {
    id: 'android-slim',
    category: 'phone',
    label: 'Android 슬림',
    badge: '360',
    tooltip: '보급형 안드로이드 / 갤럭시 A 시리즈 (360 × 800 - 20:9)',
    cutout: 'punch-hole',
  },
  {
    id: 'iphone-mini',
    category: 'phone',
    label: 'iPhone mini',
    badge: '375',
    tooltip: 'iPhone 12/13 mini (375 × 812 - 노치 컴팩트)',
    cutout: 'compact',
  },
  {
    id: 'iphone-pro',
    category: 'phone',
    label: 'iPhone Pro',
    badge: '393',
    tooltip: 'iPhone 15/16 Pro (393 × 852 - 다이내믹 아일랜드 표준)',
    cutout: 'island',
  },
  {
    id: 'galaxy-ultra',
    category: 'phone',
    label: 'Galaxy Ultra',
    badge: '412',
    tooltip: 'Galaxy S24 Ultra (412 × 915 - 플래그십 펀치홀 대화면)',
    cutout: 'punch-hole',
  },
  {
    id: 'iphone-max',
    category: 'phone',
    label: 'iPhone Pro Max',
    badge: '430',
    tooltip: 'iPhone 15/16 Pro Max (430 × 932 - 다이내믹 아일랜드 대화면)',
    cutout: 'island-max',
  },
  {
    id: 'tablet-mini',
    category: 'tablet',
    label: 'iPad mini',
    badge: '744',
    tooltip: 'iPad mini 6/7세대 (744 × 1133 - 컴팩트 태블릿)',
    cutout: 'tablet-cam',
  },
  {
    id: 'tablet-pro',
    category: 'tablet',
    label: 'iPad Pro 11"',
    badge: '834',
    tooltip: 'iPad Pro 11인치 (834 × 1194 - 프로급 태블릿)',
    cutout: 'tablet-cam',
  },
  {
    id: 'full',
    category: 'full',
    label: '화면 전체 (100%)',
    badge: 'Full',
    tooltip: '화면 전체 꽉 차게 (100% 가변 반응형)',
    cutout: 'compact',
  },
];

const MODE_STORAGE_KEY = 'overview.device-mode';

/**
 * 데스크톱/모바일 모드와 모바일 시뮬레이터 상태.
 *
 * 모드는 파생값이다: 화면과 입력 장치로 정한 기본 모드(`autoMode`)에 사용자 선택을 얹는다.
 * 창 크기가 바뀌어도 사용자 선택은 그대로 남는다.
 */
@Injectable({ providedIn: 'root' })
export class DeviceModeService {
  private readonly viewport = inject(LW_VIEWPORT);
  // 저장 도우미는 문자열을 따옴표 없이 쓰므로 읽고 쓰는 방식을 직접 준다. 빈 값은 "선택 없음"이다.
  private readonly preference = injectLocalStorage<DeviceMode | null>(MODE_STORAGE_KEY, null, {
    serializer: (mode) => mode ?? '',
    deserializer: (raw) => (raw === 'mobile' || raw === 'desktop' ? raw : null),
  });

  private readonly _selectedPresetId = signal<MobileDevicePresetId>('iphone-mini');
  private readonly _menuCollapsed = signal<boolean>(true);
  private readonly _frameless = signal<boolean>(false);

  readonly presets = MOBILE_DEVICE_PRESETS;
  readonly selectedPresetId = this._selectedPresetId.asReadonly();
  readonly isMenuCollapsed = this._menuCollapsed.asReadonly();
  readonly isFrameless = this._frameless.asReadonly();

  readonly activePreset = computed(() => this.presets.find((p) => p.id === this._selectedPresetId()) ?? this.presets[0]);

  /** 화면과 입력 장치로 정한 기본 모드 */
  readonly autoMode = computed<DeviceMode>(() =>
    resolveAutoDeviceMode({
      formFactor: this.viewport.formFactor(),
      coarsePointer: this.viewport.coarsePointer(),
      canHover: this.viewport.canHover(),
    }),
  );

  /** 실제로 적용되는 모드: 사용자 선택이 있으면 그것, 없으면 기본 모드 */
  readonly mode = computed<DeviceMode>(() => this.preference.value() ?? this.autoMode());
  readonly isMobile = computed(() => this.mode() === 'mobile');
  /** 모바일 화면을 기종 프레임 안에 그릴지 */
  readonly simulated = computed(() => shouldSimulate(this.mode(), this.autoMode()));

  setMode(mode: DeviceMode): void {
    this.preference.set(preferenceFor(mode, this.autoMode()));
  }

  toggleMode(): void {
    this.setMode(this.mode() === 'mobile' ? 'desktop' : 'mobile');
  }

  setPreset(presetId: MobileDevicePresetId): void {
    this._selectedPresetId.set(presetId);
  }

  toggleMenu(): void {
    this._menuCollapsed.update((v) => !v);
  }

  toggleFrameless(): void {
    this._frameless.update((v) => !v);
  }
}
