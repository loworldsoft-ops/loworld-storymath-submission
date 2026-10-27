/** 독자 화면의 부품이 받는 값. 부품은 엔진이나 저장소를 직접 읽지 않는다. */

export type { BookshelfBookItem } from '../../../../services/models/story-reader.model';
import type { CodexCardVm } from '../../../../services/models/codex-card.model';

export interface ReaderSlotSummaryVm {
  readonly id: string;
  readonly empty: boolean;
  readonly name: string;
  readonly originName: string;
  /** 예: "2화까지 읽음" */
  readonly progress: string;
  /** 고른 초상. 없으면 빈 글 */
  readonly portraitUrl: string;
}

/** 캐릭터를 만들 때 고르는 초상 한 장 */
export interface ReaderPortraitVm {
  readonly id: string;
  readonly url: string;
  /** 그림을 말로 옮긴 것. 예: "화산 · 남" */
  readonly label: string;
}

export interface ReaderOriginVm {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
}

/** 고를 수 있는 카드 한 장 */
export interface ReaderCardVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly description: string;
  /** 이 카드를 고르면 나아가는 조합. 예: "청운삼식 2 / 3" */
  readonly hint: string;
}

export interface ReaderMoveVm {
  readonly id: string;
  readonly name: string;
  readonly hint: string;
  readonly ready: boolean;
}

export interface ReaderLifeVm {
  readonly mine: number;
  readonly mineMax: number;
  readonly theirs: number;
  readonly theirsMax: number;
}

export interface ReaderStatVm {
  readonly label: string;
  readonly value: number;
}

export interface ReaderTraitVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly description: string;
  /** 무공·기억을 얻은 장면. 없으면 빈 글 */
  readonly scene: string;
  /** 능력치 한 줄. 예: "무공 +5 · 호신 +3". 없으면 빈 글 */
  readonly statLine?: string;
  /** 입는 자리의 이름(용어집). 입을 수 없으면 없음 */
  readonly equipLabel?: string;
  readonly equipped?: boolean;
  /** 혈에 박힌 글자. 빈 혈은 빈 글. 혈이 없으면 없음 */
  readonly sockets?: readonly string[];
  /** 완성된 구결의 이름 */
  readonly verseName?: string;
}

export interface ReaderEquipSlotVm {
  readonly slot: string;
  readonly label: string;
  readonly item: ReaderTraitVm | null;
}

export interface ReaderShopItemVm {
  readonly trait: ReaderTraitVm;
  readonly price: number;
  readonly owned: boolean;
  readonly affordable: boolean;
}

export interface ReaderShopVm {
  readonly id: string;
  readonly name: string;
  readonly zoneName: string;
  readonly items: readonly ReaderShopItemVm[];
  /** 팔 수 있는 가진 물건과 파는 값 */
  readonly sellables: readonly { readonly trait: ReaderTraitVm; readonly price: number }[];
}

export interface ReaderComboVm {
  readonly name: string;
  readonly owned: number;
  readonly required: number;
  readonly complete: boolean;
  readonly pieces: readonly { readonly name: string; readonly owned: boolean }[];
}

export interface ReaderPersonVm {
  readonly id: string;
  readonly name: string;
  readonly nature: string;
  readonly stance: string;
  readonly regard: string;
  readonly bond: number;
  readonly grudge: number;
  readonly want: string;
  readonly met: boolean;
  readonly inParty?: boolean;
  readonly romanceStage?: number;
  readonly romanceLabel?: string;
  /** 주인공과의 성품 궁합. 예: "공명" */
  readonly resonance?: string;
}

/** 가진 구슬 하나 (W9) */
export interface ReaderBeadVm {
  readonly id: string;
  readonly letter: string;
  readonly name: string;
  readonly count: number;
  /** 단계의 이름. 예: "하품" */
  readonly tier: string;
  readonly description: string;
  readonly statLine: string;
  /** 셋을 합치면 되는 구슬의 글자. 없으면 빈 글 */
  readonly next: string;
  readonly canFuse: boolean;
}

