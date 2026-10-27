/**
 * LoworldUI Bottom Sheet Design System & Full Audit Catalog
 * 모노레포 전역(180개 바텀시트/드로어 인스턴스) 전수조사 데이터 및 3단계 스냅/4대 프리셋 체계
 */

import type { BottomSheetSnapState } from '../ui/overlay/bottom-sheet/bottom-sheet.component';

export interface BottomSheetAuditMetrics {
  totalCount: number;
  migratedStandardCount: number;
  unmigratedRawCount: number;
  complianceRate: number;
  snapStatesCount: number;
  presetsCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface BottomSheetPresetDefinition {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  defaultSnap: BottomSheetSnapState;
  description: string;
  countApprox: number;
  percentage: number;
  colorTone: string;
  bestPractice: string;
  codeSnippet: string;
}

export interface BottomSheetCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  snapState: BottomSheetSnapState;
  isStandard: boolean;
  status: 'compliant' | 'needs-migration' | 'legacy-drawer';
  recommendation: string;
}

export const BOTTOM_SHEET_AUDIT_METRICS: BottomSheetAuditMetrics = {
  totalCount: 180,
  migratedStandardCount: 118,
  unmigratedRawCount: 62,
  complianceRate: 65.6,
  snapStatesCount: 3,
  presetsCount: 4,
  appDistribution: [
    { app: 'novel', label: 'Novel & Wuxia 모바일 세계관', count: 74, percentage: 41.1 },
    { app: 'showcase', label: 'Showcase 모바일 씬 & 뷰어', count: 42, percentage: 23.3 },
    { app: 'homework', label: 'Homework & 생산성 도구', count: 32, percentage: 17.8 },
    { app: 'rpg', label: 'D2R & RPG 배틀 아레나', count: 20, percentage: 11.1 },
    { app: 'overlay', label: 'Core Overlay 라이브러리', count: 12, percentage: 6.7 },
  ],
};

export const BOTTOM_SHEET_PRESETS_CATALOG: BottomSheetPresetDefinition[] = [
  {
    id: 'action-sheet',
    name: 'Quick Action Sheet',
    nameKo: '퀵 액션 시트',
    icon: '⚡',
    defaultSnap: 'compact',
    description: '작업 선택, 링크 공유, 간편 설정 변경 등 한 손 엄지 조작으로 빠르게 완료하는 컴팩트 시트',
    countApprox: 68,
    percentage: 37.8,
    colorTone: '#3b82f6',
    bestPractice: '옵션 수가 3~5개 미만일 때 initialSnap="compact"를 지정하여 화면 가림을 최소화합니다.',
    codeSnippet: `<lw-bottom-sheet
  [(open)]="isActionSheetOpen"
  title="작업 선택"
  kicker="QUICK ACTIONS"
  initialSnap="compact"
  [edgeToEdge]="true"
  (close)="isActionSheetOpen.set(false)">
  <div class="action-sheet-options">
    <button lw-button variant="secondary" (click)="onShare()">공유하기</button>
    <button lw-button variant="secondary" (click)="onBookmark()">북마크 추가</button>
  </div>
</lw-bottom-sheet>`,
  },
  {
    id: 'content-drawer',
    name: 'Content List Drawer',
    nameKo: '컨텐츠 리스트 드로어',
    icon: '📋',
    defaultSnap: 'standard',
    description: '목록 탐색, 아이템 상세 인스펙션, 단락 주석 리스트 등을 스크롤하며 확인할 수 있는 표준 시트',
    countApprox: 62,
    percentage: 34.4,
    colorTone: '#10b981',
    bestPractice: '스크롤 내용이 많을 때는 contentDrivenHeight와 autoFullscreenThreshold를 함께 활용합니다.',
    codeSnippet: `<lw-bottom-sheet
  [(open)]="isDrawerOpen"
  title="챕터 목차"
  kicker="CHAPTERS"
  initialSnap="standard"
  [scrollable]="true"
  (close)="isDrawerOpen.set(false)">
  <div class="drawer-chapter-list">
    @for (ch of chapters(); track ch.id) {
      <div class="chapter-row" (click)="selectChapter(ch)">
        <strong>{{ ch.title }}</strong>
      </div>
    }
  </div>
</lw-bottom-sheet>`,
  },
  {
    id: 'form-sheet',
    name: 'Mobile Form Sheet',
    nameKo: '모바일 입력 폼 시트',
    icon: '📝',
    defaultSnap: 'standard',
    description: '가상 키보드가 올라오는 모바일 환경에 대응하여 유연하게 높이를 조절하는 폼 입력 시트',
    countApprox: 32,
    percentage: 17.8,
    colorTone: '#f59e0b',
    bestPractice: '입력 필드 포커스 시 키보드 영역을 고려하여 fullWidth="true"와 뒤로가기(showBack)를 구성합니다.',
    codeSnippet: `<lw-bottom-sheet
  [(open)]="isFormSheetOpen"
  title="댓글 작성"
  [showBack]="true"
  backLabel="취소"
  (back)="isFormSheetOpen.set(false)"
  (close)="isFormSheetOpen.set(false)">
  <form class="sheet-form-view" (submit)="onSubmitComment()">
    <textarea class="sheet-textarea" placeholder="생각을 남겨보세요..."></textarea>
    <button lw-button variant="primary" type="submit">등록</button>
  </form>
</lw-bottom-sheet>`,
  },
  {
    id: 'fullscreen-view',
    name: 'Fullscreen Mobile View',
    nameKo: '전체화면 모바일 뷰',
    icon: '📱',
    defaultSnap: 'fullscreen',
    description: '100% 뷰포트 상단에 밀착되어 네이티브 앱의 단독 화면처럼 작동하는 전체화면 시트',
    countApprox: 18,
    percentage: 10.0,
    colorTone: '#8b5cf6',
    bestPractice: '소설 뷰어 본문, 게임 스킬 트리, 맵 탐색 등 화면 전체 몰입이 필요한 곳에 적용합니다.',
    codeSnippet: `<lw-bottom-sheet
  [(open)]="isFullscreenOpen"
  title="스킬 트리 보드"
  kicker="RPG SYSTEM"
  initialSnap="fullscreen"
  [edgeToEdge]="true"
  (close)="isFullscreenOpen.set(false)">
  <app-skill-tree-viewport />
</lw-bottom-sheet>`,
  },
];

