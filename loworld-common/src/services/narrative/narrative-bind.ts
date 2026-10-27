import type { BoundEpisode, BoundParagraph, BoundTrace, ClashResult, ReaderSlot, StatAxis, StoryBeat, StoryCondition, StoryEffects, StoryEpisode, StoryPack, StoryRelation, StorySituation, StorySpeechLine, StoryTalk } from './narrative.model';
import { activeTraits, applyEffects, bondOf, completedCombinationFlags, contestOverride, evaluateCombinations, memberRelation, ownedTraits, protagonistRelation, situationsForClash } from './narrative-state';
import { beadCount, completedVerses, realmIndex } from './narrative-beads';
import { PROTAGONIST, resonanceOf, scaleByResonance, tieOf } from './narrative-resonance';
import { resolveTuning } from './narrative-tuning';
import { withJosa, stableHash } from './narrative-util';

function joinNames(names: readonly string[]): string {
  return names.join('·');
}

export const PROTAGONIST_ID = 'protagonist';

/** 문장을 고를 때 보는 것 */
export interface BindContext {
  readonly slot: ReaderSlot;
  readonly pack: StoryPack;
  readonly episode: StoryEpisode;
  readonly clash: ClashResult | null;
  readonly catharsis: number;
  readonly axis: StatAxis;
  /** 겨루기의 앞인가 뒤인가. 인물의 감정과 눈높이가 달라진다 */
  readonly afterClash: boolean;
  /** 대화 장면 안이면 그 장면의 상대. 주인공의 말투는 이 사람을 향한다 */
  readonly focusId?: string | null;
  /** 대화 장면 안이면 그 장면에 나오는 사람. 이들과 화의 인물, 동행 중인 동료만 말한다 */
  readonly present?: readonly string[] | null;
  /** 기록(choiceId)의 앞에 붙는 말. 대화 장면 안이면 `talk:<id>#` */
  readonly prefix?: string;
  /** 대사 줄 기록에 쓰는 장면 번호: 원래 파일 안의 번호. 앞에 장면이 끼어들어도 바뀌지 않게 */
  readonly beatSource?: number;
  /** 겨루기 앞의 장면에서 인물이 어림하는 주인공의 힘. 있으면 겨루기를 보기 전의 값으로 눈높이를 정한다(tuning.preClashWitness) */
  readonly before?: { readonly witnessed: Readonly<Record<string, number>>; readonly shownPower: number } | null;
}

function relationFor(context: BindContext, speakerId: string, towardId: string | null): StoryRelation {
  const { pack, episode, clash, axis, afterClash } = context;
  // 겨루기 앞의 말은 겨루기를 보기 전의 눈으로 한다. 엮기 전에 이미 본 힘을 고쳐 두었기 때문이다.
  const slot = !afterClash && context.before ? { ...context.slot, witnessed: context.before.witnessed, shownPower: context.before.shownPower } : context.slot;
  const opponentId = episode.contest?.opponent ?? null;
  const situations = episode.contest
    ? situationsForClash(afterClash ? clash : null)
    : { protagonist: 'none' as StorySituation, opponent: 'none' as StorySituation };
  if (speakerId === PROTAGONIST_ID) {
    const target = towardId ?? context.focusId ?? opponentId ?? episode.cast[0] ?? '';
    return protagonistRelation(slot, pack, target, axis, situations.protagonist, contestOverride(episode, target, axis));
  }
  let situation: StorySituation = 'none';
  if (speakerId === opponentId) {
    situation = situations.opponent;
  } else {
    // 벗은 주인공이 밀리거나 밀릴 것 같을 때 마음을 졸인다.
    const mine = protagonistRelation(slot, pack, opponentId ?? speakerId, axis, 'none', contestOverride(episode, opponentId ?? speakerId, axis));
    const losing = afterClash ? clash?.outcome === 'defeat' : mine.regard === 'up';
    if (opponentId && losing) situation = 'friend-at-risk';
  }
  return memberRelation(slot, pack, speakerId, axis, situation, contestOverride(episode, speakerId, axis));
}

function compare(value: number, op: string, target: number): boolean {
  if (op === '<') return value < target;
  if (op === '<=') return value <= target;
  if (op === '>') return value > target;
  if (op === '>=') return value >= target;
  if (op === '=') return value === target;
  return false;
}

/** OCP(개방-폐쇄 원칙) 전략 맵: 조건 판정 전략 핸들러 레지스트리 */
type ConditionEvaluator = (args: readonly string[], context: BindContext) => boolean;

