// ── 역할 ────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'GROUP_MENTOR' | 'MENTOR' | 'MENTEE';

// ── 수료 단계 ────────────────────────────────────────────
// 기본 16과: 1~16 (커스텀 과제 추가 시 17 이상도 허용)
export type StageNumber = number;
export type BuiltinStageNumber = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16;
export const STAGE_NUMBERS: BuiltinStageNumber[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];

export interface Stage {
  number: StageNumber;
  title: string;
  contentUrl?: string;
  completedAt?: string;  // ISO 날짜. 완료 시 기록
  memoNoteId?: string;   // 단계별 메모 Note id
  completionMemo?: string; // 완료 시 인라인 메모
}

/** check-btn 토글 결과 payload (완료/취소 + 완료일/메모) */
export interface StageCompletionInput {
  number: StageNumber;
  /** true = 완료 처리, false = 완료 취소 */
  completed: boolean;
  /** 완료일 ISO (완료 처리 시), 취소 시 null */
  completedAt: string | null;
  /** 완료 메모, 취소 시 null */
  memo: string | null;
}

export const DEFAULT_STAGE_TITLES: Record<StageNumber, string> = {
  1:  '오리엔테이션 및 학습 안내',
  2:  '학습 기초 다지기',
  3:  '교재 개요 및 핵심 개념',
  4:  '집중 학습 원칙',
  5:  '자기 주도 학습법',
  6:  '협력 학습과 토론',
  7:  '문제 해결 능력',
  8:  '멘토링 입문',
  9:  '심화 학습법',
  10: '소그룹 리더십',
  11: '학습 공동체',
  12: '목표 설정과 의사결정',
  13: '책임과 성실',
  14: '글로벌 역량 이해',
  15: '학습 계획 수립',
  16: '최종 과제 발표',
};

/** CES 기독교 에센스 12과 교육 과정명 */
export const CES_STAGE_NUMBERS: StageNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CES_STAGE_TITLES: Record<StageNumber, string> = {
  1:  '원죄 (ORIGINAL SIN)',
  2:  '구원 (SALVATION)',
  3:  '믿음 (FAITH)',
  4:  '성부 하나님 (GOD THE FATHER)',
  5:  '성자 하나님 (THE SON, JESUS CHRIST)',
  6:  '성령 하나님 (THE HOLY SPIRIT)',
  7:  '교회 (CHURCH)',
  8:  '기도와 말씀묵상 (THE WORD OF GOD & PRAYER)',
  9:  '영적전쟁 (SPIRITUAL WARFARE)',
  10: '종말론 (ESCHATOLOGY)',
  11: '사명 (MISSION)',
  12: '말씀과 성령의 교회 (THE WORD AND HOLY SPIRIT CHURCH)',
};

/** CES 12과 Stage 배열 생성 */
export function createCESStages(): Stage[] {
  return CES_STAGE_NUMBERS.map(n => ({
    number: n,
    title: CES_STAGE_TITLES[n],
  }));
}

/** 기본 16단계 Stage 배열 생성 */
export function createDefaultStages(): Stage[] {
  return STAGE_NUMBERS.map(n => ({
    number: n,
    title: DEFAULT_STAGE_TITLES[n],
  }));
}

// ── Room 상태 ────────────────────────────────────────────
export type RoomStatus =
  | 'pending'     // 운영진 승인 대기
  | 'active'      // 진행 중
  | 'review'      // 수료 요청됨 (운영진 검토 중)
  | 'completed'   // 수료 완료
  | 'suspended';  // 중단

// ── 가족 구성원 ──────────────────────────────────────────
export interface FamilyMember {
  name: string;
  relation: string;  // '배우자', '자녀', '부모' 등
  note?: string;
}

// ── 교육 Room ────────────────────────────────────────────
export interface CurriculumRoom {
  id: string;
  roomNumber: string;     // 운영진이 부여한 고유 번호
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  groupId?: string;       // GROUP_MENTOR 소속 그룹
  status: RoomStatus;
  stages: Stage[];        // 항상 16개
  certificationId?: string;
  createdAt: string;
  updatedAt: string;
  /** 멘토-멘티 함께 찍은 사진 URL 목록 */
  sharedPhotoUrls?: string[];
  /** 멘티 가족 사항 */
  menteeFamily?: FamilyMember[];
}

