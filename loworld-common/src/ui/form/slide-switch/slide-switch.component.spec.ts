import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { LwSlideSwitchComponent } from './slide-switch.component';

describe('LwSlideSwitchComponent', () => {
  let fixture: ComponentFixture<LwSlideSwitchComponent>;
  let component: LwSlideSwitchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LwSlideSwitchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LwSlideSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('기본 상태에서는 checked가 false이다', () => {
    expect(component.checked()).toBe(false);
  });

  it('onToggle 호출 시 값이 반전되고 toggle 이벤트가 발생한다', () => {
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);

    const stopPropagation = vi.fn();
    const fakeEvent = { stopPropagation } as unknown as Event;

    component.onToggle(fakeEvent);

    expect(stopPropagation).toHaveBeenCalled();
    expect(component.value()).toBe(true);
    expect(toggleSpy).toHaveBeenCalledWith(fakeEvent);

    // 다시 토글하면 false가 된다
    component.onToggle(fakeEvent);
    expect(component.value()).toBe(false);
  });

  it('호스트 클래스는 checked 또는 value에 따라 is-checked를 갖는다', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList.contains('is-checked')).toBe(false);

    const fakeEvent = { stopPropagation: vi.fn() } as unknown as Event;
    component.onToggle(fakeEvent);
    fixture.detectChanges();

    expect(el.classList.contains('is-checked')).toBe(true);
  });
});
