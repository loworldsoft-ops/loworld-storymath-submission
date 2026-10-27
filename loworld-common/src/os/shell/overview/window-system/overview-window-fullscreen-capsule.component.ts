import { LW_STORAGE_PORT } from '../../../../services/ports/storage.port';
import { LwAppConfigInspectorService } from '../../../../services/services/lw-app-config-inspector.service';
import { LwHeightAnalyzerService, LwHeightDebugGroup } from '../../../../services/base/lw-height-analyzer.service';
import { LW_VIEWPORT } from '../../../../services/viewport/lw-viewport-context';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwEmptyStateComponent } from '../../../../ui/data-display/empty-state/empty-state.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwPressableDirective } from '../../../../ui/form/pressable/pressable.directive';
import { LwTooltipDirective } from '../../../../ui/overlay/tooltip/tooltip.directive';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnInit, OnDestroy, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subscription } from 'rxjs';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewWindowSessionButtonComponent } from './overview-window-session-button.component';
import { OverviewIconComponent } from '../../../../ui/media/icon/overview-icon/overview-icon.component';
import type { OverviewIconId } from '../../../../services/models/os.types';
import { OverviewWindowStore } from '../store/overview-window.store';
import { OverviewSessionFacade } from '../facade/overview-session.facade';
import { WallpaperStore } from '../wallpaper/wallpaper.store';
import { AppExecutionModeService } from '../../../platform/app-execution-mode.service';

const STORAGE_KEY = 'loworld_overview_fullscreen_capsule_position';

interface CapsulePosition {
  x: number;
  y: number;
}

/**
 * 앱을 열었을 때 맨 위에 붙는 앱 막대. 앱 이름, 앱 설정·높이 분석, 계정, 내려두기, 닫기를 둔다.
 * 예전에는 화면 위에 떠다니는 캡슐이었다. 드래그 위치 관련 코드는 쓰이지 않으며 다음 정리 때 지운다.
 */