// ── 지리 위치 ─────────────────────────────────────────────
export interface GeoLocation {
  lat: number;
  lng: number;
  countryCode: string;      // ISO 3166-1 alpha-2 (예: "KR", "MN", "VN")
  countryNameKo: string;    // 한국어 국가명 (예: "몽골", "베트남")
  city?: string;            // 도시명
  regionLabel?: string;     // 지역 레이블 (예: "동아시아", "동남아시아")
}

/** 학습자 주요 거주 국가 중심 좌표 */
export const CES_COUNTRY_CENTERS: Record<string, GeoLocation> = {
  KR: { lat: 37.5665, lng: 126.9780, countryCode: 'KR', countryNameKo: '한국',        regionLabel: '동아시아' },
  MN: { lat: 47.8864, lng: 106.9057, countryCode: 'MN', countryNameKo: '몽골',        regionLabel: '중앙아시아' },
  VN: { lat: 21.0285, lng: 105.8542, countryCode: 'VN', countryNameKo: '베트남',      regionLabel: '동남아시아' },
  KH: { lat: 11.5625, lng: 104.9160, countryCode: 'KH', countryNameKo: '캄보디아',    regionLabel: '동남아시아' },
  ID: { lat: -6.2088, lng: 106.8456, countryCode: 'ID', countryNameKo: '인도네시아',  regionLabel: '동남아시아' },
  TH: { lat: 13.7563, lng: 100.5018, countryCode: 'TH', countryNameKo: '태국',        regionLabel: '동남아시아' },
  PH: { lat: 14.5995, lng: 120.9842, countryCode: 'PH', countryNameKo: '필리핀',      regionLabel: '동남아시아' },
  MM: { lat: 16.8661, lng:  96.1951, countryCode: 'MM', countryNameKo: '미얀마',      regionLabel: '동남아시아' },
  LA: { lat: 17.9757, lng: 102.6331, countryCode: 'LA', countryNameKo: '라오스',      regionLabel: '동남아시아' },
  CN: { lat: 39.9042, lng: 116.4074, countryCode: 'CN', countryNameKo: '중국',        regionLabel: '동아시아' },
  JP: { lat: 35.6762, lng: 139.6503, countryCode: 'JP', countryNameKo: '일본',        regionLabel: '동아시아' },
  IN: { lat: 28.6139, lng:  77.2090, countryCode: 'IN', countryNameKo: '인도',        regionLabel: '남아시아' },
  NP: { lat: 27.7172, lng:  85.3240, countryCode: 'NP', countryNameKo: '네팔',        regionLabel: '남아시아' },
  KZ: { lat: 51.1605, lng:  71.4704, countryCode: 'KZ', countryNameKo: '카자흐스탄', regionLabel: '중앙아시아' },
  UZ: { lat: 41.2995, lng:  69.2401, countryCode: 'UZ', countryNameKo: '우즈베키스탄', regionLabel: '중앙아시아' },
  US: { lat: 38.8951, lng: -77.0364, countryCode: 'US', countryNameKo: '미국',        regionLabel: '북아메리카' },
  DE: { lat: 52.5200, lng:  13.4050, countryCode: 'DE', countryNameKo: '독일',        regionLabel: '유럽' },
  BR: { lat: -15.780, lng: -47.9292, countryCode: 'BR', countryNameKo: '브라질',      regionLabel: '남아메리카' },
  NG: { lat:  6.5244, lng:   3.3792, countryCode: 'NG', countryNameKo: '나이지리아',  regionLabel: '아프리카' },
};

// ── 사용자 프로필 ─────────────────────────────────────────
export interface HwUserProfile {
  id: string;
  role: UserRole;
  name: string;
  profileImageUrl?: string;
  birthDate?: string;
  gender?: 'M' | 'F';
  address?: string;
  churchAddress?: string;
  contactPhone?: string;
  location?: GeoLocation;   // 현재 거주/사역 위치
  /** 멤버가 속한 나라(국가코드 = studyRegions 문서 id). 국기 표기·지도 핀에 사용 */
  groupId?: string;
  // 멘토 전용
  certificationDate?: string;
  certificationPlace?: string;
  parentMentorId?: string;
  // 운영진 전용
  position?: string;
  churchName?: string;
}

