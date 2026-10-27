/**
 * W9 4장: 구슬 — 얻기, 흡수, 합치기, 박기, 구결, 경지, 다음 화의 장면, 상점, 도감.
 * 고정 팩 `__fixtures__/w9-mini`를 쓴다.
 */
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import type { ReaderSlot, StoryPack } from './narrative.model';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import { absorbBead, beadCount, completedVerses, fuseBeads, grantBead, nextRealm, realmOf, verseProgress } from './narrative-beads';
import { applyEffects, computeStats, createReaderSlot, grantTrait, socketBead } from './narrative-state';
import { bindEpisode } from './narrative-bind';
import { unequipItem } from './narrative-loadout';
import { buyItem, canSell } from './narrative-shop';
import { buildCodex } from './narrative-codex';

const pack: StoryPack = enrichPackWithPersonalityCards(compilePack(join(process.cwd(), 'loworld-common/src/services/narrative/__fixtures__/w9-mini')).pack as StoryPack);
const fresh = (): ReaderSlot => createReaderSlot(pack, 's', 'warm', '갑', 'seed-1');

function must(result: { ok: boolean; slot: ReaderSlot }): ReaderSlot {
  expect(result.ok).toBe(true);
  return result.slot;
}

describe('W9 구슬 얻기', () => {
  it('수를 세고, 처음 얻을 때만 traitIds에 넣는다. 가진 것만으로는 힘이 되지 않는다', () => {
    let slot = fresh();
    const before = computeStats(slot, pack);
    slot = grantTrait(slot, pack, 'bead.ga');
    slot = grantBead(slot, pack, 'bead.ga', 2);
    expect(beadCount(slot, 'bead.ga')).toBe(3);
    expect(slot.traitIds.filter((id) => id === 'bead.ga')).toHaveLength(1);
    expect(computeStats(slot, pack)).toEqual(before);
  });
});

describe('W9 흡수와 경지', () => {
  it('흡수하면 하나 줄고, 영구히 힘이 되고, 흡수 장면을 다음 화에 넣는다', () => {
    let slot = grantBead(fresh(), pack, 'bead.ga', 2);
    const before = computeStats(slot, pack).might;
    slot = must(absorbBead(slot, pack, 'bead.ga'));
    expect(beadCount(slot, 'bead.ga')).toBe(1);
    expect(slot.absorbed).toEqual(['bead.ga']);
    expect(computeStats(slot, pack).might).toBe(before + 2);
    expect(slot.pendingScenes).toEqual(['absorb.bead.ga']);
    expect(realmOf(slot, pack)?.id).toBe('realm.first');
    expect(nextRealm(slot, pack)).toEqual({ realm: pack.realms?.[1], remaining: 1 });
  });

  it('흡수 수가 문턱에 닿으면 경지가 오르고, 경지 장면이 붙고, 경지의 힘이 더해진다', () => {
    let slot = grantBead(fresh(), pack, 'bead.ga', 2);
    const guard = computeStats(slot, pack).guard;
    slot = must(absorbBead(slot, pack, 'bead.ga'));
    const second = absorbBead(slot, pack, 'bead.ga');
    expect(second.ok && second.realm?.id).toBe('realm.second');
    slot = must(second);
    expect(realmOf(slot, pack)?.id).toBe('realm.second');
    expect(computeStats(slot, pack).guard).toBe(guard + 5);
    expect(slot.pendingScenes).toEqual(['absorb.bead.ga', 'realm.realm.second']);
    expect(nextRealm(slot, pack)).toBeNull();
  });

  it('가진 것이 없으면 흡수하지 못한다', () => {
    const result = absorbBead(fresh(), pack, 'bead.ga');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toBe('none');
  });

  it('이야기의 효과 absorb는 쥐여 주고 흡수하되 흡수 장면은 넣지 않는다', () => {
    const slot = applyEffects(fresh(), pack, { absorb: ['bead.da'] });
    expect(slot.absorbed).toEqual(['bead.da']);
    expect(beadCount(slot, 'bead.da')).toBe(0);
    expect(slot.pendingScenes ?? []).toEqual([]);
  });

  it('다음 화의 첫 장면 뒤에 장면이 들어가고, 엮은 뒤에는 비운다', () => {
    const slot = must(absorbBead(grantBead(fresh(), pack, 'bead.ga'), pack, 'bead.ga'));
    const { bound, slot: after } = bindEpisode({ slot, pack, episode: pack.episodes['ep3'], clash: null, catharsis: 0, drawnTraitId: null });
    expect(bound.paragraphs.map((paragraph) => paragraph.text)).toEqual(['그냥 하루였다.', '가의 구슬을 흡수했다. 누군가의 웃음이 들렸다.']);
    expect(bound.silent?.map((trace) => trace.choiceId)).toContain('scene:absorb.bead.ga');
    expect(after.pendingScenes).toEqual([]);
  });
});

