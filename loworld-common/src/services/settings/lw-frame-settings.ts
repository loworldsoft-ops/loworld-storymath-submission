import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { LW_STORAGE_PORT } from '../ports/storage.port';

/**
 * 앱의 틀(헤더, 사이드 메뉴)을 어떻게 놓을지의 설정이다.
 * 앱의 코드를 고치지 않고 틀을 바꾸려는 것이다. 틀을 그리는 공통 부품이 이 값을 읽어 스스로 바뀐다.
 */
export interface LwFrameSettings {
  /** 사이드 메뉴를 어느 쪽에 둘지. */
  readonly navSide: 'start' | 'end';
  /** 사이드 메뉴를 보일지. */
  readonly nav: 'shown' | 'hidden';
  /** 헤더를 보일지. */
  readonly header: 'shown' | 'hidden';
  /** 사이드 메뉴의 너비. */
  readonly navWidth: 'narrow' | 'normal' | 'wide';
  /** 화면의 밀도. 촘촘하게 하면 같은 자리에 더 많이 보인다. */
  readonly density: 'comfortable' | 'compact';
  /** 헤더의 디자인 종류. */
  readonly headerVariant: 'default' | 'minimal' | 'floating';
  /** 사이드 메뉴의 디자인 종류. */
  readonly navVariant: 'default' | 'minimal' | 'floating';
  /** 모바일 하단 바를 보일지. */
  readonly bottomBar: 'shown' | 'hidden';
  /** 모바일 하단 바의 디자인 종류. */
  readonly bottomBarVariant: 'default' | 'floating';
  /** 모바일 하단 바의 단추 아래에 이름을 적을지. */
  readonly bottomBarLabels: 'shown' | 'hidden';
}

export const LW_FRAME_DEFAULT_SETTINGS: LwFrameSettings = {
  navSide: 'start',
  nav: 'shown',
  header: 'shown',
  navWidth: 'normal',
  density: 'comfortable',
  headerVariant: 'default',
  navVariant: 'default',
  bottomBar: 'shown',
  bottomBarVariant: 'default',
  bottomBarLabels: 'shown',
};

/** 설정 화면이 그릴 항목의 선언. 고를 수 있는 것은 여기 적힌 것뿐이다. */
export const LW_FRAME_SETTING_ITEMS: readonly { key: keyof LwFrameSettings; label: string; choices: readonly { value: string; label: string }[] }[] = [
  { key: 'header', label: '헤더 표시', choices: [{ value: 'shown', label: '보이기' }, { value: 'hidden', label: '숨기기' }] },
  { key: 'headerVariant', label: '헤더 스타일', choices: [{ value: 'default', label: '기본' }, { value: 'minimal', label: '미니멀' }, { value: 'floating', label: '플로팅' }] },
  { key: 'nav', label: '사이드 메뉴 표시', choices: [{ value: 'shown', label: '보이기' }, { value: 'hidden', label: '숨기기' }] },
  { key: 'navVariant', label: '사이드 메뉴 스타일', choices: [{ value: 'default', label: '기본' }, { value: 'minimal', label: '미니멀' }, { value: 'floating', label: '플로팅' }] },
  { key: 'navSide', label: '사이드 메뉴 위치', choices: [{ value: 'start', label: '왼쪽' }, { value: 'end', label: '오른쪽' }] },
  { key: 'navWidth', label: '사이드 메뉴 너비', choices: [{ value: 'narrow', label: '좁게' }, { value: 'normal', label: '보통' }, { value: 'wide', label: '넓게' }] },
  { key: 'density', label: '화면 밀도', choices: [{ value: 'comfortable', label: '보통' }, { value: 'compact', label: '촘촘하게' }] },
  { key: 'bottomBar', label: '모바일 하단 바', choices: [{ value: 'shown', label: '보이기' }, { value: 'hidden', label: '숨기기' }] },
  { key: 'bottomBarVariant', label: '모바일 하단 바 스타일', choices: [{ value: 'default', label: '기본' }, { value: 'floating', label: '플로팅' }] },
  { key: 'bottomBarLabels', label: '모바일 하단 바 이름', choices: [{ value: 'shown', label: '보이기' }, { value: 'hidden', label: '숨기기' }] },
];

/** 앱이 정하는 기본값. 단독 실행에서 그 앱의 선언서가 넣는다. 없으면 공통의 기본값이다. */
export const LW_FRAME_APP_DEFAULTS = new InjectionToken<Partial<LwFrameSettings>>('LW_FRAME_APP_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({}),
});

const STORAGE_KEY = 'loworld.frame-settings';

/**
 * 틀의 설정을 세 겹으로 합친다. 공통의 기본값 ← 앱의 기본값 ← 사용자가 설정 화면에서 바꾼 값.
 * 사용자의 값은 브라우저에 남는다.
 */
@Injectable({ providedIn: 'root' })
export class LwFrameSettingsStore {
  private readonly storage = inject(LW_STORAGE_PORT);
  private readonly appDefaults = inject(LW_FRAME_APP_DEFAULTS);
  private readonly user = signal<Partial<LwFrameSettings>>(this.load());
  /** 사용자가 설정 화면에서 바꾼 값만. 틀은 여기에 자기가 놓인 앱의 기본값을 깔아 쓴다. */
  readonly userValue = this.user.asReadonly();

  readonly value = computed<LwFrameSettings>(() => ({ ...LW_FRAME_DEFAULT_SETTINGS, ...this.appDefaults, ...this.user() }));
  /** 사용자가 바꾼 것이 있는지. */
  readonly customized = computed(() => Object.keys(this.user()).length > 0);

  set<K extends keyof LwFrameSettings>(key: K, value: LwFrameSettings[K]): void {
    this.user.update((current) => ({ ...current, [key]: value }));
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.user()));
  }

  /** 사용자가 바꾼 것을 지우고 앱의 기본값으로 돌아간다. */
  reset(): void {
    this.user.set({});
    this.storage.removeItem(STORAGE_KEY);
  }

  private load(): Partial<LwFrameSettings> {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      // 선언에 없는 값은 버린다.
      const clean: Record<string, unknown> = {};
      for (const item of LW_FRAME_SETTING_ITEMS) {
        if (item.choices.some((choice) => choice.value === parsed[item.key])) clean[item.key] = parsed[item.key];
      }
      return clean as Partial<LwFrameSettings>;
    } catch {
      return {};
    }
  }
}
