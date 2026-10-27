import { Directive, ElementRef, computed, inject, input, output } from '@angular/core';

/**
 * 모양 없는 "누를 수 있는 것". 동작만 준다.
 *
 * - 주는 것: 역할(`role`), 초점 순서, Enter·Space로 누르기, 비활성 처리, 눌림 표시(`data-pressed`).
 * - 주지 않는 것: 색, 테두리, 크기. 모양은 쓰는 쪽의 스타일이 정한다.
 *
 * 디자인 시스템 모양의 버튼이 필요하면 `lw-button`을 쓴다.
 * 고유한 모양이 필요한 곳(메뉴 항목, 게임 화면의 칸 등)에서 `lw-button`의 모양을 덮어쓰는 대신 이것을 쓴다.
 *
 * ```html
 * <button lwPressable class="os-menu__item" (press)="open()">설정</button>
 * <div lwPressable [disabled]="locked()" (press)="equip()">…</div>
 * ```
 */
@Directive({
  selector: '[lwPressable]',
  standalone: true,
  host: {
    '[attr.role]': 'hostRole()',
    '[attr.tabindex]': 'hostTabindex()',
    '[attr.type]': 'isNativeButton ? "button" : null',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-pressed]': 'pressed() ? "" : null',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class LwPressableDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly disabled = input<boolean>(false);
  /** 켜짐/꺼짐이 있는 단추일 때 지금 켜져 있는지. `data-pressed`로 드러난다. */
  readonly pressed = input<boolean>(false);
  /** 기본 역할(`button`) 대신 쓸 역할. 예: `menuitem`, `tab`. */
  readonly role = input<string | null>(null);

  /** 눌렀을 때. 비활성이면 나가지 않는다. */
  readonly press = output<Event>();

  protected readonly isNativeButton = this.el.nativeElement.tagName === 'BUTTON';
  private readonly isNativeInteractive = this.isNativeButton || this.el.nativeElement.tagName === 'A';

  protected readonly hostRole = computed(() => this.role() ?? (this.isNativeInteractive ? null : 'button'));
  protected readonly hostTabindex = computed(() => {
    if (this.isNativeInteractive) return null;
    return this.disabled() ? -1 : 0;
  });

  protected onClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.press.emit(event);
  }

  protected onKey(event: Event): void {
    // 네이티브 버튼과 링크는 브라우저가 Enter·Space를 클릭으로 바꿔 준다.
    if (this.isNativeInteractive) return;
    event.preventDefault();
    if (!this.disabled()) this.press.emit(event);
  }
}
