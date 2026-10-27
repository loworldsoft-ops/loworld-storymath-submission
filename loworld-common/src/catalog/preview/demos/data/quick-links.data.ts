import type { DevelopQuickLink } from '../../../../services/models/dx-quick-link.model';

/** 쇼케이스 기본 빠른 이동 — 라우트는 showcase 앱 기준 */
export const DEVELOP_QUICK_LINKS: readonly DevelopQuickLink[] = [
  {
    id: 'catalog',
    label: 'Develop 컴포넌트',
    path: '/develop-demo',
    description: '카탈로그 · API 표 · Live Demo',
  },
];