// ── 수료증 ───────────────────────────────────────────────
export interface Certification {
  id: string;
  roomId: string;
  menteeName: string;
  mentorName: string;
  completedAt: string;
  issuedAt: string;
  certificateNumber: string;  // 예: "CES-2026-001234"
  issuedByAdminId: string;
  location?: GeoLocation;     // 수료 당시 위치 스냅샷
}

// ── 앱 설정 ──────────────────────────────────────────────
export type HwLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'mn' | 'vi' | 'km' | 'id';
export type HwTheme = 'light' | 'dark';

export interface HwSettings {
  language: HwLanguage;
  themeMode: HwTheme;
  notifyOnStageComplete: boolean;
  notifyOnCertReview: boolean;
}

export const DEFAULT_HW_SETTINGS: HwSettings = {
  language: 'ko',
  themeMode: 'light',
  notifyOnStageComplete: true,
  notifyOnCertReview: true,
};

// ── UI 환경설정 ──────────────────────────────────────────
export interface HwUiPrefs {
  selectedGroupId: string | null;
  filterStatus: RoomStatus | 'all';
}

export const DEFAULT_HW_UI_PREFS: HwUiPrefs = {
  selectedGroupId: null,
  filterStatus: 'all',
};

// ── 과제 등록 DTO ─────────────────────────────────────────
export interface CreateRoomDto {
  menteeId?: string;      // 등록된 멤버 ID (선택 시)
  menteeName: string;
  mentorId?: string;      // 등록된 멤버 ID (선택 시)
  mentorName: string;
  roomNumber: string;
  groupId?: string;
  status?: RoomStatus;  // 기본값: 'active'
}

// ── 멤버 등록 DTO ─────────────────────────────────────────
export interface CreateMemberDto {
  name: string;
  role: 'GROUP_MENTOR' | 'MENTOR' | 'MENTEE' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER';
  contactPhone?: string;
  memberId?: string;
  /** 멘티 등록 시 배정할 담당 멘토 ID (MENTEE일 때) */
  mentorId?: string;
  /** 배정할 담당 멘토 이름 (MENTEE일 때) */
  mentorName?: string;
  /** 수업이 진행되는 나라(국가코드 = studyRegions 문서 id). 미지정 시 기본 나라로 폴백 */
  groupId?: string;
  /** 포털 멤버 등록 시 로그인 계정 ID */
  loginId?: string;
  /** 포털 멤버 등록 시 이메일 */
  email?: string;
  /** 계정 생성 시 비밀번호 */
  password?: string;
}

// ── 개발용 회원 전환(Impersonation) ───────────────────────
/** 전환 가능한 회원 한 명 */
export interface HwImpersonationOption {
  id: string;
  name: string;
  /** 전환 대상의 역할. 'OWNER'는 본인(포털 OWNER) 복귀를 의미 */
  role: UserRole | 'OWNER';
  /** 드롭다운 표시용 역할 라벨(선택) */
  roleLabel?: string;
}

/** 셸 전환 바 상태 */
export interface HwImpersonationView {
  /** true일 때만 전환 바 노출 (포털 OWNER 개발 테스트 전용) */
  enabled: boolean;
  /** 현재 전환된 회원 ID. null = 본인(OWNER) */
  currentMemberId: string | null;
  /** 전환 가능한 회원 목록(본인 + studyMembers) */
  options: HwImpersonationOption[];
}


// ── 과제(스테이지) 등록 DTO ───────────────────────────────
export interface CreateStageDto {
  roomId: string;        // 등록할 룸 ID
  title: string;         // 과제 제목
  contentUrl?: string;   // 학습 자료 URL (선택)
}

