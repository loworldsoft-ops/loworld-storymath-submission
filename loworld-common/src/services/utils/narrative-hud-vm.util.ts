import type { Quest } from '../models/quest.model';
import { getQuestProgressPercent } from './quest-stage.util';
import { renownToLevel, type NarrativeWorldState } from '../models/narrative-state.model';

export type StatSpineTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info';

export interface StatSpineMetricVm {
  id: string;
  icon: string;
  label: string;
  value: string;
  /** 0~100 — HP/MP 게이지 */
  progress?: number;
  tone?: StatSpineTone;
}

export interface StatSpineStripVm {
  metrics: StatSpineMetricVm[];
  resistSummary?: string;
  setSummary?: string;
}

export interface ActiveMissionObjectiveVm {
  id: string;
  label: string;
  current: number;
  target: number;
}

export interface ActiveMissionCardVm {
  questId: string;
  kind: Quest['kind'] | 'commission' | 'bond';
  kindLabel: string;
  title: string;
  progressPercent: number;
  objectives: ActiveMissionObjectiveVm[];
  collapsed?: boolean;
}

export interface BuildStatSpineStripInput {
  worldState: NarrativeWorldState;
  resistSummary?: string;
  setSummary?: string;
}

export function buildStatSpineStripVm(input: BuildStatSpineStripInput): StatSpineStripVm {
  const { vitals, derived, resources } = input.worldState;
  const hpPct = vitals.maxLife > 0 ? Math.round((vitals.life / vitals.maxLife) * 100) : 0;
  const mpPct = vitals.maxMana > 0 ? Math.round((vitals.mana / vitals.maxMana) * 100) : 0;

  return {
    metrics: [
      {
        id: 'hp',
        icon: '❤️',
        label: 'HP',
        value: `${vitals.life}/${vitals.maxLife}`,
        progress: hpPct,
        tone: hpPct <= 25 ? 'warning' : 'neutral',
      },
      {
        id: 'mp',
        icon: '💧',
        label: 'MP',
        value: `${vitals.mana}/${vitals.maxMana}`,
        progress: mpPct,
        tone: 'info',
      },
      {
        id: 'cp',
        icon: '⚔️',
        label: '전투력',
        value: String(derived.combatPower),
        tone: 'positive',
      },
      {
        id: 'gold',
        icon: '🪙',
        label: '골드',
        value: String(resources.gold),
        tone: 'neutral',
      },
      {
        id: 'renown',
        icon: '⭐',
        label: '명성',
        value: `Lv.${renownToLevel(derived.renown)}`,
        tone: 'info',
      },
      {
        id: 'mf',
        icon: '✨',
        label: 'MF',
        value: `${derived.magicFind}%`,
        tone: derived.magicFind >= 50 ? 'positive' : 'neutral',
      },
    ],
    resistSummary: input.resistSummary,
    setSummary: input.setSummary,
  };
}

export function buildActiveMissionCards(activeQuests: Quest[]): ActiveMissionCardVm[] {
  return activeQuests
    .filter((quest) => quest.status === 'active')
    .slice(0, 3)
    .map((quest) => ({
      questId: quest.id,
      kind: quest.kind,
      kindLabel: quest.kind === 'main' ? '메인' : '의뢰',
      title: quest.title,
      progressPercent: getQuestProgressPercent(quest),
      objectives: quest.objectives.map((objective) => ({
        id: objective.id,
        label: objective.label,
        current: Math.min(objective.currentCount, objective.targetCount),
        target: objective.targetCount,
      })),
    }));
}
