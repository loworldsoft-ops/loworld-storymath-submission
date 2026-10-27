import { Injectable, computed, inject, signal } from '@angular/core';
import { LwThemeStore } from '../theme/lw-theme.store';
import { LwHeightAnalyzerService, type LwHeightDebugGroup } from '../base/lw-height-analyzer.service';
import { LwScreenRatioService, type LwScreenCategory } from '../base/lw-screen-ratio.service';
import { LW_STORAGE_PORT } from '../ports/storage.port';

export interface LwThemeConfigSnapshot {
  mode: string;
  skin: string;
  effectiveSkin: string;
  playTheme: string;
  resolvedMode: 'light' | 'dark';
}

export interface LwViewportConfigSnapshot {
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  screenCategory: LwScreenCategory;
  devicePixelRatio: number;
  isTouchSupported: boolean;
}

export interface LwStorageConfigSnapshot {
  storageType: string;
  storedKeysCount: number;
  sampleKeys: string[];
}

import { type LwBadgeTone } from '../tokens/global.tokens';

export interface LwCustomConfigField {
  label: string;
  value: string | number | boolean | null;
  badgeTone?: LwBadgeTone;
}

export interface LwCustomConfigSectionDefinition {
  id: string;
  title: string;
  icon?: string;
  getFields: () => LwCustomConfigField[];
}

export interface LwCustomConfigSection {
  id: string;
  title: string;
  icon?: string;
  fields: LwCustomConfigField[];
}

export interface LwAppConfigFullSnapshot {
  timestamp: string;
  theme: LwThemeConfigSnapshot;
  viewport: LwViewportConfigSnapshot;
  storage: LwStorageConfigSnapshot;
  heightDebugGroups: LwHeightDebugGroup[];
  customSections: LwCustomConfigSection[];
}

/**
 * 🛠️ LwAppConfigInspectorService
 * 
 * 애플리케이션의 전반적인 환경 설정, 테마/스킨, 뷰포트 규격, 스토리지 상태 및
 * 레이아웃 높이 분석 데이터를 일원화하여 관측(Observe)할 수 있는 싱글톤 진단 서비스 (SRP, OCP).
 * 
 * - 테마, 반응형 화면 비율, 스토리지, 동적 높이 분석기 스냅샷 통합
 * - OCP 기반 `registerCustomSection()` API로 쇼케이스/도메인별 설정 동적 확장 가능
 * - 1-Click JSON 직렬화 및 클립보드 진단 공유 기능 제공
 */
@Injectable({
  providedIn: 'root'
})
export class LwAppConfigInspectorService {
  private readonly themeStore = inject(LwThemeStore);
  private readonly heightAnalyzer = inject(LwHeightAnalyzerService);
  private readonly screenRatio = inject(LwScreenRatioService);
  private readonly storagePort = inject(LW_STORAGE_PORT);

  // ── 1. 테마 & 스킨 설정 스냅샷 (Signal) ──
  readonly themeSnapshot = computed<LwThemeConfigSnapshot>(() => ({
    mode: this.themeStore.mode(),
    skin: this.themeStore.skin(),
    effectiveSkin: this.themeStore.effectiveSkin(),
    playTheme: this.themeStore.playTheme(),
    resolvedMode: this.themeStore.resolved()
  }));

  // ── 2. 뷰포트 & 디바이스 규격 스냅샷 (Signal) ──
  readonly viewportSnapshot = computed<LwViewportConfigSnapshot>(() => {
    const isBrowser = typeof window !== 'undefined';
    return {
      width: this.screenRatio.containerWidth(),
      height: this.screenRatio.containerHeight(),
      aspectRatio: Number(this.screenRatio.aspectRatio().toFixed(3)),
      isPortrait: this.screenRatio.isPortrait(),
      screenCategory: this.screenRatio.screenCategory(),
      devicePixelRatio: isBrowser ? (window.devicePixelRatio || 1) : 1,
      isTouchSupported: isBrowser ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false
    };
  });

  // ── 3. 로컬 스토리지 & 환경 스냅샷 (DIP 준수: LwStoragePort 경유) ──
  readonly storageSnapshot = computed<LwStorageConfigSnapshot>(() => {
    let count = 0;
    const sampleKeys: string[] = [];

    try {
      count = this.storagePort.length;
      for (let i = 0; i < Math.min(count, 15); i++) {
        const k = this.storagePort.key(i);
        if (k) sampleKeys.push(k);
      }
    } catch {
      // Storage access blocked fallback
    }

    return {
      storageType: this.storagePort?.constructor?.name ?? 'LwStoragePort',
      storedKeysCount: count,
      sampleKeys
    };
  });

  // ── 4. 동적 높이 분석기 원천 스냅샷 ──
  getHeightSnapshot(): LwHeightDebugGroup[] {
    return this.heightAnalyzer.getDebugSnapshot();
  }

  // ── 5. OCP 커스텀 섹션 레지스트리 ──
  private readonly customSectionDefs = signal<Map<string, LwCustomConfigSectionDefinition>>(new Map());

  /**
   * 커스텀 설정 섹션 등록 (예: 윈도우 매니저 상태, 세션 계정 상태 등)
   */
  registerCustomSection(def: LwCustomConfigSectionDefinition): void {
    this.customSectionDefs.update(map => {
      const next = new Map(map);
      next.set(def.id, def);
      return next;
    });
  }

  /**
   * 등록된 커스텀 섹션 해제
   */
  unregisterCustomSection(id: string): void {
    this.customSectionDefs.update(map => {
      if (!map.has(id)) return map;
      const next = new Map(map);
      next.delete(id);
      return next;
    });
  }

  /**
   * 등록된 모든 커스텀 섹션의 실시간 필드 리스트 계산
   */
  readonly customSections = computed<LwCustomConfigSection[]>(() => {
    const defs = Array.from(this.customSectionDefs().values());
    return defs.map(def => {
      try {
        return {
          id: def.id,
          title: def.title,
          icon: def.icon,
          fields: def.getFields()
        };
      } catch (err) {
        return {
          id: def.id,
          title: def.title,
          icon: def.icon,
          fields: [{ label: '오류', value: String(err), badgeTone: 'warning' }]
        };
      }
    });
  });

  /**
   * 전체 시스템 설정 및 높이 측정치 단일 스냅샷 캡처
   */
  getFullSnapshot(): LwAppConfigFullSnapshot {
    return {
      timestamp: new Date().toISOString(),
      theme: this.themeSnapshot(),
      viewport: this.viewportSnapshot(),
      storage: this.storageSnapshot(),
      heightDebugGroups: this.getHeightSnapshot(),
      customSections: this.customSections()
    };
  }

  /**
   * 클립보드 복사 및 로그 전송용 JSON 직렬화
   */
  exportSnapshotAsJson(pretty = true): string {
    const snapshot = this.getFullSnapshot();
    return JSON.stringify(snapshot, null, pretty ? 2 : undefined);
  }
}
