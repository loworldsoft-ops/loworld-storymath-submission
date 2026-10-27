import type { Stage, StageNumber } from '../models/curriculum.model';
import { QUEST_PLAY_PANEL_STEP_COUNT, type Quest, type QuestObjective, type QuestPlayPanelStepBinding, type QuestProgressEvent } from '../models/quest.model';

export { QUEST_PLAY_PANEL_STEP_COUNT };

/** 퀘스트의 전체 목표 진행률을 0~100 사이 정수 퍼센트로 합산한다(카드 요약 표시용). */
export function getQuestProgressPercent(quest: Quest): number {
  if (quest.objectives.length === 0) {
    return 0;
  }

  const total = quest.objectives.reduce((sum, objective) => sum + objective.targetCount, 0);
  const current = quest.objectives.reduce((sum, objective) => sum + Math.min(objective.currentCount, objective.targetCount), 0);
  if (total === 0) {
    return 0;
  }

  return Math.round((current / total) * 100);
}

export function isQuestStepObjective(objective: QuestObjective): boolean {
  return objective.type === 'COMPLETE_STEP';
}

/** novel-play 스텝 패널에 표시할 목표 — 퀘스트의 모든 objective */
export function getQuestPanelObjectives(quest: Quest): QuestObjective[] {
  return [...quest.objectives];
}

export function questHasPanelObjectives(quest: Quest): boolean {
  return getQuestPanelObjectives(quest).length > 0;
}

/** @deprecated COMPLETE_STEP 전용 — getQuestPanelObjectives 사용 */
export function getQuestStepObjectives(quest: Quest): QuestObjective[] {
  return quest.objectives.filter(isQuestStepObjective);
}

/** @deprecated questHasPanelObjectives 사용 */
export function questHasStepObjectives(quest: Quest): boolean {
  return questHasPanelObjectives(quest);
}

export interface QuestStepDetail {
  label: string;
  isCombat: boolean;
  monsterName?: string;
}

export function resolveQuestStepDetail(
  quest: Quest,
  stepNumber: number,
  objective?: QuestObjective,
): QuestStepDetail {
  const qid = quest.id?.toLowerCase() || '';
  const title = quest.title || '';

  if (qid === 'd2-act1-q1' || qid.includes('den-of-evil') || title.includes('악의 굴')) {
    const detail = RPG_ACT1_Q1_STEP_MAP[stepNumber];
    if (detail) return detail;
  }

  if (qid === 'd2-act1-q2' || title.includes('매장지') || title.includes('핏빛 까마귀')) {
    const detail = RPG_ACT1_Q2_STEP_MAP[stepNumber];
    if (detail) return detail;
  }

  // 범용 RPG 10단계 생성기 (2, 4, 6, 8, 9단계 전투)
  const baseTitle = title.replace(/^Act\s*\d+\s*-\s*\d+\.\s*/i, '').trim();
  const giver = quest.giver || '의뢰인';
  const location = quest.location || baseTitle;

  const genericTemplate = GENERIC_RPG_STEP_FACTORIES[stepNumber];
  if (genericTemplate) {
    return genericTemplate(baseTitle, giver, location);
  }

  return {
    label: `${baseTitle} 수행 — ${stepNumber}/10`,
    isCombat: stepNumber % 2 === 0 || stepNumber === 9,
    monsterName: `${baseTitle} 몬스터`,
  };
}

const RPG_ACT1_Q1_STEP_MAP: Record<number, QuestStepDetail> = {
  1: { label: '🧭 악의 굴 위치 수색 및 입구 진입', isCombat: false },
  2: { label: '⚔️ [전투] 몰락자(Fallen) 척후병 처치', isCombat: true, monsterName: '몰락자' },
  3: { label: '🔍 어두운 동굴 깊은 곳 수색', isCombat: false },
  4: { label: '⚔️ [전투] 굶주린 시체(Hungry Dead) 무리 소탕', isCombat: true, monsterName: '굶주린 시체' },
  5: { label: '🛡️ 자매단 부상병 구출 및 전열 재정비', isCombat: false },
  6: { label: '⚔️ [전투] 해골 궁수(Skeleton Archer) 격파', isCombat: true, monsterName: '해골 궁수' },
  7: { label: '🔮 동굴 내 악마의 제단 파괴 및 정화', isCombat: false },
  8: { label: '⚔️ [전투] 악의 굴 악마 잔당 섬멸', isCombat: true, monsterName: '가고일 악마' },
  9: { label: '💀⚔️ [보스전] 불타는 시체(Corpsefire) 최종 결전', isCombat: true, monsterName: '불타는 시체 (Corpsefire)' },
  10: { label: '🏆 아카라(Akara)에게 악의 굴 정화 보고', isCombat: false },
};

