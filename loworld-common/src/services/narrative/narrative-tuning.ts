/** 조율 값. 읽어 보며 바꾸는 숫자는 모두 여기에 있다. 팩의 `tuning`이 덮어쓸 수 있다. */
export const NARRATIVE_TUNING = {
  baseStat: 10,
  regardDown: 0.7,
  regardUp: 1.3,
  stanceHostile: -50,
  stanceCold: -10,
  stanceWarm: 20,
  stanceTrusting: 60,
  mightRounds: 5,
  /** 힘 겨루기: 체력 = lifeBase + guard × lifePerGuard */
  lifeBase: 60,
  lifePerGuard: 4,
  /** 힘 겨루기: 한 번의 피해 = 힘 × [damageMin, damageMax] */
  damageMin: 0.45,
  damageMax: 0.75,
  /** 무공으로 치면 기본 공격보다 이만큼 세다 */
  artDamageBoost: 1.25,
  overwhelmLife: 0.6,
  advantageLife: 0.3,
  witStrikeKnown: 1.3,
  witStrikeBlind: 0.8,
  witProbe: 1.0,
  witYield: 0.6,
  witOverwhelm: 1.5,
  witWin: 1.0,
  witClose: 0.7,
  grudgeOnDefeat: 50,
  grudgeOnClose: 10,
  catharsisAdvantage: 1.0,
  catharsisOverwhelm: 1.5,
  /** 이긴 겨루기를 본 사람이 어림하는 주인공의 힘 = 상대의 힘 × 이 값 */
  witnessOverwhelm: 1.6,
  witnessAdvantage: 1.35,
  witnessClose: 1.05,
  witnessDefeat: 0.6,
  /** 기연을 가졌으면 그 상대와 겨룰 때의 힘이 적어도 상대의 힘 × 이 값이다 */
  windfallFloor: 1.6,
  /** 성향의 갈림: 이 값 이상이면 자비, 이 값의 음수 이하면 잔혹. 조건 alignment(cruel|merciful)와 말투가 함께 쓴다 */
  alignmentStance: 34,
  /** 돈: 시작, 화를 마칠 때, 이겼을 때 등급별로 더 받는 값 */
  silverStart: 0,
  silverBase: 10,
  silverOverwhelm: 20,
  silverAdvantage: 12,
  silverClose: 6,
  /** 파는 값 = 사는 값 × 이 값(내림) */
  sellRatio: 0.5,
  /** 연애 단계를 2 이상으로 올리는 데 필요한 인연 */
  romanceBond: 80,
  /** 동행 중인 동료가 반대로 기운 성향을 이만큼 보면 걱정하고, 저만큼 보면 떠난다 */
  companionWarn: 34,
  companionLeave: 67,
  /** 공명: 성품 좌표의 거리가 이 값 이하면 공명, 저 값 이하면 보통, 그보다 멀면 어긋남 */
  resonanceNear: 50,
  resonanceFar: 110,
  /** 대화 장면의 인연 변화에 곱하는 값. 공명이면 가까워지는 값 × warm, 멀어지는 값 × cool. 어긋나면 거꾸로 */
  resonanceWarm: 1.5,
  resonanceCool: 0.5,
  /** 1이면 겨루기 앞의 장면은 겨루기를 보기 전의 눈으로 인물의 눈높이를 정한다. 0은 PoC 1의 방식(엮기 전에 고친 값) */
  preClashWitness: 0,
} as const;

export type NarrativeTuning = { readonly [K in keyof typeof NARRATIVE_TUNING]: number };

export function resolveTuning(overrides: Readonly<Record<string, number>> | undefined): NarrativeTuning {
  return { ...NARRATIVE_TUNING, ...(overrides ?? {}) } as NarrativeTuning;
}
