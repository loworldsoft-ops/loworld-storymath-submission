/**
 * 서사 엔진의 모델. 작품의 낱말을 모른다(무공, 검, 인물 이름 등은 팩의 데이터다).
 * 설계: docs/10/2026-10-07/05-novel-reader-implementation-spec.md
 */

export type StatAxis = 'might' | 'guard' | 'wit' | 'spirit' | 'fortune';
export const STAT_AXES: readonly StatAxis[] = ['might', 'guard', 'wit', 'spirit', 'fortune'];

export type StoryTraitKind = 'art' | 'item' | 'personality' | 'memory' | 'bond' | 'title' | 'material' | 'windfall' | 'bead';
export type StoryTraitSource = 'draw' | 'reward' | 'start' | 'windfall' | 'shop' | 'loot';

/** 독자가 모으는 모든 것의 공통 모양 */
export interface StoryTrait {
  readonly id: string;
  readonly kind: StoryTraitKind;
  readonly name: string;
  readonly rarity: string;
  readonly description: string;
  readonly stats: Partial<Record<StatAxis, number>>;
  readonly tags: readonly string[];
  /** 본문 토큰. 예: { 무기: '철검' } */
  readonly phrases: Readonly<Record<string, string>>;
  readonly source: StoryTraitSource;
  /** 이 속성을 가져야 뽑기에 나온다 */
  readonly requires?: string;
  /** 얻으면 바뀌는 유대 */
  readonly bonds?: Readonly<Record<string, number>>;
  /** 기연: 이 상대에게만 듣는다. axis가 있으면 그 축으로 겨룰 때만 듣는다 */
  readonly bane?: { readonly opponentId: string; readonly multiplier: number; readonly axis?: StatAxis };
  readonly icon?: string;
  /** 입는 자리. 있으면 입었을 때만 힘에 더한다 */
  readonly equip?: ReaderEquipKind;
  /** 상점에서 사는 값. 없으면 사고팔 수 없다 */
  readonly price?: number;
  /** 얻을 때 성향에 더하는 값 */
  readonly alignment?: number;
  /** 성품 카드의 좌표(-100~100). x: 친밀↔적대, y: 동경↔지배 */
  readonly x?: number;
  readonly y?: number;
  /** 장비의 혈(구슬을 박는 자리) 수 */
  readonly sockets?: number;
  /** 구슬의 글자 */
  readonly letter?: string;
  /** 구슬 셋을 합치면 되는 구슬 */
  readonly next?: string;
}

export type StoryStance = 'hostile' | 'cold' | 'neutral' | 'warm' | 'trusting';
export type StoryRegard = 'down' | 'level' | 'up';
export type StoryEmotion = 'joy' | 'anger' | 'sorrow' | 'fear' | 'love' | 'hate' | 'desire' | 'calm';
export type StorySituation = 'belittled' | 'prevailed' | 'humbled' | 'friend-at-risk' | 'coveting' | 'none';

export interface StoryCastMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  /** 본성 카드 id */
  readonly nature: readonly string[];
  readonly stats: Partial<Record<StatAxis, number>>;
  /** 처음 유대(-100~100) */
  readonly bond: number;
  readonly want: string;
  readonly line: string;
  /** 약점. 말로 겨룰 때 이것을 아는 속성(꼬리표)이 있으면 찌를 수 있다 */
  readonly weakness: string;
  readonly selfCall: string;
  /** 태도별로 주인공을 부르는 말 */
  readonly calls: Partial<Record<StoryStance, string>>;
  readonly habit: string;
  readonly zone: string;
  /** 이 인물이 따르는 성향. 반대로 기울면 걱정하고 떠난다 */
  readonly lean?: 'merciful' | 'cruel';
}

export interface StoryCombination {
  readonly id: string;
  readonly name: string;
  readonly requires: readonly string[];
  readonly ordered: boolean;
  readonly multiplier: Partial<Record<StatAxis, number>>;
  readonly flags: readonly string[];
}