const RPG_ACT1_Q2_STEP_MAP: Record<number, QuestStepDetail> = {
  1: { label: '🧭 차가운 평야를 지나 매장지로 이동', isCombat: false },
  2: { label: '⚔️ [전투] 묘지 입구 해골 전사 무리 처치', isCombat: true, monsterName: '해골 전사' },
  3: { label: '🔍 저주받은 묘비 및 영묘 수색', isCombat: false },
  4: { label: '⚔️ [전투] 배회하는 구울 및 좀비 격파', isCombat: true, monsterName: '구울' },
  5: { label: '🛡️ 카샤의 척후병과 합류 및 작전 수립', isCombat: false },
  6: { label: '⚔️ [전투] 타락한 자매단 무리 격퇴', isCombat: true, monsterName: '타락한 자매단' },
  7: { label: '🔮 망자의 안식을 위한 성수 살포', isCombat: false },
  8: { label: '⚔️ [전투] 핏빛 까마귀 친위대 섬멸', isCombat: true, monsterName: '타락한 로그' },
  9: { label: '💀⚔️ [보스전] 핏빛 까마귀(Blood Raven) 처치', isCombat: true, monsterName: '핏빛 까마귀 (Blood Raven)' },
  10: { label: '🏆 카샤(Kashya)에게 보고 및 로그 용병 지원 수령', isCombat: false },
};

type GenericStepFactory = (baseTitle: string, giver: string, location: string) => QuestStepDetail;

const GENERIC_RPG_STEP_FACTORIES: Record<number, GenericStepFactory> = {
  1: (baseTitle, _giver, location) => ({ label: `🧭 [탐색] ${location} 진입 및 정찰`, isCombat: false }),
  2: (baseTitle) => ({ label: `⚔️ [전투] ${baseTitle} 전초 경비병 처치`, isCombat: true, monsterName: `${baseTitle} 경비병` }),
  3: () => ({ label: `🔍 [수색] 내부 지형 및 전술 거점 확보`, isCombat: false }),
  4: (baseTitle) => ({ label: `⚔️ [전투] ${baseTitle} 정예 순찰대 격퇴`, isCombat: true, monsterName: `${baseTitle} 순찰대` }),
  5: () => ({ label: `🛡️ [정비] 파티 전열 재정비 및 전술 준비`, isCombat: false }),
  6: (baseTitle) => ({ label: `⚔️ [전투] ${baseTitle} 수호 몬스터 무리 격파`, isCombat: true, monsterName: `${baseTitle} 수호병` }),
  7: () => ({ label: `🔮 [조사] 악마의 장치 해제 및 정화`, isCombat: false }),
  8: (baseTitle) => ({ label: `⚔️ [전투] ${baseTitle} 최후 방어선 돌파`, isCombat: true, monsterName: `${baseTitle} 결사대` }),
  9: (baseTitle) => ({ label: `💀⚔️ [보스전] ${baseTitle} 핵심 우두머리 결전`, isCombat: true, monsterName: `${baseTitle} 우두머리` }),
  10: (_baseTitle, giver) => ({ label: `🏆 [보고] ${giver}에게 임무 완수 보고`, isCombat: false }),
};

/** objective 목록 → 퀘스트당 10개 패널 스텝 바인딩 */
export function buildQuestPlayPanelStepBindings(quest: Quest): QuestPlayPanelStepBinding[] {
  const objectives = getQuestPanelObjectives(quest);
  if (objectives.length === 0) {
    return [];
  }

  const bindings: QuestPlayPanelStepBinding[] = [];
  let stepNumber = 1;

  for (let objectiveIndex = 0; objectiveIndex < objectives.length; objectiveIndex++) {
    const objective = objectives[objectiveIndex];
    const remainingObjectives = objectives.length - objectiveIndex;
    const remainingSteps = QUEST_PLAY_PANEL_STEP_COUNT - bindings.length;
    const segmentSize =
      objectiveIndex === objectives.length - 1
        ? remainingSteps
        : Math.max(1, Math.round(remainingSteps / remainingObjectives));

    for (let segmentIndex = 0; segmentIndex < segmentSize && stepNumber <= QUEST_PLAY_PANEL_STEP_COUNT; segmentIndex++) {
      const isLastInSegment = segmentIndex === segmentSize - 1;
      const stepDetail = resolveQuestStepDetail(quest, stepNumber, objective);

      bindings.push({
        number: stepNumber,
        label: stepDetail.label,
        objectiveId: objective.id,
        objectiveIndex,
        triggersObjectiveProgress: isLastInSegment,
        isCombat: stepDetail.isCombat,
        monsterName: stepDetail.monsterName,
      });
      stepNumber++;
    }
  }

  return bindings;
}

