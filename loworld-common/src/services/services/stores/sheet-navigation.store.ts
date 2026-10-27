import { Injectable, computed, signal } from '@angular/core';

export interface SheetSubpageMeta {
  index: number;
  title: string;
  kicker?: string;
  badge?: string;
}

/**
 * 🧭 SheetNavigationStore
 * 
 * 모바일 바텀시트의 헤더 뒤로가기 액션과 슬라이드 인덱스 동기화를 총괄하는 반응형 싱글톤 스토어.
 * - 본문 내부의 중복된 subpage-nav-bar를 완전히 제거하고
 * - 바텀시트 최상단 헤더 좌측에 [← 조합 목록] 뒤로가기 버튼을 자동으로 노출/제어합니다.
 */
@Injectable({ providedIn: 'root' })
export class SheetNavigationStore {
  /** 현재 활성화된 도메인 시트 ID ('hero' | 'adventure' | 'narrative' | 'camp' | 'settings' | 'none') */
  readonly activeSheetId = signal<string>('none');

  /** 현재 슬라이더 인덱스 (0: 조합 목록 Hub, 1..4: 각 도메인 상세 지면) */
  readonly currentSlideIndex = signal<number>(0);

  /** 도메인 기본 타이틀 및 키커 */
  readonly domainTitle = signal<string>('');
  readonly domainKicker = signal<string>('');

  /** 현재 등록된 도메인의 서브페이지 메타 레지스트리 */
  readonly subpages = signal<SheetSubpageMeta[]>([]);

  /** 🔙 뒤로가기 버튼 표시 여부: 서브페이지(인덱스 > 0)에 있을 때 항상 true */
  readonly canGoBack = computed(() => this.currentSlideIndex() > 0);

  /** 뒤로가기 버튼 라벨 */
  readonly backLabel = computed(() => '목록');

  /** 헤더에 표시할 실시간 타이틀 */
  readonly headerDisplayTitle = computed(() => {
    const idx = this.currentSlideIndex();
    if (idx === 0) {
      return this.domainTitle();
    }
    const sub = this.subpages().find((p) => p.index === idx);
    const total = this.subpages().length;
    return sub ? `${sub.title} (${idx}/${total})` : this.domainTitle();
  });

  /** 헤더에 표시할 실시간 키커 */
  readonly headerDisplayKicker = computed(() => {
    const idx = this.currentSlideIndex();
    if (idx === 0) {
      return this.domainKicker();
    }
    const sub = this.subpages().find((p) => p.index === idx);
    return sub?.kicker || this.domainKicker();
  });

  /** 도메인 시트 진입 시 초기화 */
  setupDomain(sheetId: string, title: string, kicker: string, subpages: SheetSubpageMeta[]): void {
    this.activeSheetId.set(sheetId);
    this.domainTitle.set(title);
    this.domainKicker.set(kicker);
    this.subpages.set(subpages);
    this.currentSlideIndex.set(0);
  }

  /** 서브페이지 메타데이터 갱신 */
  setSubpages(subpages: SheetSubpageMeta[]): void {
    this.subpages.set(subpages);
  }

  /** 슬라이드 이동 */
  goToSlide(index: number): void {
    this.currentSlideIndex.set(Math.max(0, index));
  }

  /** 뒤로가기 클릭 시: 항상 Page 0 (조합 목록 허브)으로 즉시 복귀 */
  navigateBack(): void {
    this.currentSlideIndex.set(0);
  }

  /** 시트 종료 시 리셋 */
  reset(): void {
    this.currentSlideIndex.set(0);
    this.activeSheetId.set('none');
    this.subpages.set([]);
  }
}
