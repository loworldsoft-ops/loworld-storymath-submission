import { EquipmentSlotKey } from './equipment.model';
import { Item, ItemType } from './item.model';

export type QuestKind = 'main' | 'side';

export type QuestStatus = 'offered' | 'active' | 'completed' | 'claimed' | 'declined';

export type QuestObjectiveType =
  | 'DEFEAT_MONSTER'
  | 'COLLECT_ITEM'
  | 'REACH_SCENE'
  | 'SELECT_CHOICE'
  | 'EQUIP_ITEM'
  | 'HOLD_GOLD'
  | 'COMPLETE_STEP';

/** 목표 달성 판정에 쓰이는 매칭 조건. objective.type에 따라 필요한 필드만 채운다. */
export interface QuestObjectiveMatcher {
  monsterId?: string;
  itemId?: string;
  itemType?: ItemType;
  sceneId?: string;
  choiceId?: string;
  slot?: EquipmentSlotKey;
  goldAmount?: number;
  /** COMPLETE_STEP — 스텝 식별자 */
  stepId?: string;
}

export interface QuestObjective {
  id: string;
  type: QuestObjectiveType;
  /** 사람이 읽는 목표 설명, 예: "해골 전사 1마리 처치" */
  label: string;
  targetCount: number;
  currentCount: number;
  matcher: QuestObjectiveMatcher;
}

export type RpgQuestRewardType =
  | 'SKILL_POINTS'       // 스킬 포인트 (+1 또는 +2)
  | 'STAT_POINTS'        // 스탯 포인트 (+5)
  | 'PERMANENT_HP'       // 영구 체력 (+20)
  | 'PERMANENT_RESIST'   // 영구 올저항 (+10)
  | 'IMBUE_ITEM'         // 일반 아이템 희귀 변환
  | 'ADD_SOCKET'         // 소켓 추가
  | 'PERSONALIZE_ITEM'   // 개인화 이름 각인
  | 'MERCENARY_UNLOCK'   // 용병 고용 해금
  | 'FREE_IDENTIFY'      // 케인 무료 감정
  | 'ARTIFICE_CUBE'      // 큐브 해금
  | 'RUNE_GEM_PACK'      // 룬/보석 보상
  | 'EXP_BONUS'          // 경험치 보너스
  | 'GOLD_ITEM'          // 골드 및 일반/희귀 아이템
  | 'NEXT_ACT_UNLOCK';   // 다음 액트 해금

export interface RpgQuestRewardDetail {
  type: RpgQuestRewardType;
  value?: number;
  runes?: string[];
  description: string;
}

export interface QuestReward {
  gold?: number;
  ruby?: number;
  items?: Item[];
  /** 보상 수령 시 자동 생성할 연대기(ChronicleEntry) 요약 문구 */
  chronicleSummary?: string;
  /** 디아블로 2 특화 퀘스트 보상 상세 */
  rpgReward?: RpgQuestRewardDetail;
}

export interface Quest {
  id: string;
  title: string;
  kind: QuestKind;
  /** 퀘스트를 제안한 NPC/발단, 예: '현자 데커드' */
  giver?: string;
  description: string;
  objectives: QuestObjective[];
  reward: QuestReward;
  status: QuestStatus;
  acceptedAt?: string;
  completedAt?: string;
  /** 디아2 메인 보스 퀘스트 여부 */
  isMainBossQuest?: boolean;
  /** 디아2 소속 액트 (act1 ~ act5) */
  actId?: 'act1' | 'act2' | 'act3' | 'act4' | 'act5';
  /** 디아2 액트 내 슬롯 순서 (1~6) */
  questIndex?: number;
  /** 디아2 영어 원문 제목 */
  titleEn?: string;
  /** 퀘스트 장소/위치 */
  location?: string;
  /** D2 — 수락 시점 참여자 ID (hero, mercenary) */
  participantIds?: string[];
  /** D2 — 퀘스트 진행 중 누적 XP (파티 합산) */
  questXp?: number;
  /** D2 — 참여자별 퀘스트 XP */
  participantXp?: Record<string, number>;
  /** novel-play 스텝 패널 — 10단계 수행 UI 진행 (objective와 분리) */
  playPanel?: QuestPlayPanelProgress;
}

/** novel-play `lw-study-stage-list` — 퀘스트당 고정 10개 수행 스텝 */
export const QUEST_PLAY_PANEL_STEP_COUNT = 10;

export interface QuestPlayPanelProgress {
  /** 완료된 패널 스텝 번호 (1..QUEST_PLAY_PANEL_STEP_COUNT) */
  completedStepNumbers: number[];
}

/** 패널 스텝 1개 — objective 세그먼트에 매핑 */
export interface QuestPlayPanelStepBinding {
  number: number;
  label: string;
  objectiveId: string;
  objectiveIndex: number;
  /** 이 스텝 완료 시 underlying objective progressEvent 발행 */
  triggersObjectiveProgress: boolean;
  /** 전투 단계 여부 (⚔️) */
  isCombat?: boolean;
  /** 전투 시 등장할 대상 몬스터 명칭 */
  monsterName?: string;
}

/** 씬에 내장되는 퀘스트 제안 — StoryLootOffer와 동일한 얕은 오퍼 패턴을 따른다. */
export interface StoryQuestOffer {
  id: string;
  /** status: 'offered'로 초기화된 완전한 퀘스트 정의 */
  quest: Quest;
  summary: string;
  acceptLabel?: string;
  declineLabel?: string;
}

/** 게임 진행 중 발생하는 이벤트 — 퀘스트 진행 판정 엔진(evaluateQuestProgress)의 입력. */
export type QuestProgressEvent =
  | { type: 'DEFEAT_MONSTER'; monsterId: string }
  | { type: 'COLLECT_ITEM'; itemId: string; itemType: ItemType }
  | { type: 'REACH_SCENE'; sceneId: string }
  | { type: 'SELECT_CHOICE'; choiceId: string }
  | { type: 'EQUIP_ITEM'; itemId: string; slot: EquipmentSlotKey }
  | { type: 'GOLD_CHANGED'; amount: number }
  | { type: 'COMPLETE_STEP'; stepId: string };

