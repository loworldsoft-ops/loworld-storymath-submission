import { EquipmentSlots } from './equipment.model';
import { Inventory } from './inventory.model';
import { CharacterSkill } from './skill.model';
import type { EquippedPersonalityState, PersonalityResonanceBonus } from './personality-codex.model';
import type { CharacterClass, CharacterGender } from './character-base.model';

export type { CharacterClass, CharacterGender };

export interface CharacterStats {
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  vitality: number;
  energy: number;
  defense: number;
}

export interface CharacterPersonality {
  type: string;
  tags: string[];
  description: string;
}

export interface Chapter100Progress {
  /** 1~100 사이의 현재 서사시 진행 스텝 번호 */
  currentStep: number;
  /** 진행 또는 완료된 챕터 단계 목록 */
  completedSteps?: number[];
  /** 마지막 플레이/저장 타임스탬프 (ISO 문자열) */
  lastPlayedAt?: string;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  /** 전체 모드 D2 빌드 성별 — 미지정 시 UI 기본값 */
  gender?: CharacterGender;
  level: number;
  /** 현재 레벨에서의 누적 경험치 */
  currentExp?: number;
  /** 다음 레벨에 도달하기 위한 목표 경험치 */
  nextLevelExp?: number;
  equipment: EquipmentSlots;
  inventory: Inventory;
  stats: CharacterStats;
  /** 습득·수련 중인 스킬 목록 (레벨·경지 독립 관리) */
  skills?: CharacterSkill[];
  personality?: CharacterPersonality;
  /** 영웅에게 장착된 성격 슬롯 상태 (주성격, 보조성격, 내면의 욕구) */
  equippedPersonalityState?: EquippedPersonalityState | null;
  /** 영웅의 성격 공명 보너스 */
  activePersonalityResonance?: PersonalityResonanceBonus | null;
  /** 커스텀 클래스 라벨 */
  customClassLabel?: string;
  /** 역할 배지 (전위, 후위 등) */
  roleBadge?: string;
  /** 생물군 타입 */
  creatureType?: string;
  /** 생물군 타입 배지 */
  creatureTypeBadge?: string;
  /** 영웅 아바타 일러스트 URL */
  avatarUrl?: string;
  /** 세션 주인공 아이콘 오버라이드 — novel-party asset id (예: party-wanderer) */
  avatarIconId?: string;
  dungeonKills?: {
    mobs: number;
    bosses: number;
    clears: number;
  };
  /** 현재 체류 중인 구역/위치 정보 (예: 바위 들판, 자매단 야영지) */
  currentLocation?: {
    zoneId?: string;
    title: string;
    subtitle?: string;
    actName?: string;
    isWaypoint?: boolean;
  } | string;
  /** 챕터 100 대서사시 모드 진행 상황 */
  chapter100Progress?: Chapter100Progress;
}