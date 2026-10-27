import { LwFrameSettingsComponent } from '../../panels/frame-settings/frame-settings.component';
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwIconComponent } from '../../../../ui/media/icon/icon.component';
import { LwModalComponent } from '../../../../ui/overlay/modal/modal.component';
import { LwBottomSheetComponent } from '../../../../ui/overlay/bottom-sheet/bottom-sheet.component';
import { LwCloseButtonComponent } from '../../../../ui/navigation/close-button/close-button.component';
import { LwSlideSwitchComponent } from '../../../../ui/form/slide-switch/slide-switch.component';
import { LwSelectComponent } from '../../../../ui/form/select/select.component';
import { LwFormFieldComponent } from '../../../../ui/form/form-field/form-field.component';
import { type LwModalWindowStyle } from '../../../../ui/overlay/modal/modal.types';
import { Component, computed, effect, inject, input, OnInit, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LwAppearanceSettingsComponent } from '../../panels/appearance-settings/appearance-settings.component';
import { DEFAULT_SETTINGS, Settings } from '../../../../services/models/document.model';
import { LwComponentConfigStore } from '../../../../services/services/stores/component-config.store';
import { LwThemeStore } from '../../../../services/theme/lw-theme.store';
import { LW_SKIN_OPTIONS } from '../../../../services/theme/lw-appearance.model';
import { LwStoryPlayThemeService } from '../../../../services/services/story-play-theme.service';
import { NarrativePlayFacadeService } from '../../../../services/services/narrative-play-facade.service';
import { SheetNavigationStore } from '../../../../services/services/stores/sheet-navigation.store';
import { type StoryPlayThemeId } from '../../../../services/models/story-play-theme.model';
import { LOWORLD_BUILD_INFO } from '../../../../services/version/build-info';
import { LwStoryTypingEngineService, TYPING_SPEED_PRESETS } from '../../../collection/panels/typing/story-typing-engine.service';

interface SettingsTab {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

const TABS = {
  appearance: { id: 'play-theme', label: '모양', icon: 'sun' },
  readerOptions: { id: 'reader-options', label: '읽기 옵션', icon: 'scroll-text' },
  window: { id: 'window', label: '윈도우 및 앱 실행', icon: 'windows' },
  general: { id: 'general', label: '일반', icon: 'globe' },
  preferences: { id: 'preferences', label: '툴팁 및 디버그', icon: 'help-circle' },
  shortcuts: { id: 'shortcuts', label: '단축키', icon: 'terminal' },
  notification: { id: 'notification', label: '알림', icon: 'megaphone' },
  sync: { id: 'sync', label: '동기화', icon: 'cloud' },
  info: { id: 'info', label: '버전 정보', icon: 'info' },
} as const satisfies Record<string, SettingsTab>;

/**
 * 문서의 외형, 레이아웃 및 환경 설정을 조정하는 모달 다이얼로그 컴포넌트입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-document-settings-dialog',
  standalone: true,
  imports: [LwFrameSettingsComponent, 
    LwModalComponent,
    LwBottomSheetComponent,
    LwButtonComponent,
    LwIconComponent,
    LwCloseButtonComponent,
    LwSlideSwitchComponent,
    LwSelectComponent,
    LwFormFieldComponent,
    NgTemplateOutlet,
    LwAppearanceSettingsComponent,
  ],
  templateUrl: './document-settings-dialog.component.html',
  styleUrl: './document-settings-dialog.component.scss',
  host: {
    '[class.is-embedded]': 'isEmbeddedMode()',
    '[class.is-sheet]': 'isSheetMode()',
  },
})
export class LwDocumentSettingsDialogComponent implements OnInit {
  protected readonly componentConfigStore = inject(LwComponentConfigStore, { optional: true });
  protected readonly themeStore = inject(LwThemeStore, { optional: true });
  protected readonly themeService = inject(LwStoryPlayThemeService);
  protected readonly facade = inject(NarrativePlayFacadeService, { optional: true });
  protected readonly typingEngine = inject(LwStoryTypingEngineService, { optional: true });
  protected readonly sheetNavStore = inject(SheetNavigationStore, { optional: true });

  readonly settings = input<Settings>(DEFAULT_SETTINGS);
  readonly mode = input<string>('document');
  /** 오버레이 표현 형태: 'modal' (데스크톱 창) | 'sheet' (공통 바텀시트) | 'content' | 'embedded' (외부 바텀시트 내 임베딩) | 'auto' */
  readonly presentation = input<'modal' | 'sheet' | 'content' | 'embedded' | 'auto'>('auto');
  readonly brandName = input<string | null>(null);
  readonly brandBadgeText = input<string | null>(null);
  readonly brandIconUrl = input<string | null>(null);
  readonly playTheme = input<StoryPlayThemeId | null>(null);
  readonly playAutoMode = input<boolean | null>(null);
  readonly playAutoSave = input<boolean | null>(null);
  readonly playTypingIntro = input<boolean | null>(null);
  readonly playCommandDock = input<boolean | null>(null);
  readonly windowLaunchMode = input<'normal' | 'maximized' | null>(null);
  readonly hideWindowMode = input<boolean>(false);
  /** 모양 탭에 배경화면 변경 항목을 보일지. 배경화면 선택 화면은 바깥(OS 셸)이 연다. */
  readonly showWallpaperSetting = input<boolean>(false);
  readonly windowControls = input<boolean>(true);
  readonly windowStyle = input<LwModalWindowStyle>('os-desktop');
  readonly draggable = input<boolean>(true);
  readonly showHeader = input<boolean>(true);

