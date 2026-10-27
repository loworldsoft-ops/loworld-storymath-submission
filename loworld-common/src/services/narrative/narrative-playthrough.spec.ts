/**
 * W7-7 통독 시험 (S14, W7.1에서 R4를 훑기와 예외 종류로 바꿈)
 * 가상 독자 6명이 13화를 끝까지 읽고 R1~R6 검증 기준을 통과하는지 확인한다.
 *
 * 앱의 막간 순서와의 차이:
 * 앱은 패배 시 해당 화를 먼저 읽고(view === 'reading'), 그 화면에서 막간을 열 수 있다.
 * 따라서 패배한 화와 막간 사이에도 메뉴가 열릴 수 있다.
 * 본 시험은 단순하고 결정론적인 검증을 위해, 막간까지 마친 뒤 다음 화로 넘어가기 직전에 메뉴를 한 번 실행한다.
 */

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - pack-compiler is .mjs
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import type { ClashResult, CompanionEvent, ReaderSlot, StoryEpisode, StoryPack } from './narrative.model';
import { enrichPackWithPersonalityCards } from './personality-bridge';
import { autoPickCandidate, contestPower, createReaderSlot, evaluateCombinations } from './narrative-state';
import { applyDraw, beginInterlude, completeEpisode, completeInterlude, nextEpisodeId, openEpisode } from './narrative-flow';
import { autoMightClash, bestWitMove, createMightClash, finishMightClash, resolveWitContest } from './narrative-clash';
import { buyItem, canSell, currentZoneId, sellItem, shopInZone } from './narrative-shop';
import { equipItem, unequipItem } from './narrative-loadout';
import { READER_EQUIPMENT_SLOTS } from './narrative.model';
import { buildCodex } from './narrative-codex';
import { measureBound, summarize } from './__testing__/pattern';

/** W9 패턴 기준선. 잰 값에서 소수 셋째 자리를 내렸다 */
const PATTERN_BASELINE: Record<string, { avgRatio: number; maxClashChars: number }> = {
  V1: { avgRatio: 0.168, maxClashChars: 106 }, V2: { avgRatio: 0.177, maxClashChars: 106 }, V3: { avgRatio: 0.183, maxClashChars: 106 },
  V4: { avgRatio: 0.176, maxClashChars: 106 }, V5: { avgRatio: 0.137, maxClashChars: 105 }, V6: { avgRatio: 0.182, maxClashChars: 106 },
};

const contentDir = join(process.cwd(), 'loworld-content-wuxia/packs/wuxia-1');

interface MenuLog {
  bought: { shopId: string; traitId: string; zoneId: string }[];
  sold: { traitId: string; zoneId: string }[];
  buyAttempts: { shopId: string; traitId: string; result: string }[];
  sellAttempts: { traitId: string; result: string }[];
  equipped: { traitId: string; slot: string }[];
  unequipped: { traitId: string; slot: string }[];
}

interface Persona {
  readonly id: string;
  readonly name: string;
  readonly originId: 'sword' | 'mind';
  readonly seed: string;
  readonly menu: (slot: ReaderSlot, pack: StoryPack, log: MenuLog) => ReaderSlot;
  readonly targetEndings: readonly number[];
}

interface Run {
  readonly slot: ReaderSlot;
  readonly catharsis: number[];
  readonly candidates: Record<string, string[]>;
  readonly menuLog: MenuLog;
  readonly companionEvents: CompanionEvent[];
  readonly autoEquippedWeapon: boolean;
  readonly leftAt: Record<string, string>;
}

function autoClash(slot: ReaderSlot, pack: StoryPack, episode: StoryEpisode, attempt: number): ClashResult | null {
  if (!episode.contest) return null;
  if (episode.contest.axis === 'wit') {
    return resolveWitContest(slot, pack, episode, bestWitMove(slot, pack, episode.contest.opponent), true);
  }
  const might = createMightClash(slot, pack, episode, attempt);
  return might ? finishMightClash(autoMightClash(might), pack, true) : null;
}

function buyGoodPolicy(slot: ReaderSlot, pack: StoryPack, menuLog: MenuLog): ReaderSlot {
  const zoneId = currentZoneId(slot, pack);
  const shop = shopInZone(pack, zoneId);
  if (!shop) return slot;
  let next = slot;
  for (const itemId of shop.items) {
    const trait = pack.traits[itemId];
    if ((trait?.alignment ?? 0) >= 0) {
      const res = buyItem(next, pack, shop.id, itemId);
      menuLog.buyAttempts.push({ shopId: shop.id, traitId: itemId, result: res.ok ? 'ok' : res.reason });
      if (res.ok) {
        next = res.slot;
        menuLog.bought.push({ shopId: shop.id, traitId: itemId, zoneId: zoneId ?? '' });
      }
    }
  }
  return next;
}