/** 조건. 팩 도구가 `tier(overwhelm) & origin(sword)` 같은 글을 이 모양으로 바꾼다 */
export type StoryCondition =
  | { readonly op: 'and'; readonly all: readonly StoryCondition[] }
  | { readonly op: 'not'; readonly of: StoryCondition }
  | { readonly op: string; readonly args: readonly string[] };

export type ReaderEquipmentSlot =
  | 'weapon'
  | 'offhand'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'boots'
  | 'belt'
  | 'amulet'
  | 'ring1'
  | 'ring2';

export const READER_EQUIPMENT_SLOTS: readonly ReaderEquipmentSlot[] = [
  'weapon',
  'offhand',
  'helmet',
  'armor',
  'gloves',
  'boots',
  'belt',
  'amulet',
  'ring1',
  'ring2',
];

/** 아이템이 들어가는 자리의 종류. 반지는 두 칸 중 하나에 들어간다 */
export type ReaderEquipKind = 'weapon' | 'offhand' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'belt' | 'amulet' | 'ring';

export const EQUIP_KIND_SLOTS: Readonly<Record<ReaderEquipKind, readonly ReaderEquipmentSlot[]>> = {
  weapon: ['weapon'], offhand: ['offhand'], helmet: ['helmet'], armor: ['armor'], gloves: ['gloves'],
  boots: ['boots'], belt: ['belt'], amulet: ['amulet'], ring: ['ring1', 'ring2'],
};

export interface ReaderRomanceState {
  readonly targetId: string;
  readonly stage: number; // 1: 호감, 2: 연모, 3: 반려
}

export interface StoryEffects {
  readonly bond?: Readonly<Record<string, number>>;
  readonly flag?: readonly string[];
  readonly grant?: readonly string[];
  readonly shown?: number;
  readonly alignment?: number;
  readonly equip?: Readonly<Partial<Record<ReaderEquipmentSlot, string>>>;
  readonly equipment?: Readonly<Partial<Record<ReaderEquipmentSlot, string>>>;
  readonly partyAdd?: readonly string[];
  readonly partyRemove?: readonly string[];
  readonly party?: readonly string[];
  readonly romance?: ReaderRomanceState | Readonly<Record<string, number>>;
  /** 동료끼리의 인연. 키는 두 인물 id를 사전순으로 `+`로 잇는다 */
  readonly tie?: Readonly<Record<string, number>>;
  /** 이야기가 구슬을 흡수한다. 흡수 장면은 그 화의 본문이 직접 쓴다 */
  readonly absorb?: readonly string[];
}

export interface StorySlotVariant {
  readonly id: string;
  /** null이면 대체 문장(else) */
  readonly when: StoryCondition | null;
  readonly text: string;
  readonly effects?: StoryEffects;
}

export interface StorySlot {
  readonly id: string;
  readonly variants: readonly StorySlotVariant[];
}

export type StoryBeatKind = 'setting' | 'exchange' | 'clash' | 'aftermath' | 'insight' | 'hook';

export interface StoryBeat {
  readonly kind: StoryBeatKind;
  readonly phase: string;
  /** 본문. `[[슬롯]]`, `[[say:화자:상황]]`, `{{토큰}}`을 포함한다 */
  readonly text: string;
  readonly slots: Readonly<Record<string, StorySlot>>;
}

export interface StoryContest {
  readonly axis: 'might' | 'wit';
  readonly opponent: string;
  readonly public: boolean;
  /** 이 겨루기에서만 쓰는 상대의 힘(겨루는 축). 없으면 인물의 능력치 */
  readonly power?: number;
}

export interface StoryEpisode {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly zone: string;
  readonly cast: readonly string[];
  /** 동행 중일 때만 이 화에 나오는 인물. 동행 중이 아니면 그 인물의 대사를 빼고, 화를 여는 과정의 인물 줄에도 넣지 않는다 (S9) */
  readonly companions?: readonly string[];
  readonly draw: { readonly pools: readonly string[]; readonly exclude: readonly string[]; readonly include: readonly string[] };
  readonly contest: StoryContest | null;
  readonly reward: string | null;
  readonly onDefeat: string | null;
  readonly windfall: string | null;
  readonly effects: StoryEffects | null;
  readonly beats: readonly StoryBeat[];
  /** 화를 마치고 줍는 전리품 */
  readonly loot?: { readonly table: string; readonly count: number } | null;
  /** 이 화가 속한 사건 줄기 */
  readonly arc?: string | null;
}

