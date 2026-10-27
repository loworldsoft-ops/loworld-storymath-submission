import type { Folder, Note, Settings, TrashItem } from '../models/document.model';
import { DEFAULT_SETTINGS } from '../models/document.model';
import { createDefaultStages } from '../models/curriculum.model';
import { buildCurriculumMapMarkers } from '../utils/curriculum-map-markers';
import type { CalendarEvent, CalendarInfo, CalendarFilter, CalendarDay } from '../models/schedule.model';
import type { CurriculumRoom, Certification, CertMapMarker } from '../models/curriculum.model';

// ─────────────────────────────────────────────────────────
// Note Sample Data
// ─────────────────────────────────────────────────────────

export const SAMPLE_FOLDERS: Folder[] = [
  { id: 'f1', name: '업무', createdAt: '2026-01-10T09:00:00Z' },
  { id: 'f2', name: '아이디어', createdAt: '2026-02-01T09:00:00Z' },
  { id: 'f3', name: '개인', createdAt: '2026-03-15T09:00:00Z' },
];

export const SAMPLE_NOTES: Note[] = [
  {
    id: 'n1', title: '주간 팀 회의록', folderId: 'f1', type: '회의록',
    content: '<p>안건 1: UI 컴포넌트 라이브러리 릴리즈 일정 논의</p><p>안건 2: 디자인 토큰 정리 완료 확인</p>',
    tags: ['회의', '팀'], isPinned: true, isPublic: false, emoji: '📝',
    attachments: [], createdAt: '2026-04-20T10:00:00Z', updatedAt: '2026-04-21T10:00:00Z',
  },
  {
    id: 'n2', title: 'Shell 컴포넌트 설계 아이디어', folderId: 'f2', type: '일반',
    content: '<p>데스크톱/모바일 Shell을 독립 데이터로 데모 가능하도록 Layout Demo 페이지 구성</p>',
    tags: ['UI', '설계'], isPinned: false, isPublic: false, emoji: '💡',
    attachments: [], createdAt: '2026-04-21T14:00:00Z', updatedAt: '2026-04-21T15:00:00Z',
  },
  {
    id: 'n3', title: '고객사 통화 메모', folderId: 'f1', type: '전화',
    content: '<p>담당자: 홍길동 팀장</p><p>요청 사항: 모바일 달력 뷰 커스터마이징 지원 문의</p>',
    tags: ['고객', '전화'], isPinned: false, isPublic: false, emoji: '📞',
    attachments: [], createdAt: '2026-04-22T11:00:00Z', updatedAt: '2026-04-22T11:30:00Z',
  },
  {
    id: 'n4', title: '릴리즈 체크리스트', folderId: 'f1', type: '할 일',
    content: '<p>- [ ] 컴포넌트 단위 테스트</p><p>- [ ] Storybook 업데이트</p><p>- [ ] CHANGELOG 작성</p>',
    tags: ['배포', '체크리스트'], isPinned: false, isPublic: false, emoji: '✅',
    attachments: [], createdAt: '2026-04-22T09:00:00Z', updatedAt: '2026-04-23T08:00:00Z',
  },
  {
    id: 'n5', title: '주말 독서 메모', folderId: 'f3', type: '일반',
    content: '<p>책: 디자인 시스템 구축 전략</p><p>핵심: 컴포넌트 재사용성과 일관성이 핵심</p>',
    tags: ['독서', '개인'], isPinned: false, isPublic: false, emoji: '📚',
    attachments: [], createdAt: '2026-04-19T20:00:00Z', updatedAt: '2026-04-19T21:00:00Z',
  },
];

export const SAMPLE_TRASH: TrashItem[] = [];

export const SAMPLE_NOTE_SETTINGS: Settings = { ...DEFAULT_SETTINGS };

// ─────────────────────────────────────────────────────────
// Calendar Sample Data
// ─────────────────────────────────────────────────────────

export const SAMPLE_CALENDARS: CalendarInfo[] = [
  {
    id: 'cal1', name: '내 캘린더', accountId: 'acc1', type: 'personal',
    color: '#3b82f6', isVisible: true, isSubscribed: false, isReadOnly: false, isPublic: false,
  },
  {
    id: 'cal2', name: '업무', accountId: 'acc1', type: 'work',
    color: '#10b981', isVisible: true, isSubscribed: false, isReadOnly: false, isPublic: false,
  },
];

const today = new Date();
const d = (offsetDays: number, h = 10, m = 0): Date => {
  const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays, h, m);
  return dt;
};

