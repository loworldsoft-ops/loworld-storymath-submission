export type LwInfoBadgeVariant =
  | 'stream'    // 노블 본문/스트림 중앙 배치형 안내 캡슐 (양면 대칭 6px)
  | 'banner'    // 상단/하단 전폭 띠 배너
  | 'subtle'    // 카드/패널 내부 은은한 서브 뱃지
  | 'outline'   // 테두리 강조형 태그
  | 'solid';    // 고대비 액센트 배경형

export type LwInfoBadgeTone =
  | 'accent'    // 앰버/골드 (대서사 시작, 룬워드, 중요 챕터)
  | 'primary'   // 인디고/로열블루 (일반 정보, 시스템 안내)
  | 'success'   // 에메랄드/그린 (완료, 고용 성공, 활성화)
  | 'warning'   // 오렌지 (주의, 이전 챕터 로딩 센티넬)
  | 'danger'    // 레드 (사망, 패배, 삭제 예정, 긴급)
  | 'neutral';  // 무채색 슬레이트 (기본 메타데이터, 버전 정보)

export type LwInfoBadgeSize = 'xs' | 'sm' | 'md' | 'lg';
