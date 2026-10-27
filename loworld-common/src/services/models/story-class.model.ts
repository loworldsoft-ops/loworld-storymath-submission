import type { CharacterGender } from './character-base.model';

export interface StoryClassBaseStats {
  str: number;
  dex: number;
  vit: number;
  ene: number;
  life: number;
  mana: number;
}

/**
 * 소설별 캐릭터 직업(Class/문파/직능) 메타데이터 정의
 */
export interface StoryClassDefinition {
  /** 직업 고유 식별키 (예: 'hwashan-sword', 'barbarian', 'shadow-hunter') */
  key: string;
  /** 직업/문파 별칭 목록 (하위 호환 및 다중 키 매핑 지원) */
  aliases?: readonly string[];
  /** 한국어 직업명 (예: '화산파 검수', '야만용사') */
  name: string;
  /** 영문 또는 보조 직업명 (예: 'Hwashan Swordsman', 'Barbarian') */
  title: string;
  /** 대표 아이콘 또는 이모지 (예: '🗡️', '⚔️', '🔮') */
  icon: string;
  /** 일러스트 이미지 URL */
  illustrationUrl?: string;
  /** 핵심 주요 스탯 ('str' | 'dex' | 'vit' | 'ene') */
  primaryStat: 'str' | 'dex' | 'vit' | 'ene';
  /** 직업 배경 설명 및 무학/기술 로어 */
  description?: string;
  /** 소속 장르 (예: 'wuxia', 'fantasy', 'scifi', 'hunter') */
  genre?: string;
  /** 소속 소설 ID (예: 'wuxia', 'd2r') */
  storyId?: string;
  /** 소속 문파/세력/팩션명 (무협 세계관에서는 소속이 곧 직업이며 소속 내 세부 직업 분리가 없음) */
  affiliation?: string;
  /** 문파 고유 식별 명칭 (예: '화산파', '소림사') */
  sect?: string;
  /** 직업 기본 시작 능력치 */
  baseStats?: StoryClassBaseStats;
  /** 대표 장비 계통/무기군 (예: '검(劍)', '도(刀)', '지팡이') */
  signatureWeapon?: string;
  /** 특성 태그 목록 (예: ['외문무공', '쾌검', '물리딜러']) */
  tags?: string[];
  /** 지원하는 성별 목록 (미지정 시 ['male', 'female']) */
  supportedGenders?: CharacterGender[];
}

/**
 * 소설별 신규 캐릭터 생성 페이로드
 */
export interface StoryCharacterCreatePayload {
  storyId: string;
  classKey: string;
  name: string;
  gender: CharacterGender;
  difficulty?: string;
  slotIndex?: number;
  customStats?: Partial<StoryClassBaseStats>;
  customPersonalityId?: string;
}
