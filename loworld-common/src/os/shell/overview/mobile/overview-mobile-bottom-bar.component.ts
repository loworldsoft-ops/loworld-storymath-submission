import { LwFrameSettingsStore } from '../../../../services/settings/lw-frame-settings';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { injectLifecycleLog } from '../../../../services/lifecycle/inject-lifecycle-log';
import { LwMobileAppControlService } from '../../../../services/services/mobile-app-control.service';
import { type LwMobileAppControlAction } from '../../../../services/models/mobile-app-control.model';
import { type LwMemberAuthSessionView } from '../../../../services/models/auth.model';
import type { CharacterSummaryVm } from '../../../../game/collection/items/character-summary-card/character-summary.model';
import { LwCharacterSessionControlComponent } from '../../../../game/lib/chrome/rails/character-session-control/character-session-control.component';
import { LwSessionControlComponent } from '../../../../patterns/lib/chrome/rails/member-session-control/member-session-control.component';
import { LwSwipeTrackDirective } from '../../../../ui/gesture/lw-swipe-track.directive';

import { resolveMobileBottomBarGlyph } from '../../../../services/utils/mobile-bottom-bar-glyphs.data';
import { isOverviewMobileCharacterApp } from '../registry/overview-mobile-app-control.registry';

/** 하단 바에 그리는 한 칸 */
interface BottomBarItem {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly glyph: SafeHtml;
  readonly imageUrl: string | null;
  readonly active: boolean;
  readonly danger: boolean;
  readonly disabled: boolean;
  readonly badge: string | number | null;
  readonly activate: () => void;
}

/**
 * 모바일 앱 화면 하단 바.
 *
 * 앱이 등록한 액션(없으면 홈·설정·앱 전환·닫기)을 같은 크기의 선 아이콘 탭으로 한 줄에 놓는다.
 * 칸이 적으면 폭을 고르게 나누고, 많으면 옆으로 민다.
 */
