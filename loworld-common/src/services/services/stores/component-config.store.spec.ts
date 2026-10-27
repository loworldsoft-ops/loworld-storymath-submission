import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LwComponentConfigStore } from './component-config.store';

describe('LwComponentConfigStore', () => {
  let store: LwComponentConfigStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LwComponentConfigStore],
    });
    store = TestBed.inject(LwComponentConfigStore);
  });

  it('기본 상태에서는 모든 설정이 비활성화(false)이다', () => {
    expect(store.tooltipsEnabled()).toBe(false);
    expect(store.buttonTooltipsEnabled()).toBe(false);
    expect(store.componentTooltipsEnabled()).toBe(false);
    expect(store.titlebarButtonLabelsEnabled()).toBe(false);
    expect(store.consoleLogsEnabled()).toBe(false);
  });

  it('toggleTooltips 호출 시 툴팁 활성화 상태가 반전된다', () => {
    store.toggleTooltips();
    expect(store.tooltipsEnabled()).toBe(true);

    store.toggleTooltips();
    expect(store.tooltipsEnabled()).toBe(false);
  });

  it('setButtonTooltipsEnabled로 버튼 툴팁을 명시적으로 제어할 수 있다', () => {
    store.setButtonTooltipsEnabled(true);
    expect(store.buttonTooltipsEnabled()).toBe(true);

    store.setButtonTooltipsEnabled(false);
    expect(store.buttonTooltipsEnabled()).toBe(false);
  });

  it('toggleTitlebarButtonLabels로 타이틀바 라벨 표시 여부를 토글한다', () => {
    store.toggleTitlebarButtonLabels();
    expect(store.titlebarButtonLabelsEnabled()).toBe(true);
  });

  it('toggleConsoleLogs로 개발 콘솔 텔레메트리 On/Off를 제어한다', () => {
    store.toggleConsoleLogs();
    expect(store.consoleLogsEnabled()).toBe(true);
  });
});
