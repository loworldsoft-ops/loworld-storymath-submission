import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';
import type { ClashResult, ReaderSlot, StoryPack } from './narrative.model';
import { bindEpisode } from './narrative-bind';
import { settleCompanions } from './narrative-companion';
import { buyItem } from './narrative-shop';
import { createReaderSlot, protagonistRelation } from './narrative-state';

const contentDir = join(process.cwd(), 'loworld-content-wuxia/packs/wuxia-1');

describe.skipIf(!existsSync(contentDir))('콘텐츠 팩의 갈래 (W6-10)', () => {
  const { pack: rawPack, problems } = compilePack(contentDir);
  const pack = rawPack as StoryPack;

  const winClash: ClashResult = {
    episodeId: 'ep004',
    opponentId: 'ma-cheung',
    axis: 'might',
    tier: 'advantage',
    rounds: 3,
    finisherTraitId: null,
    usedTraitIds: [],
    untouched: false,
    auto: true,
    outcome: 'victory',
  };

  const loseClash: ClashResult = {
    ...winClash,
    outcome: 'defeat',
  };

  it('compilePack(contentDir).problems: 빈 배열', () => {
    expect(problems).toEqual([]);
  });

  it('새 슬롯: 돈 30, weapon item.broom', () => {
    const slot = createReaderSlot(pack, 's1', 'sword', '갑', 'seed1');
    expect(slot.silver).toBe(30);
    expect(slot.equipment?.weapon).toBe('item.broom');
  });

  it('buyItem: ok, 돈 0, helmet item.bamboo-hat', () => {
    const slot = createReaderSlot(pack, 's1', 'sword', '갑', 'seed1');
    const res = buyItem(slot, pack, 'shop.chores-peddler', 'item.bamboo-hat');
    expect(res.ok).toBe(true);
    expect(res.slot.silver).toBe(0);
    expect(res.slot.equipment?.helmet).toBe('item.bamboo-hat');
  });

  it('성향 -40인 슬롯에서 protagonistRelation speech는 mock 또는 roar', () => {
    let slot = createReaderSlot(pack, 's1', 'sword', '갑', 'seed1');
    slot = { ...slot, alignment: -40 };
    const speech = protagonistRelation(slot, pack, 'ma-cheung', 'might', 'none').speech;
    expect(['mock', 'roar']).toContain(speech);
  });

  it('서하가 동행 중이고 성향 -70인 슬롯에 settleCompanions: leave', () => {
    let slot = createReaderSlot(pack, 's1', 'sword', '갑', 'seed1');
    slot = { ...slot, alignment: -70, party: ['seo-ha'] };
    const res = settleCompanions(slot, pack);
    expect(res.events).toEqual([{ kind: 'leave', memberId: 'seo-ha' }]);
    expect(res.slot.party).not.toContain('seo-ha');
  });

  describe('4화 갈래 바인딩', () => {
    function findChoice(slot: ReaderSlot, clash: ClashResult, place: string): { choiceId: string | undefined; nextSlot: ReaderSlot } {
      const boundRes = bindEpisode({
        slot,
        pack,
        episode: pack.episodes['ep004'],
        clash,
        catharsis: 50,
        drawnTraitId: null,
      });
      const trace = boundRes.bound.paragraphs
        .flatMap((p) => p.traces)
        .find((t) => t.place === place || t.choiceId?.startsWith(place + '.'));
      return { choiceId: trace?.choiceId, nextSlot: boundRes.slot };
    }

    it('sword, 성향 0, 승리: 처분.1, 서하의마음.0, 성향 20, 서하 동행, 연애 1, 댕기 장착, weapon steel-sword, 달빛.0', () => {
      const slot = createReaderSlot(pack, 's-branch-1', 'sword', '갑', 'seed-b1');
      expect(slot.alignment).toBe(0);

      const boundRes = bindEpisode({
        slot,
        pack,
        episode: pack.episodes['ep004'],
        clash: winClash,
        catharsis: 50,
        drawnTraitId: null,
      });

      const traces = boundRes.bound.paragraphs.flatMap((p) => p.traces);
      const disposal = traces.find((t) => t.choiceId?.startsWith('처분.'))?.choiceId;
      const seoha = traces.find((t) => t.choiceId?.startsWith('서하의마음.'))?.choiceId;
      const moonlight = traces.find((t) => t.choiceId?.startsWith('달빛.'))?.choiceId;

      expect(disposal).toBe('처분.1');
      expect(seoha).toBe('서하의마음.0');
      expect(moonlight).toBe('달빛.0');

      const resultSlot = boundRes.slot;
      expect(resultSlot.alignment).toBe(20);
      expect(resultSlot.party).toContain('seo-ha');
      expect(resultSlot.romance).toEqual({ targetId: 'seo-ha', stage: 1 });
      expect(resultSlot.traitIds).toContain('item.seo-ha-ribbon');
      expect(resultSlot.equipment?.amulet).toBe('item.seo-ha-ribbon');
      expect(resultSlot.equipment?.weapon).toBe('item.steel-sword');
    });

    it('mind, 성향 0, 승리: 처분.2, 서하의마음.else, 성향 10, 서하 동행, 연애 없음', () => {
      const slot = createReaderSlot(pack, 's-branch-2', 'mind', '갑', 'seed-b2');
      expect(slot.alignment).toBe(0);

      const boundRes = bindEpisode({
        slot,
        pack,
        episode: pack.episodes['ep004'],
        clash: winClash,
        catharsis: 50,
        drawnTraitId: null,
      });

      const traces = boundRes.bound.paragraphs.flatMap((p) => p.traces);
      const disposal = traces.find((t) => t.choiceId?.startsWith('처분.'))?.choiceId;
      const seoha = traces.find((t) => t.choiceId?.startsWith('서하의마음.'))?.choiceId;

      expect(disposal).toBe('처분.2');
      expect(seoha).toBe('서하의마음.else');

      const resultSlot = boundRes.slot;
      expect(resultSlot.alignment).toBe(10);
      expect(resultSlot.party).toContain('seo-ha');
      expect(resultSlot.romance).toBeUndefined();
    });

    it('sword, 성향 -10, 승리: 처분.0, 서하의마음.1, 성향 -30, 서하 동행, 연애 없음', () => {
      let slot = createReaderSlot(pack, 's-branch-3', 'sword', '갑', 'seed-b3');
      slot = { ...slot, alignment: -10 };

      const boundRes = bindEpisode({
        slot,
        pack,
        episode: pack.episodes['ep004'],
        clash: winClash,
        catharsis: 50,
        drawnTraitId: null,
      });

      const traces = boundRes.bound.paragraphs.flatMap((p) => p.traces);
      const disposal = traces.find((t) => t.choiceId?.startsWith('처분.'))?.choiceId;
      const seoha = traces.find((t) => t.choiceId?.startsWith('서하의마음.'))?.choiceId;

      expect(disposal).toBe('처분.0');
      expect(seoha).toBe('서하의마음.1');

      const resultSlot = boundRes.slot;
      expect(resultSlot.alignment).toBe(-30);
      expect(resultSlot.party).toContain('seo-ha');
      expect(resultSlot.romance).toBeUndefined();
    });

    it('sword, 성향 0, 패배: 처분.else, 서하의마음.else, 성향 0, weapon 빗자루', () => {
      const slot = createReaderSlot(pack, 's-branch-4', 'sword', '갑', 'seed-b4');

      const boundRes = bindEpisode({
        slot,
        pack,
        episode: pack.episodes['ep004'],
        clash: loseClash,
        catharsis: 50,
        drawnTraitId: null,
      });

      const traces = boundRes.bound.paragraphs.flatMap((p) => p.traces);
      const disposal = traces.find((t) => t.choiceId?.startsWith('처분.'))?.choiceId;
      const seoha = traces.find((t) => t.choiceId?.startsWith('서하의마음.'))?.choiceId;

      expect(disposal).toBe('처분.else');
      expect(seoha).toBe('서하의마음.else');

      const resultSlot = boundRes.slot;
      expect(resultSlot.alignment).toBe(0);
      expect(resultSlot.equipment?.weapon).toBe('item.broom');
    });
  });
});
