export interface WorkHistoryMeta {
  phase: string;
  period: string;
  title: string;
  status: 'completed' | 'in-progress';
  statusLabel: string;
  summary: string;
  keyDeliverables: string[];
  docPath: string;
  docTitle: string;
}

export const WORK_HISTORY_CATALOG: WorkHistoryMeta[] = [
  {
    phase: 'Phase 5',
    period: '2026-08-02',
    title: '통합 개발자 지식 포털 (Developer Knowledge Portal) 구축 & UX 리뉴얼',
    status: 'completed',
    statusLabel: '🟢 완료',
    summary: '/overview/all-components 화면에 5대 메인 탭(UI, Services, Colors, Guides, Work History)을 신설하고 HSL 도메인 테마선 및 글래스모피즘 디자인 리뉴얼.',
    keyDeliverables: [
      'Core Services 탭: BreakpointUtil, LwThemeStore, LwDialogService 주입 코드 1-Click Copy 기능',
      'Theme & Colors 탭: 라이트/다크모드 시맨틱 HSL 토큰 및 8개 도메인 브랜드 스와치',
      'Readme Guides 탭: 4단계 컴포넌트 계층, Barrel Export 패키지 수출 규격 및 Signal 가이드',
      'Work History 탭: 실시간 진행상황 대시보드 및 마일스톤 타임라인 통합',
      '사이드바 카테고리 뱃지 수치 반응형 연산 버그 해결'
    ],
    docPath: 'docs/2026-08-02/core-services-and-theme-palette-developer-explorer-specification.md',
    docTitle: '통합 개발자 포털 설계서'
  },
  {
    phase: 'Phase 4',
    period: '2026-08-02',
    title: '컴포넌트 단일화 & 좀비 소스 100% 물리삭제 (Purge & Consolidation)',
    status: 'completed',
    statusLabel: '🟢 완료',
    summary: '과거 리팩토링 시 남아있던 18개 구형 모달/패널 파편 소스를 LwUnifiedOverlayModalShellComponent로 100% 마이그레이션 및 디스크 물리삭제(rm) 완료.',
    keyDeliverables: [
      '구형 modal, expanded-modal-shell 등 18개 유령 파일 디스크 물리삭제',
      '전수 조사를 통해 118개 순수 정본 컴포넌트 라이브러리 목록 확정',
      'Primitive ➔ Composite ➔ Container ➔ Shell 4단계 계층 수립'
    ],
    docPath: 'docs/2026-08-02/refactoring-failure-root-cause-analysis-and-zombie-code-purge-plan.md',
    docTitle: '좀비 코드 물리삭제 및 원인 분석서'
  },
  {
    phase: 'Phase 3',
    period: '2026-07-18 ~ 2026-07-27',
    title: '서사 연대기 24시간 시계 엔진 & 전투 아레나 (Novel Engine & Battle Arena)',
    status: 'completed',
    statusLabel: '🟢 완료',
    summary: '인터랙티브 소설 21시 시계 멈춤 스턱 결함 원인 해결 및 24시간 실시간 연대기 이벤트를 틱(Tick) 스텝으로 처리하는 NovelJourneyEventLoopEngine 연동.',
    keyDeliverables: [
      '24시간 시계 이벤트를 동기화하는 NovelJourneyEventLoopEngine 개발',
      '수동/자동 전투 아레나 통합 컴포넌트(BattleArenaComponent) 개발',
      '캐릭터 Rank 수치 균등 배분 및 덱 조작 UX 구축'
    ],
    docPath: 'docs/2026-07-27/novel-journey-event-loop-clock-engine-design.md',
    docTitle: '24시간 서사 시계 엔진 설계서'
  },
  {
    phase: 'Phase 2',
    period: '2026-06-16 ~ 2026-06-29',
    title: '회원 & Firestore 데이터베이스 탐색기 콘솔 통합 (Member & DB Console)',
    status: 'completed',
    statusLabel: '🟢 완료',
    summary: '4개 앱의 회원 관리 체계를 단일화하는 Loworld Member Integration 아키텍처 및 Firestore DB 탐색기 구축.',
    keyDeliverables: [
      'Loworld Unified Member 멀티 프로젝트 통합 아키텍처 수립',
      'loworld-db-console 데이터베이스 탐색기 구현 및 Ops 네이밍 정돈',
      '모바일 뷰포트 내 모달 Containment 스펙 및 중앙 정렬 적용'
    ],
    docPath: 'docs/2026-06-18/loworld-member-to-ops-naming-design.md',
    docTitle: '멀티 프로젝트 통합 회원 설계서'
  },
  {
    phase: 'Phase 1',
    period: '2026-04-13 ~ 2026-05-31',
    title: '기초 캘린더/노벨 레이아웃 셸 & Windows OS 표면 구축',
    status: 'completed',
    statusLabel: '🟢 완료',
    summary: 'ezcalendar, eznote, loworld-novel 3대 메인 셸 구축 및 Windows OS 형태의 OverviewWindowManager 아키텍처 수립.',
    keyDeliverables: [
      'ezcalendar 일간 타임라인(lw-day-view) flex: 1 레이아웃 공백 원인 분석 및 수정',
      'Windows OS 형태의 윈도우 매니저 아키텍처 수립',
      '돋움독(Dock) 반응형 모바일 서브 레이아웃 정책 및 다크모드 스토어 연동'
    ],
    docPath: 'docs/2026-04-13/day-view-layout-gap-analysis.md',
    docTitle: '일간 뷰 레이아웃 공백 분석서'
  }
];
