import { Injectable, computed, inject } from '@angular/core';
import { LwResponsiveService, type LwBreakpointDevice } from './lw-responsive.service';
import { LwScreenRatioService, type LwScreenCategory, type LwCardDimensions } from '../base/lw-screen-ratio.service';
import { LwHeightAnalyzerService } from '../base/lw-height-analyzer.service';
import { LwWidthAnalyzerService } from '../base/lw-width-analyzer.service';
import { LwThemeStore } from '../theme/lw-theme.store';
import { type LwThemeMode, type LwResolvedMode, type LwThemeSkinId, type LwThemeTokens, type LwThemeSkinPreset } from '../theme/lw-theme-tokens.model';

/**
 * 화면 크기, 화면 비율, 높이·너비 분석, 전역 테마를 한 객체로 묶은 파사드.
 *
 * @deprecated 필요한 것만 직접 주입한다: 화면은 `inject(LW_VIEWPORT)`, 테마는 `inject(LwThemeStore)`.
 * 노벨 전용 테마·패널 레이아웃은 `LwNovelPlayThemeService`, `StoryPanelLayoutService`를 직접 쓴다.
 */
@Injectable({ providedIn: 'root' })
export class LwPresentationControlFacade {
  // ── 1. 하위 4대 도메인 서비스 주입 ──
  readonly responsive = inject(LwResponsiveService);
  readonly screenRatio = inject(LwScreenRatioService);
  readonly heightAnalyzer = inject(LwHeightAnalyzerService);
  readonly widthAnalyzer = inject(LwWidthAnalyzerService);
  readonly themeStore = inject(LwThemeStore);

  // ── 2. 화면 반응형 신호 (Screen Size Domain) ──
  readonly viewportWidth = this.responsive.width;
  readonly viewportHeight = this.responsive.height;
  readonly isTouchDevice = this.responsive.isTouchDevice;
  readonly isMobile = this.responsive.isMobile;
  readonly isCompact = this.responsive.isCompact;
  readonly isTablet = this.responsive.isTablet;
  readonly isDesktop = this.responsive.isDesktop;
  readonly deviceTier = this.responsive.deviceTier;

  // ── 3. 화면 종횡비 & 디바이스 스케일 신호 (OS Simulation Domain) ──
  readonly containerWidth = this.screenRatio.containerWidth;
  readonly containerHeight = this.screenRatio.containerHeight;
  readonly aspectRatio = this.screenRatio.aspectRatio;
  readonly isPortrait = this.screenRatio.isPortrait;
  readonly screenCategory = this.screenRatio.screenCategory;
  readonly scaleRatio = this.screenRatio.scaleRatio;
  readonly cardScaleRatio = this.screenRatio.cardScaleRatio;
  readonly cardDimensions = this.screenRatio.cardDimensions;
  readonly bottomDockInset = this.screenRatio.bottomDockInset;

  // ── 4. 테마 & 스킨 신호 (Theme & Skin Domain) ──
  readonly themeMode = this.themeStore.mode;
  readonly skin = this.themeStore.skin;
  readonly effectiveSkin = this.themeStore.effectiveSkin;
  readonly resolvedTheme = this.themeStore.resolved;
  readonly isDark = this.themeStore.isDark;
  readonly activePreset = this.themeStore.activePreset;
  readonly tokens = this.themeStore.tokens;
  readonly hostStyleString = this.themeStore.hostStyleString;

  // ── 5. 통합 제어 액션 ──
  toggleTheme(): void {
    this.themeStore.toggle();
  }

  setThemeMode(mode: LwThemeMode): void {
    this.themeStore.setMode(mode);
  }

  setSkin(skinId: LwThemeSkinId): void {
    this.themeStore.setSkin(skinId);
  }

  /**
   * 지정된 레이아웃 그룹의 높이와 너비를 rAF 기반으로 일괄 재연산 스케줄링합니다.
   */
  recalculateLayout(groupId: string): void {
    this.heightAnalyzer.recalculateGroup(groupId);
    this.widthAnalyzer.recalculateGroup(groupId);
  }
}