const CONDITION_EVALUATORS: Record<string, ConditionEvaluator> = {
  origin: (args, ctx) => args.includes(ctx.slot.originId),
  versus: (args, ctx) => !!ctx.episode.contest && args.includes(ctx.episode.contest.opponent),
  axis: (args, ctx) => args.includes(ctx.axis),
  episode: (args, ctx) => args.some((id) => ctx.episode.id === id || ctx.episode.id.startsWith(`${id}:`)),
  outcome: (args, ctx) => !!ctx.clash && args.includes(ctx.clash.outcome),
  tier: (args, ctx) => !!ctx.clash && args.includes(ctx.clash.tier),
  finisher: (args, ctx) => !!ctx.clash && !!ctx.clash.finisherTraitId && args.includes(ctx.clash.finisherTraitId),
  rounds: (args, ctx) => !!ctx.clash && ctx.clash.rounds <= Number(args[0]),
  untouched: (_args, ctx) => !!ctx.clash && ctx.clash.untouched,
  auto: (_args, ctx) => !!ctx.clash && ctx.clash.auto,
  has: (args, ctx) => args.every((id) => ctx.slot.traitIds.includes(id)),
  tag: (args, ctx) => {
    const count = ownedTraits(ctx.slot, ctx.pack).filter((trait) => trait.tags.includes(args[0])).length;
    return count >= Number(args[1] ?? 1);
  },
  combo: (args, ctx) => evaluateCombinations(ctx.slot, ctx.pack).some((entry) => entry.id === args[0] && entry.complete),
  card: (args, ctx) => args.some((id) => ctx.slot.traitIds.includes(id)),
  speech: (args, ctx) => args.slice(1).includes(relationFor(ctx, args[0], null).speech),
  emotion: (args, ctx) => args.slice(1).includes(relationFor(ctx, args[0], null).emotion),
  stance: (args, ctx) => args.slice(1).includes(relationFor(ctx, args[0], null).stance),
  regard: (args, ctx) => args.slice(1).includes(relationFor(ctx, args[0], null).regard),
  catharsis: (args, ctx) => ctx.catharsis >= Number(args[0]),
  flag: (args, ctx) => args.every((flag) => ctx.slot.flags.includes(flag) || completedCombinationFlags(ctx.slot, ctx.pack).includes(flag)),
  alignment: (args, ctx) => {
    const val = ctx.slot.alignment ?? 0;
    const mode = args[0];
    const stance = resolveTuning(ctx.pack.tuning).alignmentStance;
    if (mode === 'cruel' || mode === '패도') return val <= -stance;
    if (mode === 'merciful' || mode === '왕도') return val >= stance;
    if (mode === 'neutral' || mode === '중도') return val > -stance && val < stance;
    if (mode === '<') return val < Number(args[1]);
    if (mode === '>') return val > Number(args[1]);
    if (mode === '<=') return val <= Number(args[1]);
    if (mode === '>=') return val >= Number(args[1]);
    return false;
  },
  equipped: (args, ctx) => {
    const eq = ctx.slot.equipment;
    if (!eq) return false;
    const [slotOrItem, maybeItem] = args;
    if (!maybeItem) {
      return Object.values(eq).some((itemId) => itemId === slotOrItem);
    }
    return (eq as Record<string, string | undefined>)[slotOrItem] === maybeItem;
  },
  party: (args, ctx) => {
    const party = ctx.slot.party ?? [];
    return args.every((memberId) => party.includes(memberId));
  },
  romance: (args, ctx) => {
    const rom = ctx.slot.romance;
    if (!rom) return false;
    const [targetId, minStage] = args;
    if (rom.targetId !== targetId) return false;
    return minStage ? rom.stage >= Number(minStage) : rom.stage >= 1;
  },
  resonance: (args, ctx) => {
    const level = args[args.length - 1];
    const [a, b] = args.length >= 3 ? [args[0], args[1]] : [args[0], PROTAGONIST];
    return resonanceOf(ctx.slot, ctx.pack, a, b) === level;
  },
  tie: (args, ctx) => compare(tieOf(ctx.slot, args[0], args[1]), args[2], Number(args[3])),
  bond: (args, ctx) => compare(bondOf(ctx.slot, ctx.pack, args[0]), args[1], Number(args[2])),
  beads: (args, ctx) => beadCount(ctx.slot, args[0]) >= Number(args[1] ?? 1),
  absorbed: (args, ctx) => (ctx.slot.absorbed ?? []).includes(args[0]),
  verse: (args, ctx) => completedVerses(ctx.slot, ctx.pack).some((verse) => verse.id === args[0]),
  realm: (args, ctx) => {
    const target = (ctx.pack.realms ?? []).findIndex((realm) => realm.id === args[0]);
    return target >= 0 && realmIndex(ctx.slot, ctx.pack) >= target;
  },
};

/** 조건을 판정한다. 모르는 조건은 거짓이다. (OCP Strategy Pattern 적용) */
export function evaluateCondition(condition: StoryCondition | null, context: BindContext): boolean {
  if (!condition) return true;
  if (condition.op === 'and') return (condition as { all: readonly StoryCondition[] }).all.every((entry) => evaluateCondition(entry, context));
  if (condition.op === 'not') return !evaluateCondition((condition as { of: StoryCondition }).of, context);
  const args = (condition as { args: readonly string[] }).args;
  const evaluator = CONDITION_EVALUATORS[condition.op];
  return evaluator ? evaluator(args, context) : false;
}

