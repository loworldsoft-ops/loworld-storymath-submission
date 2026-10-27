import { LwSheetTitleComponent } from '../../../../ui/overlay/sheet-title/sheet-title.component';
import { LwAccountRoleBadgeComponent } from '../../../../ui/data-display/badge/member-role-badge.component';
import { LwMobileAppControlService } from '../../../../services/services/mobile-app-control.service';
import { LwScreenRatioService } from '../../../../services/base/lw-screen-ratio.service';
import { type LwMobileAppControlAction } from '../../../../services/models/mobile-app-control.model';
import { LwFrameSettingsStore } from '../../../../services/settings/lw-frame-settings';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import { OverviewIconId, OverviewWindow, OverviewWindowTab } from '../../../../services/models/os.types';
import { OverviewMobileBottomBarComponent } from './overview-mobile-bottom-bar.component';
import { LwBottomSheetComponent } from '../../../../ui/overlay/bottom-sheet/bottom-sheet.component';
import type { CharacterSummaryVm } from '../../../../game/collection/items/character-summary-card/character-summary.model';
import { LwCharacterSessionMenuComponent } from '../../../../game/lib/chrome/rails/character-session-control/character-session-menu.component';
import { LwMemberSessionMenuComponent } from '../../../../patterns/lib/chrome/rails/member-session-control/member-session-menu.component';
import { getOverviewMobileDefaultActions, isOverviewMobileCharacterApp, resolveOverviewMobileControlAppId } from '../registry/overview-mobile-app-control.registry';
import { OverviewAppSwitcherSheetContentComponent } from './overview-app-switcher-sheet-content.component';

@Component({
  standalone: true,
  imports: [
    LwSheetTitleComponent,
    LwAccountRoleBadgeComponent,
    CommonModule,
    OverviewMobileBottomBarComponent,
    LwBottomSheetComponent,
    LwCharacterSessionMenuComponent,
    LwMemberSessionMenuComponent,
    OverviewAppSwitcherSheetContentComponent,
  ],
  selector: 'lw-os-mobile-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile-scene.component.html',
  styleUrl: './overview-mobile-scene.component.scss',
})
export class OverviewMobileSceneComponent implements AfterViewInit, OnDestroy {
  protected readonly mobileControlService = inject(LwMobileAppControlService);
  protected readonly screenRatio = inject(LwScreenRatioService);
  protected readonly frameSettings = inject(LwFrameSettingsStore, { optional: true });
  private readonly elementRef = inject(ElementRef);

  title = input.required<string>();
  icon = input.required<OverviewIconId>();
  fullscreen = input(false);
  frameless = input(false);
  showSessionControl = input(false);
  memberSession = input<LwMemberAuthSessionView | null>(null);
  windows = input<readonly OverviewWindow[]>([]);
  runningTabs = input<readonly OverviewWindowTab[]>([]);
  activeTab = input<OverviewWindowTab | null>(null);
  /** 설정 시트 열림 여부 */
  isSettingsOpen = input<boolean>(false);
  /** 옵션: 외부에서 직접 주입하는 상황별 제어 액션 목록 (null이면 서비스의 customActions 사용) */
  customActions = input<readonly LwMobileAppControlAction[] | null>(null);

  menuRequested = output<void>();
  backRequested = output<void>();
  closeRequested = output<void>();
  loginRequested = output<void>();
  accountRequested = output<void>();
  homeRequested = output<void>();
  settingsRequested = output<void>();
  runningTabSelected = output<OverviewWindowTab>();
  actionSelected = output<string>();

  constructor() {
effect(() => {
      const tab = this.activeTab();
      const targetAppId = resolveOverviewMobileControlAppId(tab);
      this.mobileControlService.setActiveApp(targetAppId);
    }, { allowSignalWrites: true });
  }

  /** 활성화된 하단 모바일 앱 제어 메뉴 액션 목록 */
  protected readonly effectiveActions = computed<readonly LwMobileAppControlAction[] | null>(() => {
    if (this.customActions()) {
      return this.customActions();
    }
    const currentAppPayload = this.mobileControlService.currentPayload();
    if (currentAppPayload?.actions && currentAppPayload.actions.length > 0) {
      return currentAppPayload.actions;
    }
    return getOverviewMobileDefaultActions(this.activeTab());
  });

  /** 🌟 단일화된 활성 바텀시트 상태 (SOLID SRP & 단일 호스트 원칙 준수) */
  protected readonly activeSheet = signal<'switcher' | 'character' | 'member' | null>(null);

  protected readonly isAppSwitcherOpen = computed(() => this.activeSheet() === 'switcher');
  protected readonly isCharacterSheetOpen = computed(() => this.activeSheet() === 'character');
  protected readonly isMemberSheetOpen = computed(() => this.activeSheet() === 'member');
  protected readonly isBottomSheetOpen = computed(() => this.activeSheet() !== null);

  /** 🌟 바텀시트 또는 모달 활성화 시 하단 내비게이션 바(lw-os-mobile-bottom-bar) 자동 하강 여부 */
  readonly isBottomBarHidden = computed(() => {
    return (
      (this.frameSettings?.value().bottomBar === 'hidden') ||
      this.isBottomSheetOpen() ||
      this.mobileControlService.isBottomSheetOpen() ||
      !!this.mobileControlService.activeOverlayId()
    );
  });

  /** 활성화된 바텀시트 상단 키커 텍스트 */
  protected readonly sheetKicker = computed(() => {
    switch (this.activeSheet()) {
      case 'switcher':
        return 'Overview Multitasking';
      case 'character':
        return 'Character Profile';
      case 'member':
        return 'Portal Member Session';
      default:
        return '';
    }
  });

