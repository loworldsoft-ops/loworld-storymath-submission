import type { StoryEmotion, StoryMoodRule, StoryPack, StoryRegard, StoryStance, StoryVoiceRule } from './narrative.model';
import { resolveTuning } from './narrative-tuning';

/**
 * 성품 → 감정 → 말투. 규칙은 팩의 표(`voice.csv`, `moods.csv`)에 있다.
 * 작가의 감각("교만한 인물이 약한 상대를 만나면 조롱한다")은 코드가 아니라 데이터에 두어야 작가가 고칠 수 있다.
 * 팩에 표가 없으면 팩 도구가 기본 표(conventions/content/defaults)를 넣는다.
 */

function matches(list: readonly string[], value: string): boolean {
  return list.length === 0 || list.includes(value);
}

function holdsAny(nature: readonly string[], cards: readonly string[]): boolean {
  return cards.length === 0 || cards.some((card) => nature.includes(card));
}

/** 상황에 닿아 일어나는 감정. 위에서부터 처음 맞는 줄을 쓴다. 맞는 줄이 없으면 평온하다. */
export function resolveEmotion(pack: StoryPack, nature: readonly string[], situation: string, regard: StoryRegard, bond: number): StoryEmotion {
  const rule = (pack.moods ?? []).find((entry: StoryMoodRule) =>
    matches(entry.situations, situation)
    && holdsAny(nature, entry.cards)
    && matches(entry.regards, regard)
    && (entry.bond === null || bond >= entry.bond));
  return (rule?.emotion ?? 'calm') as StoryEmotion;
}

export interface SpeechInput {
  readonly who: 'protagonist' | 'member';
  /** 주인공의 성향 값. 인물이면 쓰지 않는다 */
  readonly alignment: number;
  readonly nature: readonly string[];
  readonly emotion: string;
  readonly stance: StoryStance;
  readonly regard: StoryRegard;
}

/** 성향 값의 구간. 조건 alignment(cruel|merciful|neutral)와 같은 경계를 쓴다. */
export function alignmentBand(pack: StoryPack, alignment: number): 'cruel' | 'neutral' | 'merciful' {
  const stance = resolveTuning(pack.tuning).alignmentStance;
  if (alignment <= -stance) return 'cruel';
  if (alignment >= stance) return 'merciful';
  return 'neutral';
}

/** 말투. 위에서부터 처음 맞는 줄을 쓴다. 맞는 줄이 없으면 담담하다. */
export function resolveSpeech(pack: StoryPack, input: SpeechInput): string {
  const band = input.who === 'protagonist' ? alignmentBand(pack, input.alignment) : null;
  const rule = (pack.voice ?? []).find((entry: StoryVoiceRule) =>
    (!entry.who || entry.who === input.who)
    && (entry.alignment.length === 0 || (band !== null && entry.alignment.includes(band)))
    && holdsAny(input.nature, entry.cards)
    && matches(entry.emotions, input.emotion)
    && matches(entry.stances, input.stance)
    && matches(entry.regards, input.regard));
  return rule?.speech ?? 'plain';
}
