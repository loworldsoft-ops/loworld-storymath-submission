/**
 * W9 1장: 말투 규칙을 코드에서 팩의 표로 옮겼다.
 * 기본 표(conventions/content/defaults)가 옮기기 전의 코드와 모든 조합에서 같은 답을 내는지 본다.
 * 아래 `old*` 함수는 W9 전의 narrative-state.ts를 그대로 옮긴 것이다. 비교의 기준이라 고치지 않는다.
 */
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { defaultVoiceTables } from '../../../conventions/content/pack-compiler.mjs';
import type { StoryEmotion, StoryPack, StoryRegard, StorySituation, StoryStance } from './narrative.model';
import { alignmentBand, resolveEmotion, resolveSpeech } from './narrative-voice';

const PRIDE = ['p_pride', 'p_arrogance'];
const ANGER = ['p_anger', 'p_wrath'];
const COMPASSION = ['p_compassion', 'p_kindness'];
const DISCERNMENT = ['p_discernment'];
const COURAGE = ['p_courage'];
const hasAny = (nature: readonly string[], cards: readonly string[]) => cards.some((card) => nature.includes(card));

function oldEmotion(nature: readonly string[], situation: StorySituation, regard: StoryRegard, bond: number): StoryEmotion {
  switch (situation) {
    case 'belittled':
      if (hasAny(nature, [...PRIDE, ...ANGER])) return 'anger';
      return regard === 'up' ? 'fear' : 'hate';
    case 'prevailed':
      return hasAny(nature, COMPASSION) ? 'sorrow' : 'joy';
    case 'humbled':
      return hasAny(nature, PRIDE) ? 'anger' : 'fear';
    case 'friend-at-risk':
      return bond >= 20 ? 'love' : 'calm';
    case 'coveting':
      return 'desire';
    default:
      return 'calm';
  }
}

function oldSpeech(nature: readonly string[], emotion: StoryEmotion, stance: StoryStance, regard: StoryRegard): string {
  const distant = stance === 'hostile' || stance === 'cold';
  if (hasAny(nature, PRIDE) && distant && regard === 'down') return 'mock';
  if (hasAny(nature, PRIDE) && emotion === 'anger' && regard !== 'down') return 'bluster';
  if (hasAny(nature, PRIDE) && regard === 'level') return 'probe';
  if (hasAny(nature, DISCERNMENT) && distant && regard === 'down') return 'lecture';
  if (hasAny(nature, COURAGE) && regard !== 'down') return 'resolve';
  if (hasAny(nature, DISCERNMENT) && regard === 'up') return 'resolve';
  if (emotion === 'fear' && regard === 'up') return 'fawn';
  if (hasAny(nature, COMPASSION) && (emotion === 'love' || emotion === 'sorrow') && (stance === 'warm' || stance === 'trusting')) return 'worry';
  if (hasAny(nature, ANGER) && emotion === 'anger') return 'roar';
  return 'plain';
}

function oldAlignmentSpeech(alignment: number, regard: StoryRegard): string | null {
  if (alignment <= -34) return regard === 'up' ? 'roar' : 'mock';
  if (alignment >= 34) return regard === 'down' ? 'lecture' : 'resolve';
  return null;
}

const pack = { tuning: {}, ...defaultVoiceTables() } as unknown as StoryPack;
const CARDS = ['p_pride', 'p_arrogance', 'p_anger', 'p_wrath', 'p_compassion', 'p_kindness', 'p_discernment', 'p_courage', 'p_shame'];
const EMOTIONS: StoryEmotion[] = ['joy', 'anger', 'sorrow', 'fear', 'love', 'hate', 'desire', 'calm'];
const STANCES: StoryStance[] = ['hostile', 'cold', 'neutral', 'warm', 'trusting'];
const REGARDS: StoryRegard[] = ['down', 'level', 'up'];
const SITUATIONS: StorySituation[] = ['belittled', 'prevailed', 'humbled', 'friend-at-risk', 'coveting', 'none'];
const ALIGNMENTS = [-100, -34, -33, 0, 33, 34, 100];

/** 카드 9장의 모든 부분집합 (512개) */
const NATURES: string[][] = Array.from({ length: 1 << CARDS.length }, (_, mask) => CARDS.filter((_, index) => mask & (1 << index)));

describe('W9 말투 표 — 기본 표가 옛 코드와 같다', () => {
  // 조합이 수십만 개라 줄마다 expect를 부르지 않고 어긋난 것만 모은다.
  it('감정: 카드 부분집합 × 상황 × 눈높이 × 인연', () => {
    let checked = 0;
    const wrong: string[] = [];
    for (const nature of NATURES) for (const situation of SITUATIONS) for (const regard of REGARDS) for (const bond of [-50, 0, 19, 20, 80]) {
      if (resolveEmotion(pack, nature, situation, regard, bond) !== oldEmotion(nature, situation, regard, bond)) wrong.push(`${nature}|${situation}|${regard}|${bond}`);
      checked += 1;
    }
    expect(wrong).toEqual([]);
    expect(checked).toBe(512 * 6 * 3 * 5);
  });

  it('인물의 말투: 카드 부분집합 × 감정 × 태도 × 눈높이', () => {
    const wrong: string[] = [];
    for (const nature of NATURES) for (const emotion of EMOTIONS) for (const stance of STANCES) for (const regard of REGARDS) {
      if (resolveSpeech(pack, { who: 'member', alignment: 0, nature, emotion, stance, regard }) !== oldSpeech(nature, emotion, stance, regard)) wrong.push(`${nature}|${emotion}|${stance}|${regard}`);
    }
    expect(wrong).toEqual([]);
  });

  it('주인공의 말투: 성향이 먼저, 그다음 카드', () => {
    const wrong: string[] = [];
    for (const alignment of ALIGNMENTS) for (const nature of NATURES) for (const emotion of EMOTIONS) for (const stance of STANCES) for (const regard of REGARDS) {
      const expected = oldAlignmentSpeech(alignment, regard) ?? oldSpeech(nature, emotion, stance, regard);
      if (resolveSpeech(pack, { who: 'protagonist', alignment, nature, emotion, stance, regard }) !== expected) wrong.push(`${alignment}|${nature}|${emotion}|${stance}|${regard}`);
    }
    expect(wrong).toEqual([]);
  }, 20000);

  it('인물의 말투는 성향 줄을 쓰지 않는다', () => {
    expect(resolveSpeech(pack, { who: 'member', alignment: -100, nature: [], emotion: 'calm', stance: 'neutral', regard: 'level' })).toBe('plain');
  });

  it('표가 없는 팩은 늘 담담하고 평온하다', () => {
    const bare = { tuning: {} } as unknown as StoryPack;
    expect(resolveSpeech(bare, { who: 'protagonist', alignment: -100, nature: ['p_pride'], emotion: 'anger', stance: 'hostile', regard: 'down' })).toBe('plain');
    expect(resolveEmotion(bare, ['p_pride'], 'belittled', 'up', 0)).toBe('calm');
  });

  it('성향 구간의 경계는 tuning.alignmentStance', () => {
    expect(alignmentBand(pack, -34)).toBe('cruel');
    expect(alignmentBand(pack, -33)).toBe('neutral');
    expect(alignmentBand(pack, 34)).toBe('merciful');
    expect(alignmentBand({ tuning: { alignmentStance: 50 } } as unknown as StoryPack, 40)).toBe('neutral');
  });
});
