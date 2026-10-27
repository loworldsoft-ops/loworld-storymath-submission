export interface ColorTokenMeta {
  token: string;
  name: string;
  lightValue: string;
  darkValue: string;
  description: string;
  category: 'semantic' | 'domain';
}

export const COLOR_TOKENS_CATALOG: ColorTokenMeta[] = [
  {
    token: '--lw-bg-panel',
    name: 'Panel Background',
    lightValue: '#f8fafc',
    darkValue: '#152131',
    description: '메인 패널 및 셸 바탕색',
    category: 'semantic'
  },
  {
    token: '--lw-text-primary',
    name: 'Primary Text',
    lightValue: '#0f172a',
    darkValue: '#edf5ff',
    description: '주요 본문 및 타이틀 텍스트 컬러',
    category: 'semantic'
  },
  {
    token: '--lw-text-secondary',
    name: 'Secondary Text',
    lightValue: '#475569',
    darkValue: '#c4d4e8',
    description: '보조 설명 및 메타데이터 텍스트 컬러',
    category: 'semantic'
  },
  {
    token: '--lw-border-color',
    name: 'Border Divider',
    lightValue: 'rgba(226, 232, 240, 0.8)',
    darkValue: '#2a3b53',
    description: '컨테이너 경계선 및 영역 구분선',
    category: 'semantic'
  },
  {
    token: '--lw-accent-primary',
    name: 'Primary Accent',
    lightValue: '#0284c7',
    darkValue: '#38bdf8',
    description: '버튼, 활성 탭, 주요 액션 하이라이트',
    category: 'semantic'
  },
  // Domain Accent Palettes
  {
    token: '--domain-common',
    name: 'Common Domain Accent',
    lightValue: '#0284c7',
    darkValue: '#38bdf8',
    description: '공통 프리미티브 및 프레임 도메인 테마',
    category: 'domain'
  },
  {
    token: '--domain-novel',
    name: 'Novel Domain Accent',
    lightValue: '#9333ea',
    darkValue: '#c084fc',
    description: '소설/서사 인터랙션 도메인 테마',
    category: 'domain'
  },
  {
    token: '--domain-homework',
    name: 'Homework Domain Accent',
    lightValue: '#10b981',
    darkValue: '#34d399',
    description: '학습/과제 관리 도메인 테마',
    category: 'domain'
  },
  {
    token: '--domain-calendar',
    name: 'Calendar Domain Accent',
    lightValue: '#f59e0b',
    darkValue: '#fbbf24',
    description: '일정/시간 그리드 도메인 테마',
    category: 'domain'
  },
  {
    token: '--domain-note',
    name: 'Note Domain Accent',
    lightValue: '#f43f5e',
    darkValue: '#fb7185',
    description: '노트/문서 도메인 테마',
    category: 'domain'
  },
  {
    token: '--domain-db',
    name: 'Database Domain Accent',
    lightValue: '#4f46e5',
    darkValue: '#818cf8',
    description: '데이터베이스/도감 도메인 테마',
    category: 'domain'
  }
];