const TIER_LABEL: Record<string, string> = { overwhelm: '압도', advantage: '우세', close: '접전', underdog: '열세' };
const SPEECH_LABEL: Record<string, string> = {
  mock: '조롱', bluster: '허세', probe: '떠봄', lecture: '훈계', resolve: '결의', fawn: '아첨', worry: '걱정', roar: '윽박', plain: '담담',
};
const EMOTION_LABEL: Record<string, string> = {
  joy: '기쁨', anger: '노여움', sorrow: '슬픔', fear: '두려움', love: '사랑', hate: '미움', desire: '욕망', calm: '평온',
};
const STANCE_LABEL: Record<string, string> = { hostile: '적대', cold: '냉담', neutral: '무심', warm: '호의', trusting: '신뢰' };
const REGARD_LABEL: Record<string, string> = { down: '내려다봄', level: '대등', up: '올려다봄' };

// 이름은 팩의 glossary(`speech.<id>` 등)를 먼저 본다. 없으면 PoC 1부터 쓰던 이름이다.
export function speechLabel(speech: string, pack?: StoryPack): string { return pack?.glossary[`speech.${speech}`] ?? SPEECH_LABEL[speech] ?? speech; }
export function emotionLabel(emotion: string, pack?: StoryPack): string { return pack?.glossary[`emotion.${emotion}`] ?? EMOTION_LABEL[emotion] ?? emotion; }
export function stanceLabel(stance: string, pack?: StoryPack): string { return pack?.glossary[`stance.${stance}`] ?? STANCE_LABEL[stance] ?? stance; }
export function regardLabel(regard: string, pack?: StoryPack): string { return pack?.glossary[`regard.${regard}`] ?? REGARD_LABEL[regard] ?? regard; }
export function tierLabel(tier: string, pack?: StoryPack): string { return pack?.glossary[`tier.${tier}`] ?? TIER_LABEL[tier] ?? tier; }

/** OCP(개방-폐쇄 원칙) 전략 맵: 조건 설명 포맷터 레지스트리 */
type ConditionDescriber = (args: readonly string[], pack: StoryPack, nameOf: (id: string) => string) => string;

const CONDITION_DESCRIBERS: Record<string, ConditionDescriber> = {
  origin: (args, pack) => args.map((id) => pack.origins.find((origin) => origin.id === id)?.name ?? id).join('·'),
  versus: (args, _pack, nameOf) => `${withJosa(joinNames(args.map(nameOf)), '과/와')} 겨뤄서`,
  axis: () => '',
  episode: () => '',
  outcome: (args) => (args.includes('victory') ? '이겨서' : '져서'),
  tier: (args, pack) => `${args.map((tier) => tierLabel(tier, pack)).join('·')}`,
  finisher: (args, _pack, nameOf) => `${withJosa(joinNames(args.map(nameOf)), '으로/로')} 끝내서`,
  rounds: (args) => `${args[0]}합 안에 끝내서`,
  untouched: () => '한 대도 맞지 않아서',
  has: (args, _pack, nameOf) => `${withJosa(joinNames(args.map(nameOf)), '을/를')} 가져서`,
  tag: (args) => `${args[0]} 계열을 ${args[1] ?? 1}개 이상 가져서`,
  combo: (args, pack) => `${withJosa(pack.combinations.find((entry) => entry.id === args[0])?.name ?? args[0], '을/를')} 완성해서`,
  card: (args, _pack, nameOf) => `${args.map(nameOf).join('·')}의 성품`,
  speech: (args, pack, nameOf) => `${nameOf(args[0])}의 말투가 ${args.slice(1).map((value) => speechLabel(value, pack)).join('·')}`,
  emotion: (args, pack, nameOf) => `${nameOf(args[0])}의 ${args.slice(1).map((value) => emotionLabel(value, pack)).join('·')}`,
  stance: (args, pack, nameOf) => `${nameOf(args[0])}의 태도가 ${args.slice(1).map((value) => stanceLabel(value, pack)).join('·')}`,
  regard: (args, pack, nameOf) => `${withJosa(nameOf(args[0]), '이/가')} ${args.slice(1).map((value) => regardLabel(value, pack)).join('·')}`,
  catharsis: () => '쌓인 원한을 갚아서',
  flag: () => '앞선 일 때문에',
  alignment: (args) => {
    const mode = args[0];
    if (mode === 'cruel' || mode === '패도') return '패도라서';
    if (mode === 'merciful' || mode === '왕도') return '왕도라서';
    if (mode === 'neutral' || mode === '중도') return '중도라서';
    if (mode === '<') return `성향이 ${args[1]}보다 낮아서`;
    if (mode === '<=') return `성향이 ${args[1]} 이하라서`;
    if (mode === '>') return `성향이 ${args[1]}보다 높아서`;
    if (mode === '>=') return `성향이 ${args[1]} 이상이라서`;
    return '';
  },
  equipped: (args, _pack, nameOf) => {
    const itemId = args.length >= 2 ? args[1] : args[0];
    return `${withJosa(nameOf(itemId), '을/를')} 차고 있어서`;
  },
  party: (args, _pack, nameOf) => `${withJosa(joinNames(args.map(nameOf)), '과/와')} 함께라서`,
  romance: (args, _pack, nameOf) => `${withJosa(nameOf(args[0]), '과/와')} 마음이 닿아서`,
  resonance: (args, _pack, nameOf) => {
    const level = args[args.length - 1];
    if (level === 'neutral') return '';
    const who = args.length >= 3 ? `${withJosa(nameOf(args[0]), '과/와')} ${nameOf(args[1])}의` : `${withJosa(nameOf(args[0]), '과/와')}`;
    return `${who} 성품이 ${level === 'resonant' ? '맞아서' : '어긋나서'}`;
  },
  tie: (args, _pack, nameOf) => `${nameOf(args[0])}·${nameOf(args[1])} 사이가 ${args[2]?.startsWith('<') ? '멀어서' : '가까워서'}`,
  bond: (args, _pack, nameOf) => `${withJosa(nameOf(args[0]), '과/와')} ${args[1]?.startsWith('<') ? '멀어서' : '가까워서'}`,
  beads: (args, _pack, nameOf) => `${withJosa(nameOf(args[0]), '을/를')} 지녀서`,
  absorbed: (args, _pack, nameOf) => `${withJosa(nameOf(args[0]), '을/를')} 흡수해서`,
  verse: (args, pack) => `${withJosa(pack.verses?.find((verse) => verse.id === args[0])?.name ?? args[0], '을/를')} 완성해서`,
  realm: (args, pack) => `${pack.realms?.find((realm) => realm.id === args[0])?.name ?? args[0]}에 이르러서`,
};

