import { STAT_AXES, type ReaderSlot, type StatAxis, type StoryPack, type StoryRealm, type StoryTrait, type StoryVerse } from './narrative.model';

/**
 * 구슬: 얻고, 흡수하고, 장비에 박고, 셋을 합친다. 순서대로 박은 글자가 구결을 이룬다.
 * 이 파일은 속성을 주는 일(grantTrait)을 모른다. 구결이 주는 속성은 부르는 쪽이 `grant`로 넘긴다(narrative-state의 socketBead).
 */

export type BeadFailure = 'none' | 'no-item' | 'full' | 'few' | 'top' | 'unknown';
export type BeadResult =
  | { readonly ok: true; readonly slot: ReaderSlot; readonly verse?: StoryVerse; readonly realm?: StoryRealm; readonly made?: string }
  | { readonly ok: false; readonly slot: ReaderSlot; readonly reason: BeadFailure };

export function isBead(pack: StoryPack, id: string): boolean {
  return pack.traits[id]?.kind === 'bead';
}

export function beadCount(slot: ReaderSlot, id: string): number {
  return slot.beads?.[id] ?? 0;
}

/** 구슬을 얻는다. 처음 얻으면 traitIds에도 넣는다(도감과 has()가 "얻은 적 있다"로 읽는다) */
export function grantBead(slot: ReaderSlot, pack: StoryPack, id: string, count = 1): ReaderSlot {
  if (!isBead(pack, id) || count <= 0) return slot;
  const beads = { ...(slot.beads ?? {}), [id]: beadCount(slot, id) + count };
  const traitIds = slot.traitIds.includes(id) ? slot.traitIds : [...slot.traitIds, id];
  return { ...slot, beads, traitIds };
}

function takeBead(slot: ReaderSlot, id: string, count = 1): ReaderSlot {
  const left = beadCount(slot, id) - count;
  const beads = { ...(slot.beads ?? {}) };
  if (left > 0) beads[id] = left;
  else delete beads[id];
  return { ...slot, beads };
}

function queueScene(slot: ReaderSlot, pack: StoryPack, key: string): ReaderSlot {
  if (!pack.scenes?.[key] || (slot.pendingScenes ?? []).includes(key)) return slot;
  return { ...slot, pendingScenes: [...(slot.pendingScenes ?? []), key] };
}

// ── 경지 ──────────────────────────────────────────────────────────────

/** 흡수한 수로 정한 경지. 팩에 경지가 없으면 null */
export function realmOf(slot: ReaderSlot, pack: StoryPack): StoryRealm | null {
  const absorbed = slot.absorbed?.length ?? 0;
  const realms = pack.realms ?? [];
  let current: StoryRealm | null = null;
  for (const realm of realms) if (absorbed >= realm.absorbed) current = realm;
  return current;
}

export function realmIndex(slot: ReaderSlot, pack: StoryPack): number {
  const realm = realmOf(slot, pack);
  return realm ? (pack.realms ?? []).indexOf(realm) : -1;
}

/** 다음 경지와 거기까지 남은 흡수 수. 끝이면 null */
export function nextRealm(slot: ReaderSlot, pack: StoryPack): { realm: StoryRealm; remaining: number } | null {
  const absorbed = slot.absorbed?.length ?? 0;
  const realm = (pack.realms ?? []).find((entry) => entry.absorbed > absorbed);
  return realm ? { realm, remaining: realm.absorbed - absorbed } : null;
}

// ── 흡수, 합치기 ───────────────────────────────────────────────────────

/**
 * 하나를 흡수한다. `scene`이면 그 구슬의 흡수 장면을 다음 화의 앞에 넣는다.
 * 이야기가 효과(`absorb`)로 흡수할 때는 그 화의 본문이 장면을 직접 쓰므로 `scene: false`다. 경지 장면은 둘 다 넣는다.
 */
export function absorbBead(slot: ReaderSlot, pack: StoryPack, id: string, options: { readonly scene: boolean } = { scene: true }): BeadResult {
  if (!isBead(pack, id)) return { ok: false, slot, reason: 'unknown' };
  if (beadCount(slot, id) < 1) return { ok: false, slot, reason: 'none' };
  const before = realmOf(slot, pack);
  let next: ReaderSlot = { ...takeBead(slot, id), absorbed: [...(slot.absorbed ?? []), id] };
  if (options.scene) next = queueScene(next, pack, `absorb.${id}`);
  const after = realmOf(next, pack);
  if (after && after !== before) {
    next = queueScene(next, pack, `realm.${after.id}`);
    return { ok: true, slot: next, realm: after };
  }
  return { ok: true, slot: next };
}

/** 같은 구슬 셋을 한 단계 깊은 구슬 하나로 */
export function fuseBeads(slot: ReaderSlot, pack: StoryPack, id: string): BeadResult {
  const bead = pack.traits[id];
  if (!bead || bead.kind !== 'bead') return { ok: false, slot, reason: 'unknown' };
  if (!bead.next || !isBead(pack, bead.next)) return { ok: false, slot, reason: 'top' };
  if (beadCount(slot, id) < 3) return { ok: false, slot, reason: 'few' };
  return { ok: true, slot: grantBead(takeBead(slot, id, 3), pack, bead.next), made: bead.next };
}

// ── 박기, 구결 ─────────────────────────────────────────────────────────

