/**
 * LoworldUI Modal Design System & Full Audit Catalog
 * 모노레포 전역(340개 모달/다이얼로그/오버레이 인스턴스) 전수조사 데이터 및 6대 내장 베리언트 체계
 */

import type { LwModalVariant, LwModalSize, LwModalTone, LwModalWindowStyle } from '../ui/overlay/modal/modal.types';

export interface ModalAuditMetrics {
  totalCount: number;
  migratedStandardCount: number;
  unmigratedRawCount: number;
  complianceRate: number;
  variantsCount: number;
  windowStylesCount: number;
  sizesCount: number;
  tonesCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface ModalVariantDefinition {
  id: LwModalVariant;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  countApprox: number;
  percentage: number;
  colorTone: string;
  bestPractice: string;
  codeSnippet: string;
}

export interface ModalCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  variant: LwModalVariant;
  size: LwModalSize;
  windowStyle: LwModalWindowStyle;
  isStandard: boolean;
  status: 'compliant' | 'needs-migration' | 'legacy-overlay';
  recommendation: string;
}

export const MODAL_AUDIT_METRICS: ModalAuditMetrics = {
  totalCount: 340,
  migratedStandardCount: 232,
  unmigratedRawCount: 108,
  complianceRate: 68.2,
  variantsCount: 6,
  windowStylesCount: 3,
  sizesCount: 6,
  tonesCount: 6,
  appDistribution: [
    { app: 'novel', label: 'Wuxia & Novel 세계관 앱', count: 112, percentage: 32.9 },
    { app: 'homework', label: 'Homework & 생산성 도구', count: 78, percentage: 22.9 },
    { app: 'overlay', label: 'Overlay 코어 서비스 & 인증', count: 64, percentage: 18.8 },
    { app: 'showcase', label: 'Showcase 포털 데모', count: 54, percentage: 15.9 },
    { app: 'rpg', label: 'D2R & RPG 전투 시스템', count: 32, percentage: 9.4 },
  ],
};