/** 조건을 사람이 읽는 말로 바꾼다. "이렇게 쓰인 이유"에 쓴다. (OCP Strategy Pattern 적용) */
export function describeCondition(condition: StoryCondition | null, pack: StoryPack): string {
  if (!condition) return '';
  if (condition.op === 'and') return (condition as { all: readonly StoryCondition[] }).all.map((entry) => describeCondition(entry, pack)).filter(Boolean).join(', ');
  if (condition.op === 'not') return `${describeCondition((condition as { of: StoryCondition }).of, pack)} 아님`;
  const args = (condition as { args: readonly string[] }).args;
  const nameOf = (id: string): string => pack.traits[id]?.name ?? pack.cast[id]?.name ?? id;
  const describer = CONDITION_DESCRIBERS[condition.op];
  return describer ? describer(args, pack, nameOf) : '';
}

interface PickedLine {
  readonly line: StorySpeechLine;
  readonly speech: string;
  readonly personal: boolean;
}

/** 대화 표에서 줄을 고른다. 인물 전용 → 역할 → any 순이고, 조건이 붙은 줄이 먼저다. */
export function pickSpeechLine(context: BindContext, speakerId: string, situation: string, place: string): PickedLine | null {
  const { pack, slot, episode } = context;
  const relation = relationFor(context, speakerId, null);
  const role = speakerId === PROTAGONIST_ID ? 'protagonist' : pack.cast[speakerId]?.role ?? '';
  let best: { line: StorySpeechLine; rank: number }[] = [];
  for (const line of pack.speech) {
    if (line.situation !== situation) continue;
    let rank = 0;
    if (line.speaker === speakerId) rank = 30;
    else if (line.speaker === `role:${role}`) rank = 20;
    else if (line.speaker === 'any') rank = 10;
    else continue;
    if (line.speech) {
      if (line.speech !== relation.speech) continue;
      rank += 5;
    }
    if (line.when) {
      if (!evaluateCondition(line.when, context)) continue;
      // 조건이 많을수록 더 좁은 줄이다. 좁은 줄이 먼저다.
      rank += 2 + (line.when.op === 'and' ? (line.when as { all: readonly StoryCondition[] }).all.length - 1 : 0) * 0.5;
    }
    if (best.length === 0 || rank > best[0].rank) best = [{ line, rank }];
    else if (rank === best[0].rank) best.push({ line, rank });
  }
  if (best.length === 0) return null;
  const chosen = best[stableHash(`${slot.seed ?? slot.id}:${episode.id}:${place}`) % best.length].line;
  return { line: chosen, speech: relation.speech, personal: !!chosen.speech || !!chosen.when };
}

/** `{{토큰}}`과 `{{토큰|을/를}}`을 채운다. */
export function fillTokens(text: string, context: BindContext, speakerId: string | null = null): string {
  const { slot, pack, clash } = context;
  const origin = pack.origins.find((entry) => entry.id === slot.originId);
  const phrases: Record<string, string> = { ...(origin?.phrases ?? {}) };
  for (const trait of activeTraits(slot, pack)) Object.assign(phrases, trait.phrases);
  phrases['주인공'] = slot.name;
  phrases['결정타'] = clash?.finisherTraitId ? pack.traits[clash.finisherTraitId]?.name ?? '맨손' : '맨손';
  phrases['합'] = String(clash?.rounds ?? 0);
  const opponent = context.episode?.contest ? pack.cast[context.episode.contest.opponent] : null;
  if (opponent) phrases['상대'] = opponent.name;
  if (speakerId && speakerId !== PROTAGONIST_ID) {
    const member = pack.cast[speakerId];
    const stance = relationFor(context, speakerId, null).stance;
    if (member) {
      phrases['자칭'] = member.selfCall || '나';
      const call = member.calls[stance] ?? member.calls.neutral ?? slot.name;
      phrases['호칭'] = call.replace(/\{\{\s*주인공\s*\}\}/g, slot.name);
    }
  }
  return text.replace(/\{\{\s*([^}|]+?)\s*(?:\|\s*([^}]+?)\s*)?\}\}/g, (_match, key: string, josa?: string) => {
    const value = phrases[key] ?? key;
    return josa ? withJosa(value, josa) : value;
  });
}

