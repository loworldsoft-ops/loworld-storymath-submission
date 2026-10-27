/** 빠른 이동 항목 — 쇼케이스 등 호스트가 라우팅 처리 */
export interface DevelopQuickLink {
  id: string;
  label: string;
  /** 라우터 경로 (선행 슬래시 권장), 예: `/develop-components` */
  path: string;
  description?: string;
}