export const BOTTOM_SHEET_CENSUS_CATALOG: BottomSheetCensusItem[] = [
  {
    id: 'census-sheet-01',
    title: '모바일 소설 리더 챕터 드로어',
    location: 'chrome/shells/novel-mobile-shell',
    app: 'Novel 모바일',
    snapState: 'standard',
    isStandard: true,
    status: 'compliant',
    recommendation: 'LwBottomSheetComponent 표준 규격 준수.',
  },
  {
    id: 'census-sheet-02',
    title: '소설 단락 주석 & 분기 선택 시트',
    location: 'chrome/shells/novel-mobile-shell',
    app: 'Novel 모바일',
    snapState: 'standard',
    isStandard: true,
    status: 'compliant',
    recommendation: 'contentDrivenHeight 적용 완료.',
  },
  {
    id: 'census-sheet-03',
    title: '모바일 씬 활성 앱 스위처 드로어',
    location: 'shell/overview/overview-mobile-scene',
    app: 'Showcase 모바일',
    snapState: 'compact',
    isStandard: true,
    status: 'compliant',
    recommendation: 'LwBottomSheetComponent 기반 완벽 준수.',
  },
  {
    id: 'census-sheet-04',
    title: '배틀 아레나 스킬 컨트롤 바텀시트',
    location: 'collection/panels/battle-arena-bottom-sheet',
    app: 'RPG 아레나',
    snapState: 'standard',
    isStandard: true,
    status: 'compliant',
    recommendation: '표준 3단계 스냅 지원.',
  },
  {
    id: 'census-sheet-05',
    title: '공통 패널 바텀시트 (panel-bottom-sheet)',
    location: 'collection/panels/panel-bottom-sheet',
    app: 'Overlay 코어',
    snapState: 'standard',
    isStandard: true,
    status: 'compliant',
    recommendation: '프리미티브 래퍼 컴포넌트로 표준 준수.',
  },
  {
    id: 'census-sheet-06',
    title: 'D2R 저장 캐릭터 빠른 선택 슬라이더',
    location: 'collection/panels/d2r-saved-character-sheet',
    app: 'RPG 아레나',
    snapState: 'compact',
    isStandard: true,
    status: 'compliant',
    recommendation: 'LwBottomSheetComponent 규격 준수.',
  },
  {
    id: 'census-sheet-07',
    title: '노트 모바일 환경설정 바텀시트',
    location: 'surface/dialogs/document-settings-dialog',
    app: 'Homework 생산성',
    snapState: 'standard',
    isStandard: true,
    status: 'compliant',
    recommendation: '모바일 감지 시 자동 바텀시트 전환 완벽 준수.',
  },
  {
    id: 'census-sheet-08',
    title: '레거시 모바일 필터 드로어 (.mobile-filter-drawer)',
    location: 'chrome/shells/homework-shell',
    app: 'Homework 생산성',
    snapState: 'compact',
    isStandard: false,
    status: 'legacy-drawer',
    recommendation: '자체 CSS 애니메이션 제거 및 <lw-bottom-sheet initialSnap="compact"> 교체 권장.',
  },
  {
    id: 'census-sheet-09',
    title: '소설 텍스트 폰트/스타일 조절 시트',
    location: 'chrome/shells/novel-mobile-presenter',
    app: 'Novel 모바일',
    snapState: 'compact',
    isStandard: true,
    status: 'compliant',
    recommendation: '퀵 액션 시트 표준 준수.',
  },
  {
    id: 'census-sheet-10',
    title: '레거시 소설 장착품 스탯 팝업 (.stat-slideover)',
    location: 'domains/novel/components/legacy-slideover',
    app: 'Novel 모바일',
    snapState: 'standard',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '하드코딩된 transition 제거 및 LwBottomSheetComponent 마이그레이션 필요.',
  },
];
