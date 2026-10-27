import type { ReaderSlot, StoryPack } from './narrative.model';
import { resolveTuning } from './narrative-tuning';
import { clamp } from './narrative-util';

/**
 * 공명: 두 사람의 성품 카드 좌표가 얼마나 가까운가.
 * 같은 말을 주고받아도 성품이 맞는 사람과 더 가까워진다. 대화 장면의 인연 변화에만 쓴다(슬롯의 효과는 그대로).
 */
export type ResonanceLevel = 'resonant' | 'neutral' | 'dissonant';

export const PROTAGONIST = 'protagonist';

interface Point { readonly x: number; readonly y: number }

function cardPoint(pack: StoryPack, cardId: string): Point | null {
  const card = pack.cards?.[cardId];
  if (card) return card;
  const trait = pack.traits[cardId];
  return trait && typeof trait.x === 'number' && typeof trait.y === 'number' ? { x: trait.x, y: trait.y } : null;
}

/** 카드들의 좌표 평균. 좌표를 아는 카드가 없으면 null */
export function natureDisposition(pack: StoryPack, cards: readonly string[]): Point | null {
  const points = cards.map((id) => cardPoint(pack, id)).filter((point): point is Point => !!point);
  if (points.length === 0) return null;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

/** 사람의 자리. 주인공은 모은 성품 카드, 인물은 cast의 본성 카드 */
export function personDisposition(slot: ReaderSlot, pack: StoryPack, personId: string): Point | null {
  if (personId === PROTAGONIST) {
    const cards = slot.traitIds.filter((id) => pack.traits[id]?.kind === 'personality');
    return natureDisposition(pack, cards);
  }
  return natureDisposition(pack, pack.cast[personId]?.nature ?? []);
}

export function resonanceDistance(slot: ReaderSlot, pack: StoryPack, a: string, b: string = PROTAGONIST): number | null {
  const first = personDisposition(slot, pack, a);
  const second = personDisposition(slot, pack, b);
  if (!first || !second) return null;
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function resonanceOf(slot: ReaderSlot, pack: StoryPack, a: string, b: string = PROTAGONIST): ResonanceLevel {
  const distance = resonanceDistance(slot, pack, a, b);
  if (distance === null) return 'neutral';
  const tuning = resolveTuning(pack.tuning);
  if (distance <= tuning.resonanceNear) return 'resonant';
  if (distance <= tuning.resonanceFar) return 'neutral';
  return 'dissonant';
}

/** 공명에 따라 인연의 변화를 키우거나 줄인다. 가까워지는 값과 멀어지는 값은 거꾸로 움직인다 */
export function scaleByResonance(delta: number, level: ResonanceLevel, pack: StoryPack): number {
  if (level === 'neutral' || delta === 0) return delta;
  const tuning = resolveTuning(pack.tuning);
  const warmer = level === 'resonant';
  const factor = delta > 0 ? (warmer ? tuning.resonanceWarm : tuning.resonanceCool) : (warmer ? tuning.resonanceCool : tuning.resonanceWarm);
  return Math.round(delta * factor);
}

/** 동료끼리의 인연의 열쇠: 두 id를 사전순으로 `+`로 잇는다. 팩 도구의 tieKey와 같다 */
export function tieKey(a: string, b: string): string {
  return [a, b].sort().join('+');
}

export function tieOf(slot: ReaderSlot, a: string, b: string): number {
  return slot.ties?.[tieKey(a, b)] ?? 0;
}

export function addTies(slot: ReaderSlot, deltas: Readonly<Record<string, number>>): ReaderSlot {
  const ties = { ...(slot.ties ?? {}) };
  for (const [key, delta] of Object.entries(deltas)) {
    const [a, b] = key.split('+');
    const normalized = tieKey(a ?? '', b ?? '');
    ties[normalized] = clamp((ties[normalized] ?? 0) + delta, -100, 100);
  }
  return { ...slot, ties };
}