export const MODAL_VARIANTS_CATALOG: ModalVariantDefinition[] = [
  {
    id: 'confirm',
    name: 'Confirm / Alert Modal',
    nameKo: '확인 / 경고 모달',
    icon: '⚠️',
    description: '작업 확인, 위험 삭제 경고, 알림 메시지를 표시하며 취소/확인 버튼이 자동 배치되는 다이얼로그',
    countApprox: 124,
    percentage: 36.5,
    colorTone: '#ef4444',
    bestPractice: '파괴적 작업(삭제 등)에는 tone="danger"를 적용하여 경고 효과를 극대화합니다.',
    codeSnippet: `<lw-modal
  [(open)]="isConfirmOpen"
  variant="confirm"
  size="sm"
  tone="danger"
  title="캐릭터 삭제 확인"
  subtitle="정말로 이 영웅을 삭제하시겠습니까?"
  detail="삭제된 데이터는 영구히 복구할 수 없습니다."
  confirmLabel="영구 삭제"
  cancelLabel="취소"
  (confirm)="onDeleteConfirmed()"
  (cancel)="isConfirmOpen.set(false)"
/>`,
  },
  {
    id: 'form',
    name: 'Form / Input Modal',
    nameKo: '폼 입력 모달',
    icon: '📝',
    description: '선언형 필드 배열(fields)을 통해 텍스트, 이메일, 셀렉트 박스 등의 입력을 자동으로 렌더링하고 검증하는 모달',
    countApprox: 82,
    percentage: 24.1,
    colorTone: '#3b82f6',
    bestPractice: 'fields 프로퍼티에 LwModalFormField[]를 전달하여 별도 폼 템플릿 없이 표준 폼을 완성합니다.',
    codeSnippet: `<lw-modal
  [(open)]="isFormOpen"
  variant="form"
  size="md"
  title="신규 노트 생성"
  subtitle="작성할 노트의 기본 정보를 입력하세요."
  [fields]="[
    { id: 'title', label: '제목', type: 'text', required: true, placeholder: '노트 제목 입력' },
    { id: 'category', label: '분류', type: 'select', options: [{ label: '일반', value: 'general' }] }
  ]"
  submitLabel="생성 완료"
  (formSubmit)="onFormSubmit($event)"
/>`,
  },
  {
    id: 'custom',
    name: 'Custom Content Modal',
    nameKo: '자유 구성 모달',
    icon: '🧩',
    description: '헤더와 백드롭, 윈도우 프레임 표준을 유지하면서 내부 본문을 ng-content로 자유롭게 합성하는 모달',
    countApprox: 68,
    percentage: 20.0,
    colorTone: '#8b5cf6',
    bestPractice: '복잡한 차트, 에디터 도구, 지도 패널 등을 모달 내부에 배치할 때 사용합니다.',
    codeSnippet: `<lw-modal
  [(open)]="isCustomOpen"
  variant="custom"
  size="lg"
  title="스토리 월드맵 탐색"
  windowStyle="os-desktop"
  [backdropBlur]="true">
  <div class="custom-map-viewport">
    <app-world-map [level]="currentLevel()" />
  </div>
  <footer slot="footer">
    <button lw-button variant="secondary" (click)="isCustomOpen.set(false)">닫기</button>
  </footer>
</lw-modal>`,
  },
  {
    id: 'selection',
    name: 'Selection List Modal',
    nameKo: '아이템 선택 모달',
    icon: '📋',
    description: '아이템 목록(LwModalSelectionItem[])을 표시하고 사용자가 항목을 선택하도록 돕는 단일/다중 선택 다이얼로그',
    countApprox: 34,
    percentage: 10.0,
    colorTone: '#10b981',
    bestPractice: '폴더 이동, 담당자 배정, 스킬 슬롯 장착 등 리스트 중 하나를 고르는 인터랙션에 최적화되어 있습니다.',
    codeSnippet: `<lw-modal
  [(open)]="isSelectionOpen"
  variant="selection"
  size="md"
  title="스킬 장착 슬롯 선택"
  subtitle="장착할 룬 또는 패시브 스킬을 선택하세요."
  [items]="skillItems()"
  [selectedId]="currentSkillId()"
  (itemSelect)="onSkillSelected($event)"
/>`,
  },
  {
    id: 'wizard',
    name: 'Wizard Step Modal',
    nameKo: '위저드 단계 모달',
    icon: '🧙‍♂️',
    description: '상단 스텝 진행도 바와 이전/다음 네비게이션이 내장된 다단계 설정 및 온보딩 마법사 다이얼로그',
    countApprox: 20,
    percentage: 5.9,
    colorTone: '#f59e0b',
    bestPractice: '초기 프로젝트 셋업, 캘린더 구독 단계, 복합 결제 플로우 등에 사용합니다.',
    codeSnippet: `<lw-modal
  [(open)]="isWizardOpen"
  variant="wizard"
  size="lg"
  title="외부 캘린더 동기화 마법사"
  [steps]="[
    { id: 'provider', title: '서비스 선택' },
    { id: 'auth', title: '계정 인증' },
    { id: 'sync', title: '동기화 완료' }
  ]"
  [(currentStep)]="stepIndex"
  (wizardComplete)="onCompleteWizard()"
/>`,
  },
  {
    id: 'settings',
    name: 'Settings Tab Modal',
    nameKo: '환경설정 탭 모달',
    icon: '⚙️',
    description: 'macOS 시스템 설정 스타일의 좌측/상단 카테고리 탭과 독립된 설정 패널을 제공하는 환경설정 다이얼로그',
    countApprox: 12,
    percentage: 3.5,
    colorTone: '#64748b',
    bestPractice: '앱 글로벌 옵션, 테마 및 사운드 설정, 단축키 매핑 패널에 최적화되어 있습니다.',
    codeSnippet: `<lw-modal
  [(open)]="isSettingsOpen"
  variant="settings"
  size="xl"
  title="Loworld 시스템 환경설정"
  [tabs]="[
    { id: 'general', label: '일반', icon: '⚙️' },
    { id: 'appearance', label: '테마 및 외형', icon: '🎨' },
    { id: 'shortcuts', label: '단축키', icon: '⌨️' }
  ]"
  [(activeTab)]="currentSettingsTab"
/>`,
  },
];

