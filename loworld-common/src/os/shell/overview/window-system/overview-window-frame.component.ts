import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { LW_VIEWPORT } from '../../../../services/viewport/lw-viewport-context';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewIconId, OverviewWindowSize } from '../../../../services/models/os.types';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';
import { OverviewWindowFullscreenCapsuleComponent } from './overview-window-fullscreen-capsule.component';
import { OverviewWindowSessionButtonComponent } from './overview-window-session-button.component';

import { LwCloseButtonComponent } from '../../../../ui/navigation/close-button/close-button.component';

/**
 * 윈도우 프레임 통합 파라미터 객체 인터페이스 (ISP 원칙 준수)
 */
export interface OverviewWindowFrameConfig {
  readonly title: string;
  readonly icon: OverviewIconId;
  readonly active?: boolean;
  readonly minimized?: boolean;
  readonly maximized?: boolean;
  readonly size?: OverviewWindowSize;
  readonly zIndex?: number;
  readonly offset?: number;
  readonly showSessionControl?: boolean;
  readonly memberSession?: LwMemberAuthSessionView | null;
  readonly showTitlebar?: boolean;
}

@Component({
  standalone: true,
  imports: [
    OverviewIconComponent,
    OverviewWindowSessionButtonComponent,
    OverviewWindowFullscreenCapsuleComponent,
    LwCloseButtonComponent,
  ],
  selector: 'lw-os-window-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  
  templateUrl: './overview-window-frame.component.html',
  styleUrl: './overview-window-frame.component.scss',
})
export class OverviewWindowFrameComponent {
  private readonly lifecycleLog = injectLifecycleLog('OverviewWindowFrameComponent', 'APP');

  /** 통합 윈도우 설정 객체 (권장) */
  config = input<OverviewWindowFrameConfig | null>(null);

  /** 개별 Input 하위 호환성 유지 */
  titleInput = input<string>('', { alias: 'title' });
  iconInput = input<OverviewIconId>('windows', { alias: 'icon' });
  activeInput = input(false, { alias: 'active' });
  minimizedInput = input(false, { alias: 'minimized' });
  maximizedInput = input(false, { alias: 'maximized' });
  sizeInput = input<OverviewWindowSize>('desktop', { alias: 'size' });
  zIndexInput = input(1, { alias: 'zIndex' });
  offsetInput = input(0, { alias: 'offset' });
  showSessionControlInput = input(false, { alias: 'showSessionControl' });
  memberSessionInput = input<LwMemberAuthSessionView | null>(null, { alias: 'memberSession' });
  showTitlebarInput = input(true, { alias: 'showTitlebar' });

  readonly title = computed(() => this.config()?.title ?? this.titleInput());
  readonly icon = computed(() => this.config()?.icon ?? this.iconInput());
  readonly active = computed(() => this.config()?.active ?? this.activeInput());
  readonly minimized = computed(() => this.config()?.minimized ?? this.minimizedInput());
  readonly maximized = computed(() => this.config()?.maximized ?? this.maximizedInput());
  readonly size = computed(() => this.config()?.size ?? this.sizeInput());
  readonly zIndex = computed(() => this.config()?.zIndex ?? this.zIndexInput());
  readonly offset = computed(() => this.config()?.offset ?? this.offsetInput());
  readonly showSessionControl = computed(() => this.config()?.showSessionControl ?? this.showSessionControlInput());
  readonly memberSession = computed(() => this.config()?.memberSession ?? this.memberSessionInput());
  readonly showTitlebar = computed(() => this.config()?.showTitlebar ?? this.showTitlebarInput());

  focusRequested = output<void>();
  minimizeRequested = output<void>();
  maximizeRequested = output<void>();
  closeRequested = output<void>();
  loginRequested = output<void>();
  accountRequested = output<void>();

  protected windowFrameRef = viewChild<ElementRef<HTMLElement>>('windowFrame');
  private readonly viewport = inject(LW_VIEWPORT);

  /** 일반 윈도우 드래그 위치 상태 */
  protected windowX = signal<number | null>(null);
  protected windowY = signal<number | null>(null);
  protected isWindowPositioned = signal<boolean>(false);
  protected isWindowDragging = signal<boolean>(false);

  private windowDragStartX = 0;
  private windowDragStartY = 0;
  private windowElemStartX = 0;
  private windowElemStartY = 0;

  protected onFocus(): void {
    this.focusRequested.emit();
  }

  protected onMinimize(event: MouseEvent): void {
    event.stopPropagation();
    this.minimizeRequested.emit();
  }

  protected onMaximize(event: MouseEvent): void {
    event.stopPropagation();
    this.maximizeRequested.emit();
  }

  protected onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.closeRequested.emit();
  }

  protected onFloatingClose(): void {
    this.closeRequested.emit();
  }

  protected onFloatingRestore(event?: MouseEvent): void {
    event?.stopPropagation();
    this.maximizeRequested.emit();
  }

  protected onLogin(event?: MouseEvent): void {
    event?.stopPropagation();
    this.loginRequested.emit();
  }

  protected onAccount(event?: MouseEvent): void {
    event?.stopPropagation();
    this.accountRequested.emit();
  }

  /* ── Draggable Window Titlebar Handlers ────────────────────── */

  protected onTitlebarPointerDown(event: PointerEvent): void {
    if (this.maximized()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, lw-button, a, input, [role="button"], .traffic-btn, .overview-window-session-button')) {
      return;
    }
    if (event.button !== 0) return;

    this.onFocus();

    const elem = this.windowFrameRef()?.nativeElement;
    if (!elem) return;

    event.preventDefault();
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    const rect = elem.getBoundingClientRect();
    const parentRect = elem.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    this.windowElemStartX = rect.left - parentRect.left;
    this.windowElemStartY = rect.top - parentRect.top;
    this.windowDragStartX = event.clientX;
    this.windowDragStartY = event.clientY;

    this.windowX.set(this.windowElemStartX);
    this.windowY.set(this.windowElemStartY);
    this.isWindowPositioned.set(true);
    this.isWindowDragging.set(true);
  }

  protected onTitlebarPointerMove(event: PointerEvent): void {
    if (!this.isWindowDragging()) return;
    const elem = this.windowFrameRef()?.nativeElement;
    if (!elem) return;

    const deltaX = event.clientX - this.windowDragStartX;
    const deltaY = event.clientY - this.windowDragStartY;

    const parent = elem.offsetParent as HTMLElement | null;
    const parentWidth = parent ? parent.clientWidth : this.viewport.width();
    const parentHeight = parent ? parent.clientHeight : this.viewport.height();

    const width = elem.offsetWidth;
    const minTop = 0;
    const maxTop = Math.max(0, parentHeight - 42);
    const minLeft = -(width - 120);
    const maxLeft = parentWidth - 120;

    const nextX = Math.max(minLeft, Math.min(maxLeft, this.windowElemStartX + deltaX));
    const nextY = Math.max(minTop, Math.min(maxTop, this.windowElemStartY + deltaY));

    this.windowX.set(nextX);
    this.windowY.set(nextY);
  }

  protected onTitlebarPointerUp(event: PointerEvent): void {
    if (!this.isWindowDragging()) return;
    try {
      if ((event.currentTarget as HTMLElement)?.hasPointerCapture(event.pointerId)) {
        (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    this.isWindowDragging.set(false);
  }

  protected onTitlebarDblClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, lw-button, a, input, [role="button"], .traffic-btn, .overview-window-session-button')) {
      return;
    }
    this.onMaximize(event);
  }
}