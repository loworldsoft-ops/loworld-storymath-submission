import type { CodexBaseTier, CodexBaseTierMeta } from './codex-base-tier.model';

export type CodexCardKind =
  | 'base'
  | 'unique'
  | 'set_piece'
  | 'runeword'
  | 'gem'
  | 'rune'
  | 'affix'
  | 'personality'
  | 'skill'
  | 'character'
  | 'monster'
  | 'party'
  | 'custom';

export type CodexCardRarity = 'common' | 'magic' | 'rare' | 'legendary' | 'unique' | 'set';
export type CodexPropTone = 'default' | 'positive' | 'accent' | 'warning' | 'danger';

export interface CodexCardPropLine {
  bullet?: string; // 기본값: '◈'
  label: string;   // 예: "기본 피해", "요구 레벨", "대화 특성", "마나 소모"
  value: string | number; // 예: "45 ~ 110", "Lv.42", "+25%", "35 MP"
  tone?: CodexPropTone;
}

export interface CodexCardRequirementChip {
  label: string;
  met: boolean;
  tooltip?: string;
}

/**
 * 도감 스킬 고유 단락 서사 단계 (起·承·轉·結)
 */
export interface CodexCardParagraphPhase {
  badge: string;  // '起' | '承' | '轉' | '結'
  label: string;  // 예: "기(起) · 비전의 발견"
  title: string;  // 예: "[프레이어] 비급의 개방"
  content: string;// 단락 서사 본문
}

/**
 * 스킬도감 및 랜덤 카드의 단락 서사 (起承轉結) 상세 뷰모델
 */
export interface CodexCardParagraphStory {
  phaseLabel: string; // 활성 단락 명칭
  title: string;      // 활성 단락 소제목
  content: string;    // 활성 단락 서사 본문
  badge?: string;     // 활성 단락 뱃지 ("起", "承", "轉", "結")
  phases?: CodexCardParagraphPhase[]; // 起·承·轉·結 4단락 전체 서사
  activePhaseIndex?: number;          // 현재 활성화/선택된 단락 인덱스 (0~3)
}

/**
 * 도감 카드 식별 및 텍스트 메타 슬라이스 (ISP)
 */
export interface CodexCardIdentitySlice {
  id: string;
  name: string;
  nameEn?: string | null;
  categoryLabel?: string;
  subtitle?: string;
  description?: string;
  lore?: string;
  paragraphStory?: CodexCardParagraphStory;
}

/**
 * 도감 카드 시각 표현 슬라이스 (ISP)
 */
export interface CodexCardVisualSlice {
  previewUrl?: string;
  imageUrl?: string;
  heroImageUrl?: string;
  slotTag?: string;
  categoryTag?: string;
  activeBadge?: string;
  icon?: string;
  iconFallback?: string;
}

/**
 * 도감 카드 등급/분류 슬라이스 (ISP)
 */
export interface CodexCardClassificationSlice {
  tier?: CodexBaseTier | number | string;
  tierLabel?: string;
  kind?: CodexCardKind;
  rarity?: CodexCardRarity;
}

/**
 * 도감 장비 특화 메타 슬라이스 (ISP)
 */
export interface CodexCardEquipmentSlice {
  maxSockets?: number;
  compatibleRunewordCount?: number;
  hasClassRestriction?: boolean;
}

/**
 * 도감 카드 인터랙션/상태 플래그 슬라이스 (ISP)
 */
export interface CodexCardStateSlice {
  selected?: boolean;
  owned?: boolean;
  equipped?: boolean;
  discovered?: boolean;
  disabled?: boolean;
}

/**
 * 도감 카드 세부 프리젠테이션 속성 슬라이스 (ISP)
 */
export interface CodexCardPresentationSlice {
  props?: CodexCardPropLine[];
  requirementChips?: CodexCardRequirementChip[];
  previewStatsLines?: string[];
  metaTags?: string[];
  actionLabel?: string;
}

/**
 * 전 도감(장비, 성격, 스킬, 캐릭터, 몬스터, 파티, 랜덤카드) 공통 카드 뷰모델 합성 인터페이스
 * ISP 원칙에 따라 개별 기능 슬라이스들을 조합(Composition)하여 정의
 */
export interface CodexCardVm
  extends CodexCardIdentitySlice,
    CodexCardVisualSlice,
    CodexCardClassificationSlice,
    CodexCardEquipmentSlice,
    CodexCardStateSlice,
    CodexCardPresentationSlice {}