/** Quest → Study Stage[] (퀘스트당 10개 수행 스텝) */
export function questObjectivesToStages(quest: Quest): Stage[] {
  return buildQuestPlayPanelStepBindings(quest).map((binding) => ({
    number: binding.number as StageNumber,
    title: binding.label,
    completedAt: isQuestPlayPanelStepComplete(quest, binding.number)
      ? quest.acceptedAt ?? quest.completedAt ?? new Date(0).toISOString()
      : undefined,
  }));
}

/** @deprecated questObjectivesToStages 사용 */
export function questStepObjectivesToStages(quest: Quest): Stage[] {
  return questObjectivesToStages(quest);
}

export function getQuestPanelStepNumbers(quest: Quest): StageNumber[] {
  return buildQuestPlayPanelStepBindings(quest).map(
    (binding) => binding.number as StageNumber,
  );
}

/** @deprecated getQuestPanelStepNumbers 사용 */
export function getQuestStepNumbers(quest: Quest): StageNumber[] {
  return getQuestPanelStepNumbers(quest);
}

export function getQuestPlayPanelStepBinding(
  quest: Quest,
  stepNumber: number,
): QuestPlayPanelStepBinding | null {
  return buildQuestPlayPanelStepBindings(quest).find((binding) => binding.number === stepNumber) ?? null;
}

export function isQuestPlayPanelStepComplete(quest: Quest, stepNumber: number): boolean {
  const binding = getQuestPlayPanelStepBinding(quest, stepNumber);
  if (!binding) {
    return false;
  }

  // 1. 퀘스트 전체가 완료/수령 상태면 모든 스텝 완료
  if (quest.status === 'completed' || quest.status === 'claimed') {
    return true;
  }

  // 2. playPanel에 기록된 완료 스텝 번호 기준 개별 판정 (SSOT)
  if (quest.playPanel?.completedStepNumbers.includes(stepNumber)) {
    return true;
  }

  const objective = getQuestPanelObjectives(quest)[binding.objectiveIndex];
  if (!objective) {
    return false;
  }

  // 3. playPanel이 없는 외부 objective 연동용 비례 계산
  if (objective.targetCount > 1) {
    const segmentBindings = buildQuestPlayPanelStepBindings(quest).filter(
      (candidate) => candidate.objectiveIndex === binding.objectiveIndex,
    );
    const indexInSegment = segmentBindings.findIndex((candidate) => candidate.number === stepNumber);
    if (indexInSegment === -1) {
      return false;
    }
    const completedInSegment = Math.floor(
      (objective.currentCount / objective.targetCount) * segmentBindings.length,
    );
    return indexInSegment < completedInSegment;
  }

  return false;
}

export function findActiveQuestForSteps(
  quests: readonly Quest[],
  focusedQuestId?: string | null,
): Quest | null {
  return findQuestForStepsPanel(quests, focusedQuestId, ['active']);
}

/** novel-play 스텝 패널 대상 — active/completed 퀘스트 (모든 objective 타입) */
export function findQuestForStepsPanel(
  quests: readonly Quest[],
  focusedQuestId?: string | null,
  statuses: readonly Quest['status'][] = ['active', 'completed'],
): Quest | null {
  const isEligible = (quest: Quest) =>
    questHasPanelObjectives(quest) && statuses.includes(quest.status);

  if (focusedQuestId) {
    const focused = quests.find(
      (quest) => quest.id === focusedQuestId && isEligible(quest),
    );
    if (focused) {
      return focused;
    }
  }

  return quests.find(isEligible) ?? null;
}

/** @deprecated getQuestPlayPanelStepBinding 사용 */
export function getQuestObjectiveByStepNumber(
  quest: Quest,
  stepNumber: number,
): QuestObjective | null {
  const binding = getQuestPlayPanelStepBinding(quest, stepNumber);
  if (!binding) {
    return null;
  }
  return getQuestPanelObjectives(quest)[binding.objectiveIndex] ?? null;
}

