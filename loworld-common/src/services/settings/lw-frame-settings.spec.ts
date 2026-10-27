import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { LW_STORAGE_PORT } from '../ports/storage.port';
import {
  LW_FRAME_APP_DEFAULTS,
  LW_FRAME_DEFAULT_SETTINGS,
  LwFrameSettingsStore,
  type LwFrameSettings,
} from './lw-frame-settings';

describe('LwFrameSettingsStore (세 겹 합치기)', () => {
  let mockStorage: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    length: number;
    key: ReturnType<typeof vi.fn>;
  };

  const createStore = (appDefaults: Partial<LwFrameSettings> = {}, storedJson: string | null = null) => {
    mockStorage = {
      getItem: vi.fn().mockReturnValue(storedJson),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LwFrameSettingsStore,
        { provide: LW_STORAGE_PORT, useValue: mockStorage },
        { provide: LW_FRAME_APP_DEFAULTS, useValue: appDefaults },
      ],
    });

    return TestBed.inject(LwFrameSettingsStore);
  };

  it('아무 설정도 없을 때 공통의 플랫폼 기본값(1겹)을 가진다', () => {
    const store = createStore({}, null);
    expect(store.value()).toEqual(LW_FRAME_DEFAULT_SETTINGS);
    expect(store.customized()).toBe(false);
  });

  it('앱의 기본값이 주어지면 플랫폼 기본값을 덮어쓴다(2겹 합치기)', () => {
    const store = createStore({ navSide: 'end', density: 'compact' }, null);

    expect(store.value().navSide).toBe('end');
    expect(store.value().density).toBe('compact');
    // 사용자가 바꾼 것은 아니므로 customized는 false
    expect(store.customized()).toBe(false);
  });

  it('사용자가 설정을 바꾸면 앱 기본값을 덮어쓰고 스토리지에 저장된다(3겹 합치기)', () => {
    const store = createStore({ navSide: 'end', density: 'compact' }, null);

    store.set('navSide', 'start');

    expect(store.value().navSide).toBe('start');
    expect(store.value().density).toBe('compact'); // 앱 기본값 유지
    expect(store.customized()).toBe(true);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'loworld.frame-settings',
      JSON.stringify({ navSide: 'start' }),
    );
  });

  it('reset 호출 시 사용자의 설정이 지워지고 스토리지에서 제거된다', () => {
    const store = createStore({ navSide: 'end' }, JSON.stringify({ navSide: 'start' }));

    expect(store.value().navSide).toBe('start');
    expect(store.customized()).toBe(true);

    store.reset();

    expect(store.value().navSide).toBe('end'); // 앱 기본값으로 복귀
    expect(store.customized()).toBe(false);
    expect(mockStorage.removeItem).toHaveBeenCalledWith('loworld.frame-settings');
  });

  it('스토리지에 유효하지 않은 키나 선택지가 저장되어 있어도 안전하게 무시한다', () => {
    const corruptData = JSON.stringify({
      navSide: 'invalid-side-value',
      unknownHackKey: 'malicious',
      density: 'compact',
    });

    const store = createStore({}, corruptData);

    // invalid-side-value는 필터링되어 플랫폼 기본값 유지
    expect(store.value().navSide).toBe(LW_FRAME_DEFAULT_SETTINGS.navSide);
    // 올바른 density 선택지는 로드됨
    expect(store.value().density).toBe('compact');
  });
});