export function socketsOf(slot: ReaderSlot, itemId: string): readonly string[] {
  return slot.sockets?.[itemId] ?? [];
}

function verseFits(verse: StoryVerse, item: StoryTrait): boolean {
  if ((item.sockets ?? 0) !== verse.beads.length) return false;
  if (!item.equip || !verse.equip.includes(item.equip)) return false;
  return verse.tags.length === 0 || verse.tags.some((tag) => item.tags.includes(tag));
}

/** 이 장비에 박힌 구슬이 이루는 구결. 혈이 다 차고 순서까지 같아야 한다 */
export function verseOfItem(slot: ReaderSlot, pack: StoryPack, itemId: string): StoryVerse | null {
  const item = pack.traits[itemId];
  if (!item) return null;
  const set = socketsOf(slot, itemId);
  return (pack.verses ?? []).find((verse) => verseFits(verse, item) && verse.beads.length === set.length && verse.beads.every((bead, index) => set[index] === bead)) ?? null;
}

function equippedItemIds(slot: ReaderSlot): string[] {
  return Object.values(slot.equipment ?? {}).filter((id): id is string => !!id);
}

/** 지금 입은 장비에서 완성된 구결 */
export function completedVerses(slot: ReaderSlot, pack: StoryPack): StoryVerse[] {
  return equippedItemIds(slot).map((id) => verseOfItem(slot, pack, id)).filter((verse): verse is StoryVerse => !!verse);
}

export interface VerseProgress {
  readonly verse: StoryVerse;
  /** 구결이 맞을 수 있는 장비 중 가장 많이 맞춘 것 */
  readonly itemId: string | null;
  readonly matched: number;
  readonly required: number;
  readonly complete: boolean;
}

/** 구결마다 앞에서부터 순서대로 맞게 박힌 수. 메뉴가 "인신 1 / 2"처럼 보인다 */
export function verseProgress(slot: ReaderSlot, pack: StoryPack): VerseProgress[] {
  const owned = slot.traitIds.filter((id) => pack.traits[id]?.kind === 'item');
  return (pack.verses ?? []).map((verse) => {
    let best: { itemId: string | null; matched: number } = { itemId: null, matched: 0 };
    for (const itemId of owned) {
      const item = pack.traits[itemId];
      if (!item || !verseFits(verse, item)) continue;
      const set = socketsOf(slot, itemId);
      let matched = 0;
      while (matched < set.length && set[matched] === verse.beads[matched]) matched += 1;
      if (matched < set.length) matched = 0;
      if (best.itemId === null || matched > best.matched) best = { itemId, matched };
    }
    return { verse, itemId: best.itemId, matched: best.matched, required: verse.beads.length, complete: best.matched === verse.beads.length };
  });
}

/**
 * 구슬 하나를 장비의 다음 빈 혈에 박는다. 박은 구슬은 빠지지 않는다.
 * 구결이 완성되면 `grant`로 구결의 속성을 주고, 깃발 `verse:<id>`를 세우고, 구결 장면을 다음 화의 앞에 넣는다.
 */
export function placeBead(slot: ReaderSlot, pack: StoryPack, itemId: string, id: string, grant: (slot: ReaderSlot, traitId: string) => ReaderSlot): BeadResult {
  if (!isBead(pack, id)) return { ok: false, slot, reason: 'unknown' };
  if (beadCount(slot, id) < 1) return { ok: false, slot, reason: 'none' };
  const item = pack.traits[itemId];
  if (!item || !slot.traitIds.includes(itemId) || !(item.sockets && item.sockets > 0)) return { ok: false, slot, reason: 'no-item' };
  const set = socketsOf(slot, itemId);
  if (set.length >= item.sockets) return { ok: false, slot, reason: 'full' };
  let next: ReaderSlot = { ...takeBead(slot, id), sockets: { ...(slot.sockets ?? {}), [itemId]: [...set, id] } };
  const verse = verseOfItem(next, pack, itemId);
  if (!verse) return { ok: true, slot: next };
  for (const traitId of verse.grant) next = grant(next, traitId);
  const flag = `verse:${verse.id}`;
  next = { ...next, flags: next.flags.includes(flag) ? next.flags : [...next.flags, flag, ...verse.flags.filter((entry) => !next.flags.includes(entry))] };
  next = queueScene(next, pack, `verse.${verse.id}`);
  return { ok: true, slot: next, verse };
}

// ── 힘 ────────────────────────────────────────────────────────────────

/** 구슬이 더하는 힘: 흡수한 구슬 + 입은 장비에 박힌 구슬 + 완성한 구결 + 경지 */
export function beadStats(slot: ReaderSlot, pack: StoryPack): Record<StatAxis, number> {
  const total = Object.fromEntries(STAT_AXES.map((axis) => [axis, 0])) as Record<StatAxis, number>;
  const add = (stats: Partial<Record<StatAxis, number>> | undefined) => {
    for (const axis of STAT_AXES) total[axis] += stats?.[axis] ?? 0;
  };
  for (const id of slot.absorbed ?? []) add(pack.traits[id]?.stats);
  for (const itemId of equippedItemIds(slot)) for (const id of socketsOf(slot, itemId)) add(pack.traits[id]?.stats);
  for (const verse of completedVerses(slot, pack)) add(verse.stats);
  add(realmOf(slot, pack)?.stats);
  return total;
}
