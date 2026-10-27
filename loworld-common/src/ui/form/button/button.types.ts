import type { LwSize } from '../../../services/tokens/global.tokens';

export type LwButtonVariant =
  | 'primary'      // 솔리드 브랜드 강조 (제출, 완료, 메인 CTA)
  | 'secondary'    // 중립 보조 (취소, 이전, 닫기)
  | 'outline'      // 외곽선 강조 (필터, 보조 액션)
  | 'ghost'        // 투명 평면 (헤더/사이드바 아이콘, 텍스트 링크)
  | 'danger'       // 파괴적 위험 (삭제, 비우기, 초기화)
  | 'novel';       // 소설 RPG 도메인 특화 (골드/룬/타워 액션)

export type LwButtonShape =
  | 'default'      // 사각 라운딩 (4px ~ 10px)
  | 'pill'         // 캡슐형 (border-radius: 9999px)
  | 'circle'       // 1:1 원형 (아이콘 전용, FAB)
  | 'square';      // 1:1 사각형 (아이콘 전용 툴바)

export type LwButtonType = 'button' | 'submit' | 'reset';
