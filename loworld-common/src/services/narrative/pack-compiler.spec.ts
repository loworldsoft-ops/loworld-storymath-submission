import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error - conventions pack-compiler is a .mjs script
import { compilePack } from '../../../conventions/content/pack-compiler.mjs';

function createTempPack(files: Record<string, string>): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'pack-compiler-test-'));
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = join(dir, relPath);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }
  return {
    dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const TRAIT_HEADER = 'id,kind,name,rarity,description,might,guard,wit,spirit,fortune,tags,phrases,source,requires,bonds,baneOpponent,baneMultiplier,icon,equip,price,alignment';
const CAST_HEADER = 'id,name,role,nature,might,guard,wit,spirit,bond,want,line,weakness,selfCall,call.hostile,call.cold,call.neutral,call.warm,call.trusting,habit,zone,lean';

function traitRow(o: { id: string; kind?: string; name?: string; might?: string; guard?: string; equip?: string; price?: string; alignment?: string }): string {
  const headerKeys = TRAIT_HEADER.split(',');
  const data: Record<string, string> = {
    id: o.id,
    kind: o.kind ?? 'item',
    name: o.name ?? o.id,
    rarity: 'common',
    description: '설명',
    might: o.might ?? '',
    guard: o.guard ?? '',
    source: 'draw',
    equip: o.equip ?? '',
    price: o.price ?? '',
    alignment: o.alignment ?? '',
  };
  return headerKeys.map((k) => data[k] ?? '').join(',');
}

function castRow(o: { id: string; name?: string; lean?: string }): string {
  const headerKeys = CAST_HEADER.split(',');
  const data: Record<string, string> = {
    id: o.id,
    name: o.name ?? o.id,
    role: 'ally',
    bond: '30',
    zone: 'zone.main',
    lean: o.lean ?? '',
  };
  return headerKeys.map((k) => data[k] ?? '').join(',');
}

const BASE_PACK_FILES = {
  'pack.json': JSON.stringify({
    id: 'test-pack',
    title: '테스트 팩',
    version: 1,
    origins: [],
    startTraits: [],
    startGrudges: {},
    episodes: ['ep001'],
    tuning: {},
  }),
  'map.json': JSON.stringify({
    zones: [{ id: 'zone.main', name: '마을', description: '', x: 0, y: 0, adjacent: [] }],
  }),
  'cast.csv': [
    CAST_HEADER,
    castRow({ id: 'seo-ha', name: '서하', lean: 'merciful' }),
  ].join('\n'),
  'traits.csv': [
    TRAIT_HEADER,
    traitRow({ id: 'sword', equip: 'weapon', price: '40', might: '5' }),
    traitRow({ id: 'pill', price: '15', guard: '5' }),
    traitRow({ id: 'p_kind', kind: 'personality', alignment: '10' }),
  ].join('\n'),
  'shops.json': JSON.stringify([
    { id: 'shop1', zone: 'zone.main', name: '잡화점', items: ['sword', 'pill'] },
  ]),
  'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

이야기가 시작된다.

[[장면]]

:::slot 장면
- else → 본문 { partyRemove: [seo-ha] }
:::
`,
};

describe('pack-compiler W6-2 검증', () => {
  it('새 열과 상점, partyRemove 효과가 올바르게 컴파일된다', () => {
    const { dir, cleanup } = createTempPack(BASE_PACK_FILES);
    try {
      const { pack, problems } = compilePack(dir);
      expect(problems).toEqual([]);

      // traits 새 열
      expect(pack.traits['sword'].equip).toBe('weapon');
      expect(pack.traits['sword'].price).toBe(40);
      expect(pack.traits['pill'].price).toBe(15);
      expect(pack.traits['pill'].equip).toBeUndefined();
      expect(pack.traits['p_kind'].alignment).toBe(10);

      // cast 새 열
      expect(pack.cast['seo-ha'].lean).toBe('merciful');

      // shops.json
      expect(pack.shops).toHaveLength(1);
      expect(pack.shops[0]).toEqual({
        id: 'shop1',
        zone: 'zone.main',
        name: '잡화점',
        items: ['sword', 'pill'],
      });

      // partyRemove 효과 파싱
      const variant = pack.episodes['ep001'].beats[0].slots['장면'].variants[0];
      expect(variant.effects?.partyRemove).toEqual(['seo-ha']);
    } finally {
      cleanup();
    }
  });

  it('traits.csv 및 cast.csv의 잘못된 값에 대해 문제를 보고한다', () => {
    const invalidFiles = {
      ...BASE_PACK_FILES,
      'traits.csv': [
        TRAIT_HEADER,
        traitRow({ id: 'bad-equip', equip: 'jetpack', price: '40' }),
        traitRow({ id: 'not-item-equip', kind: 'art', equip: 'weapon', price: '40' }),
        traitRow({ id: 'bad-price', price: 'abc' }),
        traitRow({ id: 'bad-align', kind: 'personality', alignment: 'xyz' }),
      ].join('\n'),
      'cast.csv': [
        CAST_HEADER,
        castRow({ id: 'bad-lean', name: '인물', lean: 'neutral' }),
      ].join('\n'),
    };
    const { dir, cleanup } = createTempPack(invalidFiles);
    try {
      const { problems } = compilePack(dir);
      expect(problems.some((p: string) => p.includes('bad-equip의 입는 자리를 모른다'))).toBe(true);
      expect(problems.some((p: string) => p.includes('not-item-equip는 아이템이 아닌데 입는 자리가 있다'))).toBe(true);
      expect(problems.some((p: string) => p.includes('bad-price의 값은 0 이상의 정수여야 한다'))).toBe(true);
      expect(problems.some((p: string) => p.includes('bad-align의 성향 값은 숫자여야 한다'))).toBe(true);
      expect(problems.some((p: string) => p.includes('bad-lean의 성향을 모른다'))).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('shops.json의 중복 id, 잘못된 구역, 없는 속성, 값 없는 물건을 검사한다', () => {
    const invalidShopsFiles = {
      ...BASE_PACK_FILES,
      'traits.csv': [
        TRAIT_HEADER,
        traitRow({ id: 'free-item' }),
      ].join('\n'),
      'shops.json': JSON.stringify([
        { id: 's1', zone: 'zone.invalid', name: '가게1', items: ['free-item', 'missing-item'] },
        { id: 's1', zone: 'zone.main', name: '중복가게', items: [] },
      ]),
    };
    const { dir, cleanup } = createTempPack(invalidShopsFiles);
    try {
      const { problems } = compilePack(dir);
      expect(problems.some((p: string) => p.includes('상점 id가 겹친다 — s1'))).toBe(true);
      expect(problems.some((p: string) => p.includes('zone.invalid'))).toBe(true);
      expect(problems.some((p: string) => p.includes('없는 속성 — missing-item'))).toBe(true);
      expect(problems.some((p: string) => p.includes('물건에 값이 없다 — free-item'))).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('효과의 equipment, party, partyRemove, romance 검증을 수행한다', () => {
    const invalidEffectsFiles = {
      ...BASE_PACK_FILES,
      'traits.csv': [
        TRAIT_HEADER,
        traitRow({ id: 'sword', equip: 'weapon', price: '40', might: '5' }),
        traitRow({ id: 'hat', equip: 'helmet', price: '30', guard: '5' }),
        traitRow({ id: 'pill', price: '15', guard: '5' }),
      ].join('\n'),
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문

[[장면]]

:::slot 장면
- else → 문장 { equipment: { badslot: sword, weapon: missing_item, armor: pill, offhand: hat }, party: [ghost_member], partyRemove: [phantom_member], romance: { seo-ha: 5, ghost_member: 1 } }
:::
`,
    };
    const { dir, cleanup } = createTempPack(invalidEffectsFiles);
    try {
      const { problems } = compilePack(dir);
      expect(problems.some((p: string) => p.includes('모르는 장비 칸 — badslot'))).toBe(true);
      expect(problems.some((p: string) => p.includes('장비에 없는 속성 — missing_item'))).toBe(true);
      expect(problems.some((p: string) => p.includes('pill는 입을 수 있는 속성이 아니다'))).toBe(true);
      expect(problems.some((p: string) => p.includes('offhand 칸에 맞지 않는 장비 종류 — helmet'))).toBe(true);
      expect(problems.some((p: string) => p.includes('없는 동료 — ghost_member'))).toBe(true);
      expect(problems.some((p: string) => p.includes('없는 동료 — phantom_member'))).toBe(true);
      expect(problems.some((p: string) => p.includes('없는 인물과의 연애 — ghost_member'))).toBe(true);
      expect(problems.some((p: string) => p.includes('연애 단계는 1~3이어야 한다 — 5'))).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('W7-1 CSV 칸 수 검사: 머리줄보다 칸이 많은 줄은 문제를 내고, 칸이 적은 줄은 허용한다', () => {
    const validTraitLine = traitRow({ id: 't1' });
    const overflowTraitLine = validTraitLine + ',extra';
    const underflowTraitLine = 't3,item,t3';
    const overflowCastLine = castRow({ id: 'c1' }) + ',extra';
    const speechHeader = 'id,situation,speech,speaker,when,text';
    const validSpeechLine = 's1,sit,plain,any,,대사';
    const overflowSpeechLine = 's2,sit,plain,any,,대사,extra';

    const testFiles = {
      ...BASE_PACK_FILES,
      'traits.csv': `${TRAIT_HEADER}\n${validTraitLine}\n${overflowTraitLine}\n${underflowTraitLine}\n`,
      'cast.csv': `${CAST_HEADER}\n${castRow({ id: 'seo-ha' })}\n${overflowCastLine}\n`,
      'speech.csv': `${speechHeader}\n${validSpeechLine}\n${overflowSpeechLine}\n`,
    };

    const { dir, cleanup } = createTempPack(testFiles);
    try {
      const { problems } = compilePack(dir);
      expect(problems).toContain('traits.csv 3번째 줄: 칸이 머리줄보다 많다 (22/21)');
      expect(problems.some((p: string) => p.includes('traits.csv 4번째 줄'))).toBe(false);
      expect(problems).toContain('cast.csv 3번째 줄: 칸이 머리줄보다 많다 (22/21)');
      expect(problems).toContain('speech.csv 3번째 줄: 칸이 머리줄보다 많다 (7/6)');
    } finally {
      cleanup();
    }
  });

  it('W7-2 companions: 화 머리말의 companions를 읽고 cast와의 관계 및 인물 존재 여부를 검사한다', () => {
    // 1. companions 유효 및 미지정 시 빈 배열
    const validFiles = {
      ...BASE_PACK_FILES,
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: []
companions: [seo-ha]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

이야기가 시작된다.

[[장면]]

:::slot 장면
- else → 본문
:::
`,
    };
    const { dir: dir1, cleanup: cleanup1 } = createTempPack(validFiles);
    try {
      const { pack, problems, notices } = compilePack(dir1);
      expect(problems).toEqual([]);
      expect(notices).toEqual([]);
      expect(pack.episodes['ep001'].companions).toEqual(['seo-ha']);
    } finally {
      cleanup1();
    }

    // 2. companions 생략 시 빈 배열
    const { dir: dir2, cleanup: cleanup2 } = createTempPack(BASE_PACK_FILES);
    try {
      const { pack, problems } = compilePack(dir2);
      expect(problems).toEqual([]);
      expect(pack.episodes['ep001'].companions).toEqual([]);
    } finally {
      cleanup2();
    }

    // 3. 없는 동료 (nobody)
    const missingCompanionFiles = {
      ...BASE_PACK_FILES,
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: []
companions: [nobody]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문

[[장면]]

:::slot 장면
- else → 본문
:::
`,
    };
    const { dir: dir3, cleanup: cleanup3 } = createTempPack(missingCompanionFiles);
    try {
      const { problems } = compilePack(dir3);
      expect(problems.some((p: string) => p.includes('없는 동료 — nobody'))).toBe(true);
    } finally {
      cleanup3();
    }

    // 4. cast와 companions에 함께 있음
    const bothCastAndCompanionFiles = {
      ...BASE_PACK_FILES,
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
companions: [seo-ha]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문

[[장면]]

:::slot 장면
- else → 본문
:::
`,
    };
    const { dir: dir4, cleanup: cleanup4 } = createTempPack(bothCastAndCompanionFiles);
    try {
      const { problems } = compilePack(dir4);
      expect(problems.some((p: string) => p.includes('cast와 companions에 함께 있다 — seo-ha'))).toBe(true);
    } finally {
      cleanup4();
    }
  });

  it('W7-2 draft: 임시 화 알림을 화 번호 순(막간 뒤)으로 생성한다', () => {
    // 1. 화 둘에 draft: true
    const draftFiles = {
      ...BASE_PACK_FILES,
      'pack.json': JSON.stringify({
        id: 'test-pack',
        title: '테스트 팩',
        version: 1,
        origins: [],
        startTraits: [],
        startGrudges: {},
        episodes: ['ep003', 'ep002'],
        tuning: {},
      }),
      'episodes/ep002.md': `---
id: ep002
number: 2
title: 둘째
zone: zone.main
draft: true
cast: []
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문

[[장면]]

:::slot 장면
- else → 본문
:::
`,
      'episodes/ep003.md': `---
id: ep003
number: 3
title: 셋째
zone: zone.main
draft: true
cast: []
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문

[[장면]]

:::slot 장면
- else → 본문
:::
`,
    };
    const { dir: dir1, cleanup: cleanup1 } = createTempPack(draftFiles);
    try {
      const { problems, notices } = compilePack(dir1);
      expect(problems).toEqual([]);
      expect(notices).toEqual(['임시 화 2개: ep002, ep003']);
    } finally {
      cleanup1();
    }

    // 2. draft 없음
    const { dir: dir2, cleanup: cleanup2 } = createTempPack(BASE_PACK_FILES);
    try {
      const { notices } = compilePack(dir2);
      expect(notices).toEqual([]);
    } finally {
      cleanup2();
    }
  });

  it('W7-2 빈 갈래 ∅: 슬롯 갈래가 ∅일 때 텍스트를 빈 문자열로 처리한다', () => {
    const emptyVariantFiles = {
      ...BASE_PACK_FILES,
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문

[[슬롯1]]
[[슬롯2]]

:::slot 슬롯1
- else → ∅
:::

:::slot 슬롯2
- has(sword) → ∅ { bond: { seo-ha: 5 } }
- else → 일반 대사
:::
`,
    };
    const { dir, cleanup } = createTempPack(emptyVariantFiles);
    try {
      const { pack, problems } = compilePack(dir);
      expect(problems).toEqual([]);
      const beat = pack.episodes['ep001'].beats[0];
      const slot1Else = beat.slots['슬롯1'].variants[0];
      expect(slot1Else.text).toBe('');

      const slot2When = beat.slots['슬롯2'].variants[0];
      expect(slot2When.text).toBe('');
      expect(slot2When.effects?.bond).toEqual({ 'seo-ha': 5 });
    } finally {
      cleanup();
    }
  });

  it('W7-2 슬롯 id 겹침: 한 파일 안에 같은 슬롯 id가 두 번 나오면 문제를 낸다', () => {
    const duplicateSlotFiles = {
      ...BASE_PACK_FILES,
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
draw: { pools: [], exclude: [], include: [] }
---

## 起 · setting

본문 1 [[처분]]

:::slot 처분
- else → 갈래 1
:::

## 承 · exchange

본문 2 [[처분]]

:::slot 처분
- else → 갈래 2
:::
`,
    };
    const { dir, cleanup } = createTempPack(duplicateSlotFiles);
    try {
      const { problems } = compilePack(dir);
      expect(problems.some((p: string) => p.includes('슬롯 id가 겹친다 — 처분'))).toBe(true);
    } finally {
      cleanup();
    }
  });

  it('시험용 고정 팩(__fixtures__/wuxia-1)을 묶으면 problems가 비어 있고 pack.shops가 []다', () => {
    const fixtureDir = join(__dirname, '__fixtures__/wuxia-1');
    const { pack, problems } = compilePack(fixtureDir);
    expect(problems).toEqual([]);
    expect(pack.shops).toEqual([]);
  });
});

describe('pack-compiler W9 검증', () => {
  const W9_TRAITS = [
    `${TRAIT_HEADER},sockets,letter,next`,
    `blade,item,검,common,설명,5,,,,,검,,draw,,,,,,weapon,,,2,,`,
    `robe,item,옷,common,설명,,5,,,,,,draw,,,,,,,,,3,,`,
    `bead.a,bead,가,low,설명,2,,,,,,,loot,,,,,,,,,,가,bead.b`,
    `bead.b,bead,나,mid,설명,,,,,,,,loot,,,,,,,,,,,bead.zz`,
    `bead.c,item,다,low,설명,,,,,,,,loot,,,,,,,,,,다,`,
  ].join('\n');

  it('W9 고정 팩(__fixtures__/w9-mini)을 묶으면 problems가 비어 있다', () => {
    const { pack, problems } = compilePack(join(__dirname, '__fixtures__/w9-mini'));
    expect(problems).toEqual([]);
    expect(pack.talks).toHaveLength(3);
    expect(pack.verses).toHaveLength(1);
    expect(pack.realms).toHaveLength(2);
    expect(Object.keys(pack.scenes)).toHaveLength(3);
  });

  it('팩에 말투 표가 없으면 기본 표를 넣는다', () => {
    const { dir, cleanup } = createTempPack(BASE_PACK_FILES);
    try {
      const { pack } = compilePack(dir);
      expect(pack.voice.length).toBeGreaterThan(5);
      expect(pack.voice[pack.voice.length - 1].speech).toBe('plain');
      expect(pack.moods[pack.moods.length - 1].emotion).toBe('calm');
    } finally {
      cleanup();
    }
  });

  it('구슬과 혈의 칸을 읽고 잘못된 것을 보고한다', () => {
    const { dir, cleanup } = createTempPack({ ...BASE_PACK_FILES, 'traits.csv': W9_TRAITS });
    try {
      const { pack, problems } = compilePack(dir);
      expect(pack.traits['blade'].sockets).toBe(2);
      expect(pack.traits['bead.a']).toMatchObject({ kind: 'bead', letter: '가', next: 'bead.b' });
      expect(problems).toEqual(expect.arrayContaining([
        'traits.csv: robe는 입는 아이템이 아닌데 혈이 있다',
        'traits.csv: 구슬 bead.b에 글자(letter)가 없다',
        'traits.csv: bead.c는 구슬이 아닌데 letter나 next가 있다',
        'traits.csv: bead.b의 next가 구슬이 아니다 — bead.zz',
      ]));
    } finally {
      cleanup();
    }
  });

  it('대사 줄, 대화 장면, 구결, 전리품, 장면, 경지, 사건 줄기, 새 조건과 효과를 검사한다', () => {
    const { dir, cleanup } = createTempPack({
      ...BASE_PACK_FILES,
      'traits.csv': W9_TRAITS,
      'pack.json': JSON.stringify({
        id: 'test-pack', title: 't', version: 1, origins: [], startTraits: [], startGrudges: {}, episodes: ['ep001'], tuning: {},
        realms: [{ id: 'realm.a', name: 'a', absorbed: 1 }, { id: 'realm.b', name: 'b', absorbed: 1 }],
        arcs: [{ id: 'arc.a', name: 'a' }],
      }),
      'verses.json': JSON.stringify([{ id: 'verse.a', beads: ['bead.a', 'blade'], equip: ['wand'], grant: ['nothing'] }]),
      'loot.json': JSON.stringify([{ id: 'loot.a', entries: [{ id: 'ghost', weight: 0 }, { id: 'bead.a', weight: 1, when: 'alignment(cruel)' }] }]),
      'scenes/absorb.bead.a.md': '흡수했다.',
      'scenes/wrong.key.md': '틀린 열쇠.',
      'talks/meal.md': `---
with: [nobody]
effects: { tie: { seo-ha+ghost: 5 }, absorb: [blade] }
---
@seo-ha[tease]: 하나
@seo-ha: 둘
@seo-ha: 셋
`,
      'episodes/ep001.md': `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
loot: { table: loot.none, count: 9 }
arc: arc.none
---

## 起 · setting

@ghost: 없는 사람.
@seo-ha[sing]: 모르는 말투.

본문에 적은 효과. { flag: [oops] }

[[talk:nothing]]

[[talk:meal:ghost|대체]]

[[갈래]]

:::slot 갈래
- resonance(seo-ha, loud) & tie(seo-ha, ghost, ~, x) & beads(bead.c) & verse(verse.none) & realm(realm.none) → 글
- else → 글
:::
`,
    });
    try {
      const { problems } = compilePack(dir);
      expect(problems).toEqual(expect.arrayContaining([
        '대화 장면 talk.meal: situation이 없다',
        '대화 장면 talk.meal: 없는 상대 — nobody',
        '대화 장면 talk.meal: 동료끼리의 인연은 두 인물이어야 한다 — ghost+seo-ha',
        '대화 장면 talk.meal: 없는 구슬을 흡수한다 — blade',
        '대화 장면 talk.meal: @seo-ha의 말투 갈래 무리에 대체 줄이 2개다 (하나까지)',
        '화 ep001: 없는 인물이 말한다 — @ghost',
        '화 ep001: 모르는 말투 — @seo-ha[sing]',
        '화 ep001: 대화 장면에 상황 "nothing"이 없고 대체 문장도 없다',
        '화 ep001: 대화 장면의 상대가 없다 — ghost',
        '화 ep001 슬롯 갈래: 공명은 resonant, neutral, dissonant 중 하나다 — loud',
        '화 ep001 슬롯 갈래: 없는 인물 — ghost',
        '화 ep001 슬롯 갈래: tie의 비교는 <, <=, >, >=, = 중 하나다 — ~',
        '화 ep001 슬롯 갈래: tie의 값은 수여야 한다 — x',
        '화 ep001 슬롯 갈래: 없는 구슬 — bead.c',
        '화 ep001 슬롯 갈래: 없는 구결 — verse.none',
        '화 ep001 슬롯 갈래: 없는 경지 — realm.none',
        'verses.json: verse.a 없는 구슬 — blade',
        'verses.json: verse.a 모르는 입는 자리 — wand',
        'verses.json: verse.a 없는 속성을 준다 — nothing',
        'loot.json: loot.a 없는 속성 — ghost',
        'loot.json: loot.a ghost의 무게는 0보다 커야 한다',
        'pack.json: 첫 경지 realm.a의 absorbed는 0이어야 한다',
        'pack.json: 경지 realm.b의 absorbed가 앞 경지보다 커야 한다',
        'scenes/wrong.key.md: 열쇠는 absorb.<구슬>, realm.<경지>, verse.<구결> 중 하나여야 한다',
        '화 ep001: 없는 전리품 표 — loot.none',
        '화 ep001: 전리품 수는 1~5다 — 9',
        '화 ep001: 없는 사건 줄기 — arc.none',
        '화 ep001: 효과가 슬롯 밖에 있다(글자로 나온다) — { flag: [oops] }',
      ]));
    } finally {
      cleanup();
    }
  });

  it('겨루기의 power를 읽고, 0 이하는 막는다', () => {
    const episode = (power: string) => `---
id: ep001
number: 1
title: 시작
zone: zone.main
cast: [seo-ha]
contest: { axis: wit, opponent: seo-ha, public: true, power: ${power} }
---

## 轉 · clash

겨뤘다.
`;
    const ok = createTempPack({ ...BASE_PACK_FILES, 'episodes/ep001.md': episode('60') });
    const bad = createTempPack({ ...BASE_PACK_FILES, 'episodes/ep001.md': episode('0') });
    try {
      expect(compilePack(ok.dir).pack.episodes['ep001'].contest).toEqual({ axis: 'wit', opponent: 'seo-ha', public: true, power: 60 });
      expect(compilePack(bad.dir).problems).toContain('화 ep001: 겨루기의 power는 0보다 큰 수여야 한다 — 0');
    } finally {
      ok.cleanup();
      bad.cleanup();
    }
  });
});