/** 본문의 곧은따옴표를 여닫는 따옴표로 바꾼다. 대화 표의 대사와 모양을 맞춘다. */
function curlyQuotes(text: string): string {
  let open = false;
  return text.replace(/"/g, () => {
    open = !open;
    return open ? '“' : '”';
  });
}

interface BeatBinding {
  readonly paragraphs: BoundParagraph[];
  readonly slot: ReaderSlot;
  readonly personal: number;
  readonly total: number;
  readonly silent: readonly BoundTrace[];
}

// ── 대사 줄과 대화 장면 (W9) ───────────────────────────────────────────

/** `@화자(상대)[말투,…]: 대사`. 상대는 주인공의 말투가 누구를 향하는지다. 없으면 대화 장면의 상대, 겨루기 상대, 화의 첫 인물 */
const LINE_PATTERN = /^@([^\s[\]:()]+)(?:\(([^)]*)\))?(?:\[([^\]]*)\])?:\s*([\s\S]*)$/;
const TALK_PATTERN = /^\[\[talk:([^\]:|]+)(?::([^\]|]+))?(?:\|([^\]]*))?\]\]$/;

export interface LineVariant {
  /** `[말투,…]`. 없으면 대체 줄이다 */
  readonly speeches: readonly string[] | null;
  readonly text: string;
}

/** 같은 화자의 대사 줄이 이어진 무리. 말투 갈래가 있으면 하나만 나온다 */
export interface LineGroup {
  /** 장면 안에서 `@<화자>.<순번>` */
  readonly id: string;
  readonly speaker: string;
  /** 말투가 향하는 사람. 주인공의 줄에만 뜻이 있다 */
  readonly toward: string | null;
  readonly variants: readonly LineVariant[];
  /** `[ ]` 줄이 하나라도 있다 */
  readonly branching: boolean;
}

export type BeatUnit =
  | { readonly kind: 'text'; readonly index: number; readonly source: string }
  | { readonly kind: 'lines'; readonly index: number; readonly group: LineGroup };

/** 장면의 글을 문단과 대사 무리로 나눈다. index는 빈 문단까지 센 문단 번호다(PoC 1의 자리 계산과 같다) */
export function beatUnits(text: string): BeatUnit[] {
  const units: BeatUnit[] = [];
  let groupCount = 0;
  let open: { index: number; speaker: string; toward: string | null; variants: LineVariant[] } | null = null;
  const close = (): void => {
    if (!open) return;
    const group: LineGroup = { id: `@${open.speaker}.${groupCount}`, speaker: open.speaker, toward: open.toward, variants: open.variants, branching: open.variants.some((variant) => variant.speeches !== null) };
    units.push({ kind: 'lines', index: open.index, group });
    groupCount += 1;
    open = null;
  };
  for (const [index, raw] of text.split(/\n\s*\n/).entries()) {
    const source = raw.trim();
    if (!source) continue;
    if (!source.startsWith('@')) {
      close();
      units.push({ kind: 'text', index, source });
      continue;
    }
    // 대사 문단 안에서는 `@`로 시작하는 줄마다 대사 한 줄이다. 말투 갈래를 줄줄이 붙여 쓴다.
    for (const entry of source.split(/\n(?=\s*@)/)) {
      const line = LINE_PATTERN.exec(entry.trim());
      if (!line) continue;
      const [, speaker, rawToward, bracket, said] = line;
      const toward = rawToward?.trim() || null;
      if (open && (open.speaker !== speaker || open.toward !== toward)) close();
      if (!open) open = { index, speaker, toward, variants: [] };
      open.variants.push({ speeches: bracket === undefined ? null : bracket.split(/[,;]/).map((value) => value.trim()).filter(Boolean), text: said.trim() });
    }
  }
  close();
  return units;
}

/** 이 자리에서 이 사람이 말할 수 있는가. 동행하지 않는 동료와, 대화 장면에 없는 사람은 말하지 않는다 */
function canSpeak(context: BindContext, slot: ReaderSlot, speakerId: string): boolean {
  if (speakerId === PROTAGONIST_ID) return true;
  const party = slot.party ?? [];
  if (context.episode.companions?.includes(speakerId) && !party.includes(speakerId)) return false;
  if (context.present) {
    return context.present.includes(speakerId) || context.episode.cast.includes(speakerId) || party.includes(speakerId);
  }
  return true;
}

