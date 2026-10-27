import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { LwAvatarComponent } from '../../../../../ui/data-display/avatar/avatar.component';
import { LwBadgeComponent } from '../../../../../ui/data-display/badge/badge.component';
import { LwButtonComponent } from '../../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../../ui/media/icon/icon.component';
import { LwSearchInputComponent } from '../../../../../ui/form/search-input/search-input.component';
import { LwSideMenuItemComponent } from '../../../../../ui/navigation/side-menu/side-menu-item.component';
import { LwSideMenuSectionComponent } from '../../../../../ui/navigation/side-menu/side-menu-section.component';
import { CONSOLE_GROUP_ROLE_LABELS, ConsoleGroup, ConsoleTabId, ConsoleUser } from '../../console.models';

export interface ConsoleNavItem {
  readonly id: ConsoleTabId;
  readonly label: string;
  readonly icon: string;
}

export interface ConsoleNavGroup {
  readonly label: string;
  readonly items: readonly ConsoleNavItem[];
}

interface GroupTreeRow {
  readonly group: ConsoleGroup;
  readonly depth: number;
}

const NAV_GROUPS: readonly ConsoleNavGroup[] = [
  { label: 'Models', items: [{ id: 'credentials', label: '모델 사용 설정', icon: 'settings-2' }] },
  { label: 'Workflow Builder', items: [{ id: 'spaces', label: '워크스페이스', icon: 'layout-list' }] },
  {
    label: 'RAGOps',
    items: [
      { id: 'data-library', label: '데이터 라이브러리', icon: 'library' },
      { id: 'pii-masking', label: 'PII 패턴', icon: 'shield-check' },
      { id: 'rag', label: 'RAG', icon: 'brain' },
    ],
  },
  {
    label: 'Playground',
    items: [
      { id: 'prompts', label: '프롬프트 라이브러리', icon: 'scroll-text' },
      { id: 'playground', label: '플레이그라운드', icon: 'flask-conical' },
    ],
  },
];

const PLATFORM_ITEMS: readonly ConsoleNavItem[] = [
  { id: 'organization', label: '조직', icon: 'users' },
  { id: 'usage', label: '모델 사용량 통계', icon: 'chart-column' },
  { id: 'external-connections', label: '외부 연결', icon: 'plug' },
];

const FOOT_ITEMS: readonly ConsoleNavItem[] = [
  { id: 'notices', label: '공지사항', icon: 'megaphone' },
  { id: 'chatbot-hub', label: '챗봇 허브', icon: 'bot-message-square' },
];

/**
 * 파운드리 관리자 화면의 사이드바 내비게이션 레일 컴포넌트입니다.
 */
@Component({
  selector: 'lw-console-sidebar',
  standalone: true,
  imports: [
    LwAvatarComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwSearchInputComponent,
    LwSideMenuItemComponent,
    LwSideMenuSectionComponent,
  ],
  templateUrl: './lw-console-sidebar.component.html',
  styleUrl: './lw-console-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-collapsed]': 'collapsed()',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'closeGroupPopover()',
  },
})
export class LwConsoleSidebarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly brand = input<string>('LLMOps Console');
  readonly themeMode = input<'light' | 'dark'>('light');
  readonly collapsed = input<boolean>(false);
  readonly activeTab = input.required<ConsoleTabId>();
  readonly currentGroup = input.required<ConsoleGroup>();
  readonly groups = input<readonly ConsoleGroup[]>([]);
  readonly user = input.required<ConsoleUser>();
  readonly platformOpen = input<boolean>(false);
  readonly groupPopoverOpen = input<boolean>(false);

  readonly toggleCollapse = output<void>();
  readonly toggleTheme = output<void>();
  readonly selectTab = output<ConsoleTabId>();
  readonly togglePlatform = output<void>();
  readonly groupPopoverOpenChange = output<boolean>();
  readonly selectGroup = output<string>();
  readonly openProfile = output<void>();

  readonly navGroups = NAV_GROUPS;
  readonly platformItems = PLATFORM_ITEMS;
  readonly footItems = FOOT_ITEMS;

  readonly groupSearchQuery = signal<string>('');

  readonly currentRoleLabel = computed(() => CONSOLE_GROUP_ROLE_LABELS[this.currentGroup().role]);
  readonly themeLabel = computed(() => (this.themeMode() === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'));
  readonly collapseLabel = computed(() => (this.collapsed() ? '사이드바 펼치기' : '사이드바 접기'));

  /** 부모-자식 순서로 펼친 그룹 트리. 검색어가 있으면 일치하는 그룹만 남긴다. */
  readonly groupTree = computed<readonly GroupTreeRow[]>(() => {
    const groups = this.groups();
    const q = this.groupSearchQuery().toLowerCase().trim();
    const rows: GroupTreeRow[] = [];
    const walk = (parent: string | undefined, depth: number): void => {
      for (const group of groups.filter((g) => g.parent === parent)) {
        if (!q || group.name.toLowerCase().includes(q)) {
          rows.push({ group, depth: q ? 0 : depth });
        }
        walk(group.id, depth + 1);
      }
    };
    walk(undefined, 0);
    return rows;
  });

  onGroupPick(groupId: string): void {
    this.selectGroup.emit(groupId);
    this.closeGroupPopover();
  }

  onPlatformToggle(): void {
    // 접힌 상태에서는 하위 메뉴를 보여 줄 수 없으므로 먼저 펼친다.
    if (this.collapsed()) {
      this.toggleCollapse.emit();
      if (this.platformOpen()) return;
    }
    this.togglePlatform.emit();
  }

  toggleGroupPopover(event: Event): void {
    event.stopPropagation();
    if (this.collapsed()) {
      this.toggleCollapse.emit();
    }
    this.groupPopoverOpenChange.emit(!this.groupPopoverOpen());
  }

  closeGroupPopover(): void {
    if (!this.groupPopoverOpen()) return;
    this.groupSearchQuery.set('');
    this.groupPopoverOpenChange.emit(false);
  }

  onDocumentClick(event: Event): void {
    if (!this.groupPopoverOpen()) return;
    const switcher = this.host.nativeElement.querySelector('.lw-console-sb__group');
    if (switcher && !switcher.contains(event.target as Node)) {
      this.closeGroupPopover();
    }
  }
}