function buyCruelPolicy(slot: ReaderSlot, pack: StoryPack, menuLog: MenuLog): ReaderSlot {
  const zoneId = currentZoneId(slot, pack);
  const shop = shopInZone(pack, zoneId);
  if (!shop) return slot;
  let next = slot;
  if (shop.items.includes('item.bloody-dagger')) {
    const res = buyItem(next, pack, shop.id, 'item.bloody-dagger');
    menuLog.buyAttempts.push({ shopId: shop.id, traitId: 'item.bloody-dagger', result: res.ok ? 'ok' : res.reason });
    if (res.ok) {
      next = res.slot;
      menuLog.bought.push({ shopId: shop.id, traitId: 'item.bloody-dagger', zoneId: zoneId ?? '' });
    }
  } else {
    for (const itemId of shop.items) {
      const trait = pack.traits[itemId];
      if ((trait?.alignment ?? 0) <= 0) {
        const res = buyItem(next, pack, shop.id, itemId);
        menuLog.buyAttempts.push({ shopId: shop.id, traitId: itemId, result: res.ok ? 'ok' : res.reason });
        if (res.ok) {
          next = res.slot;
          menuLog.bought.push({ shopId: shop.id, traitId: itemId, zoneId: zoneId ?? '' });
        }
      }
    }
  }
  return next;
}

function stripPolicy(slot: ReaderSlot, pack: StoryPack, menuLog: MenuLog): ReaderSlot {
  let next = slot;
  for (const slotKey of READER_EQUIPMENT_SLOTS) {
    if (next.equipment?.[slotKey]) {
      const itemId = next.equipment[slotKey]!;
      next = unequipItem(next, slotKey);
      menuLog.unequipped.push({ traitId: itemId, slot: slotKey });
    }
  }
  const zoneId = currentZoneId(next, pack) ?? '';
  for (const traitId of [...next.traitIds]) {
    if (canSell(next, pack, traitId)) {
      const res = sellItem(next, pack, traitId);
      menuLog.sellAttempts.push({ traitId, result: res.ok ? 'ok' : res.reason });
      if (res.ok) {
        next = res.slot;
        menuLog.sold.push({ traitId, zoneId });
      }
    }
  }
  return next;
}

function traderPolicy(weaponId: string) {
  return (slot: ReaderSlot, pack: StoryPack, menuLog: MenuLog): ReaderSlot => {
    const zoneId = currentZoneId(slot, pack) ?? '';
    const shop = shopInZone(pack, zoneId);
    let next = slot;
    if (shop && shop.items.includes(weaponId)) {
      const bRes = buyItem(next, pack, shop.id, weaponId);
      menuLog.buyAttempts.push({ shopId: shop.id, traitId: weaponId, result: bRes.ok ? 'ok' : bRes.reason });
      if (bRes.ok) {
        next = bRes.slot;
        menuLog.bought.push({ shopId: shop.id, traitId: weaponId, zoneId });
      }
    }
    if (next.traitIds.includes(weaponId)) {
      next = equipItem(next, pack, weaponId, 'weapon');
      menuLog.equipped.push({ traitId: weaponId, slot: 'weapon' });
    }
    for (const traitId of [...next.traitIds]) {
      const trait = pack.traits[traitId];
      if (trait?.kind === 'item' && trait?.equip === 'weapon' && next.equipment?.weapon !== traitId) {
        if (canSell(next, pack, traitId)) {
          const sRes = sellItem(next, pack, traitId);
          menuLog.sellAttempts.push({ traitId, result: sRes.ok ? 'ok' : sRes.reason });
          if (sRes.ok) {
            next = sRes.slot;
            menuLog.sold.push({ traitId, zoneId });
          }
        }
      }
    }
    return next;
  };
}

function traderPlusBuyGood(weaponId: string) {
  const trader = traderPolicy(weaponId);
  return (slot: ReaderSlot, pack: StoryPack, menuLog: MenuLog): ReaderSlot => {
    let next = trader(slot, pack, menuLog);
    next = buyGoodPolicy(next, pack, menuLog);
    return next;
  };
}

function playthrough(pack: StoryPack, persona: Persona): Run {
  const menuLog: MenuLog = { bought: [], sold: [], buyAttempts: [], sellAttempts: [], equipped: [], unequipped: [] };
  const catharsisList: number[] = [];
  const candidatesMap: Record<string, string[]> = {};
  const allEvents: CompanionEvent[] = [];
  const leftAt: Record<string, string> = {};
  let autoEquippedWeapon = false;

  let slot = createReaderSlot(pack, persona.id, persona.originId, persona.id, persona.seed);
  for (let guard = 0; guard < 50; guard += 1) {
    if (slot.history.length > 0) {
      slot = persona.menu(slot, pack, menuLog);
    }
    const id = nextEpisodeId(slot, pack);
    if (!id) break;
    const opened = openEpisode(slot, pack, id);
    if (!opened) break;
    candidatesMap[id] = opened.candidates.map((c) => c.id);
    const picked = autoPickCandidate(slot, opened.episode, opened.candidates);
    const work = applyDraw(slot, pack, picked?.id ?? null);
    const clash = autoClash(work, pack, opened.episode, 0);

    const prevWeapon = work.equipment?.weapon;
    const done = completeEpisode({
      slot: work,
      pack,
      episode: opened.episode,
      candidateIds: opened.candidates.map((c) => c.id),
      drawnTraitId: picked?.id ?? null,
      clash,
    });
    slot = done.slot;
    if (done.slot.equipment?.weapon !== prevWeapon) {
      autoEquippedWeapon = true;
    }

    catharsisList.push(done.catharsis);
    if (done.companionEvents?.length) {
      allEvents.push(...done.companionEvents);
      for (const ev of done.companionEvents) {
        if (ev.kind === 'leave' && !leftAt[ev.memberId]) {
          leftAt[ev.memberId] = opened.episode.id;
        }
      }
    }

    if (done.needsInterlude) {
      const begun = beginInterlude(slot, pack, opened.episode);
      if (begun) {
        let rematch = autoClash(begun.slot, pack, opened.episode, 1);
        if (rematch?.outcome === 'defeat') rematch = autoClash(begun.slot, pack, opened.episode, 2);
        if (!rematch) {
          throw new Error(`[playthrough] rematch is null: seed=${persona.seed}, ep=${opened.episode.id}`);
        }
        const finished = completeInterlude({ slot: begun.slot, pack, episode: opened.episode, rematch });
        if (finished) {
          slot = finished.slot;
          catharsisList.push(finished.catharsis);
        }
      }
    }
  }
  return { slot, catharsis: catharsisList, candidates: candidatesMap, menuLog, companionEvents: allEvents, autoEquippedWeapon, leftAt };
}