export const MODAL_CENSUS_CATALOG: ModalCensusItem[] = [
  {
    id: 'census-mod-01',
    title: '캘린더 구독 마법사 모달',
    location: 'overlay/dialogs/schedule-subscription-modal',
    app: 'Overlay 코어',
    variant: 'custom',
    size: 'md',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '표준 LwModalComponent 규격을 완벽히 준수하고 있음.',
  },
  {
    id: 'census-mod-02',
    title: '회원 통합 로그인 / 인증 모달',
    location: 'overlay/dialogs/member-login-dialog',
    app: 'Overlay 코어',
    variant: 'custom',
    size: 'lg',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '헤더 아크릴 블러 및 탭 분할 완벽 준수.',
  },
  {
    id: 'census-mod-03',
    title: 'DB 개발자 쉘 쿼리 실행 팝업',
    location: 'chrome/shells/db-shell',
    app: 'Showcase 데모',
    variant: 'custom',
    size: 'xl',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '표준 LwModalComponent 적용 완료.',
  },
  {
    id: 'census-mod-04',
    title: '개발자 계정 전환 모달 (.dev-switch-modal)',
    location: 'chrome/shells/homework-shell',
    app: 'Homework 생산성',
    variant: 'custom',
    size: 'md',
    windowStyle: 'standard',
    isStandard: false,
    status: 'needs-migration',
    recommendation: '로컬 div 래퍼를 표준 <lw-modal variant="selection">으로 교체 권장.',
  },
  {
    id: 'census-mod-05',
    title: '국가 / 지역 관리 다이얼로그 (.region-modal)',
    location: 'chrome/shells/homework-shell',
    app: 'Homework 생산성',
    variant: 'custom',
    size: 'md',
    windowStyle: 'standard',
    isStandard: true,
    status: 'compliant',
    recommendation: 'LwModalComponent 내부에 로컬 폼 수용 상태. form variant 전환 고려.',
  },
  {
    id: 'census-mod-06',
    title: '전역 피드백 호스트 다이얼로그 (lw-dialog-host)',
    location: 'primitives/overlay/dialog',
    app: 'Overlay 코어',
    variant: 'confirm',
    size: 'sm',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: 'LwDialogService 연동 표준 호스트로 완벽 준수.',
  },
  {
    id: 'census-mod-07',
    title: '영웅 장비/스킬 상세 정보 팝업 (3종)',
    location: 'collection/items/character-summary-card',
    app: 'RPG 전투',
    variant: 'custom',
    size: 'sm',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '카드 내부 LwModalComponent 인라인 팝업 완벽 준수.',
  },
  {
    id: 'census-mod-08',
    title: '몬스터 등급 및 전리품 상세 모달 (4종)',
    location: 'collection/items/monster-summary-card',
    app: 'RPG 전투',
    variant: 'custom',
    size: 'sm',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '소형 sm 모달 표준 템플릿 준수.',
  },
  {
    id: 'census-mod-09',
    title: '숙제 단계 완료 처리 다이얼로그',
    location: 'collection/lists/homework-stage-list',
    app: 'Homework 생산성',
    variant: 'confirm',
    size: 'sm',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: 'confirm 모달 표준 준수.',
  },
  {
    id: 'census-mod-10',
    title: '영웅 성격 도감 및 로드아웃 관리 모달',
    location: 'collection/panels/character-detail-modal',
    app: 'Novel 세계관',
    variant: 'custom',
    size: 'lg',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '대형 lg 모달 창 스타일 준수.',
  },
  {
    id: 'census-mod-11',
    title: '소설 단락 관리자 커스텀 팝업 4종',
    location: 'collection/panels/novel-paragraph-manager',
    app: 'Novel 세계관',
    variant: 'custom',
    size: 'md',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '단락 주석, 분기 선택 등 4개 모달 표준화 완료.',
  },
  {
    id: 'census-mod-12',
    title: '노트 이동 / 암호 / 알람 모달군 (4종)',
    location: 'surface/dialogs/note-*-modal',
    app: 'Homework 생산성',
    variant: 'custom',
    size: 'md',
    windowStyle: 'os-desktop',
    isStandard: true,
    status: 'compliant',
    recommendation: '모바일 바텀시트 호환 다이얼로그로 표준 준수.',
  },
  {
    id: 'census-mod-13',
    title: '레거시 소설 챕터 생성 팝업 (.custom-chapter-popup)',
    location: 'domains/novel/components/legacy-chapter-popup',
    app: 'Novel 세계관',
    variant: 'custom',
    size: 'md',
    windowStyle: 'frameless',
    isStandard: false,
    status: 'legacy-overlay',
    recommendation: 'z-index 하드코딩 제거 및 <lw-modal variant="form">으로 완전 교체 필요.',
  },
  {
    id: 'census-mod-14',
    title: '스토리 월드맵 전체화면 확장 뷰어',
    location: 'surface/spatial/story-world-map-panel',
    app: 'Novel 세계관',
    variant: 'custom',
    size: 'fullscreen',
    windowStyle: 'frameless',
    isStandard: true,
    status: 'compliant',
    recommendation: 'size="fullscreen" 표준 모달 최대화 모드 준수.',
  },
];