@Component({
  standalone: true,
  imports: [LwCharacterSessionControlComponent, LwSessionControlComponent, LwSwipeTrackDirective],
  selector: 'lw-os-mobile-bottom-bar',
  host: {
    '[attr.data-bar-labels]': 'frameSettings.value().bottomBarLabels',
    '[attr.data-bar-variant]': 'frameSettings.value().bottomBarVariant',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile-bottom-bar.component.html',
  styleUrl: './overview-mobile-bottom-bar.component.scss',
})
export class OverviewMobileBottomBarComponent {
  /** 단추 아래의 이름을 보일지는 설정을 따른다. */
  protected readonly frameSettings = inject(LwFrameSettingsStore);
  private readonly lifecycleLog = injectLifecycleLog('OverviewMobileBottomBarComponent', 'OS');

  private readonly mobileControlService = inject(LwMobileAppControlService);
  private readonly sanitizer = inject(DomSanitizer);

  /** 현재 실행 중인 윈도우 탭 식별자 */
  activeTab = input<string | null>(null);

  /** 외부에서 직접 전달한 커스텀 액션 목록 (null이면 서비스의 액션 참조) */
  actions = input<readonly LwMobileAppControlAction[] | null>(null);

  /** 세션 컨트롤 노출 여부 (부모 씬에서 주입) */
  showSessionControl = input<boolean>(false);

  /** 포탈 회원 세션 정보 (부모 씬에서 주입) */
  memberSession = input<LwMemberAuthSessionView | null>(null);

  /** 현재 실행 중인 앱 개수 */
  runningCount = input<number>(0);

  /** 앱 전환기 시트 열림 여부 */
  isAppSwitcherOpen = input<boolean>(false);

  /** 설정 시트 열림 여부 */
  isSettingsOpen = input<boolean>(false);

  actionClick = output<LwMobileAppControlAction>();
  homeClick = output<void>();
  settingsClick = output<void>();
  switcherClick = output<void>();
  closeClick = output<void>();

  /** 캐릭터 아바타 클릭 이벤트 (모바일 뷰포트 바텀시트 오픈용) */
  characterClick = output<CharacterSummaryVm | null>();

  /** 포탈 회원 아바타 클릭 이벤트 (모바일 뷰포트 바텀시트 오픈용) */
  memberClick = output<LwMemberAuthSessionView | null>();

  protected readonly currentPayload = computed(() => this.mobileControlService.currentPayload());

  /** 캐릭터 세션은 캐릭터를 쓰는 앱에서만 보인다. */
  private readonly isCharacterApp = computed(() => isOverviewMobileCharacterApp(this.activeTab()));

  readonly character = computed(() => (this.isCharacterApp() ? this.currentPayload()?.character ?? null : null));
  readonly characterSummaries = computed(() =>
    this.isCharacterApp() ? this.currentPayload()?.characterSummaries ?? null : null,
  );
  readonly showCharacterControl = computed(
    () => this.isCharacterApp() && (this.currentPayload()?.showCharacterControl ?? false),
  );

  readonly effectiveMemberSession = computed(() => this.memberSession() ?? this.currentPayload()?.memberSession ?? null);

  readonly effectiveShowSessionControl = computed(
    () => this.showSessionControl() || (this.currentPayload()?.showSessionControl ?? false),
  );

  /** 왼쪽 세션 영역에 실제로 그릴 것이 있는가 */
  protected readonly hasSessionArea = computed(
    () => this.effectiveShowSessionControl() && (this.showCharacterControl() || this.effectiveMemberSession() !== null),
  );

  protected readonly actionsSwipe = viewChild<LwSwipeTrackDirective>('actionsSwipe');

  protected readonly items = computed<readonly BottomBarItem[]>(() => {
    const custom = this.actions() ?? this.mobileControlService.customActions();
    const runningBadge = this.runningCount() > 1 ? this.runningCount() : null;

    if (custom) {
      return custom.map((action) => {
        const isSwitcher = action.id === 'switcher';
        return this.item({
          id: action.id,
          label: action.label || '',
          hint: action.ariaLabel || action.tooltip || action.label || '',
          icon: action.icon ?? action.id,
          imageUrl: action.iconUrl ?? null,
          active: !!action.active || (isSwitcher && this.isAppSwitcherOpen()),
          danger: action.role === 'danger' || action.id === 'close',
          disabled: !!action.disabled,
          badge: action.badge ?? (isSwitcher ? runningBadge : null),
          activate: () => this.actionClick.emit(action),
        });
      });
    }

    return [
      this.item({ id: 'home', label: '홈', hint: '홈 화면으로 이동', activate: () => this.homeClick.emit() }),
      this.item({
        id: 'settings',
        label: '설정',
        hint: '현재 앱 설정 열기',
        active: this.isSettingsOpen(),
        activate: () => this.settingsClick.emit(),
      }),
      this.item({
        id: 'switcher',
        label: '앱 전환',
        hint: '실행 중인 앱 목록 및 전환',
        active: this.isAppSwitcherOpen(),
        badge: runningBadge,
        activate: () => this.switcherClick.emit(),
      }),
      this.item({ id: 'close', label: '닫기', hint: '현재 앱 닫기', danger: true, activate: () => this.closeClick.emit() }),
    ];
  });

  private item(
    spec: Pick<BottomBarItem, 'id' | 'label' | 'hint' | 'activate'> &
      Partial<Omit<BottomBarItem, 'glyph'>> & { icon?: string },
  ): BottomBarItem {
    return {
      imageUrl: null,
      active: false,
      danger: false,
      disabled: false,
      badge: null,
      ...spec,
      // 아이콘 그림은 이 앱에 들어 있는 고정 문자열이라 그대로 넣어도 안전하다.
      glyph: this.sanitizer.bypassSecurityTrustHtml(resolveMobileBottomBarGlyph(spec.icon ?? spec.id)),
    };
  }

  protected onItemClick(item: BottomBarItem): void {
    // 옆으로 밀다가 손을 뗀 것은 누른 것으로 치지 않는다.
    if (item.disabled || this.actionsSwipe()?.shouldSuppressClick()) return;
    item.activate();
  }

  protected onHomeIndicator(): void {
    this.homeClick.emit();
  }

  protected onCharacterSelectClick(): void {
    this.currentPayload()?.onCharacterSelect?.();
  }

  protected onCharacterDetailClick(summary: CharacterSummaryVm | null): void {
    this.characterClick.emit(summary);
  }

  protected onCharacterSwitchClick(targetId: string): void {
    this.currentPayload()?.onCharacterSwitch?.(targetId);
  }

  protected onCharacterLogoutClick(): void {
    this.currentPayload()?.onCharacterLogout?.();
  }

  protected onLoginClick(): void {
    this.currentPayload()?.onLogin?.();
  }

  protected onLogoutClick(): void {
    this.currentPayload()?.onLogout?.();
  }

  protected onAccountClick(): void {
    this.currentPayload()?.onAccount?.();
  }

  protected onMemberTriggerClick(session: LwMemberAuthSessionView | null): void {
    this.memberClick.emit(session);
  }
}