/** 대화 장면의 상대가 이 화에 있는가: 화의 인물이거나, 이 화의 동료 칸에 있고 동행 중이다 */
function isHere(context: BindContext, slot: ReaderSlot, memberId: string): boolean {
  if (context.episode.cast.includes(memberId)) return true;
  return !!context.episode.companions?.includes(memberId) && (slot.party ?? []).includes(memberId);
}

function conditionCount(condition: StoryCondition | null): number {
  if (!condition) return 0;
  return condition.op === 'and' ? (condition as { all: readonly StoryCondition[] }).all.length : 1;
}

/** 대화 장면을 고른다: 상황이 같고, 상대가 모두 이 화에 있고, 조건이 맞는 것 중 가장 좁은 것. 같으면 씨앗으로 */
export function pickTalk(context: BindContext, situation: string, partner: string | null, place: string): StoryTalk | null {
  const { slot, pack, episode } = context;
  let best: { talk: StoryTalk; rank: number }[] = [];
  for (const talk of pack.talks ?? []) {
    if (talk.situation !== situation) continue;
    if (partner && !talk.with.includes(partner)) continue;
    if (!talk.with.every((id) => isHere(context, slot, id))) continue;
    if (talk.when && !evaluateCondition(talk.when, { ...context, focusId: talk.with[0] ?? partner })) continue;
    const conditions = conditionCount(talk.when);
    const rank = 10 + talk.with.length * 5 + (conditions > 0 ? 2 + (conditions - 1) * 0.5 : 0);
    if (best.length === 0 || rank > best[0].rank) best = [{ talk, rank }];
    else if (rank === best[0].rank) best.push({ talk, rank });
  }
  if (best.length === 0) return null;
  return best[stableHash(`${slot.seed ?? slot.id}:${episode.id}:${place}:talk`) % best.length].talk;
}

/** 대화 장면이 끝나면: 인연과 동료끼리의 인연은 공명에 따라 커지거나 작아진다. 나머지 효과는 그대로 */
export function applyTalkEffects(slot: ReaderSlot, pack: StoryPack, effects: StoryEffects | null | undefined): ReaderSlot {
  if (!effects) return slot;
  const scaled: { bond?: Record<string, number>; tie?: Record<string, number> } = {};
  if (effects.bond) {
    scaled.bond = Object.fromEntries(Object.entries(effects.bond).map(([id, delta]) => [id, scaleByResonance(delta, resonanceOf(slot, pack, id), pack)]));
  }
  if (effects.tie) {
    scaled.tie = Object.fromEntries(Object.entries(effects.tie).map(([key, delta]) => {
      const [a, b] = key.split('+');
      return [key, scaleByResonance(delta, resonanceOf(slot, pack, a ?? '', b ?? ''), pack)];
    }));
  }
  return applyEffects(slot, pack, { ...effects, ...scaled });
}

function talkReason(talk: StoryTalk, context: BindContext): string {
  const parts = [describeCondition(talk.when, context.pack)];
  const partner = talk.with[0];
  if (partner) {
    const level = resonanceOf(context.slot, context.pack, partner);
    if (level !== 'neutral') parts.push(describeCondition({ op: 'resonance', args: [partner, level] }, context.pack));
  }
  return [...new Set(parts.filter(Boolean))].join(', ');
}

/** 문단 안의 `[[슬롯]]`을 갈래로 채운다. 갈래의 효과는 그 자리에서 슬롯에 적용한다 */
function fillSlots(source: string, beat: StoryBeat, context: BindContext, start: ReaderSlot): { text: string; slot: ReaderSlot; traces: BoundTrace[]; silent: BoundTrace[]; personal: number; total: number } {
  let slot = start;
  let personal = 0;
  let total = 0;
  const traces: BoundTrace[] = [];
  const silent: BoundTrace[] = [];
  const prefix = context.prefix ?? '';
  const text = source.replace(/\[\[([^\]:]+)\]\]/g, (_match, slotId: string) => {
    const definition = beat.slots[slotId.trim()];
    if (!definition) return '';
    total += 1;
    const chosen = definition.variants.find((variant) => evaluateCondition(variant.when, { ...context, slot })) ?? definition.variants[definition.variants.length - 1];
    if (!chosen) return '';
    slot = applyEffects(slot, context.pack, chosen.effects);
    const fallback = definition.variants.find((variant) => !variant.when);
    const other = chosen.when ? fallback : definition.variants.find((variant) => variant !== chosen);
    const filled = fillTokens(chosen.text, { ...context, slot }, null);
    const trace: BoundTrace = {
      place: slotId.trim(),
      choiceId: `${prefix}${chosen.id}`,
      reason: describeCondition(chosen.when, context.pack),
      text: filled,
      alternative: other && other !== chosen ? fillTokens(other.text, { ...context, slot }, null) : null,
    };
    if (!chosen.text) {
      silent.push(trace);
    } else {
      if (chosen.when) personal += 1;
      traces.push(trace);
    }
    return chosen.text;
  });
  return { text, slot, traces, silent, personal, total };
}