  /** 🌟 현재 모바일 앱 제어 페이로드 */
  protected readonly currentPayload = computed(() => this.mobileControlService.currentPayload());

  /** 👤 캐릭터 세션 정보 (소설 도메인 전용 엄격 격리) */
  readonly rawCharacter = computed(() => {
    if (!isOverviewMobileCharacterApp(this.activeTab())) {
      return null;
    }
    return this.currentPayload()?.character ?? null;
  });
  readonly characterSummary = computed(() => {
    const summaries = this.currentPayload()?.characterSummaries;
    if (summaries && summaries.length > 0) {
      return summaries[0];
    }
    const char = this.rawCharacter();
    if (!char) return null;
    return char as unknown as CharacterSummaryVm;
  });
  readonly otherCharacters = computed(() => {
    const summaries = this.currentPayload()?.characterSummaries;
    if (!summaries || summaries.length === 0 || !isOverviewMobileCharacterApp(this.activeTab())) return [];
    const currentId = this.characterSummary()?.id;
    return summaries.filter((c) => c.id !== currentId);
  });

  /** 🔑 포탈 회원 세션 정보 */
  readonly memberSessionInfo = computed(() => this.currentPayload()?.memberSession ?? this.memberSession() ?? null);

  protected closeActiveSheet(): void {
    this.activeSheet.set(null);
  }

  /** 캐릭터 시트의 제목 옆 꼬리표. 직업의 이름은 앱이 넣어 준다(`customClassLabel`). OS는 직업을 모른다. */
  protected characterDetails(summary: { customClassLabel?: string; roleBadge?: string; class?: string; level?: number }): readonly string[] {
    const label = summary.customClassLabel?.trim() || summary.roleBadge?.split('·')[0].trim() || summary.class || '';
    return [label, summary.level != null ? `Lv.${summary.level}` : ''];
  }

  protected openCharacterSheet(_summary?: CharacterSummaryVm | null): void {
    if (!isOverviewMobileCharacterApp(this.activeTab())) return;
    this.activeSheet.set('character');
  }

  protected closeCharacterSheet(): void {
    this.closeActiveSheet();
  }

  protected openMemberSheet(_session?: LwMemberAuthSessionView | null): void {
    this.activeSheet.set('member');
  }

  protected closeMemberSheet(): void {
    this.closeActiveSheet();
  }

  protected onCharacterDetailAction(): void {
    this.closeActiveSheet();
    const summary = this.characterSummary();
    this.mobileControlService.currentPayload()?.onCharacterDetail?.(summary);
  }

  protected onCharacterSelectAction(): void {
    this.closeActiveSheet();
    this.mobileControlService.currentPayload()?.onCharacterSelect?.();
  }

  protected onCharacterSwitchAction(targetId: string): void {
    this.closeActiveSheet();
    this.mobileControlService.currentPayload()?.onCharacterSwitch?.(targetId);
  }

  protected onCharacterLogoutAction(): void {
    this.closeActiveSheet();
    this.mobileControlService.currentPayload()?.onCharacterLogout?.();
  }

  protected onMemberAccountAction(): void {
    this.closeActiveSheet();
    this.accountRequested.emit();
    this.mobileControlService.currentPayload()?.onAccount?.();
  }

  protected onMemberLogoutAction(): void {
    this.closeActiveSheet();
    this.mobileControlService.currentPayload()?.onLogout?.();
  }

  protected onCustomActionClick(action: LwMobileAppControlAction): void {
    if (action.disabled) return;

    this.actionSelected.emit(action.id);

    if (action.id === 'home') {
      this.onHome();
      return;
    }
    if (action.id === 'switcher' || action.id === 'running') {
      this.toggleAppSwitcher();
      return;
    }
    if (action.id === 'close') {
      this.onClose();
      return;
    }
    // 앱 커스텀 액션에 핸들러가 정의된 경우 최우선으로 1회 실행
    if (action.handler) {
      action.handler();
      this.mobileControlService.currentPayload()?.onAction?.(action.id);
      return;
    }

    // 핸들러가 없는 기본 OS 설정 액션일 때만 OS 설정창 호출
    if (action.id === 'settings') {
      this.onSettings();
      return;
    }

    this.mobileControlService.executeAction(action.id);
  }

  protected toggleAppSwitcher(): void {
    this.activeSheet.update(v => v === 'switcher' ? null : 'switcher');
  }

  protected closeAppSwitcher(): void {
    this.closeActiveSheet();
  }

  protected onHome(): void {
    this.closeActiveSheet();
    this.mobileControlService.dismissActiveOverlay();
    this.homeRequested.emit();
  }

  protected onSettings(): void {
    this.closeActiveSheet();
    this.settingsRequested.emit();
  }

  protected onClose(): void {
    this.closeActiveSheet();
    this.mobileControlService.dismissActiveOverlay();
    this.closeRequested.emit();
  }

  protected onSelectTab(tab: OverviewWindowTab): void {
    this.closeActiveSheet();
    this.runningTabSelected.emit(tab);
  }

  protected onMenu(): void {
    this.menuRequested.emit();
  }

  protected onBack(): void {
    this.onHome();
  }

  protected onLogin(): void {
    this.loginRequested.emit();
  }

  protected onAccount(): void {
    this.accountRequested.emit();
  }

  ngAfterViewInit(): void {
    const el = this.elementRef.nativeElement as HTMLElement;
    if (el) {
      this.screenRatio.registerContainer(el);
    }
  }

  ngOnDestroy(): void {
    this.screenRatio.unregisterContainer();
  }
}