export interface StorySpeechLine {
  readonly id: string;
  readonly situation: string;
  /** 비어 있으면 어느 말투든 */
  readonly speech: string;
  /** 인물 id, `role:역할`, 또는 `any` */
  readonly speaker: string;
  readonly when: StoryCondition | null;
  readonly text: string;
}

/** 캐릭터를 만들 때 고르는 전생의 갈래 */
export interface StoryOrigin {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly stats: Partial<Record<StatAxis, number>>;
  readonly traits: readonly string[];
  readonly phrases: Readonly<Record<string, string>>;
}

export interface StoryMapZone {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** 지도 위의 자리(0~100) */
  readonly x: number;
  readonly y: number;
  readonly adjacent: readonly string[];
}

export interface StoryShop {
  readonly id: string;
  readonly zone: string;
  readonly name: string;
  /** 파는 아이템의 속성 id. 모두 price가 있어야 한다 */
  readonly items: readonly string[];
}

/** 말투 표의 한 줄. 빈 목록은 아무것이나다. 위에서부터 처음 맞는 줄이 말투를 정한다 */
export interface StoryVoiceRule {
  /** 'protagonist' | 'member' | '' */
  readonly who: string;
  /** 주인공의 성향 구간: cruel | neutral | merciful */
  readonly alignment: readonly string[];
  /** 이 중 하나라도 가지면 맞다 */
  readonly cards: readonly string[];
  readonly emotions: readonly string[];
  readonly stances: readonly string[];
  readonly regards: readonly string[];
  readonly speech: string;
}

/** 감정 표의 한 줄 */
export interface StoryMoodRule {
  readonly situations: readonly string[];
  readonly cards: readonly string[];
  readonly regards: readonly string[];
  /** 인연이 이 값 이상일 때만 */
  readonly bond: number | null;
  readonly emotion: string;
}

/** 대화 장면. 화의 `[[talk:상황]]` 자리에 상황 × 상대 × 조건으로 골라 넣는다 */
export interface StoryTalk {
  readonly id: string;
  readonly situation: string;
  /** 이 장면에 나오는 상대. 모두 그 화에 있어야 한다 */
  readonly with: readonly string[];
  readonly when: StoryCondition | null;
  readonly effects: StoryEffects | null;
  readonly beat: StoryBeat;
}

/** 구결: 장비의 혈에 구슬을 순서대로 박으면 완성된다 */
export interface StoryVerse {
  readonly id: string;
  readonly name: string;
  readonly beads: readonly string[];
  readonly equip: readonly ReaderEquipKind[];
  /** 있으면 장비의 꼬리표에 하나라도 있어야 한다 */
  readonly tags: readonly string[];
  readonly stats: Partial<Record<StatAxis, number>>;
  /** 완성하면 얻는 속성(무공 카드 등) */
  readonly grant: readonly string[];
  readonly flags: readonly string[];
  readonly description?: string;
}

export interface StoryLootEntry {
  readonly id: string;
  readonly weight: number;
  readonly when: StoryCondition | null;
}

export interface StoryLootTable {
  readonly id: string;
  readonly entries: readonly StoryLootEntry[];
}

/** 경지. 흡수한 구슬의 수로 오른다 */
export interface StoryRealm {
  readonly id: string;
  readonly name: string;
  readonly absorbed: number;
  readonly stats: Partial<Record<StatAxis, number>>;
}

/** 여러 화에 걸친 사건 줄기 */
export interface StoryArc {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
}