/** @deprecated getQuestPlayPanelStepBinding 사용 */
export function getQuestStepIdByNumber(quest: Quest, stepNumber: number): string | null {
  const objective = getQuestObjectiveByStepNumber(quest, stepNumber);
  if (!objective) {
    return null;
  }
  return objective.matcher.stepId ?? objective.id;
}

/** sequentialMode — 첫 미완료 패널 스텝만 완료 가능 */
export function isSequentialStepAllowed(quest: Quest, stepNumber: number): boolean {
  if (quest.status !== 'active') {
    return false;
  }
  if (isQuestPlayPanelStepComplete(quest, stepNumber)) {
    return false;
  }

  const bindings = buildQuestPlayPanelStepBindings(quest);
  const firstIncomplete = bindings.find(
    (binding) => !isQuestPlayPanelStepComplete(quest, binding.number),
  );
  if (!firstIncomplete) {
    return false;
  }
  return firstIncomplete.number === stepNumber;
}

/** 스텝 완료 체크 → quest.engine 입력 이벤트 (마일스톤 스텝만) */
export function buildQuestProgressEventForPanelStep(
  quest: Quest,
  stepNumber: number,
): QuestProgressEvent | null {
  const binding = getQuestPlayPanelStepBinding(quest, stepNumber);
  if (!binding?.triggersObjectiveProgress) {
    return null;
  }
  const objective = getQuestPanelObjectives(quest)[binding.objectiveIndex];
  if (!objective) {
    return null;
  }
  return buildQuestProgressEventForObjective(objective);
}

/** 스텝 완료 체크 → quest.engine 입력 이벤트 */
export function buildQuestProgressEventForObjective(
  objective: QuestObjective,
): QuestProgressEvent | null {
  const { matcher } = objective;

  switch (objective.type) {
    case 'COMPLETE_STEP':
      return {
        type: 'COMPLETE_STEP',
        stepId: matcher.stepId ?? objective.id,
      };
    case 'REACH_SCENE':
      if (!matcher.sceneId) {
        return null;
      }
      return { type: 'REACH_SCENE', sceneId: matcher.sceneId };
    case 'DEFEAT_MONSTER':
      if (!matcher.monsterId) {
        return null;
      }
      return { type: 'DEFEAT_MONSTER', monsterId: matcher.monsterId };
    case 'COLLECT_ITEM':
      if (!matcher.itemId || !matcher.itemType) {
        return null;
      }
      return {
        type: 'COLLECT_ITEM',
        itemId: matcher.itemId,
        itemType: matcher.itemType,
      };
    case 'SELECT_CHOICE':
      if (!matcher.choiceId) {
        return null;
      }
      return { type: 'SELECT_CHOICE', choiceId: matcher.choiceId };
    case 'EQUIP_ITEM':
      if (!matcher.itemId || !matcher.slot) {
        return null;
      }
      return {
        type: 'EQUIP_ITEM',
        itemId: matcher.itemId,
        slot: matcher.slot,
      };
    case 'HOLD_GOLD':
      return {
        type: 'GOLD_CHANGED',
        amount: matcher.goldAmount ?? objective.targetCount,
      };
    default:
      return null;
  }
}

export function buildQuestStepsPanelSummary(quest: Quest): {
  progressPercent: number;
  completedSteps: number;
  totalSteps: number;
} {
  const bindings = buildQuestPlayPanelStepBindings(quest);
  const totalSteps = bindings.length || QUEST_PLAY_PANEL_STEP_COUNT;
  const completedSteps = bindings.filter((binding) =>
    isQuestPlayPanelStepComplete(quest, binding.number),
  ).length;

  const panelPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const objectivePercent = getQuestProgressPercent(quest);

  return {
    progressPercent: Math.max(panelPercent, objectivePercent),
    completedSteps,
    totalSteps,
  };
}

function formatQuestPanelStepLabel(
  objective: QuestObjective,
  segmentIndex: number,
  segmentSize: number,
  isLastInSegment: boolean,
): string {
  if (segmentSize === 1) {
    return objective.label;
  }
  if (segmentSize === QUEST_PLAY_PANEL_STEP_COUNT) {
    if (isLastInSegment) {
      return objective.label;
    }
    const base = objective.label.replace(/\s*완료\s*$/, '').trim();
    return `${base} — ${segmentIndex + 1}/${segmentSize}`;
  }
  if (isLastInSegment) {
    return `${objective.label} (${segmentIndex + 1}/${segmentSize})`;
  }
  const base = objective.label.replace(/^\d+\.\s*/, '').replace(/\s*완료\s*$/, '').trim();
  return `${base} — ${segmentIndex + 1}/${segmentSize}`;
}