function bindBeat(beat: StoryBeat, beatIndex: number, context: BindContext): BeatBinding {
  let slot = context.slot;
  let personal = 0;
  let total = 0;
  const paragraphs: BoundParagraph[] = [];
  const silent: BoundTrace[] = [];
  const prefix = context.prefix ?? '';

  for (const unit of beatUnits(beat.text)) {
    const live: BindContext = { ...context, slot };
    const place = `${beatIndex}.${unit.index}`;

    if (unit.kind === 'lines') {
      const { group } = unit;
      if (!canSpeak(context, slot, group.speaker)) continue;
      const speakerName = group.speaker === PROTAGONIST_ID ? slot.name : context.pack.cast[group.speaker]?.name ?? null;
      let lines: { variant: LineVariant; trace: BoundTrace | null }[] = group.variants.map((variant) => ({ variant, trace: null }));
      if (group.branching) {
        total += 1;
        const speech = relationFor(live, group.speaker, group.toward).speech;
        let index = group.variants.findIndex((variant) => variant.speeches?.includes(speech));
        if (index < 0) index = group.variants.findIndex((variant) => variant.speeches === null);
        const choiceId = `${prefix}L${context.beatSource ?? beatIndex}${group.id}.${index < 0 ? 'none' : index}`;
        if (index < 0) {
          silent.push({ place: `line:${group.id}`, choiceId, reason: '', text: '', alternative: null });
          continue;
        }
        const variant = group.variants[index];
        if (variant.speeches) personal += 1;
        const reason = variant.speeches && speakerName ? `${speakerName}의 말투: ${speechLabel(speech, context.pack)}` : '';
        const fallback = group.variants.find((entry) => entry.speeches === null);
        lines = [{ variant, trace: { place: `line:${group.id}`, choiceId, reason, text: '', alternative: fallback && fallback !== variant ? fillTokens(fallback.text, live, group.speaker) : null } }];
      }
      for (const { variant, trace } of lines) {
        const filledSlots = fillSlots(variant.text, beat, { ...context, slot }, slot);
        slot = filledSlots.slot;
        personal += filledSlots.personal;
        total += filledSlots.total;
        silent.push(...filledSlots.silent);
        const said = curlyQuotes(fillTokens(filledSlots.text, { ...context, slot }, group.speaker).replace(/[ \t]+/g, ' ').trim());
        if (!said) continue;
        paragraphs.push({
          beatKind: beat.kind,
          text: `“${said}”`,
          dialogue: true,
          speakerName,
          traces: [...(trace ? [{ ...trace, text: said }] : []), ...filledSlots.traces],
        });
      }
      continue;
    }

    const source = unit.source;
    const talkMatch = prefix.startsWith('talk:') ? null : TALK_PATTERN.exec(source);
    if (talkMatch) {
      const [, rawSituation, rawPartner, fallback] = talkMatch;
      const situation = rawSituation.trim();
      const partner = rawPartner?.trim() || null;
      total += 1;
      const talk = pickTalk(live, situation, partner, place);
      if (!talk) {
        const trace: BoundTrace = { place: `talk:${situation}`, choiceId: `talk:${situation}:else`, reason: '', text: fallback ? fillTokens(fallback, live, null) : '', alternative: null };
        if (fallback) paragraphs.push({ beatKind: beat.kind, text: curlyQuotes(trace.text), dialogue: false, speakerName: null, traces: [trace] });
        else silent.push(trace);
        continue;
      }
      const inner = bindBeat(talk.beat, beatIndex, { ...live, focusId: talk.with[0] ?? partner, present: talk.with, prefix: `talk:${talk.id}#`, beatSource: 0 });
      slot = applyTalkEffects(inner.slot, context.pack, talk.effects);
      personal += inner.personal + (talk.when ? 1 : 0);
      total += inner.total;
      silent.push(...inner.silent);
      const trace: BoundTrace = { place: `talk:${situation}`, choiceId: `talk:${talk.id}`, reason: talkReason(talk, live), text: inner.paragraphs[0]?.text ?? '', alternative: null };
      if (inner.paragraphs.length > 0) {
        const [first, ...rest] = inner.paragraphs;
        paragraphs.push({ ...first, traces: [trace, ...first.traces] }, ...rest);
      } else {
        silent.push(trace);
      }
      continue;
    }

    const say = /^\[\[say:([^:\]|]+):([^\]|]+)(?:\|([^\]]*))?\]\]$/.exec(source);
    if (say) {
      const [, speakerId, situation, fallback] = say;
      if (context.episode.companions?.includes(speakerId) && !(live.slot.party ?? []).includes(speakerId)) {
        continue;
      }
      total += 1;
      const picked = pickSpeechLine(live, speakerId, situation.trim(), place);
      const text = picked?.line.text ?? fallback ?? '';
      if (!text) continue;
      const speakerName = speakerId === PROTAGONIST_ID ? slot.name : context.pack.cast[speakerId]?.name ?? null;
      const filled = fillTokens(text, live, speakerId);
      if (picked?.personal) personal += 1;
      // 독자 때문에 고른 줄에만 까닭을 남긴다. 누구에게나 같은 줄은 "이렇게 쓰인 이유"에 나오지 않는다.
      const reason = picked?.personal
        ? [picked.line.speech && speakerName ? `${speakerName}의 말투: ${speechLabel(picked.speech, context.pack)}` : '', describeCondition(picked.line.when, context.pack)].filter(Boolean).join(', ')
        : '';
      const fallbackText = fallback ? fillTokens(fallback, live, speakerId) : null;
      paragraphs.push({
        beatKind: beat.kind,
        text: `“${filled}”`,
        dialogue: true,
        speakerName,
        traces: picked ? [{ place: `say:${speakerId}:${situation}`, choiceId: picked.line.id, reason, text: filled, alternative: fallbackText && fallbackText !== filled ? fallbackText : null }] : [],
      });
      continue;
    }

    const filledSlots = fillSlots(source, beat, context, slot);
    slot = filledSlots.slot;
    personal += filledSlots.personal;
    total += filledSlots.total;
    silent.push(...filledSlots.silent);
    const text = curlyQuotes(fillTokens(filledSlots.text, { ...context, slot }, null).replace(/[ \t]+/g, ' ').trim());
    if (!text) {
      continue;
    }
    paragraphs.push({ beatKind: beat.kind, text, dialogue: false, speakerName: null, traces: filledSlots.traces });
  }
  return { paragraphs, slot, personal, total, silent };
}