describe('W9 합치기', () => {
  it('셋을 한 단계 깊은 하나로', () => {
    const result = fuseBeads(grantBead(fresh(), pack, 'bead.ga', 4), pack, 'bead.ga');
    expect(result.ok && result.made).toBe('bead.na');
    const slot = must(result);
    expect(beadCount(slot, 'bead.ga')).toBe(1);
    expect(beadCount(slot, 'bead.na')).toBe(1);
  });

  it('모자라거나 더 깊은 글자가 없으면 못 한다', () => {
    const few = fuseBeads(grantBead(fresh(), pack, 'bead.ga', 2), pack, 'bead.ga');
    expect(!few.ok && few.reason).toBe('few');
    const top = fuseBeads(grantBead(fresh(), pack, 'bead.na', 3), pack, 'bead.na');
    expect(!top.ok && top.reason).toBe('top');
  });
});

describe('W9 박기와 구결', () => {
  it('왼쪽 혈부터 찬다. 순서가 맞으면 구결이 완성되어 무공을 얻고, 깃발과 장면이 생긴다', () => {
    let slot = grantBead(grantBead(fresh(), pack, 'bead.ga'), pack, 'bead.na');
    const base = computeStats(slot, pack);
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    expect(slot.sockets?.['item.blade']).toEqual(['bead.ga']);
    expect(verseProgress(slot, pack)[0]).toMatchObject({ matched: 1, required: 2, complete: false, itemId: 'item.blade' });
    const done = socketBead(slot, pack, 'item.blade', 'bead.na');
    expect(done.ok && done.verse?.id).toBe('verse.gana');
    slot = must(done);
    expect(completedVerses(slot, pack).map((verse) => verse.id)).toEqual(['verse.gana']);
    expect(slot.traitIds).toContain('art.verse');
    expect(slot.flags).toEqual(expect.arrayContaining(['verse:verse.gana', 'gana']));
    expect(slot.pendingScenes).toEqual(['verse.verse.gana']);
    const stats = computeStats(slot, pack);
    // 가(무공 2) + 구결(무공 3) + 얻은 무공 카드 가나검(무공 8), 나(호신 4)
    expect(stats.might).toBe(base.might + 2 + 3 + 8);
    expect(stats.guard).toBe(base.guard + 4);
  });

  it('혈이 다 찼으면, 혈이 없는 장비면 못 박는다', () => {
    let slot = grantBead(fresh(), pack, 'bead.ga', 3);
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    const full = socketBead(slot, pack, 'item.blade', 'bead.ga');
    expect(!full.ok && full.reason).toBe('full');
    const plain = socketBead(grantTrait(slot, pack, 'item.plain'), pack, 'item.plain', 'bead.ga');
    expect(!plain.ok && plain.reason).toBe('no-item');
  });

  it('순서가 다르면 구결이 아니다', () => {
    let slot = grantBead(grantBead(fresh(), pack, 'bead.ga'), pack, 'bead.na');
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.na'));
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    expect(completedVerses(slot, pack)).toEqual([]);
    expect(verseProgress(slot, pack)[0].matched).toBe(0);
  });

  it('자동 착용은 박힌 구슬까지 센다: 구슬 박은 장비를 맨 장비가 밀어내지 않는다', () => {
    let slot = grantBead(fresh(), pack, 'bead.ga', 2);
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    // 검(무공 5) + 가 둘(무공 4) = 9 > 날검(무공 7). 날검을 얻어도 검을 입은 채다. 박지 않았으면 날검으로 바뀐다
    expect(grantTrait(slot, pack, 'item.sharp').equipment?.weapon).toBe('item.blade');
    expect(grantTrait(fresh(), pack, 'item.sharp').equipment?.weapon).toBe('item.sharp');
  });

  it('벗으면 박힌 구슬과 구결의 힘이 빠진다', () => {
    let slot = grantBead(grantBead(fresh(), pack, 'bead.ga'), pack, 'bead.na');
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.na'));
    const worn = computeStats(slot, pack);
    const bare = unequipItem(slot, 'weapon');
    expect(completedVerses(bare, pack)).toEqual([]);
    expect(computeStats(bare, pack).guard).toBe(worn.guard - 4);
  });
});

describe('W9 구슬과 상점, 도감', () => {
  it('구슬은 몇 번이고 산다. 팔지 못한다', () => {
    let slot = { ...fresh(), silver: 30 };
    slot = must(buyItem(slot, pack, 'shop.a', 'bead.ga'));
    slot = must(buyItem(slot, pack, 'shop.a', 'bead.ga'));
    expect(beadCount(slot, 'bead.ga')).toBe(2);
    expect(slot.silver).toBe(10);
    expect(canSell(slot, pack, 'bead.ga')).toBe(false);
  });

  it('도감에 구슬과 구결 분류가 생긴다', () => {
    let slot = grantBead(grantBead(fresh(), pack, 'bead.ga'), pack, 'bead.na');
    let codex = buildCodex(pack, slot);
    const group = (id: string) => codex.groups.find((entry) => entry.id === id);
    expect(group('bead')?.entries.find((entry) => entry.id === 'bead.ga')?.state).toBe('owned');
    expect(group('bead')?.entries.find((entry) => entry.id === 'bead.da')?.state).toBe('unknown');
    expect(group('verse')?.entries[0].state).toBe('seen');
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.ga'));
    slot = must(socketBead(slot, pack, 'item.blade', 'bead.na'));
    codex = buildCodex(pack, slot);
    expect(group('verse')?.entries[0].state).toBe('owned');
  });
});