function getEnding(slot: ReaderSlot): number | null {
  const ep13 = slot.history.find((h) => h.episodeId === 'ep013');
  if (!ep13) return null;
  const trace = ep13.bound.paragraphs.flatMap((p) => p.traces).find((t) => t.place === '끝맺음');
  if (!trace) return null;
  if (trace.choiceId === '끝맺음.0') return 1;
  if (trace.choiceId === '끝맺음.1') return 2;
  if (trace.choiceId === '끝맺음.2') return 3;
  if (trace.choiceId === '끝맺음.else') return 4;
  return null;
}

const PERSONA_DEFS: readonly Persona[] = [
  { id: 'V1', name: '협객', originId: 'sword', seed: 'V1-38', menu: buyGoodPolicy, targetEndings: [1] },
  { id: 'V2', name: '흑도', originId: 'mind', seed: 'V2-6', menu: buyCruelPolicy, targetEndings: [2] },
  { id: 'V3', name: '약골', originId: 'mind', seed: 'V3-2', menu: stripPolicy, targetEndings: [4] },
  { id: 'V4', name: '장사꾼', originId: 'sword', seed: 'V4-5', menu: traderPolicy('item.saber'), targetEndings: [3, 4] },
  { id: 'V5', name: '마두', originId: 'sword', seed: 'V5-1', menu: buyCruelPolicy, targetEndings: [2, 4] },
  { id: 'V6', name: '선비', originId: 'mind', seed: 'V6-12', menu: traderPlusBuyGood('item.iron-gauntlet'), targetEndings: [3] },
];

const EXPECTED_ENDINGS: Record<string, number> = {
  V1: 1,
  V2: 2,
  V3: 4,
  V4: 4,
  V5: 2,
  V6: 3,
};

type UnreachedKind = 'rematch-loss' | 'origin-exhausted' | 'grudge-reset' | 'stat-gap' | 'always-in-party' | 'coverage';

const UNREACHED_OK: Record<string, { kind: UnreachedKind; why: string }> = {
  'ep001#받아냄.1': {
    kind: 'coverage',
    why: 'mind 출신 독자가 1화 곽두 겨루기에서 호각 패배(wit 차이 0~9)를 기록하지 못함',
  },
  'ep002#밝힘.1': {
    kind: 'coverage',
    why: 'sword 출신 독자가 2화 진 총관 재치 겨루기를 압승이 아닌 우세 승리로 이긴 적이 없음',
  },
  'ep003#구경꾼.0': {
    kind: 'grudge-reset',
    why: '3화 마층과의 첫 겨루기는 시작 원한이 0이며, 겨루기 승리 시 카타르시스가 0이라 50에 도달 불가',
  },
  'ep003#승부.2': {
    kind: 'coverage',
    why: '마층에게 한 대도 맞지 않고(untouched) 승리하는 갈래이나, 청운삼식 조합 갈래가 선순위로 매칭됨',
  },
  'ep003#추천.else': {
    kind: 'rematch-loss',
    why: '2화 보상 또는 2화 막간 재대결 승리로 목패(item.elder-token)를 확정 획득하므로 목패 미보유 갈래 도달 불가',
  },
  'ep004#결말.2': {
    kind: 'origin-exhausted',
    why: '앞선 두 갈래가 origin(sword), origin(mind)으로 전체 출신을 모두 소진하여 남는 독자가 없음',
  },
  'ep004#손에쥔것.0': {
    kind: 'coverage',
    why: '4화 시점에 기본 빗자루 대신 철검(item.iron-sword)을 장착하고 진입하는 독자가 없음',
  },
  'ep006#동료의눈.else': {
    kind: 'always-in-party',
    why: '4화에서 서하가 반드시 영입되며 성향 이탈 조건(-67)은 8화 이후에만 발생 가능하므로 6화에 서하가 반드시 동행 중',
  },
  'ep008#결판.0': {
    kind: 'grudge-reset',
    why: '곽두에게 쌓인 원한은 1화 막간 재대결 및 2화 승리로 0으로 초기화되므로 8화 승리 시 카타르시스가 0',
  },
  'ep008#결판.else': {
    kind: 'stat-gap',
    why: '곽두의 힘은 30인데 300번 훑기 중 8화 시점 독자의 힘 최솟값은 40 이상이어서 패배할 수 없음',
  },
  'ep008#처분.else': {
    kind: 'stat-gap',
    why: '8화 곽두 겨루기에서 패배하는 독자가 없음 (힘 격차)',
  },
  'ep012#쓰러짐.else': {
    kind: 'always-in-party',
    why: '5화에서 사도연 미영입 독자(성향 >= -15)가 11화까지 성향을 최대로 낮춰도 -67에 도달할 수 없어 서하가 잔류하므로 동료 0명 불가',
  },
  'interlude:common-memory#갚음.else': {
    kind: 'rematch-loss',
    why: '1화 패배 후 막간 재대결은 2회 기회 및 기연 보정으로 패배하지 않음',
  },
  'interlude:ep002-defeat#갚음.1': {
    kind: 'coverage',
    why: '2화 패배 막간 재대결을 원한 40 미만(호각)으로 이긴 독자가 없음',
  },
  'interlude:ep002-defeat#갚음.else': {
    kind: 'rematch-loss',
    why: '2화 패배 후 막간 재대결은 2회 기회 및 기연 보정으로 패배하지 않음',
  },
  'interlude:ep002-defeat#떠올림.else': {
    kind: 'coverage',
    why: 'mind 출신 독자가 2화 진 총관 재치 겨루기에서 패배하지 않음',
  },
  'interlude:ep002-defeat#소문.else': {
    kind: 'rematch-loss',
    why: '2화 막간 소문 슬롯의 선행 갈래가 outcome(victory)이라 재대결 패배 시에만 도달 가능',
  },
  'interlude:final-memory#곁.else': {
    kind: 'always-in-party',
    why: '12화 결전 패배 시점에 서하 또는 사도연 중 적어도 한 명이 반드시 동행 중이므로 동료 0명 불가',
  },
};

