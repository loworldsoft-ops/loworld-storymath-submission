import { type LwModalFormField, type LwModalSelectionItem, type LwModalWizardStep, type LwModalSettingsTab } from '../../../ui/overlay/modal/modal.types';
import { type UnifiedCardItemVm } from '../../../ui/data-display/unified-card-item/unified-card-item.component';

export const DEMO_MODAL_FORM_FIELDS: LwModalFormField[] = [
  { id: 'user-id', label: '사용자 아이디', type: 'text', placeholder: '아이디를 입력하세요', required: true },
  { id: 'user-pw', label: '비밀번호', type: 'password', placeholder: '비밀번호 입력', required: true },
  {
    id: 'user-role',
    label: '소속 역할(Role)',
    type: 'select',
    options: [
      { label: '일반 멤버 (Member)', value: 'MEMBER' },
      { label: '관리자 (Admin)', value: 'ADMIN' },
      { label: '프로젝트 소유자 (Owner)', value: 'OWNER' },
    ],
  },
  { id: 'user-memo', label: '비고 메모', type: 'textarea', placeholder: '추가 사항을 입력하세요' },
];

export const DEMO_MODAL_SELECTION_ITEMS: LwModalSelectionItem[] = [
  { id: 'folder-work', label: '업무 및 프로젝트 노트', icon: '📁', description: '기획서, 설계서 및 코드 리뷰' },
  { id: 'folder-personal', label: '개인 아이디어 창고', icon: '💡', description: '개인 스크랩 및 버킷 리스트' },
  { id: 'folder-archive', label: '보관함 (Archive)', icon: '📦', description: '완료된 과거 일지 보관함' },
];

export const DEMO_MODAL_WIZARD_STEPS: LwModalWizardStep[] = [
  { id: 'step-1', title: '1단계: 계정 연동', description: 'Google / Apple / Kakao 캘린더를 연동합니다.' },
  { id: 'step-2', title: '2단계: 동기화 주기', description: '실시간/15분/1시간 단위 동기화 주기를 설정합니다.' },
  { id: 'step-3', title: '3단계: 설정 완료', description: '최종 동의 후 구독 캘린더를 활성화합니다.' },
];

export const DEMO_MODAL_SETTINGS_TABS: LwModalSettingsTab[] = [
  { id: 'general', label: '일반 설정', icon: '⚙️', description: '기본 시스템 언어 및 테마 설정' },
  { id: 'notification', label: '알림 설정', icon: '🔔', description: '푸시 및 사운드 알림 환경설정' },
  { id: 'sync', label: '클라우드 동기화', icon: '☁️', description: '자동 백업 및 저장소 연결 관리' },
  { id: 'info', label: '버전 정보', icon: 'ℹ️', description: 'LoworldUI 라이브러리 및 릴리즈 노트' },
];

export const SAMPLE_CARD_ITEM: UnifiedCardItemVm = {
  id: 'sample-doc-card-1',
  title: 'LoworldUI 공통 카드 시스템 설계 정본.md',
  subTitle: '최근 수정: 방금 전',
  contentSnippet: '공통 카드 체계 통합 및 개별 카드 컴포넌트 전수조사 리팩토링 설계서입니다.',
  badge: '공통 소자',
  badgeVariant: 'primary',
  timestamp: '2026-08-13',
  iconName: 'document',
};

export const SELECTABLE_DEMO_ITEMS = [
  { id: 'item-1', title: '프론트엔드 아키텍처 가이드', desc: 'Angular 19 독립형 컴포넌트 표준' },
  { id: 'item-2', title: '디자인 토큰 시스템 명세', desc: 'HSL 색상 팔레트 및 반응형 간격' },
  { id: 'item-3', title: '모바일 하이브리드 어댑터', desc: 'Capacitor 및 Web 오프라인 동기화' },
];