@Component({
  standalone: true,
  imports: [
    LwButtonComponent,
    LwEmptyStateComponent,
    LwIconComponent,
    LwPressableDirective,
    LwTooltipDirective,
    OverviewWindowSessionButtonComponent,
    OverviewIconComponent,
  ],
  selector: 'lw-os-window-fullscreen-capsule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-window-fullscreen-capsule.component.html',
  styleUrl: './overview-window-fullscreen-capsule.component.scss',
})
export class OverviewWindowFullscreenCapsuleComponent
  implements OnInit, OnDestroy
{
  title = input<string>('');
  icon = input<OverviewIconId>('components');
  showSessionControl = input(false);
  memberSession = input<LwMemberAuthSessionView | null>(null);

  closeRequested = output<void>();
  minimizeRequested = output<void>();
  loginRequested = output<void>();
  accountRequested = output<void>();

  protected capsuleRef = viewChild<ElementRef<HTMLElement>>('capsule');

  // 디버거 상태 관리
  protected readonly appConfigInspector = inject(LwAppConfigInspectorService);
  protected readonly windowStore = inject(OverviewWindowStore);
  protected readonly sessionFacade = inject(OverviewSessionFacade);
  protected readonly wallpaperStore = inject(WallpaperStore);
  protected readonly heightAnalyzer = inject(LwHeightAnalyzerService);
  private readonly storagePort = inject(LW_STORAGE_PORT);
  private readonly viewport = inject(LW_VIEWPORT);
  protected readonly executionMode = inject(AppExecutionModeService);

  protected readonly isDebugOpen = signal(false);
  protected readonly activeTab = signal<'height' | 'theme' | 'window' | 'storage'>('height');
  protected readonly debugSnapshot = signal<LwHeightDebugGroup[]>([]);
  protected readonly copySuccess = signal(false);
  private debugSub?: Subscription;

  protected readonly totalElementsCount = computed(() => {
    return this.debugSnapshot().reduce((acc, g) => acc + g.elements.length, 0);
  });

  protected floatingX = signal<number | null>(null);
  protected floatingY = signal<number | null>(null);
  protected floatingPositioned = signal<boolean>(false);
  protected isDragging = signal<boolean>(false);

  // 뷰포트 위치 기반 상단/하단 자동 플립
  protected readonly isPlacementTop = computed(() => {
    const y = this.floatingY();
    if (y === null) return false;
    const vh = this.viewport.height();
    return y > vh / 2;
  });

  // 뷰포트 좌우 경계 검사
  protected readonly horizontalAlign = computed<'center' | 'left' | 'right'>(() => {
    const x = this.floatingX();
    if (x === null) return 'center';
    const vw = this.viewport.width();
    if (x < 180) return 'left';
    if (vw - x < 240) return 'right';
    return 'center';
  });

  private dragStartX = 0;
  private dragStartY = 0;
  private elemStartX = 0;
  private elemStartY = 0;
  private activePointerId: number | null = null;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadSavedPosition();

    this.debugSub = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isDebugOpen()) {
          this.debugSnapshot.set(this.heightAnalyzer.getDebugSnapshot());
        }
      });

    this.appConfigInspector.registerCustomSection({
      id: 'showcase-window-section',
      title: '윈도우 매니저 세부 (Showcase)',
      getFields: () => [
        { label: '실행 모드', value: this.windowStore.launchMode(), badgeTone: 'primary' },
        { label: '활성 앱 존재', value: this.windowStore.hasActiveApp() ? 'YES' : 'NO', badgeTone: 'info' },
        { label: '최대화 창 존재', value: this.windowStore.hasMaximizedWindow() ? 'YES' : 'NO' },
      ],
    });
  }

  ngOnDestroy(): void {
    if (this.isDragging()) {
      this.endDrag();
    }
    this.debugSub?.unsubscribe();
    this.appConfigInspector.unregisterCustomSection('showcase-window-section');
  }

  protected async copyJsonSnapshot(): Promise<void> {
    try {
      const json = this.appConfigInspector.exportSnapshotAsJson(true);
      await navigator.clipboard.writeText(json);
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    } catch {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (!this.floatingPositioned()) return;
    const curX = this.floatingX();
    const curY = this.floatingY();
    if (curX === null || curY === null) return;

    const elem = this.capsuleRef()?.nativeElement;
    const width = elem?.offsetWidth ?? 140;
    const height = elem?.offsetHeight ?? 44;

    const winW = this.viewport.width();
    const winH = this.viewport.height();
    const clampedX = Math.max(10, Math.min(winW - width - 10, curX));
    const clampedY = Math.max(10, Math.min(winH - height - 10, curY));

    if (clampedX !== curX || clampedY !== curY) {
      this.floatingX.set(clampedX);
      this.floatingY.set(clampedY);
      this.savePosition(clampedX, clampedY);
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        'button, lw-button, .overview-window-floating-close, .capsule-sub-btn, .height-debugger-panel, .session-button'
      )
    ) {
      return;
    }
    const elem = this.capsuleRef()?.nativeElement;
    if (!elem) return;

    event.preventDefault();
    this.activePointerId = event.pointerId;
    try {
      elem.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    const rect = elem.getBoundingClientRect();
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.elemStartX = rect.left;
    this.elemStartY = rect.top;

    this.floatingX.set(rect.left);
    this.floatingY.set(rect.top);
    this.floatingPositioned.set(true);

    this.isDragging.set(true);
  }

  @HostListener('window:pointermove', ['$event'])
  protected onWindowPointerMove(event: PointerEvent): void {
    if (!this.isDragging()) return;

    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.endDrag(event);
      return;
    }

    const elem = this.capsuleRef()?.nativeElement;
    const width = elem?.offsetWidth ?? 140;
    const height = elem?.offsetHeight ?? 44;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    const winW = this.viewport.width();
    const winH = this.viewport.height();
    const nextX = Math.max(10, Math.min(winW - width - 10, this.elemStartX + deltaX));
    const nextY = Math.max(10, Math.min(winH - height - 10, this.elemStartY + deltaY));

    this.floatingX.set(nextX);
    this.floatingY.set(nextY);
  }

  @HostListener('window:pointerup', ['$event'])
  @HostListener('window:pointercancel', ['$event'])
  protected onWindowPointerUp(event: PointerEvent): void {
    if (!this.isDragging()) return;
    this.endDrag(event);
  }

  @HostListener('window:blur')
  protected onWindowBlur(): void {
    if (this.isDragging()) {
      this.endDrag();
    }
  }

  @HostListener('window:contextmenu')
  protected onWindowContextMenu(): void {
    if (this.isDragging()) {
      this.endDrag();
    }
  }

  protected onLostPointerCapture(event: PointerEvent): void {
    if (this.isDragging()) {
      this.endDrag(event);
    }
  }

  private endDrag(event?: PointerEvent): void {
    if (!this.isDragging()) return;
    const elem = this.capsuleRef()?.nativeElement;
    const pointerId = event?.pointerId ?? this.activePointerId;
    if (pointerId !== null && elem) {
      try {
        if (elem.hasPointerCapture(pointerId)) {
          elem.releasePointerCapture(pointerId);
        }
      } catch {
        // ignore
      }
    }
    this.activePointerId = null;
    this.isDragging.set(false);

    if (this.floatingPositioned()) {
      this.savePosition(this.floatingX(), this.floatingY());
    }
  }

  protected onResetPosition(event: MouseEvent): void {
    event.stopPropagation();
    this.floatingPositioned.set(false);
    this.floatingX.set(null);
    this.floatingY.set(null);
    try {
      this.storagePort.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  protected onClose(event?: MouseEvent | Event): void {
    event?.stopPropagation();
    this.closeRequested.emit();
  }

  protected toggleDebugger(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isDebugOpen.update((open) => !open);
    if (this.isDebugOpen()) {
      this.debugSnapshot.set(this.heightAnalyzer.getDebugSnapshot());
    }
  }

  private loadSavedPosition(): void {
    try {
      const saved = this.storagePort.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<CapsulePosition>;
      if (
        parsed &&
        typeof parsed.x === 'number' &&
        typeof parsed.y === 'number' &&
        !isNaN(parsed.x) &&
        !isNaN(parsed.y)
      ) {
        const width = 140;
        const height = 44;
        const winW = this.viewport.width();
        const winH = this.viewport.height();
        const clampedX = Math.max(10, Math.min(winW - width - 10, parsed.x));
        const clampedY = Math.max(10, Math.min(winH - height - 10, parsed.y));

        this.floatingX.set(clampedX);
        this.floatingY.set(clampedY);
        this.floatingPositioned.set(true);
      }
    } catch {
      // ignore
    }
  }

  private savePosition(x: number | null, y: number | null): void {
    if (x == null || y == null) return;
    try {
      this.storagePort.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    } catch {
      // ignore
    }
  }
}