function collectReached(pack: StoryPack, slot: ReaderSlot, into: Set<string>): void {
  for (const h of slot.history) {
    const ep = pack.episodes[h.episodeId];
    if (!ep) continue;
    const epSlotNames = new Set(ep.beats.flatMap((b) => Object.keys(b.slots)));
    const allTraces = [
      ...h.bound.paragraphs.flatMap((p) => p.traces),
      ...(h.bound.silent ?? []),
    ];
    for (const t of allTraces) {
      if (t.place.startsWith('say:')) continue;
      if (epSlotNames.has(t.place)) {
        into.add(`${h.episodeId}#${t.choiceId}`);
      } else if (h.drawnTraitId && pack.traits[h.drawnTraitId]?.gainScene) {
        into.add(`origin:${h.drawnTraitId}#${t.choiceId}`);
      }
    }
    if (h.interlude) {
      const intId = ep.onDefeat ?? Object.keys(pack.interludes)[0];
      const intTraces = [
        ...h.interlude.bound.paragraphs.flatMap((p) => p.traces),
        ...(h.interlude.bound.silent ?? []),
      ];
      for (const t of intTraces) {
        if (t.place.startsWith('say:')) continue;
        into.add(`interlude:${intId}#${t.choiceId}`);
      }
    }
  }
}