  /** 바텀시트 독립 렌더링 모드 여부 */
  protected readonly isSheetMode = computed<boolean>(() => {
    return this.presentation() === 'sheet';
  });

  /** 상위 바텀시트 등에 직접 임베딩되는 컨텐츠 모드 여부 */
  protected readonly isEmbeddedMode = computed<boolean>(() => {
    return this.presentation() === 'content' || this.presentation() === 'embedded';
  });

  readonly close = output();
  readonly settingsChange = output<Partial<Settings>>();
  readonly playThemeChange = output<StoryPlayThemeId>();
  readonly playAutoModeChange = output<boolean>();
  readonly playAutoSaveChange = output<boolean>();
  readonly playTypingIntroChange = output<boolean>();
  readonly playCommandDockChange = output<boolean>();
  readonly windowLaunchModeChange = output<'normal' | 'maximized'>();
  readonly wallpaperRequest = output<void>();
  readonly manualSaveRequest = output<void>();
  readonly restartRequest = output<void>();

  readonly activeTab = signal('play-theme');
  protected readonly buildInfo = LOWORLD_BUILD_INFO;

  protected readonly runtimePlatform = computed<'android-bridge' | 'web'>(() => {
    if (typeof window !== 'undefined' && ((window as any).loworldNative || (window as any).androidBridge)) {
      return 'android-bridge';
    }
    return 'web';
  });

  readonly effectiveWindowLaunchMode = computed<'normal' | 'maximized'>(() => {
    return this.windowLaunchMode() ?? this.settings().windowLaunchMode ?? 'maximized';
  });

  onSelectWindowLaunchMode(mode: 'normal' | 'maximized'): void {
    this.windowLaunchModeChange.emit(mode);
    this.settingsChange.emit({ windowLaunchMode: mode });
  }

  readonly effectiveTypingIntroEnabled = computed<boolean>(() => {
    return this.playTypingIntro() ?? false;
  });

  onToggleTypingIntro(): void {
    this.playTypingIntroChange.emit(!this.effectiveTypingIntroEnabled());
  }

  readonly effectiveCommandDockEnabled = computed<boolean>(() => {
    return this.playCommandDock() ?? true;
  });

  onToggleCommandDock(): void {
    this.playCommandDockChange.emit(!this.effectiveCommandDockEnabled());
  }

