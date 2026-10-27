/**
 * 패턴 검사 (W9 엔진 설계서 7.4). 시험 전용이다. 공개 진입점에 넣지 않는다.
 * 한 독자가 읽은 화마다 "대화가 많다, 전투는 짧다, 매 상황 보상"을 숫자로 잰다.
 * 기준은 콘텐츠 저장소의 bible/style.md 2장.
 */
import type { BoundEpisode, ReaderSlot } from '../narrative.model';

export interface EpisodePattern {
  readonly episodeId: string;
  /** 흡수·경지·얻는 장면(insight)을 뺀 글자 */
  readonly chars: number;
  /** 대사 문단 + 지문 속 “…” */
  readonly dialogueChars: number;
  readonly ratio: number;
  /** 겨루기(clash) 장면의 글자 */
  readonly clashChars: number;
  /** 대화 장면 자리(골랐든 대체 문장이든) */
  readonly talkPlaces: number;
  /** 실제로 고른 대화 장면 */
  readonly talksChosen: number;
  /** 말한 사람의 이름 */
  readonly speakers: readonly string[];
  /** 이 화에서 무언가를 얻었는가(정해진 보상, 전리품, 구슬, 인연, 동료, 연애). 은자는 늘 받으니 세지 않는다 */
  readonly rewarded: boolean;
}

export interface PatternSummary {
  readonly episodes: number;
  readonly chars: number;
  readonly avgRatio: number;
  readonly minRatio: number;
  readonly maxClashChars: number;
  readonly withoutTalk: readonly string[];
  readonly withoutReward: readonly string[];
}

function quotedLength(text: string): number {
  return (text.match(/“[^”]*”/g) ?? []).reduce((sum, quote) => sum + quote.length, 0);
}

function traces(bound: BoundEpisode) {
  return [...bound.paragraphs.flatMap((paragraph) => paragraph.traces), ...(bound.silent ?? [])];
}

export function measureBound(bound: BoundEpisode): Omit<EpisodePattern, 'rewarded' | 'episodeId'> {
  const body = bound.paragraphs.filter((paragraph) => paragraph.beatKind !== 'insight');
  const chars = body.reduce((sum, paragraph) => sum + paragraph.text.length, 0);
  const dialogueChars = body.reduce((sum, paragraph) => sum + (paragraph.dialogue ? paragraph.text.length : quotedLength(paragraph.text)), 0);
  const clashChars = bound.paragraphs.filter((paragraph) => paragraph.beatKind === 'clash').reduce((sum, paragraph) => sum + paragraph.text.length, 0);
  const talkTraces = traces(bound).filter((trace) => trace.place.startsWith('talk:'));
  return {
    chars,
    dialogueChars,
    ratio: chars ? dialogueChars / chars : 0,
    clashChars,
    talkPlaces: talkTraces.length,
    talksChosen: talkTraces.filter((trace) => trace.choiceId.startsWith('talk:talk.')).length,
    speakers: [...new Set(bound.paragraphs.map((paragraph) => paragraph.speakerName).filter((name): name is string => !!name))],
  };
}

function beadTotal(slot: ReaderSlot): number {
  return Object.values(slot.beads ?? {}).reduce((sum, count) => sum + count, 0) + (slot.absorbed?.length ?? 0) + Object.values(slot.sockets ?? {}).reduce((sum, set) => sum + set.length, 0);
}

/** 화 하나를 읽기 전과 읽은 뒤(막간까지)의 슬롯을 비교해 보상이 있었는지 본다 */
export function wasRewarded(before: ReaderSlot, after: ReaderSlot): boolean {
  if (after.traitIds.some((id) => !before.traitIds.includes(id))) return true;
  if (beadTotal(after) > beadTotal(before)) return true;
  if (Object.entries(after.bonds).some(([id, value]) => value > (before.bonds[id] ?? Number.NEGATIVE_INFINITY))) return true;
  if (Object.entries(after.ties ?? {}).some(([key, value]) => value > (before.ties?.[key] ?? 0))) return true;
  if ((after.party ?? []).some((id) => !(before.party ?? []).includes(id))) return true;
  return (after.romance?.stage ?? 0) > (before.romance?.stage ?? 0);
}

export function summarize(patterns: readonly EpisodePattern[]): PatternSummary {
  const chars = patterns.reduce((sum, pattern) => sum + pattern.chars, 0);
  const dialogue = patterns.reduce((sum, pattern) => sum + pattern.dialogueChars, 0);
  return {
    episodes: patterns.length,
    chars,
    avgRatio: chars ? dialogue / chars : 0,
    minRatio: Math.min(...patterns.map((pattern) => pattern.ratio)),
    maxClashChars: Math.max(0, ...patterns.map((pattern) => pattern.clashChars)),
    withoutTalk: patterns.filter((pattern) => pattern.talkPlaces === 0).map((pattern) => pattern.episodeId),
    withoutReward: patterns.filter((pattern) => !pattern.rewarded).map((pattern) => pattern.episodeId),
  };
}