/** 성품 카드의 이름과 좌표. 브리지가 채운다 */
export interface StoryCard {
  readonly id: string;
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

/** 묶인 팩. 앱은 이것만 읽는다 */
export interface StoryPack {
  readonly id: string;
  readonly title: string;
  readonly genre: string;
  readonly version: number;
  readonly protagonist: { readonly defaultName: string };
  readonly origins: readonly StoryOrigin[];
  readonly startTraits: readonly string[];
  readonly startGrudges: Readonly<Record<string, number>>;
  readonly glossary: Readonly<Record<string, string>>;
  readonly traits: Readonly<Record<string, StoryTrait>>;
  readonly cast: Readonly<Record<string, StoryCastMember>>;
  readonly combinations: readonly StoryCombination[];
  readonly speech: readonly StorySpeechLine[];
  readonly episodeOrder: readonly string[];
  readonly episodes: Readonly<Record<string, StoryEpisode>>;
  readonly interludes: Readonly<Record<string, StoryEpisode>>;
  /** 속성 id → 그 속성을 얻는 장면 */
  readonly gainScenes: Readonly<Record<string, StoryBeat>>;
  readonly zones: readonly StoryMapZone[];
  readonly tuning: Readonly<Record<string, number>>;
  readonly shops?: readonly StoryShop[];
  readonly voice?: readonly StoryVoiceRule[];
  readonly moods?: readonly StoryMoodRule[];
  readonly talks?: readonly StoryTalk[];
  readonly verses?: readonly StoryVerse[];
  readonly loot?: readonly StoryLootTable[];
  /** 열쇠(absorb.<구슬>, realm.<경지>, verse.<구결>) → 다음 화의 앞에 넣는 장면 */
  readonly scenes?: Readonly<Record<string, StoryBeat>>;
  readonly realms?: readonly StoryRealm[];
  readonly arcs?: readonly StoryArc[];
  readonly cards?: Readonly<Record<string, StoryCard>>;
}

export type ClashTier = 'overwhelm' | 'advantage' | 'close' | 'underdog';

/** 겨루기의 결과. 힘으로든 말로든 같은 모양이다 */
export interface ClashResult {
  readonly episodeId: string;
  readonly opponentId: string;
  readonly axis: 'might' | 'wit';
  readonly outcome: 'victory' | 'defeat';
  readonly tier: ClashTier;
  readonly rounds: number;
  readonly finisherTraitId: string | null;
  readonly usedTraitIds: readonly string[];
  readonly untouched: boolean;
  readonly auto: boolean;
}

export interface BoundTrace {
  readonly place: string;
  readonly choiceId: string;
  /** 이 문장이 선택된 까닭. 사람이 읽는 말 */
  readonly reason: string;
  readonly text: string;
  /** 다른 독자가 읽었을 문장 */
  readonly alternative: string | null;
}

export interface BoundParagraph {
  readonly beatKind: StoryBeatKind;
  readonly text: string;
  readonly dialogue: boolean;
  readonly speakerName: string | null;
  readonly traces: readonly BoundTrace[];
}

export interface BoundEpisode {
  readonly episodeId: string;
  readonly title: string;
  readonly number: number | null;
  readonly zone: string;
  readonly paragraphs: readonly BoundParagraph[];
  /** 독자 때문에 고른 문장의 수와 고를 수 있었던 자리의 수 */
  readonly personalCount: number;
  readonly totalCount: number;
  /** 빈 갈래(∅)를 고른 자리. 글자가 없어 문단에 넣지 않는다. 통독 시험이 도달을 셀 때만 읽는다 */
  readonly silent?: readonly BoundTrace[];
}

export interface EpisodeRecord {
  readonly episodeId: string;
  readonly packVersion: number;
  readonly candidateIds: readonly string[];
  readonly drawnTraitId: string | null;
  readonly clash: ClashResult | null;
  readonly rewardTraitId: string | null;
  readonly bound: BoundEpisode;
  readonly interlude: {
    readonly windfallTraitId: string;
    readonly rematch: ClashResult;
    readonly bound: BoundEpisode;
  } | null;
  /** 이 화를 마치고 받은 돈 */
  readonly silver?: number;
  /** 주운 전리품 */
  readonly loot?: readonly string[];
}

/** 화를 마칠 때 동료에게 일어난 일 */
export interface CompanionEvent {
  readonly memberId: string;
  readonly kind: 'warn' | 'leave';
}

/** 캐릭터 슬롯 하나 = 소설 한 편 */
export interface ReaderSlot {
  readonly id: string;
  /** 캐릭터를 만들 때 한 번 정해지는 씨앗. 뽑기와 겨루기의 무작위가 여기서 나온다. 같은 캐릭터는 늘 같은 결과를 얻는다 */
  readonly seed?: string;
  readonly packId: string;
  readonly name: string;
  readonly originId: string;
  /** 얻은 순서대로 */
  readonly traitIds: readonly string[];
  readonly bonds: Readonly<Record<string, number>>;
  readonly grudges: Readonly<Record<string, number>>;
  readonly flags: readonly string[];
  /** 남이 보는 겨루기에서 드러낸 힘의 최고값 */
  readonly shownPower: number;
  /** 인물별로 직접 본 주인공의 힘 */
  readonly witnessed: Readonly<Record<string, number>>;
  readonly history: readonly EpisodeRecord[];
  /** 성향 (-100: 패도/잔혹 ~ +100: 왕도/자비, 기본 0: 중도/실리) */
  readonly alignment?: number;
  /** 착용 장비 슬롯 */
  readonly equipment?: Partial<Record<ReaderEquipmentSlot, string>>;
  /** 동행 중인 동료 인물 ID 목록 */
  readonly party?: readonly string[];
  /** 연애 상태 */
  readonly romance?: ReaderRomanceState;
  /** 가진 돈 */
  readonly silver?: number;
  /** 가진 구슬과 수 */
  readonly beads?: Readonly<Record<string, number>>;
  /** 장비에 박힌 구슬, 왼쪽 혈부터 */
  readonly sockets?: Readonly<Record<string, readonly string[]>>;
  /** 흡수한 구슬, 순서대로 */
  readonly absorbed?: readonly string[];
  /** 다음 화의 앞에 넣을 장면의 열쇠 */
  readonly pendingScenes?: readonly string[];
  /** 동료끼리의 인연 */
  readonly ties?: Readonly<Record<string, number>>;
}

export interface CombinationProgress {
  readonly id: string;
  readonly name: string;
  readonly owned: number;
  readonly required: number;
  readonly complete: boolean;
}

/** 한 인물이 주인공을 대하는 지금의 상태 */
export interface StoryRelation {
  readonly memberId: string;
  readonly bond: number;
  readonly stance: StoryStance;
  readonly regard: StoryRegard;
  readonly emotion: StoryEmotion;
  readonly speech: string;
}

/** 화를 여는 과정에서 보여 주는 한 줄 */
export interface PreludeLine {
  readonly step: 'draw' | 'change' | 'people' | 'clash' | 'bound';
  readonly text: string;
}

/** 도감의 분류. 이름은 팩의 glossary(`codex.<id>`)에서 온다 */
export type CodexGroupId = 'item' | 'art' | 'memory' | 'cast' | 'personality' | 'combination' | 'bead' | 'verse' | 'other';

/** owned: 가졌다(인물은 만났다), seen: 뽑기 후보나 상점에서 보았다, unknown: 아직 모른다 */
export type CodexState = 'owned' | 'seen' | 'unknown';

export interface CodexEntry {
  readonly id: string;           // 팩의 id 그대로 (속성 id, 인물 id, 조합 id)
  readonly group: CodexGroupId;
  readonly state: CodexState;
  /** 처음 얻거나 만난 화. 모르면 없다 */
  readonly firstEpisodeId?: string;
}

export interface CodexGroup {
  readonly id: CodexGroupId;
  readonly entries: readonly CodexEntry[];   // 팩에 적힌 순서 (cast는 Record라 키 순서)
  readonly known: number;                    // owned + seen
  readonly total: number;
}

export interface CodexBook {
  readonly groups: readonly CodexGroup[];    // 항목이 0개인 분류는 넣지 않는다
}