  readonly resolvedBrandName = computed(() => {
    if (this.brandName()) {
      return this.brandName()!;
    }
    const m = this.mode();
    if (m === 'overview') return 'Loworld Overview';
    if (m === 'novel') return 'Loworld Novel';
    if (m === 'calendar') return 'ezCalendar';
    if (m === 'canvas') return 'ezCanvas';
    if (m === 'db') return 'ezDB';
    if (m === 'develop') return 'Loworld Develop';
    if (m === 'homework') return 'Loworld Homework';
    if (m === 'plan') return 'Loworld Plan';
    return 'ezNote';
  });

  readonly resolvedBrandBadgeText = computed(() => {
    if (this.brandBadgeText()) {
      return this.brandBadgeText()!;
    }
    const name = this.resolvedBrandName();
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return 'LW';
  });

  readonly currentActiveTheme = computed<StoryPlayThemeId>(() => {
    return this.playTheme() ?? this.themeService.activeTheme();
  });

  readonly speedPresets = TYPING_SPEED_PRESETS;
  readonly typingSpeed = computed(() => this.typingEngine?.typingSpeedMultiplier() ?? 1.0);

  setTypingSpeed(speed: number): void {
    this.typingEngine?.setTypingSpeedMultiplier(speed);
  }

  /** 설정 갈래. `icon`은 모바일 목록에 쓰는 선 아이콘 이름이다. */
  readonly displayTabs = computed<readonly SettingsTab[]>(() => {
    if (this.mode() === 'novel') {
      return [TABS.appearance, TABS.readerOptions, { ...TABS.preferences, label: '공통 환경설정' }, TABS.shortcuts, TABS.info];
    }
    if (this.mode() === 'overview') {
      // OS 홈의 설정에는 실제로 동작하는 갈래만 둔다. 언어·알림·동기화·단축키는 앱(노트 등) 설정이다.
      const tabs = [TABS.appearance, TABS.window, TABS.preferences, TABS.info];
      return this.hideWindowMode() ? tabs.filter((t) => t.id !== 'window') : tabs;
    }
    return [TABS.appearance, TABS.general, TABS.preferences, TABS.shortcuts, TABS.notification, TABS.sync, TABS.info];
  });

  constructor() {
    // 🧭 SheetNavigationStore와 모바일 슬라이드 레벨 양방향 반응형 동기화
    effect(() => {
      if (!this.sheetNavStore) return;
      if (this.isEmbeddedMode() || this.isSheetMode()) {
        const currentIdx = this.sheetNavStore.currentSlideIndex();
        if (currentIdx === 0 && this.mobileViewLevel() === 'detail') {
          this.mobileViewLevel.set('menu');
        } else if (currentIdx > 0 && this.mobileViewLevel() === 'menu') {
          const tabs = this.displayTabs();
          if (tabs[currentIdx - 1]) {
            this.activeTab.set(tabs[currentIdx - 1].id);
          }
          this.mobileViewLevel.set('detail');
        }
      }
    });
  }

  ngOnInit(): void {
    this.activeTab.set('play-theme');
    if (this.sheetNavStore && (this.isEmbeddedMode() || this.isSheetMode())) {
      const subpages = this.displayTabs().map((tab, idx) => ({
        index: idx + 1,
        title: this.getTabCleanTitle(tab),
        kicker: this.getTabCleanTitle(tab).toUpperCase(),
      }));
      this.sheetNavStore.setupDomain(
        'settings',
        this.resolvedBrandName() + ' 설정',
        'SETTINGS & PREFERENCES',
        subpages
      );
    }
  }


  /** 모양 설정이 바뀌면 읽기 화면과 바깥에 예전 이름의 테마로도 알린다. */
  onAppearanceChange(): void {
    const themeId = this.themeService.activeTheme();
    this.facade?.setReadingTheme(themeId);
    this.playThemeChange.emit(themeId);
  }

  readonly tooltipsEnabled = computed(() => this.componentConfigStore?.tooltipsEnabled() ?? false);
  readonly buttonTooltipsEnabled = computed(() => this.componentConfigStore?.buttonTooltipsEnabled() ?? false);
  readonly componentTooltipsEnabled = computed(() => this.componentConfigStore?.componentTooltipsEnabled() ?? false);
  readonly titlebarButtonLabelsEnabled = computed(() => this.componentConfigStore?.titlebarButtonLabelsEnabled() ?? false);
  readonly consoleLogsEnabled = computed(() => this.componentConfigStore?.consoleLogsEnabled() ?? false);

