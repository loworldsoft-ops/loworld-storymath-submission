/**
 * 도감 스킬 고유 단락 스토리 섹션 (起承轉結 4단락 구조)
 */
export interface SkillStoryPhaseSection {
  readonly phase: 'intro' | 'development' | 'twist' | 'conclusion';
  readonly badge: '起' | '承' | '轉' | '結';
  readonly label: string;
  readonly title: string;
  readonly content: string;
}

/**
 * 도감 스킬 1개에 완결된 고유 단락 스토리 패키지
 */
export interface SkillParagraphStory {
  readonly skillId: string;
  readonly originStory: string; // 비급의 유래 및 전설
  readonly awakeningPassage: string; // 체득 및 깨달음의 순간
  readonly castNarrative: string; // 실전 발동 및 적 격파 순간
  readonly phases: readonly SkillStoryPhaseSection[]; // 起承轉結 4단락 상세 서사
}
