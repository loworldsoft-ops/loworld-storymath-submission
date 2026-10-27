import type { DomainDefinition, WindowTabRegistration } from './host.types';
import type { LwFrameSettings } from '../services/settings/lw-frame-settings';
import type { LwAppearanceDefaults } from '../services/theme/lw-appearance.model';
import type { LwFirebaseConfig } from '../firebase/showcase-firebase.client';

/** 네이티브 셸(APK)로 묶을 때의 설정. 묶기 명령(scripts/package-native.mjs)이 읽는다. */
export interface LwNativeSettings {
  /** 폰의 앱 목록에 보이는 이름 */
  readonly name: string;
  /** 공통의 정적 자원(public/assets) 가운데 넣을 폴더. 없으면 모두 넣는다 */
  readonly assets?: readonly string[];
  /** 화면 방향. 없으면 기기를 따른다 */
  readonly orientation?: 'landscape' | 'portrait';
  /** 사람이 보는 버전 */
  readonly version?: string;
  /** 올릴 때마다 1씩 는다. 스토어와 덮어 깔기가 이것으로 새것을 안다 */
  readonly versionCode?: number;
  /** 서버를 쓰지 않는 오프라인 앱 여부. 묶을 때 Firebase를 뺀다 */
  readonly offline?: boolean;
}

/**
 * 앱 저장소가 내보내는 선언서다. 앱은 자기가 어디서 뜨는지 모르고 이것만 내보낸다.
 * 쇼케이스는 여러 앱의 선언서를 모아 OS 화면에 띄우고, 단독 실행은 하나만 받아 전체 화면으로 띄운다.
 */
export interface LwAppManifest {
  /** 저장소 이름의 뒤쪽이다 (`loworld-app-<id>`). */
  readonly id: string;
  /** OS의 실행 목록에 보일 정의. */
  readonly domain: DomainDefinition;
  /** 이 앱의 화면을 창으로 띄우는 등록. 화면은 `loadComponent`로 늦게 불러온다. */
  readonly windowTabs: readonly WindowTabRegistration[];
  /** 이 앱이 정하는 틀의 기본값. 사용자가 설정 화면에서 바꿀 수 있다. 단독 실행에서 쓰인다. */
  readonly frame?: Partial<LwFrameSettings>;
  /** 이 앱이 처음 뜰 때의 모양. 사용자가 설정에서 바꾸면 그것이 이긴다. 단독 실행에서 쓰인다. */
  readonly appearance?: LwAppearanceDefaults;
  /** 네이티브 셸(APK)로 묶을 때의 설정. */
  readonly native?: LwNativeSettings;
  /** 단독으로 띄울 때 처음 여는 탭. 모바일에서는 그 탭의 `mobileTab`을 연다. */
  readonly homeTab: string;
  /** 이 앱이 필요로 하는 공통 저장소 ('note', 'calendar' 등). 선언하지 않으면 주입하지 않는다 */
  readonly repositories?: readonly ('note' | 'calendar')[];
}

export interface LwEnvironment {
  readonly id: string;
  readonly firebase?: LwFirebaseConfig;
  /**
   * 콘텐츠의 기준 주소. `{id}` 자리에 콘텐츠 id가 들어간다.
   * 개발: '/content/{id}' (prepare.mjs가 옆의 콘텐츠 저장소 dist를 잇는다), 출시: 'https://loworld-content-{id}.pages.dev'
   */
  readonly contentBaseUrl?: string;
}