  toggleTooltips(): void {
    this.componentConfigStore?.toggleTooltips();
  }

  toggleButtonTooltips(): void {
    this.componentConfigStore?.toggleButtonTooltips();
  }

  toggleComponentTooltips(): void {
    this.componentConfigStore?.toggleComponentTooltips();
  }

  toggleTitlebarButtonLabels(): void {
    this.componentConfigStore?.toggleTitlebarButtonLabels();
  }

  toggleConsoleLogs(): void {
    this.componentConfigStore?.toggleConsoleLogs();
  }

  readonly shortcuts = [
    { id: 'new-note', label: '새 노트 / 세션 진행', keys: 'Ctrl + 2' },
    { id: 'save', label: '노트 / 소설 씬 저장', keys: 'Ctrl + S' },
    { id: 'delete', label: '항목 삭제', keys: 'Del' },
    { id: 'search', label: '검색', keys: 'Ctrl + F' },
    { id: 'print', label: '인쇄', keys: 'Ctrl + P' },
  ];

  // ── 📱 Mobile Master-Detail Navigation & Swipe Support ──
  readonly mobileViewLevel = signal<'menu' | 'detail'>('menu');

  readonly activeTabObj = computed(() => {
    return this.displayTabs().find(t => t.id === this.activeTab()) ?? this.displayTabs()[0];
  });

  openMobileDetail(tabId: string): void {
    this.activeTab.set(tabId);
    this.mobileViewLevel.set('detail');
    if (this.isEmbeddedMode() || this.isSheetMode()) {
      const idx = this.displayTabs().findIndex((t) => t.id === tabId);
      if (idx >= 0 && this.sheetNavStore) {
        this.sheetNavStore.goToSlide(idx + 1);
      }
    }
  }

  goBackToMobileMenu(): void {
    this.mobileViewLevel.set('menu');
    this.sheetNavStore?.navigateBack();
  }

  getTabCleanTitle(tab: SettingsTab): string {
    return tab.label;
  }

  getTabDesc(tabId: string): string {
    if (tabId === 'play-theme') {
      return '화면 모드, 스킨, 밀도, 움직임';
    }
    const descriptions: Record<string, string> = {
      'reader-options': '서사 타이핑 연출, 배속, 자동 재생 및 저장',
      'preferences': '버튼 설명 툴팁, 콘솔 로그',
      'window': '창 모드 또는 전체화면 앱 실행 방식',
      'general': 'UI 기본 표시 언어',
      'shortcuts': '단축키 및 키보드 조작 안내',
      'notification': '리마인더 알림 및 시스템 효과음',
      'sync': '클라우드 데이터 실시간 자동 동기화',
      'info': `빌드 ${this.buildInfo.buildDateKst} (${this.buildInfo.gitCommit})`,
    };
    return descriptions[tabId] ?? '상세 설정 관리';
  }

  getTabBadge(tabId: string): string | null {
    if (tabId === 'play-theme') {
      const skin = this.themeStore?.appearanceSkin();
      return LW_SKIN_OPTIONS.find((o) => o.id === skin)?.name ?? null;
    }
    if (tabId === 'info') {
      return `v${this.buildInfo.version} (${this.buildInfo.gitCommit})`;
    }
    if (tabId === 'window') {
      return this.effectiveWindowLaunchMode() === 'maximized' ? '전체화면' : '창 모드';
    }
    return null;
  }

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  onTouchEnd(e: TouchEvent): void {
    if (this.mobileViewLevel() === 'detail' && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - this.touchStartX;
      const deltaY = Math.abs(e.changedTouches[0].clientY - this.touchStartY);
      // 우측으로 50px 이상 수평 스와이프 시 메뉴 목록으로 복귀
      if (deltaX > 50 && deltaY < 45) {
        this.goBackToMobileMenu();
      }
    }
  }
}