// ── Shell 텍스트/설정 커스터마이징 ──────────────────────────
export interface HwShellConfig {
  /** 멘토 역할 표시명 (기본: '멘토') */
  mentorLabel?: string;
  /** 로그인 버튼 텍스트 (기본: '로그인') */
  loginLabel?: string;
  /** 지도 탭 제목 (기본: '학습자 지도') */
  mapViewTitle?: string;
  /** 검색 placeholder (기본: '이름/방 번호 검색...') */
  searchPlaceholder?: string;
  /** 수료 통계 레이블 (기본: '수료') */
  completedLabel?: string;
  /** 수료 현황 섹션 제목 (기본: '수료 현황') */
  certSectionTitle?: string;
  /** 수료증 로딩 텍스트 (기본: '수료증 데이터를 불러오는 중...') */
  certLoadingText?: string;
  /** 수료증 미발급 안내 (기본: '모든 단계를 완료하면 수료증이 발급됩니다.') */
  certEmptyText?: string;
  /** 수료증 발급 요청 버튼 (기본: '수료증 발급 요청') */
  certRequestBtnText?: string;
  /** 항목 미선택 안내 (기본: '좌측 목록에서 과제를 선택하세요.') */
  emptySelectionText?: string;
  /** 검색 결과 없음 (기본: '검색 결과가 없습니다.') */
  emptySearchText?: string;
  /** 목록 탭 레이블 (기본: '목록') */
  listTabLabel?: string;
  /** 지도 탭 레이블 (기본: '지도') */
  mapTabLabel?: string;
  /** 더보기 탭 레이블 (기본: '더보기') */
  moreTabLabel?: string;
  /** 지도에서 목록으로 돌아가기 버튼 (기본: '목록으로 돌아가기') */
  backToListLabel?: string;
  /** 상태별 표시 레이블 커스터마이징 */
  statusLabels?: Partial<Record<RoomStatus, string>>;
  /** 단계 총 수 (기본: 16) */
  totalStages?: number;
  /** 단계별 커스텀 제목 (CurriculumRoom.stages 데이터를 직접 넣는 것이 우선) */
  stageTitles?: Partial<Record<number, string>>;
}

export const DEFAULT_HW_SHELL_CONFIG: Required<Omit<HwShellConfig, 'statusLabels' | 'stageTitles'>> = {
  mentorLabel:        '멘토',
  loginLabel:         '멤버 로그인',
  mapViewTitle:       '학습자 지도',
  searchPlaceholder:  '이름/방 번호 검색...',
  completedLabel:     '수료',
  certSectionTitle:   '수료 현황',
  certLoadingText:    '수료증 데이터를 불러오는 중...',
  certEmptyText:      '모든 단계를 완료하면 수료증이 발급됩니다.',
  certRequestBtnText: '수료증 발급 요청',
  emptySelectionText: '좌측 목록에서 과제를 선택하세요.',
  emptySearchText:    '검색 결과가 없습니다.',
  listTabLabel:       '목록',
  mapTabLabel:        '지도',
  moreTabLabel:       '더보기',
  backToListLabel:    '목록으로 돌아가기',
  totalStages:        16,
};

export const DEFAULT_HW_STATUS_LABELS: Record<RoomStatus, string> = {
  pending:   '대기',
  active:    '진행중',
  review:    '검토중',
  completed: '수료',
  suspended: '중단',
};

// ── 지도 마커 ────────────────────────────────────────────
export interface CertMapMarker {
  certificationId: string;
  roomId: string;
  menteeName: string;
  mentorName: string;
  countryCode: string;
  countryNameKo: string;
  city?: string;
  regionLabel?: string;
  lat: number;
  lng: number;
  issuedAt: string;
  certificateNumber: string;
  /** 방 상태 — 마커 색·패널 표시용 */
  status?: RoomStatus;
}

export interface CountryRankItem {
  countryCode: string;
  countryNameKo: string;
  regionLabel?: string;
  count: number;
}

// ── 상태 뱃지 색상 ────────────────────────────────────────
export const ROOM_STATUS_COLORS: Record<RoomStatus, { bg: string; border: string; text: string; label: string }> = {
  pending:   { bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.25)', text: '#6b7280', label: '대기' },
  active:    { bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.25)',  text: '#3b82f6', label: '진행중' },
  review:    { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b', label: '검토 중' },
  completed: { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)', text: '#10b981', label: '수료 ★' },
  suspended: { bg: 'rgba(251,50,32,0.10)',   border: 'rgba(251,50,32,0.25)',  text: '#fb3220', label: '중단' },
};