export const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: 'ev1', calendarId: 'cal1', type: 'event', title: 'UI 컴포넌트 릴리즈 미팅',
    description: '전체 팀 릴리즈 일정 확정', startDate: d(0, 10), endDate: d(0, 11),
    isAllDay: false, isPublic: false,
    createdAt: d(-7), updatedAt: d(-1), ownerId: 'u1',
  },
  {
    id: 'ev2', calendarId: 'cal2', type: 'task', title: '스타일 토큰 정리',
    description: '디자인 시스템 토큰 파일 업데이트', startDate: d(0, 14), endDate: d(0, 15),
    isAllDay: false, isPublic: false, isCompleted: false,
    createdAt: d(-5), updatedAt: d(0), ownerId: 'u1',
  },
  {
    id: 'ev3', calendarId: 'cal1', type: 'event', title: '코드 리뷰 세션',
    description: 'PR #142 리뷰', startDate: d(1, 15), endDate: d(1, 16),
    isAllDay: false, isPublic: false,
    createdAt: d(-3), updatedAt: d(-1), ownerId: 'u1',
  },
  {
    id: 'ev4', calendarId: 'cal1', type: 'event', title: '디자인 피드백 미팅',
    description: '피그마 시안 리뷰', startDate: d(3, 11), endDate: d(3, 12),
    isAllDay: false, isPublic: false,
    createdAt: d(-2), updatedAt: d(-2), ownerId: 'u1',
  },
  {
    id: 'ev5', calendarId: 'cal2', type: 'task', title: 'Layout Demo 구현',
    description: '레이아웃 독립 데모 페이지 개발', startDate: d(0, 9), endDate: d(0, 18),
    isAllDay: false, isPublic: false, isCompleted: false,
    createdAt: d(-1), updatedAt: d(0), ownerId: 'u1',
  },
];

export const SAMPLE_FILTER: CalendarFilter = {
  showEvents: true, showTasks: true, showBirthdays: true, showHolidays: true,
  visibleCalendars: ['cal1', 'cal2'],
};

/** 기준 날짜 기준 42일 월 그리드 생성 */
export function buildMonthDays(base: Date, events: CalendarEvent[]): CalendarDay[] {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayTs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = date.getTime() === todayTs;
    const evts = events.filter(e =>
      e.startDate.getFullYear() === date.getFullYear() &&
      e.startDate.getMonth() === date.getMonth() &&
      e.startDate.getDate() === date.getDate()
    );
    days.push({ date, dayNumber: date.getDate(), isCurrentMonth, isToday, events: evts });
  }
  return days;
}

/** 기준 날짜의 주 7일 반환 */
export function buildWeekDays(base: Date): Date[] {
  const dayOfWeek = base.getDay();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

// ─────────────────────────────────────────────────────────
// Curriculum Sample Data
// ─────────────────────────────────────────────────────────

function makeRoom(
  overrides: Pick<CurriculumRoom, 'id' | 'roomNumber' | 'mentorName' | 'menteeName' | 'status' | 'menteeId'> &
    { groupId?: string; _complete?: number },
): CurriculumRoom {
  const completedCount = overrides._complete ?? 0;
  const stages = createDefaultStages().map((s, i) => ({
    ...s,
    completedAt: i < completedCount
      ? new Date(Date.now() - (completedCount - i) * 86_400_000).toISOString()
      : undefined,
  }));
  return {
    mentorId: 'm1',
    certificationId: undefined,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    stages,
    ...overrides,
  } as CurriculumRoom;
}

export const SAMPLE_HW_ROOMS: CurriculumRoom[] = [
  makeRoom({
    id: 'r1', roomNumber: 'CES-2026-001', mentorName: '박성훈', menteeName: '김지수',
    menteeId: 'mt-kr-01', groupId: 'KR', status: 'active', _complete: 9,
  }),
  makeRoom({
    id: 'r2', roomNumber: 'CES-2026-002', mentorName: '이현석', menteeName: '최민준',
    menteeId: 'mt-mn-01', groupId: 'MN', status: 'review', _complete: 16,
  }),
  makeRoom({
    id: 'r3', roomNumber: 'CES-2026-003', mentorName: '정수빈', menteeName: '오서연',
    menteeId: 'mt-vn-01', groupId: 'VN', status: 'completed', _complete: 16,
  }),
  makeRoom({
    id: 'r4', roomNumber: 'CES-2026-004', mentorName: '박성훈', menteeName: '황민재',
    menteeId: 'mt-kh-01', groupId: 'KH', status: 'pending', _complete: 0,
  }),
  makeRoom({
    id: 'r5', roomNumber: 'CES-2026-005', mentorName: '이현석', menteeName: '강하은',
    menteeId: 'mt-kr-02', groupId: 'KR', status: 'active', _complete: 3,
  }),
];

export const SAMPLE_HW_CERTIFICATIONS: Record<string, Certification> = {
  r3: {
    id: 'cert-1', roomId: 'r3',
    menteeName: '오서연', mentorName: '정수빈',
    completedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    issuedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    certificateNumber: 'CES-2026-000003',
    issuedByAdminId: 'admin1',
  },
};

export const SAMPLE_HW_MARKERS: CertMapMarker[] = buildCurriculumMapMarkers(SAMPLE_HW_ROOMS, {
  getCertificationForRoom: id => SAMPLE_HW_CERTIFICATIONS[id],
});