/** 구슬을 박을 수 있는 장비 (빈 혈이 있다) */
export interface ReaderSocketTargetVm {
  readonly itemId: string;
  readonly name: string;
  /** 박힌 글자, 빈 혈은 빈 글 */
  readonly sockets: readonly string[];
}

export interface ReaderVerseVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly letters: readonly { readonly letter: string; readonly placed: boolean }[];
  readonly complete: boolean;
  /** 어느 장비에 맞는가. 예: "검 · 혈 둘" */
  readonly fit: string;
}

export interface ReaderRealmVm {
  readonly name: string;
  readonly absorbed: number;
  /** 예: "이류까지 1개". 끝이면 빈 글 */
  readonly next: string;
}

/** 동료 둘 사이 */
export interface ReaderTieVm {
  readonly key: string;
  readonly names: string;
  readonly value: number;
  readonly resonance: string;
}

/** 사건 줄기의 진행 */
export interface ReaderArcVm {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly read: number;
  readonly total: number;
}

export interface ReaderZoneVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly x: number;
  readonly y: number;
  readonly adjacent: readonly string[];
  readonly current: boolean;
  readonly visited: boolean;
  readonly episodes: readonly string[];
}

export interface ReaderLogTraceVm {
  readonly text: string;
  readonly reason: string;
  readonly alternative: string | null;
}

export interface ReaderLogEntryVm {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly traces: readonly ReaderLogTraceVm[];
}

export interface ReaderCodexEntryVm {
  readonly id: string;
  readonly state: 'owned' | 'seen' | 'unknown';
  /** unknown이면 '？？？' */
  readonly name: string;
  /** 상세 카드에 넘길 모양. unknown이면 없다 */
  readonly card?: CodexCardVm;
}

export interface ReaderCodexCategoryVm {
  readonly id: string;
  readonly name: string;
  readonly known: number;
  readonly total: number;
  readonly entries: readonly ReaderCodexEntryVm[];
}

export interface ReaderMenuAlignmentVm {
  readonly value: number;
  readonly label: string;
  readonly stance: 'cruel' | 'merciful' | 'neutral';
}

export interface ReaderMenuVm {
  readonly name: string;
  /** 고른 초상. 없으면 빈 글 */
  readonly portraitUrl: string;
  readonly originName: string;
  readonly originSummary: string;
  readonly stats: readonly ReaderStatVm[];
  readonly cards: readonly ReaderTraitVm[];
  readonly disposition: { readonly x: number; readonly y: number } | null;
  readonly alignment?: ReaderMenuAlignmentVm;
  readonly people: readonly ReaderPersonVm[];
  readonly party?: readonly ReaderPersonVm[];
  readonly arts: readonly ReaderTraitVm[];
  readonly combos: readonly ReaderComboVm[];
  readonly bag: readonly ReaderTraitVm[];
  readonly equipment: readonly ReaderEquipSlotVm[];
  readonly silver: number;
  readonly currencyLabel: string;
  readonly currencyUnit: string;
  readonly shop: ReaderShopVm | null;
  readonly notice: string;
  readonly memories: readonly ReaderTraitVm[];
  readonly zones: readonly ReaderZoneVm[];
  readonly log: readonly ReaderLogEntryVm[];
  readonly codexCategories?: readonly ReaderCodexCategoryVm[];
  /** 팩에 구슬이 있을 때만 있다. 없으면 구슬 탭을 보이지 않는다 (W9) */
  readonly beads?: readonly ReaderBeadVm[];
  readonly socketTargets?: readonly ReaderSocketTargetVm[];
  readonly verses?: readonly ReaderVerseVm[];
  readonly realm?: ReaderRealmVm | null;
  readonly ties?: readonly ReaderTieVm[];
  readonly arcs?: readonly ReaderArcVm[];
}

export type ReaderMenuTab = 'cast' | 'gear' | 'beads' | 'arts' | 'journey' | 'codex' | 'log';

export const READER_MENU_TABS: readonly ReaderMenuTab[] = ['cast', 'gear', 'beads', 'arts', 'journey', 'codex', 'log'];