describe.skipIf(!existsSync(contentDir))('통독 시험 (W7-7, W7-8)', () => {
  const { pack: rawPack } = compilePack(contentDir);
  const pack = enrichPackWithPersonalityCards(rawPack as StoryPack);

  const runs = PERSONA_DEFS.map((persona) => ({
    persona,
    run: playthrough(pack, persona),
  }));

  /** 도달만 세는 넓은 통독. 씨앗을 고르지 않는다(범위 고정). R4만 이 결과를 쓴다 */
  const SWEEP_SEEDS = 50;
  const sweepRuns = PERSONA_DEFS.flatMap((persona) =>
    Array.from({ length: SWEEP_SEEDS }, (_, i) => playthrough(pack, { ...persona, seed: `${persona.id}-${i + 1}` })),
  );

  describe('훑기: 300번 통독', () => {
    it('300번 모두 완독하고 12화 재대결을 이긴다', () => {
      for (let i = 0; i < sweepRuns.length; i += 1) {
        const run = sweepRuns[i];
        const persona = PERSONA_DEFS[Math.floor(i / SWEEP_SEEDS)];
        const seed = `${persona.id}-${(i % SWEEP_SEEDS) + 1}`;
        expect(run.slot.history).toHaveLength(13);
        const ep12 = run.slot.history.find((h) => h.episodeId === 'ep012');
        expect(ep12?.interlude?.rematch.outcome).toBe('victory');
      }
    });
  });

  describe('R1: 수렴과 완독', () => {
    it.each(runs)('$persona.id ($persona.name) 13화 완독 및 12화 패배 후 재대결 승리', ({ run }) => {
      expect(nextEpisodeId(run.slot, pack)).toBeNull();
      expect(run.slot.history).toHaveLength(13);

      const ep12 = run.slot.history.find((h) => h.episodeId === 'ep012');
      expect(ep12).toBeDefined();
      expect(ep12!.clash?.outcome).toBe('defeat');
      expect(ep12!.interlude).toBeDefined();
      expect(ep12!.interlude!.rematch.outcome).toBe('victory');
    });
  });

  describe('R2: 고정된 결말', () => {
    it.each(runs)('$persona.id ($persona.name) 목표 결말과 일치', ({ persona, run }) => {
      const ending = getEnding(run.slot);
      expect(ending).toBe(EXPECTED_ENDINGS[persona.id]);
      expect(persona.targetEndings).toContain(ending);
    });
  });

  describe('R3: 20가지 기능 검증', () => {
    it('1. 출신: sword와 mind가 모두 R1 통과', () => {
      const swordPassed = runs.filter((r) => r.persona.originId === 'sword').every((r) => r.run.slot.history.length === 13);
      const mindPassed = runs.filter((r) => r.persona.originId === 'mind').every((r) => r.run.slot.history.length === 13);
      expect(swordPassed).toBe(true);
      expect(mindPassed).toBe(true);
    });

    it('2. 겨루기 축: might와 wit 각각 victory와 defeat 존재', () => {
      const axes: Record<string, Set<string>> = { might: new Set(), wit: new Set() };
      for (const { run } of runs) {
        for (const h of run.slot.history) {
          if (h.clash) axes[h.clash.axis]?.add(h.clash.outcome);
          if (h.interlude?.rematch) axes[h.interlude.rematch.axis]?.add(h.interlude.rematch.outcome);
        }
      }
      expect(axes.might.has('victory')).toBe(true);
      expect(axes.might.has('defeat')).toBe(true);
      expect(axes.wit.has('victory')).toBe(true);
      expect(axes.wit.has('defeat')).toBe(true);
    });

    it('3. 네 단계: overwhelm, advantage, close, underdog 모두 출현', () => {
      const tiers = new Set<string>();
      for (const { run } of runs) {
        for (const h of run.slot.history) {
          if (h.clash) tiers.add(h.clash.tier);
          if (h.interlude?.rematch) tiers.add(h.interlude.rematch.tier);
        }
      }
      expect(tiers.has('overwhelm')).toBe(true);
      expect(tiers.has('advantage')).toBe(true);
      expect(tiers.has('close')).toBe(true);
      expect(tiers.has('underdog')).toBe(true);
    });

    it('4. 막간: ep012 전부, ep007 하나 이상, ep001~ep004 하나 이상', () => {
      const ep12Interludes = runs.filter((r) => r.run.slot.history.find((h) => h.episodeId === 'ep012')?.interlude).length;
      const ep07Interludes = runs.filter((r) => r.run.slot.history.find((h) => h.episodeId === 'ep007')?.interlude).length;
      const ep0104Interludes = runs.filter((r) =>
        r.run.slot.history.some((h) => ['ep001', 'ep002', 'ep003', 'ep004'].includes(h.episodeId) && h.interlude)
      ).length;

      expect(ep12Interludes).toBe(6);
      expect(ep07Interludes).toBeGreaterThanOrEqual(1);
      expect(ep0104Interludes).toBeGreaterThanOrEqual(1);
    });

    it('5. 막간 없는 패배: ep006 또는 ep010에서 defeat이고 interlude가 null인 기록 존재', () => {
      const defeatNoInterlude = runs.some((r) =>
        r.run.slot.history.some((h) => ['ep006', 'ep010'].includes(h.episodeId) && h.clash?.outcome === 'defeat' && !h.interlude)
      );
      expect(defeatNoInterlude).toBe(true);
    });

    it('6. 겨루기 없는 화: ep005, ep011, ep013의 clash가 모두 null', () => {
      const allNull = runs.every((r) =>
        ['ep005', 'ep011', 'ep013'].every((id) => r.run.slot.history.find((h) => h.episodeId === id)?.clash === null)
      );
      expect(allNull).toBe(true);
    });

    it('7. 조합: combo.cheongun-three와 combo.sword-and-mind 각각 완성된 독자 존재', () => {
      const cheongunCompleted = runs.some((r) =>
        evaluateCombinations(r.run.slot, pack).find((c) => c.id === 'combo.cheongun-three')?.complete
      );
      const swordAndMindCompleted = runs.some((r) =>
        evaluateCombinations(r.run.slot, pack).find((c) => c.id === 'combo.sword-and-mind')?.complete
      );
      expect(cheongunCompleted).toBe(true);
      expect(swordAndMindCompleted).toBe(true);
    });

    it('8. 자동 착용: 메뉴 없이 equipment.weapon이 바뀐 화가 존재', () => {
      expect(runs.some((r) => r.run.autoEquippedWeapon)).toBe(true);
    });

    it('9. 메뉴 입기·벗기: MenuLog에 equipItem 성공과 unequipItem 성공 기록 존재', () => {
      const allEquipped = runs.flatMap((r) => r.run.menuLog.equipped);
      const allUnequipped = runs.flatMap((r) => r.run.menuLog.unequipped);
      expect(allEquipped.length).toBeGreaterThan(0);
      expect(allUnequipped.length).toBeGreaterThan(0);
    });

    it('10. equipment: 효과: 4화 처분.0~2 중 하나에 닿은 독자의 병기가 청운 철검', () => {
      const reached = runs.filter(({ run }) => {
        const ep004 = run.slot.history.find((h) => h.episodeId === 'ep004');
        const trace = ep004?.bound.paragraphs.flatMap((p) => p.traces).find((t) => t.place === '처분');
        return trace && ['처분.0', '처분.1', '처분.2'].includes(trace.choiceId);
      });
      expect(reached.length).toBeGreaterThan(0);
      const v1 = reached.find((r) => r.persona.id === 'V1');
      expect(v1?.run.slot.traitIds).toContain('item.steel-sword');
      // 5화 시작 시 청운 철검 착용 갈래(행색.0: equipped(weapon, item.steel-sword))에 도달했는지 확인
      const ep005 = v1?.run.slot.history.find((h) => h.episodeId === 'ep005');
      const trace5 = ep005?.bound.paragraphs.flatMap((p) => p.traces).find((t) => t.place === '행색');
      expect(trace5?.choiceId).toBe('행색.0');
    });

    it('11. 장비 → 뽑기: V4의 ep006 후보 중 첫 무공이 도 꼬리표, V6은 권 꼬리표', () => {
      const v4 = runs.find((r) => r.persona.id === 'V4')!;
      const v6 = runs.find((r) => r.persona.id === 'V6')!;

      const v4Ep06Candidates = v4.run.candidates['ep006'] ?? [];
      const v4FirstArt = v4Ep06Candidates.map((id) => pack.traits[id]).find((t) => t?.kind === 'art');
      expect(v4FirstArt?.tags).toContain('도');

      const v6Ep06Candidates = v6.run.candidates['ep006'] ?? [];
      const v6FirstArt = v6Ep06Candidates.map((id) => pack.traits[id]).find((t) => t?.kind === 'art');
      expect(v6FirstArt?.tags).toContain('권');
    });

    it('12. 상점: 세 상점 모두 산 기록, 판 기록, poor 기록 존재', () => {
      const boughtShops = new Set(runs.flatMap((r) => r.run.menuLog.bought.map((b) => b.shopId)));
      const totalSold = runs.reduce((acc, r) => acc + r.run.menuLog.sold.length, 0);
      const hasPoor = runs.some((r) => r.run.menuLog.buyAttempts.some((a) => a.result === 'poor'));

      expect(boughtShops.has('shop.chores-peddler')).toBe(true);
      expect(boughtShops.has('shop.yard-armory')).toBe(true);
      expect(boughtShops.has('shop.market')).toBe(true);
      expect(totalSold).toBeGreaterThan(0);
      expect(hasPoor).toBe(true);
    });

    it('13. 성향 끝: 최종 성향 -67 이하와 +34 이상 존재', () => {
      const minAlign = Math.min(...runs.map((r) => r.run.slot.alignment ?? 0));
      const maxAlign = Math.max(...runs.map((r) => r.run.slot.alignment ?? 0));
      expect(minAlign).toBeLessThanOrEqual(-67);
      expect(maxAlign).toBeGreaterThanOrEqual(34);
    });

    it('14. 성향 출처: aligned:p_* 및 aligned:item.* 깃발 존재', () => {
      const allFlags = runs.flatMap((r) => r.run.slot.flags);
      expect(allFlags.some((f) => f.startsWith('aligned:p_'))).toBe(true);
      expect(allFlags.some((f) => f.startsWith('aligned:item.'))).toBe(true);
    });

    it('15. 주인공 말투: 주인공 대사 줄에 mock과 (lecture 또는 resolve) 존재', () => {
      const speechKinds = new Set<string>();
      for (const { run } of runs) {
        for (const h of run.slot.history) {
          for (const p of h.bound.paragraphs) {
            for (const t of p.traces) {
              if (t.place.startsWith('say:protagonist:')) {
                const line = pack.speech.find((s) => s.id === t.choiceId);
                if (line?.speech) speechKinds.add(line.speech);
              }
            }
          }
        }
      }
      expect(speechKinds.has('mock')).toBe(true);
      const hasLectureOrResolve = speechKinds.has('lecture') || speechKinds.has('resolve');
      expect(hasLectureOrResolve).toBe(true);
    });

    it('16. 동료: party에 seo-ha 든 독자, sa-doyeon 든 독자, warned:seo-ha 및 left:seo-ha 깃발 존재', () => {
      const hasSeoha = runs.some((r) => (r.run.slot.party ?? []).includes('seo-ha'));
      const hasSadoyeon = runs.some((r) => (r.run.slot.party ?? []).includes('sa-doyeon'));
      const allFlags = runs.flatMap((r) => r.run.slot.flags);

      expect(hasSeoha).toBe(true);
      expect(hasSadoyeon).toBe(true);
      expect(allFlags).toContain('warned:seo-ha');
      expect(allFlags).toContain('left:seo-ha');
    });

    it('17. 연애: romance.stage가 3인 독자 존재, 서하가 떠난 독자의 romance가 undefined', () => {
      const stage3 = runs.some((r) => r.run.slot.romance?.stage === 3);
      const leftSeoha = runs.filter((r) => r.run.slot.flags.includes('left:seo-ha'));

      expect(stage3).toBe(true);
      expect(leftSeoha.length).toBeGreaterThan(0);
      for (const r of leftSeoha) {
        expect(r.run.slot.romance).toBeUndefined();
      }
    });

    it('18. 원한: catharsis 중 50 이상 존재', () => {
      const maxCatharsis = Math.max(...runs.flatMap((r) => r.run.catharsis));
      expect(maxCatharsis).toBeGreaterThanOrEqual(50);
    });

    it('19. 지도: 기록의 구역 5개 모두 출현', () => {
      const zones = new Set<string>();
      for (const { run } of runs) {
        for (const h of run.slot.history) {
          const ep = pack.episodes[h.episodeId];
          if (ep?.zone) zones.add(ep.zone);
        }
      }
      expect(zones.size).toBe(5);
    });

    it('20. 결말: 4갈래 모두 출현', () => {
      const endings = new Set(runs.map((r) => getEnding(r.run.slot)));
      expect(endings.has(1)).toBe(true);
      expect(endings.has(2)).toBe(true);
      expect(endings.has(3)).toBe(true);
      expect(endings.has(4)).toBe(true);
    });
  });

  describe('R4: 갈래 도달과 예외 목록 검증', () => {
    it('도달하지 않은 갈래가 예외 목록과 일치하며 W7 예외 종류 조건을 만족한다', () => {
      const allBranches = new Set<string>();

      for (const [epId, ep] of Object.entries(pack.episodes)) {
        for (const beat of ep.beats) {
          for (const slot of Object.values(beat.slots)) {
            for (const v of slot.variants) {
              allBranches.add(`${epId}#${v.id}`);
            }
          }
        }
      }

      for (const [intId, interlude] of Object.entries(pack.interludes)) {
        for (const beat of interlude.beats) {
          for (const slot of Object.values(beat.slots)) {
            for (const v of slot.variants) {
              allBranches.add(`interlude:${intId}#${v.id}`);
            }
          }
        }
      }

      for (const [traitId, trait] of Object.entries(pack.traits)) {
        if (trait.gainScene) {
          for (const beat of trait.gainScene.beats) {
            for (const slot of Object.values(beat.slots)) {
              for (const v of slot.variants) {
                allBranches.add(`origin:${traitId}#${v.id}`);
              }
            }
          }
        }
      }

      const reachedBranches = new Set<string>();
      for (const { run } of runs) {
        collectReached(pack, run.slot, reachedBranches);
      }
      for (const run of sweepRuns) {
        collectReached(pack, run.slot, reachedBranches);
      }

      const unreached = [...allBranches].filter((b) => !reachedBranches.has(b)).sort();
      const expectedKeys = Object.keys(UNREACHED_OK).sort();

      expect(unreached).toEqual(expectedKeys);

      // 구조상 못 읽는 것 (coverage가 아닌 것): 12개 이하
      const structural = unreached.filter((k) => UNREACHED_OK[k]?.kind !== 'coverage');
      expect(structural.length).toBeLessThanOrEqual(12);

      // W7 쪽 coverage (ep005~ep013, interlude:final-memory): 0개
      const w7Coverage = unreached.filter((k) => {
        const isW7 = /^ep0(0[5-9]|1[0-3])#/.test(k) || k.startsWith('interlude:final-memory#');
        return isW7 && UNREACHED_OK[k]?.kind === 'coverage';
      });
      expect(w7Coverage).toHaveLength(0);

      // 1~4화 및 옛 막간 coverage: 6개 이하
      const legacyCoverage = unreached.filter((k) => {
        const isLegacy = /^ep00[1-4]#/.test(k) || k.startsWith('interlude:common-memory#') || k.startsWith('interlude:ep002-defeat#');
        return isLegacy && UNREACHED_OK[k]?.kind === 'coverage';
      });
      expect(legacyCoverage.length).toBeLessThanOrEqual(6);

      // 모든 why가 빈 문자열이 아님
      for (const k of unreached) {
        const entry = UNREACHED_OK[k];
        expect(entry).toBeDefined();
        expect(entry.why.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('W9 지문: PoC 1의 결과가 W9 전과 같다', () => {
    // W9(말투 표, 대화 장면, 구슬…)는 PoC 1에 영향을 주지 않아야 한다(W9 0.3). 지문은 W9의 엔진을 고치기 전에 잰 값이다.
    // 바뀌면 PoC 1의 글이 바뀐 것이다. 지문을 고치기 전에 사용자에게 묻는다.
    const fingerprint = (slots: readonly ReaderSlot[]) => createHash('sha256').update(JSON.stringify(slots)).digest('hex');
    it('가상 독자 6명', () => {
      expect(fingerprint(runs.map(({ run }) => run.slot))).toBe('a9b76355505ee78d2378f19518a649be67526b080c21101d09685a337f5f6f0e');
    });
    it('300번 훑기', () => {
      expect(fingerprint(sweepRuns.map((run) => run.slot))).toBe('d6edc6c0be1ef1c6012c6c23bb5f005a5bd7ba7b2e83d636288ceccd8bc451af');
    });
  });

  describe('W9 패턴 기준선: PoC 1은 새 기대를 걸지 않고, 지금보다 나빠지지 않는다', () => {
    // 잰 값(W9, 2026-10-20). PoC 1은 기능 시험용 축소판이라 대사가 적다(대사 비율 평균 약 0.2). PoC 2의 기준(bible/style.md)을 걸지 않는다
    const patternsOf = (slot: ReaderSlot) => slot.history.map((record) => ({ episodeId: record.episodeId, ...measureBound(record.bound), rewarded: true }));
    it.each(runs)('$persona.id: 대사 비율과 겨루기 길이가 기준선 그대로', ({ persona, run }) => {
      const summary = summarize(patternsOf(run.slot));
      if (process.env['POC1_PATTERN']) appendFileSync(process.env['POC1_PATTERN'], `${persona.id} ${summary.avgRatio.toFixed(4)} ${summary.maxClashChars} ${summary.chars}\n`);
      expect(summary.avgRatio).toBeGreaterThanOrEqual(PATTERN_BASELINE[persona.id].avgRatio);
      expect(summary.maxClashChars).toBeLessThanOrEqual(PATTERN_BASELINE[persona.id].maxClashChars);
    });
  });

  describe('R5: 결정론', () => {
    it.each(runs)('$persona.id ($persona.name) 재실행 시 슬롯 JSON이 동일', ({ persona, run }) => {
      const secondRun = playthrough(pack, persona);
      expect(JSON.stringify(secondRun.slot)).toBe(JSON.stringify(run.slot));
    });
  });

  describe('R6: 부재 동료의 침묵', () => {
    it('서하가 떠난 독자는 떠난 화의 막간과 다음 화부터 서하의 대사가 본문에 없다', () => {
      const leftRuns = runs.filter((r) => r.run.leftAt['seo-ha']);
      expect(leftRuns.length).toBeGreaterThan(0);

      for (const { run } of leftRuns) {
        const leaveEpId = run.leftAt['seo-ha'];
        const epIdx = run.slot.history.findIndex((h) => h.episodeId === leaveEpId);
        expect(epIdx).toBeGreaterThanOrEqual(0);

        // 그 화의 막간이 있으면 막간 문단 검사
        const leaveHistory = run.slot.history[epIdx];
        if (leaveHistory.interlude) {
          for (const p of leaveHistory.interlude.bound.paragraphs) {
            expect(p.speakerName).not.toBe('서하');
          }
        }

        // 그다음 화부터의 모든 본문과 막간 검사
        for (let i = epIdx + 1; i < run.slot.history.length; i += 1) {
          const h = run.slot.history[i];
          for (const p of h.bound.paragraphs) {
            expect(p.speakerName).not.toBe('서하');
          }
          if (h.interlude) {
            for (const p of h.interlude.bound.paragraphs) {
              expect(p.speakerName).not.toBe('서하');
            }
          }
        }
      }
    });

    it('사도연이 동행하지 않은 독자는 본문 전체에 사도연의 대사가 없다', () => {
      const nonSadoyeonRuns = runs.filter((r) => !(r.run.slot.party ?? []).includes('sa-doyeon'));
      expect(nonSadoyeonRuns.length).toBeGreaterThan(0);

      for (const { run } of nonSadoyeonRuns) {
        for (const h of run.slot.history) {
          for (const p of h.bound.paragraphs) {
            expect(p.speakerName).not.toBe('사도연');
          }
          if (h.interlude) {
            for (const p of h.interlude.bound.paragraphs) {
              expect(p.speakerName).not.toBe('사도연');
            }
          }
        }
      }
    });
  });

  describe('W8 도감', () => {
    const villainId = Object.keys(pack.startGrudges)[0];
    const ep4 = pack.episodes['ep004'];
    const ep4CompanionId = ep4?.cast.find((id) => id !== ep4.contest?.opponent);

    it.each(runs)('$persona.id ($persona.name) buildCodex가 던지지 않고 모든 분류의 known <= total', ({ run }) => {
      const codex = buildCodex(pack, run.slot);
      expect(codex.groups.length).toBeGreaterThan(0);
      for (const group of codex.groups) {
        expect(group.known).toBeLessThanOrEqual(group.total);
      }
    });

    it.each(runs)('$persona.id ($persona.name) owned인 속성 = 슬롯의 traitIds (집합으로 일치)', ({ run }) => {
      const codex = buildCodex(pack, run.slot);
      const ownedTraitEntries = codex.groups
        .filter((g) => g.id !== 'cast' && g.id !== 'combination')
        .flatMap((g) => g.entries)
        .filter((e) => e.state === 'owned')
        .map((e) => e.id);
      expect(new Set(ownedTraitEntries)).toEqual(new Set(run.slot.traitIds));
    });

    it.each(runs)('$persona.id ($persona.name) 기연(windfall)은 owned 아니면 unknown (seen 없음)', ({ run }) => {
      const codex = buildCodex(pack, run.slot);
      const memGroup = codex.groups.find((g) => g.id === 'memory');
      expect(memGroup).toBeDefined();
      for (const entry of memGroup!.entries) {
        const trait = pack.traits[entry.id];
        if (trait?.kind === 'windfall') {
          expect(entry.state).not.toBe('seen');
          expect(['owned', 'unknown']).toContain(entry.state);
        }
      }
    });

    it.each(runs)('$persona.id ($persona.name) 빌런과 4화 동료는 모두에게 owned(만났다)', ({ run }) => {
      const codex = buildCodex(pack, run.slot);
      const castGroup = codex.groups.find((g) => g.id === 'cast');
      expect(castGroup).toBeDefined();

      expect(villainId).toBeDefined();
      const villainEntry = castGroup!.entries.find((e) => e.id === villainId);
      expect(villainEntry?.state).toBe('owned');

      expect(ep4CompanionId).toBeDefined();
      const companionEntry = castGroup!.entries.find((e) => e.id === ep4CompanionId);
      expect(companionEntry?.state).toBe('owned');
    });
  });
});

