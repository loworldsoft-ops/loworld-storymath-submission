import type { CharacterClass } from './character-base.model';

/** D2R 캠페인 액트 (LoD 5액트) */
export type CampaignActId = 'act1' | 'act2' | 'act3' | 'act4' | 'act5';

export type CampaignActProgressState = 'locked' | 'hub' | 'cleared';

/** 일반 · 악몽 · 지옥 */
export type CampaignDifficulty = 'normal' | 'nightmare' | 'hell';

export const CAMPAIGN_ACT_IDS: readonly CampaignActId[] = ['act1', 'act2', 'act3', 'act4', 'act5'] as const;

export const CAMPAIGN_DIFFICULTIES: readonly CampaignDifficulty[] = [
  'normal',
  'nightmare',
  'hell',
] as const;

export interface CampaignProgress {
  isActive: boolean;
  /** 캐릭터 생성·난이도 선택 완료 */
  setupComplete: boolean;
  difficulty: CampaignDifficulty;
  unlockedDifficulty: CampaignDifficulty;
  currentActId: CampaignActId;
  currentHubZoneId: string;
  actStates: Record<CampaignActId, CampaignActProgressState>;
  bossesDefeated: Partial<Record<CampaignActId, boolean>>;
  protagonistClassId?: CharacterClass;
  protagonistName?: string;
}

export interface CampaignPersistedState {
  isActive: boolean;
  setupComplete: boolean;
  difficulty: CampaignDifficulty;
  unlockedDifficulty: CampaignDifficulty;
  currentActId: CampaignActId;
  currentHubZoneId: string;
  actStates: Record<CampaignActId, CampaignActProgressState>;
  bossesDefeated: Partial<Record<CampaignActId, boolean>>;
  protagonistClassId?: CharacterClass;
  protagonistName?: string;
  narrativeState?: import('./narrative-state.model').NarrativeWorldState;
  quests?: import('./quest.model').Quest[];
}

export const CAMPAIGN_DIFFICULTY_LABELS: Record<CampaignDifficulty, string> = {
  normal: '일반',
  nightmare: '악몽',
  hell: '지옥',
};

export const CAMPAIGN_ACT_LABELS: Record<CampaignActId, string> = {
  act1: '액트 I',
  act2: '액트 II',
  act3: '액트 III',
  act4: '액트 IV',
  act5: '액트 V',
};

export function createDefaultCampaignProgress(): CampaignProgress {
  return {
    isActive: true,
    setupComplete: false,
    difficulty: 'normal',
    unlockedDifficulty: 'normal',
    currentActId: 'act1',
    currentHubZoneId: 'd2-zone-act1-hub',
    actStates: createCampaignQuestPlayActStates(),
    bossesDefeated: {},
  };
}

/** novel-play 퀘스트 UI — 5액트 챕터 모두 선택·수락 가능 (지도 해금과 분리) */
export function createCampaignQuestPlayActStates(): Record<CampaignActId, CampaignActProgressState> {
  return {
    act1: 'hub',
    act2: 'hub',
    act3: 'hub',
    act4: 'hub',
    act5: 'hub',
  };
}
