import { CommonModule } from '@angular/common';
import { LwButtonComponent } from '../../form/button/button.component';
import { LwAvatarComponent } from '../../data-display/avatar/avatar.component';
import { LwSettingsButtonComponent } from '../settings-button/settings-button.component';
import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { LwActionEvent } from '../../../services/models/action-event.model';
import { type LwMemberAuthSessionView } from '../../../services/models/auth.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, LwButtonComponent, LwAvatarComponent, LwSettingsButtonComponent],
  selector: 'lw-app-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrl: './titlebar.component.scss',
})
export class LwAppTitlebarComponent {
  appTitle = input('');
  appIconSrc = input('');
  pointIconSrc = input('');
  points = input(0);
  showPoints = input(false);
  showSessionControl = input(true);
  memberAuthSession = input<LwMemberAuthSessionView | null>(null);
  loginLabel = input('로그인');
  isMobile = input(false);
  profileImageUrl = input<string | null>(null);
  profileInitial = input('');
  /** JWT는 있는데 user-info 전·이미지 없음일 때 비로그인 실루엣과 구분 */
  sessionActive = input(false);
  showMeta = input(false);
  metaEyebrow = input('');
  metaTitle = input('');
  metaSubtitle = input('');
  metaBadge = input('');
  primaryActionLabel = input('');
  primaryActionActive = input(false);
  secondaryActionLabel = input('');
  secondaryActionActive = input(false);
  showSettingsButton = input(true);
  settingsActive = input(false);
  sidebarActive = input(false);
  /** 사이드바(햄버거) 버튼 노출 여부 (기본 true, 모바일 슬림 헤더에서는 false) */
  showSidebarToggle = input(true);
  /** 타이틀 전용 모드 (우측 액션 및 세션 버튼을 모두 숨기고 타이틀만 표시) */
  titleOnlyMode = input(false);
  /** 모바일: 텍스트 action 버튼 대신 context/overflow 아이콘만 표시 */
  compactMode = input(false);
  contextEyebrow = input('');
  contextTitle = input('');
  contextActive = input(false);
  showContextToggle = input(false);
  showOverflowMenu = input(false);
  overflowActive = input(false);
  showProgressShortcut = input(false);
  progressShortcutActive = input(false);
  /** 아이콘 버튼 옆에 텍스트 라벨을 함께 표시할지 여부 (기본 false: 아이콘 전용) */
  showButtonLabels = input(false);
  /** 모든 아이콘 버튼에 마우스 호버 시 툴팁을 노출할지 여부 (기본 true) */
  showTooltips = input(true);

  readonly actionEvent = output<LwActionEvent<void>>();
  readonly settingsClick = output<void>();
  readonly logout = output<void>();
  readonly account = output<void>();

  readonly _imgError = signal(false);

  onToggleSidebar(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'TOGGLE_SIDEBAR', payload: undefined, source: 'lw-app-titlebar' });
  }

  onLogin(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'LOGIN', payload: undefined, source: 'lw-app-titlebar' });
  }

  onPointsClick(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'POINTS_CLICK', payload: undefined, source: 'lw-app-titlebar' });
  }

  onMetaClick(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'META_CLICK', payload: undefined, source: 'lw-app-titlebar' });
  }

  onSettingsClick(event?: MouseEvent): void {
    event?.stopPropagation();
    this.settingsClick.emit();
    this.actionEvent.emit({ actionId: 'TOGGLE_SETTINGS', payload: undefined, source: 'lw-app-titlebar' });
  }

  onPrimaryAction(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'PRIMARY_ACTION', payload: undefined, source: 'lw-app-titlebar' });
  }

  onSecondaryAction(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'SECONDARY_ACTION', payload: undefined, source: 'lw-app-titlebar' });
  }

  onContextToggle(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'CONTEXT_TOGGLE', payload: undefined, source: 'lw-app-titlebar' });
  }

  onOverflowMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'OVERFLOW_MENU', payload: undefined, source: 'lw-app-titlebar' });
  }

  onProgressShortcut(event: MouseEvent): void {
    event.stopPropagation();
    this.actionEvent.emit({ actionId: 'PROGRESS_SHORTCUT', payload: undefined, source: 'lw-app-titlebar' });
  }


  /** 진행/패널/메뉴 등 알려진 액션 라벨을 단색 아이콘 키로 매핑한다. 미지정 라벨은 텍스트만 표시한다. */
  actionIconKey(label: string): 'progress' | 'panel' | 'menu' | null {
    switch (label) {
      case '진행':
        return 'progress';
      case '패널':
        return 'panel';
      case '메뉴':
        return 'menu';
      default:
        return null;
    }
  }
}

/** @deprecated Use {@link LwAppTitlebarComponent} */
export { LwAppTitlebarComponent as LwTitlebarComponent };
