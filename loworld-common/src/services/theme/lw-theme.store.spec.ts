import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { LW_STORAGE_PORT } from '../ports/storage.port';
import {
  LW_APPEARANCE_APP_DEFAULTS,
  LW_APPEARANCE_STORAGE_KEY,
  type LwAppearanceDefaults,
} from './lw-appearance.model';
import { LwThemeStore } from './lw-theme.store';

describe('LwThemeStore (앱 기본 모양과 저장값)', () => {
  let mockStorage: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    length: number;
    key: ReturnType<typeof vi.fn>;
  };

  const createStore = (
    appDefaults: LwAppearanceDefaults = {},
    storedJson: string | null = null,
  ) => {
    mockStorage = {
      getItem: vi.fn().mockImplementation((key: string) => {
        if (key === LW_APPEARANCE_STORAGE_KEY) return storedJson;
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LwThemeStore,
        { provide: LW_STORAGE_PORT, useValue: mockStorage },
        { provide: LW_APPEARANCE_APP_DEFAULTS, useValue: appDefaults },
      ],
    });

    return TestBed.inject(LwThemeStore);
  };

  it('(가) 저장된 값이 없고 앱 기본값이 { scheme: "dark" }이면 resolved()가 dark', () => {
    const store = createStore({ scheme: 'dark' }, null);
    expect(store.scheme()).toBe('dark');
    expect(store.resolved()).toBe('dark');
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('(나) 저장된 값이 light이면 앱 기본값이 있어도 light', () => {
    const stored = JSON.stringify({
      v: 1,
      scheme: 'light',
      skin: 'plain',
      density: 'comfortable',
      motion: 'system',
    });
    const store = createStore({ scheme: 'dark', skin: 'night' }, stored);
    expect(store.scheme()).toBe('light');
    expect(store.resolved()).toBe('light');
  });

  it('(다) 앱 기본값의 skin이 반영된다', () => {
    const store = createStore({ skin: 'night' }, null);
    expect(store.appearanceSkin()).toBe('night');
    expect(store.resolved()).toBe('dark');
    expect(store.effectiveSkin()).toBe('night');
  });
});