export interface BindInput {
  readonly slot: ReaderSlot;
  readonly pack: StoryPack;
  readonly episode: StoryEpisode;
  readonly clash: ClashResult | null;
  readonly catharsis: number;
  /** 이번 화에서 뽑은 속성. 얻는 장면이 있으면 화의 맨 앞에 넣는다 */
  readonly drawnTraitId: string | null;
  /** 겨루기를 보기 전에 인물들이 어림하던 힘. BindContext.before */
  readonly before?: BindContext['before'];
}

/**
 * 뼈대에 독자의 상태를 바인딩해 본문을 만든다. 순수 함수이고 난수를 쓰지 않는다.
 * 겨루기 장면 앞의 장면은 겨루기 전의 관계로, 그 뒤는 겨룬 뒤의 관계로 고른다.
 */
export function bindEpisode(input: BindInput): { bound: BoundEpisode; slot: ReaderSlot } {
  const { pack, episode, clash, catharsis, drawnTraitId } = input;
  const axis: StatAxis = episode.contest?.axis ?? 'might';
  let slot = input.slot;
  let personal = 0;
  let total = 0;
  const paragraphs: BoundParagraph[] = [];
  const silent: BoundTrace[] = [];

  // 얻는 장면은 화의 첫 장면(상황) 바로 뒤에 넣는다. 어디서 언제인지가 먼저 나와야 읽힌다.
  // 장면마다 기록의 머리(prefix)와 원래 번호(source)를 함께 든다. 끼어든 장면의 기록이 화의 기록과 섞이지 않게.
  type Placed = { readonly beat: StoryBeat; readonly prefix?: string; readonly source?: number };
  const beats: Placed[] = episode.beats.map((beat, index) => ({ beat, source: index }));
  const gainScene = drawnTraitId ? pack.gainScenes[drawnTraitId] : undefined;
  if (gainScene) beats.splice(Math.min(1, beats.length), 0, { beat: { ...gainScene, kind: 'insight' } });
  // 메뉴에서 흡수하거나 구결을 완성하거나 경지가 오르면, 그 장면이 다음 화의 앞(얻는 장면 다음)에 나온다. 막간에는 넣지 않는다.
  const pending = episode.number > 0 ? (slot.pendingScenes ?? []).filter((key) => !!pack.scenes?.[key]) : [];
  const sceneAt = Math.min(1, beats.length) + (gainScene ? 1 : 0);
  pending.forEach((key, index) => beats.splice(sceneAt + index, 0, { beat: { ...(pack.scenes as Record<string, StoryBeat>)[key], kind: 'insight' }, prefix: `scene:${key}#`, source: 0 }));
  if (pending.length > 0 || (episode.number > 0 && (slot.pendingScenes?.length ?? 0) > 0)) slot = { ...slot, pendingScenes: [] };
  for (const key of pending) silent.push({ place: `scene:${key}`, choiceId: `scene:${key}`, reason: '', text: '', alternative: null });

  let afterClash = !episode.contest;
  beats.forEach(({ beat, prefix, source }, index) => {
    if (beat.kind === 'clash') afterClash = true;
    const result = bindBeat(beat, index, { slot, pack, episode, clash, catharsis, axis, afterClash, before: input.before ?? null, ...(prefix ? { prefix } : {}), ...(source !== undefined ? { beatSource: source } : {}) });
    slot = result.slot;
    personal += result.personal;
    total += result.total;
    paragraphs.push(...result.paragraphs);
    if (result.silent.length > 0) {
      silent.push(...result.silent);
    }
  });

  slot = applyEffects(slot, pack, episode.effects);
  return {
    slot,
    bound: {
      episodeId: episode.id,
      title: episode.title,
      number: episode.number > 0 ? episode.number : null,
      zone: episode.zone,
      paragraphs,
      personalCount: personal,
      totalCount: total,
      ...(silent.length > 0 ? { silent } : {}),
    },
  };
}
