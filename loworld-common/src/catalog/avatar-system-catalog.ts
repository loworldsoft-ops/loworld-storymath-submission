/**
 * LoworldUI Avatar Design System & Full Audit Catalog
 * 모노레포 전역(142개 아바타 인스턴스) 전수조사 데이터 및 3단계 폴백/3대 규격 체계
 */

export interface AvatarAuditMetrics {
  totalCount: number;
  standardCount: number;
  rawImgCount: number;
  svgInitialFallbackCount: number;
  complianceRate: number;
  variantsCount: number;
  sizesCount: number;
  appDistribution: Array<{ app: string; label: string; count: number; percentage: number }>;
}

export interface AvatarPresetDefinition {
  id: string;
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

export interface AvatarCensusItem {
  id: string;
  title: string;
  location: string;
  app: string;
  pattern: 'character-portrait' | 'member-initial' | 'bot-assistant' | 'silhouette-fallback';
  currentImpl: 'lw-avatar' | 'img' | 'div.avatar' | 'span.initial' | 'svg';
  isStandard: boolean;
  status: 'compliant' | 'needs-migration' | 'raw-markup';
  recommendation: string;
}

export const AVATAR_AUDIT_METRICS: AvatarAuditMetrics = {
  totalCount: 142,
  standardCount: 48,
  rawImgCount: 54,
  svgInitialFallbackCount: 40,
  complianceRate: 33.8,
  variantsCount: 3,
  sizesCount: 3,
  appDistribution: [
    { app: 'novel', label: 'Novel 서사 및 캐릭터 도감', count: 56, percentage: 39.4 },
    { app: 'homework', label: 'Homework & Study 세션 룸', count: 32, percentage: 22.5 },
    { app: 'chrome', label: 'Core Chrome 및 앱 타이틀바', count: 24, percentage: 16.9 },
    { app: 'develop', label: 'Develop 및 AI 챗봇 어시스턴트', count: 18, percentage: 12.7 },
    { app: 'showcase', label: 'Showcase 및 데스크톱 서피스', count: 12, percentage: 8.5 },
  ],
};

export const AVATAR_PRESETS_CATALOG: AvatarPresetDefinition[] = [
  {
    id: 'character-portrait',
    name: 'Character & Hero Portrait',
    nameKo: '서사 캐릭터 & 영웅 초상화',
    icon: '🧙‍♂️',
    description: '원형 뷰포트에 고해상도 일러스트레이션을 비동기/지연 로딩하며, 이미지 로드 실패 시 이니셜과 테마 그라디언트로 매끄럽게 폴백합니다.',
    countApprox: 56,
    percentage: 39.4,
    colorTone: '#8b5cf6',
    bestPractice: '인라인 img 태그에 border-radius 50%를 적용하지 말고, lazy 로딩과 에러 방어가 캡슐화된 <lw-avatar [src]="url" [alt]="name" [initial]="name.charAt(0)">를 사용하세요.',
    codeSnippet: `<lw-avatar
  [src]="char.avatarUrl"
  [alt]="char.name"
  [initial]="(char.name || '?').charAt(0)"
  size="md" />`,
  },
  {
    id: 'member-initial',
    name: 'Member & Profile Initial Circle',
    nameKo: '회원 & 계정 이니셜 원형 아바타',
    icon: '👤',
    description: '이미지가 없는 사용자 프로필을 위해 이름의 첫 글자를 부드러운 그라디언트 배경(135deg)과 함께 중앙 정렬하여 노출합니다.',
    countApprox: 42,
    percentage: 29.6,
    colorTone: '#3b82f6',
    bestPractice: '별도의 CSS 클래스로 원형 span을 만들지 않고 initialBg 및 initial 인풋을 조합하여 일관된 타이포그래피 스케일을 유지하세요.',
    codeSnippet: `<lw-avatar
  [initial]="(member.displayName || 'U').charAt(0)"
  initialBg="linear-gradient(135deg, #3b82f6, #6366f1)"
  size="sm" />`,
  },
  {
    id: 'bot-assistant',
    name: 'AI Bot & System Assistant',
    nameKo: 'AI 봇 & 시스템 어시스턴트',
    icon: '🤖',
    description: '챗봇 대화창 및 시스템 알림에서 로봇 이모지 또는 시스템 엠블럼을 초경량 원형 아바타로 표현합니다.',
    countApprox: 24,
    percentage: 16.9,
    colorTone: '#10b981',
    bestPractice: '대화창의 반복되는 버블 옆에 size="sm" 크기로 일관되게 배치하여 시각적 흐름을 안정화하세요.',
    codeSnippet: `<lw-avatar
  [src]="data().botAvatarUrl"
  [alt]="data().botName"
  initial="🤖"
  size="sm" />`,
  },
  {
    id: 'anonymous-fallback',
    name: 'Anonymous & Fallback Silhouette',
    nameKo: '익명 사용자 및 에러 방어 실루엣',
    icon: '🛡️',
    description: '이미지도 없고 이름도 없는 완전 익명 상태이거나 데이터 로딩 실패 시 1.5px stroke의 벡터 SVG 윤곽선을 렌더링합니다.',
    countApprox: 20,
    percentage: 14.1,
    colorTone: '#64748b',
    bestPractice: '아무런 인풋도 주지 않아도 깨지지 않는 완전 안전 상태(Graceful Fallback)를 기본 제공합니다.',
    codeSnippet: `<lw-avatar size="md" />`,
  },
];

export const AVATAR_CENSUS_CATALOG: AvatarCensusItem[] = [
  {
    id: 'census-av-01',
    title: 'Character Session Control (상단 캐릭터 전환 바)',
    location: 'loworld-ui/chrome/rails/character-session-control',
    app: 'chrome',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (size="sm" 채택)',
  },
  {
    id: 'census-av-02',
    title: 'Member Session Menu (회원 계정 드롭다운 헤더)',
    location: 'loworld-ui/chrome/rails/member-session-control',
    app: 'chrome',
    pattern: 'member-initial',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (initial="U" 채택)',
  },
  {
    id: 'census-av-03',
    title: 'Chatbot Conversation Bubbles (AI 챗봇 메시지)',
    location: 'loworld-ui/develop/chatbot',
    app: 'develop',
    pattern: 'bot-assistant',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (botAvatarUrl + initial="🤖")',
  },
  {
    id: 'census-av-04',
    title: 'Study Room Member Roster (과제 룸 참여 학생 목록)',
    location: 'loworld-ui/chrome/shells/homework-shell/study-desktop-presenter',
    app: 'homework',
    pattern: 'member-initial',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (size="sm" + 이니셜)',
  },
  {
    id: 'census-av-05',
    title: 'Novel Character Equipment Sheet (영웅 장착 시트)',
    location: 'loworld-ui/collection/panels/novel-play/novel-equipment-sheet',
    app: 'novel',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (size="lg" + 원형 초상화)',
  },
  {
    id: 'census-av-06',
    title: 'Deckard Cain Storybook Guide (케인 대화 텍스트북)',
    location: 'loworld-ui/collection/panels/deckard-cain-guide-panel',
    app: 'novel',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (initial="🧙‍♂️")',
  },
  {
    id: 'census-av-07',
    title: 'Monster Summary Card (몬스터/보스 요약 카드)',
    location: 'loworld-ui/collection/items/monster-summary-card',
    app: 'novel',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수',
  },
  {
    id: 'census-av-08',
    title: 'Homework Room Thumbnail (과제 룸 카드 썸네일)',
    location: 'loworld-ui/collection/items/homework-room-card',
    app: 'homework',
    pattern: 'member-initial',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수',
  },
  {
    id: 'census-av-09',
    title: 'Battle Matchup Inspector (전장 매치업 적/아군 포트레이트)',
    location: 'loworld-ui/surface/panels/battle-matchup-inspector-panel',
    app: 'novel',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (initial="👹" 적군 아바타)',
  },
  {
    id: 'census-av-10',
    title: 'Overview Desktop Surface User (데스크톱 사용자 프로필)',
    location: 'loworld-ui-showcase/shell/overview/desktop/overview-desktop-surface',
    app: 'showcase',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수',
  },
  {
    id: 'census-av-11',
    title: 'Character Detail Modal Portrait (인물 상세 팝업 인라인 이미지)',
    location: 'loworld-ui/collection/panels/character-detail-modal',
    app: 'novel',
    pattern: 'character-portrait',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (모달 내 초상화)',
  },
  {
    id: 'census-av-12',
    title: 'Unified List Item Slot (공통 리스트 아이템 프로필)',
    location: 'loworld-ui/primitives/list/unified-list-item',
    app: 'primitives',
    pattern: 'member-initial',
    currentImpl: 'lw-avatar',
    isStandard: true,
    status: 'compliant',
    recommendation: 'lw-avatar 표준 소자 100% 준수 (44px 리스트 슬롯 통합)',
  },
];
