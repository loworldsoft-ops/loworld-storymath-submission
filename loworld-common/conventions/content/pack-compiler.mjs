// 출처: LoworldUI/scripts/pack/pack-compiler.mjs (git: 764ef63fd45b0d697509998c4f9797a38dcf21ea)
// 팩 폴더(packs/<id>)를 읽어 앱이 쓰는 묶음 하나로 만든다.
// 형식: docs/10/2026-10-07/05-novel-reader-implementation-spec.md 6장
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 팩에 말투·감정 표가 없을 때 넣는 기본 표. W9 전의 엔진 코드와 똑같이 고른다(defaults/README.md) */
const DEFAULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'defaults');

const STAT_AXES = ['might', 'guard', 'wit', 'spirit', 'fortune'];
const STANCES = ['hostile', 'cold', 'neutral', 'warm', 'trusting'];
const BEAT_KINDS = ['setting', 'exchange', 'clash', 'aftermath', 'insight', 'hook'];
const SPEECHES = ['mock', 'bluster', 'probe', 'lecture', 'resolve', 'fawn', 'worry', 'roar', 'plain'];
const EMOTIONS = ['joy', 'anger', 'sorrow', 'fear', 'love', 'hate', 'desire', 'calm'];
const REGARDS = ['down', 'level', 'up'];
const SITUATIONS = ['belittled', 'prevailed', 'humbled', 'friend-at-risk', 'coveting', 'none'];
const ALIGNMENT_BANDS = ['cruel', 'neutral', 'merciful'];
const RESONANCE_LEVELS = ['resonant', 'neutral', 'dissonant'];
const COMPARE_OPS = ['<', '<=', '>', '>=', '='];
const CONDITION_OPS = {
  origin: 1, outcome: 1, tier: 1, finisher: 1, rounds: 1, untouched: 0, auto: 0, has: 1, tag: 1, combo: 1,
  card: 1, speech: 2, emotion: 2, stance: 2, regard: 2, catharsis: 1, flag: 1, versus: 1, axis: 1, episode: 1,
  alignment: 1, equipped: 1, party: 1, romance: 1,
  resonance: 2, tie: 4, bond: 3, beads: 1, absorbed: 1, verse: 1, realm: 1,
};
const EQUIP_KINDS = ['weapon', 'offhand', 'helmet', 'armor', 'gloves', 'boots', 'belt', 'amulet', 'ring'];
const EQUIPMENT_SLOTS = ['weapon', 'offhand', 'helmet', 'armor', 'gloves', 'boots', 'belt', 'amulet', 'ring1', 'ring2'];
const EQUIP_KIND_SLOTS = {
  weapon: ['weapon'], offhand: ['offhand'], helmet: ['helmet'], armor: ['armor'], gloves: ['gloves'],
  boots: ['boots'], belt: ['belt'], amulet: ['amulet'], ring: ['ring1', 'ring2'],
};
/** 다른 작품의 고유 명칭. 본문과 데이터에 있으면 안 된다. */
const FORBIDDEN_WORDS = [
  '디아블로', '안다리엘', '데커드', '호라드릭', '호라드림', '자매단', '카나이', '메피스토', '티리엘', '트리스트럼',
  'Diablo', 'Horadric', 'Andariel', 'Tristram',
];

// ── CSV ───────────────────────────────────────────────────────────────

export function parseCsv(text) {
  return parseCsvInternal(text).rows;
}

function parseCsvInternal(text, filename, problems) {
  const allRows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let lineNumber = 1;
  const lineNumbers = [];
  const source = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else {
        cell += char;
        if (char === '\n') lineNumber += 1;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell); cell = '';
    } else if (char === '\n') {
      row.push(cell);
      allRows.push(row);
      lineNumbers.push(lineNumber);
      row = [];
      cell = '';
      lineNumber += 1;
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    allRows.push(row);
    lineNumbers.push(lineNumber);
  }

  let headerIndex = -1;
  for (let i = 0; i < allRows.length; i += 1) {
    if (allRows[i].some((val) => val.trim() !== '')) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return { header: [], rows: [] };
  const header = allRows[headerIndex];
  const headerLen = header.length;

  const rows = [];
  for (let i = headerIndex + 1; i < allRows.length; i += 1) {
    const r = allRows[i];
    if (!r.some((val) => val.trim() !== '')) continue;
    const lineNum = lineNumbers[i];
    if (filename && problems && r.length > headerLen) {
      problems.push(`${filename} ${lineNum}번째 줄: 칸이 머리줄보다 많다 (${r.length}/${headerLen})`);
    }
    rows.push(Object.fromEntries(header.map((key, idx) => [key.trim(), (r[idx] ?? '').trim()])));
  }
  return { header, rows };
}

// ── 머리말의 값: 글, 숫자, [a, b], { a: b } ─────────────────────────────

export function parseValue(text) {
  const source = text.trim();
  let position = 0;
  const skip = () => { while (position < source.length && /\s/.test(source[position])) position += 1; };
  const scalar = (raw) => {
    const value = raw.trim();
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null' || value === '') return null;
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    return value.replace(/^['"]|['"]$/g, '');
  };
  const read = (stops) => {
    skip();
    if (source[position] === '[') {
      position += 1;
      const items = [];
      for (;;) {
        skip();
        if (source[position] === ']') { position += 1; break; }
        items.push(read(',]'));
        skip();
        if (source[position] === ',') position += 1;
        if (position >= source.length) break;
      }
      return items;
    }
    if (source[position] === '{') {
      position += 1;
      const result = {};
      for (;;) {
        skip();
        if (source[position] === '}') { position += 1; break; }
        let key = '';
        while (position < source.length && source[position] !== ':') { key += source[position]; position += 1; }
        position += 1;
        result[key.trim()] = read(',}');
        skip();
        if (source[position] === ',') position += 1;
        if (position >= source.length) break;
      }
      return result;
    }
    let raw = '';
    while (position < source.length && !stops.includes(source[position])) { raw += source[position]; position += 1; }
    return scalar(raw);
  };
  return read('');
}

// ── 조건: tier(overwhelm) & origin(sword) ───────────────────────────────

export function parseCondition(text, problems, where) {
  const source = text.trim();
  if (!source || source === 'else') return null;
  const parts = source.split('&').map((part) => part.trim()).filter(Boolean);
  const terms = parts.map((part) => {
    let negate = false;
    let body = part;
    if (body.startsWith('!')) { negate = true; body = body.slice(1).trim(); }
    const match = /^([a-z_]+)\(([^)]*)\)$/.exec(body);
    if (!match) {
      problems.push(`${where}: 조건을 읽을 수 없다 — "${part}"`);
      return { op: 'unknown', args: [] };
    }
    const [, op, rawArgs] = match;
    const args = rawArgs.split(',').map((arg) => arg.trim()).filter(Boolean);
    if (!(op in CONDITION_OPS)) problems.push(`${where}: 모르는 조건 — "${op}"`);
    else if (args.length < CONDITION_OPS[op]) problems.push(`${where}: 조건 ${op}에 값이 모자란다`);
    const term = { op, args };
    return negate ? { op: 'not', of: term } : term;
  });
  return terms.length === 1 ? terms[0] : { op: 'and', all: terms };
}

function parseEffects(value) {
  if (!value || typeof value !== 'object') return undefined;
  const effects = {};
  if (value.bond && typeof value.bond === 'object') effects.bond = Object.fromEntries(Object.entries(value.bond).map(([key, delta]) => [key, Number(delta)]));
  if (value.flag) effects.flag = [].concat(value.flag).map(String);
  if (value.grant) effects.grant = [].concat(value.grant).map(String);
  if (value.shown !== undefined) effects.shown = Number(value.shown);
  if (value.alignment !== undefined) effects.alignment = Number(value.alignment);
  if (value.equipment && typeof value.equipment === 'object') effects.equipment = value.equipment;
  if (value.partyRemove) effects.partyRemove = [].concat(value.partyRemove).map(String);
  if (value.party) effects.party = [].concat(value.party).map(String);
  if (value.romance && typeof value.romance === 'object') effects.romance = Object.fromEntries(Object.entries(value.romance).map(([k, v]) => [k, Number(v)]));
  if (value.tie && typeof value.tie === 'object') effects.tie = Object.fromEntries(Object.entries(value.tie).map(([key, delta]) => [tieKey(...key.split('+').map((part) => part.trim())), Number(delta)]));
  if (value.absorb) effects.absorb = [].concat(value.absorb).map(String);
  return Object.keys(effects).length ? effects : undefined;
}

/** 동료끼리의 인연의 열쇠. 엔진의 tieKey와 같다: 두 id를 사전순으로 `+`로 잇는다 */
function tieKey(a, b) {
  return [a ?? '', b ?? ''].sort().join('+');
}

// ── 화 파일 ───────────────────────────────────────────────────────────

function splitFrontMatter(text) {
  const source = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  if (!source.startsWith('---\n')) return { meta: {}, body: source };
  const end = source.indexOf('\n---', 4);
  if (end < 0) return { meta: {}, body: source };
  const meta = {};
  for (const line of source.slice(4, end).split('\n')) {
    const colon = line.indexOf(':');
    if (colon < 0 || !line.trim() || line.trim().startsWith('#')) continue;
    meta[line.slice(0, colon).trim()] = parseValue(line.slice(colon + 1));
  }
  return { meta, body: source.slice(end + 4) };
}

/** 본문을 장면으로 나눈다. `## 국면 · 종류`가 장면의 시작이고 `:::slot id` 블록이 슬롯이다. */
function parseBeats(body, problems, where, singleBeatKind) {
  const beats = [];
  let current = singleBeatKind ? { kind: singleBeatKind, phase: '', lines: [], slots: {} } : null;
  let slot = null;
  const seenSlots = new Set();
  for (const line of body.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading && !slot) {
      if (singleBeatKind) continue;
      if (current) beats.push(current);
      const [phase, kindRaw = ''] = heading[1].split('·').map((part) => part.trim());
      const kind = kindRaw.split(/\s|\(/)[0];
      if (!BEAT_KINDS.includes(kind)) problems.push(`${where}: 장면의 종류를 모른다 — "${heading[1]}"`);
      current = { kind, phase, lines: [], slots: {} };
      continue;
    }
    const open = /^:::slot\s+(\S+)\s*$/.exec(line);
    if (open) {
      if (!current) { problems.push(`${where}: 장면 밖에 슬롯이 있다 — ${open[1]}`); continue; }
      if (seenSlots.has(open[1])) {
        problems.push(`${where}: 슬롯 id가 겹친다 — ${open[1]}`);
      }
      seenSlots.add(open[1]);
      slot = { id: open[1], variants: [] };
      continue;
    }
    if (line.trim() === ':::' && slot) {
      if (!slot.variants.some((variant) => variant.when === null)) problems.push(`${where}: 슬롯 ${slot.id}에 대체 문장(else)이 없다`);
      current.slots[slot.id] = slot;
      slot = null;
      continue;
    }
    if (slot) {
      const item = /^-\s*(.+?)\s*(?:→|->)\s*(.+)$/.exec(line.trim());
      if (!item) { if (line.trim()) problems.push(`${where}: 슬롯 ${slot.id}의 줄을 읽을 수 없다 — "${line.trim()}"`); continue; }
      let text = item[2].trim();
      let effects;
      const tail = /\s\{\s*(?:bond|flag|grant|shown|alignment|equipment|partyRemove|party|romance|tie|absorb)\b.*\}\s*$/.exec(text);
      if (tail) { effects = parseEffects(parseValue(tail[0])); text = text.slice(0, tail.index).trim(); }
      if (text === '∅') text = '';
      const isElse = item[1].trim() === 'else';
      const variant = {
        id: `${slot.id}.${isElse ? 'else' : slot.variants.length}`,
        when: isElse ? null : parseCondition(item[1], problems, `${where} 슬롯 ${slot.id}`),
        text,
      };
      if (effects) variant.effects = effects;
      slot.variants.push(variant);
      continue;
    }
    if (current) current.lines.push(line);
    else if (line.trim()) problems.push(`${where}: 장면(##) 밖에 글이 있다 — "${line.trim().slice(0, 20)}"`);
  }
  if (slot) problems.push(`${where}: 슬롯 ${slot.id}가 닫히지 않았다(:::)`);
  if (current) beats.push(current);
  return beats.map((beat) => ({ kind: beat.kind, phase: beat.phase, text: beat.lines.join('\n').trim(), slots: beat.slots }));
}

function parseEpisodeFile(text, problems, where) {
  const { meta, body } = splitFrontMatter(text);
  const draw = meta.draw && typeof meta.draw === 'object' ? meta.draw : {};
  const contest = meta.contest && typeof meta.contest === 'object'
    ? { axis: meta.contest.axis === 'wit' ? 'wit' : 'might', opponent: String(meta.contest.opponent ?? ''), public: meta.contest.public === true }
    : null;
  if (contest && meta.contest.power !== undefined && meta.contest.power !== null) {
    if (typeof meta.contest.power !== 'number' || meta.contest.power <= 0) problems.push(`${where}: 겨루기의 power는 0보다 큰 수여야 한다 — ${meta.contest.power}`);
    else contest.power = meta.contest.power;
  }
  let loot = null;
  if (typeof meta.loot === 'string') loot = { table: meta.loot, count: 1 };
  else if (meta.loot && typeof meta.loot === 'object') loot = { table: String(meta.loot.table ?? ''), count: Number(meta.loot.count ?? 1) };
  return {
    id: String(meta.id ?? ''),
    number: Number(meta.number ?? 0),
    title: String(meta.title ?? ''),
    zone: String(meta.zone ?? ''),
    cast: [].concat(meta.cast ?? []).map(String),
    companions: [].concat(meta.companions ?? []).map(String),
    draft: meta.draft === true,
    draw: {
      pools: [].concat(draw.pools ?? []).map(String),
      exclude: [].concat(draw.exclude ?? []).map(String),
      include: [].concat(draw.include ?? []).map(String),
    },
    contest,
    reward: meta.reward ? String(meta.reward) : null,
    onDefeat: meta.onDefeat ? String(meta.onDefeat) : null,
    windfall: meta.windfall ? String(meta.windfall) : null,
    effects: parseEffects(meta.effects) ?? null,
    beats: parseBeats(body, problems, where, null),
    ...(loot ? { loot } : {}),
    ...(meta.arc ? { arc: String(meta.arc) } : {}),
  };
}

/** 대화 장면 파일: 머리말(상황, 상대, 조건, 효과) + 장면 하나 */
function parseTalkFile(text, problems, id) {
  const where = `대화 장면 ${id}`;
  const { meta, body } = splitFrontMatter(text);
  if (!meta.situation) problems.push(`${where}: situation이 없다`);
  const [beat] = parseBeats(body, problems, where, 'exchange');
  return {
    talk: {
      id,
      situation: String(meta.situation ?? ''),
      with: [].concat(meta.with ?? []).map(String),
      when: typeof meta.when === 'string' && meta.when ? parseCondition(meta.when, problems, where) : null,
      effects: parseEffects(meta.effects) ?? null,
      beat: beat ?? { kind: 'exchange', phase: '', text: '', slots: {} },
    },
    draft: meta.draft === true,
  };
}

// ── 표 ────────────────────────────────────────────────────────────────

function parsePairs(text, numeric) {
  const result = {};
  for (const part of (text ?? '').split(';')) {
    const [key, value] = part.split('=').map((entry) => entry?.trim());
    if (key && value !== undefined && value !== '') result[key] = numeric ? Number(value) : value;
  }
  return result;
}

function readTraits(rows, problems) {
  const traits = {};
  for (const row of rows) {
    if (!row.id) continue;
    if (traits[row.id]) problems.push(`traits.csv: 속성 id가 겹친다 — ${row.id}`);
    const stats = {};
    for (const axis of STAT_AXES) if (row[axis]) stats[axis] = Number(row[axis]);
    const trait = {
      id: row.id,
      kind: row.kind || 'item',
      name: row.name ?? '',
      rarity: row.rarity || 'common',
      description: row.description ?? '',
      stats,
      tags: (row.tags ?? '').split(';').map((tag) => tag.trim()).filter(Boolean),
      phrases: parsePairs(row.phrases, false),
      source: row.source || 'draw',
    };
    if (row.requires) trait.requires = row.requires;
    if (row.bonds) trait.bonds = parsePairs(row.bonds, true);
    if (row.baneOpponent) {
      trait.bane = { opponentId: row.baneOpponent, multiplier: Number(row.baneMultiplier || 2) };
      if (row.baneAxis) {
        if (!STAT_AXES.includes(row.baneAxis)) problems.push(`traits.csv: ${row.id}의 기연 축을 모른다 — ${row.baneAxis}`);
        else trait.bane.axis = row.baneAxis;
      }
    }
    if (row.icon) trait.icon = row.icon;
    if (row.equip) {
      if (!EQUIP_KINDS.includes(row.equip)) {
        problems.push(`traits.csv: ${row.id}의 입는 자리를 모른다 — ${row.equip}`);
      } else if (trait.kind !== 'item') {
        problems.push(`traits.csv: ${row.id}는 아이템이 아닌데 입는 자리가 있다`);
      } else {
        trait.equip = row.equip;
      }
    }
    if (row.price !== undefined && row.price !== '') {
      if (!/^\d+$/.test(row.price)) {
        problems.push(`traits.csv: ${row.id}의 값은 0 이상의 정수여야 한다 — ${row.price}`);
      } else {
        trait.price = Number(row.price);
      }
    }
    if (row.alignment !== undefined && row.alignment !== '') {
      if (!/^-?\d+(\.\d+)?$/.test(row.alignment)) {
        problems.push(`traits.csv: ${row.id}의 성향 값은 숫자여야 한다 — ${row.alignment}`);
      } else {
        trait.alignment = Number(row.alignment);
      }
    }
    if (row.sockets !== undefined && row.sockets !== '') {
      if (!/^[0-6]$/.test(row.sockets)) problems.push(`traits.csv: ${row.id}의 혈 수는 0~6이어야 한다 — ${row.sockets}`);
      else if (trait.kind !== 'item' || !trait.equip) problems.push(`traits.csv: ${row.id}는 입는 아이템이 아닌데 혈이 있다`);
      else if (Number(row.sockets) > 0) trait.sockets = Number(row.sockets);
    }
    if (row.letter) trait.letter = row.letter;
    if (row.next) trait.next = row.next;
    if (trait.kind === 'bead' && !trait.letter) problems.push(`traits.csv: 구슬 ${row.id}에 글자(letter)가 없다`);
    if (trait.kind !== 'bead' && (row.letter || row.next)) problems.push(`traits.csv: ${row.id}는 구슬이 아닌데 letter나 next가 있다`);
    traits[row.id] = trait;
  }
  return traits;
}

function readCast(rows, problems) {
  const cast = {};
  for (const row of rows) {
    if (!row.id) continue;
    if (cast[row.id]) problems.push(`cast.csv: 인물 id가 겹친다 — ${row.id}`);
    const stats = {};
    for (const axis of STAT_AXES) if (row[axis]) stats[axis] = Number(row[axis]);
    const calls = {};
    for (const stance of STANCES) if (row[`call.${stance}`]) calls[stance] = row[`call.${stance}`];
    cast[row.id] = {
      id: row.id,
      name: row.name ?? row.id,
      role: row.role ?? '',
      nature: (row.nature ?? '').split(';').map((entry) => entry.trim()).filter(Boolean),
      stats,
      bond: Number(row.bond || 0),
      want: row.want ?? '',
      line: row.line ?? '',
      weakness: row.weakness ?? '',
      selfCall: row.selfCall ?? '',
      calls,
      habit: row.habit ?? '',
      zone: row.zone ?? '',
    };
    if (row.lean) {
      if (row.lean !== 'merciful' && row.lean !== 'cruel') {
        problems.push(`cast.csv: ${row.id}의 성향을 모른다 — ${row.lean}`);
      } else {
        cast[row.id].lean = row.lean;
      }
    }
  }
  return cast;
}

function readSpeech(rows, problems, speeches = SPEECHES) {
  return rows.filter((row) => row.situation && row.text).map((row, index) => {
    if (row.speech && !speeches.includes(row.speech)) problems.push(`speech.csv ${index + 2}번째 줄: 모르는 말투 — ${row.speech}`);
    return {
      id: `sp${index + 1}`,
      situation: row.situation,
      speech: row.speech ?? '',
      speaker: row.speaker || 'any',
      when: row.when ? parseCondition(row.when, problems, `speech.csv ${index + 2}번째 줄`) : null,
      text: row.text,
    };
  });
}

const list = (cell) => (cell ?? '').split(';').map((entry) => entry.trim()).filter(Boolean);

function readVoice(rows, problems, file) {
  return rows.filter((row) => row.speech).map((row) => {
    if (row.who && row.who !== 'protagonist' && row.who !== 'member') problems.push(`${file}: who는 protagonist나 member여야 한다 — ${row.who}`);
    list(row.alignment).forEach((band) => ALIGNMENT_BANDS.includes(band) || problems.push(`${file}: 모르는 성향 구간 — ${band}`));
    list(row.emotion).forEach((value) => EMOTIONS.includes(value) || problems.push(`${file}: 모르는 감정 — ${value}`));
    list(row.stance).forEach((value) => STANCES.includes(value) || problems.push(`${file}: 모르는 태도 — ${value}`));
    list(row.regard).forEach((value) => REGARDS.includes(value) || problems.push(`${file}: 모르는 눈높이 — ${value}`));
    return { who: row.who ?? '', alignment: list(row.alignment), cards: list(row.card), emotions: list(row.emotion), stances: list(row.stance), regards: list(row.regard), speech: row.speech };
  });
}

function readMoods(rows, problems, file) {
  return rows.filter((row) => row.emotion).map((row) => {
    if (!EMOTIONS.includes(row.emotion)) problems.push(`${file}: 모르는 감정 — ${row.emotion}`);
    list(row.situation).forEach((value) => SITUATIONS.includes(value) || problems.push(`${file}: 모르는 상황 — ${value}`));
    list(row.regard).forEach((value) => REGARDS.includes(value) || problems.push(`${file}: 모르는 눈높이 — ${value}`));
    if (row.bond && !/^-?\d+$/.test(row.bond)) problems.push(`${file}: bond는 정수여야 한다 — ${row.bond}`);
    return { situations: list(row.situation), cards: list(row.card), regards: list(row.regard), bond: row.bond ? Number(row.bond) : null, emotion: row.emotion };
  });
}

/** 기본 말투·감정 표. 손으로 만든 시험 팩이 팩 도구를 거친 팩과 같은 말투를 얻게 한다 */
export function defaultVoiceTables() {
  const problems = [];
  const rows = (name) => parseCsvInternal(readText(join(DEFAULTS_DIR, name)), name, problems).rows;
  return { voice: readVoice(rows('voice.csv'), problems, 'voice.csv'), moods: readMoods(rows('moods.csv'), problems, 'moods.csv') };
}

// ── 검사 ──────────────────────────────────────────────────────────────

function conditionRefs(condition, visit) {
  if (!condition) return;
  if (condition.op === 'and') condition.all.forEach((entry) => conditionRefs(entry, visit));
  else if (condition.op === 'not') conditionRefs(condition.of, visit);
  else visit(condition);
}

function checkPack(pack, problems, speeches = SPEECHES) {
  const hasTrait = (id) => !!pack.traits[id];
  const hasPerson = (id) => id === 'protagonist' || !!pack.cast[id];
  const hasOrigin = (id) => pack.origins.some((origin) => origin.id === id);
  const hasCombo = (id) => pack.combinations.some((combo) => combo.id === id);
  const isBead = (id) => pack.traits[id]?.kind === 'bead';
  const hasVerse = (id) => pack.verses.some((verse) => verse.id === id);
  const hasRealm = (id) => pack.realms.some((realm) => realm.id === id);
  const isNumber = (text) => /^-?\d+(\.\d+)?$/.test(text ?? '');

  const checkCondition = (condition, where) => conditionRefs(condition, ({ op, args }) => {
    if (op === 'origin') args.forEach((id) => hasOrigin(id) || problems.push(`${where}: 없는 갈래 — ${id}`));
    if (op === 'has' || op === 'finisher' || op === 'card') args.forEach((id) => hasTrait(id) || problems.push(`${where}: 없는 속성 — ${id}`));
    if (op === 'combo') hasCombo(args[0]) || problems.push(`${where}: 없는 조합 — ${args[0]}`);
    if (op === 'versus') args.forEach((id) => hasPerson(id) || problems.push(`${where}: 없는 인물 — ${id}`));
    if (['speech', 'emotion', 'stance', 'regard'].includes(op)) hasPerson(args[0]) || problems.push(`${where}: 없는 인물 — ${args[0]}`);
    if (op === 'speech') args.slice(1).forEach((value) => speeches.includes(value) || problems.push(`${where}: 모르는 말투 — ${value}`));
    if (op === 'stance') args.slice(1).forEach((value) => STANCES.includes(value) || problems.push(`${where}: 모르는 태도 — ${value}`));
    if (op === 'resonance') {
      args.slice(0, -1).forEach((id) => hasPerson(id) || problems.push(`${where}: 없는 인물 — ${id}`));
      if (!RESONANCE_LEVELS.includes(args[args.length - 1])) problems.push(`${where}: 공명은 resonant, neutral, dissonant 중 하나다 — ${args[args.length - 1]}`);
    }
    if (op === 'tie' || op === 'bond') {
      const people = op === 'tie' ? args.slice(0, 2) : args.slice(0, 1);
      const [compare, value] = op === 'tie' ? args.slice(2) : args.slice(1);
      people.forEach((id) => hasPerson(id) || problems.push(`${where}: 없는 인물 — ${id}`));
      if (!COMPARE_OPS.includes(compare)) problems.push(`${where}: ${op}의 비교는 <, <=, >, >=, = 중 하나다 — ${compare}`);
      if (!isNumber(value)) problems.push(`${where}: ${op}의 값은 수여야 한다 — ${value}`);
    }
    if (op === 'beads' || op === 'absorbed') isBead(args[0]) || problems.push(`${where}: 없는 구슬 — ${args[0]}`);
    if (op === 'beads' && args[1] !== undefined && !isNumber(args[1])) problems.push(`${where}: beads의 수가 수가 아니다 — ${args[1]}`);
    if (op === 'verse') hasVerse(args[0]) || problems.push(`${where}: 없는 구결 — ${args[0]}`);
    if (op === 'realm') hasRealm(args[0]) || problems.push(`${where}: 없는 경지 — ${args[0]}`);
  });

  const checkEffects = (effects, where) => {
    if (!effects) return;
    (effects.grant ?? []).forEach((id) => hasTrait(id) || problems.push(`${where}: 없는 속성을 준다 — ${id}`));
    (effects.absorb ?? []).forEach((id) => isBead(id) || problems.push(`${where}: 없는 구슬을 흡수한다 — ${id}`));
    for (const key of Object.keys(effects.tie ?? {})) {
      const people = key.split('+');
      if (people.length !== 2 || people.some((id) => !pack.cast[id])) problems.push(`${where}: 동료끼리의 인연은 두 인물이어야 한다 — ${key}`);
    }
    Object.keys(effects.bond ?? {}).forEach((id) => hasPerson(id) || problems.push(`${where}: 없는 인물의 유대 — ${id}`));
    if (effects.equipment) {
      for (const [slot, itemId] of Object.entries(effects.equipment)) {
        if (!EQUIPMENT_SLOTS.includes(slot)) {
          problems.push(`${where}: 모르는 장비 칸 — ${slot}`);
          continue;
        }
        const trait = pack.traits[itemId];
        if (!trait) {
          problems.push(`${where}: 장비에 없는 속성 — ${itemId}`);
        } else if (!trait.equip) {
          problems.push(`${where}: ${itemId}는 입을 수 있는 속성이 아니다`);
        } else if (!EQUIP_KIND_SLOTS[trait.equip]?.includes(slot)) {
          problems.push(`${where}: ${slot} 칸에 맞지 않는 장비 종류 — ${trait.equip}`);
        }
      }
    }
    for (const memberId of (effects.party ?? [])) {
      if (!pack.cast[memberId]) problems.push(`${where}: 없는 동료 — ${memberId}`);
    }
    for (const memberId of (effects.partyRemove ?? [])) {
      if (!pack.cast[memberId]) problems.push(`${where}: 없는 동료 — ${memberId}`);
    }
    if (effects.romance && typeof effects.romance === 'object') {
      const entries = effects.romance.targetId !== undefined
        ? [[effects.romance.targetId, effects.romance.stage]]
        : Object.entries(effects.romance);
      for (const [targetId, stage] of entries) {
        if (!pack.cast[targetId]) problems.push(`${where}: 없는 인물과의 연애 — ${targetId}`);
        const numStage = Number(stage);
        if (![1, 2, 3].includes(numStage)) problems.push(`${where}: 연애 단계는 1~3이어야 한다 — ${stage}`);
      }
    }
  };

  const situations = new Set(pack.speech.map((line) => line.situation));
  const talkSituations = new Set(pack.talks.map((talk) => talk.situation));
  /** 대사 줄(`@화자[말투]: 대사`)의 화자와 말투, 그리고 무리 규칙: `[ ]` 줄이 있는 무리에 대체 줄은 하나까지 */
  const checkLines = (text, where) => {
    let run = null;
    const closeRun = () => {
      if (run && run.bracketed > 0 && run.plain > 1) problems.push(`${where}: @${run.speaker}의 말투 갈래 무리에 대체 줄이 ${run.plain}개다 (하나까지)`);
      run = null;
    };
    for (const raw of text.split(/\n\s*\n/)) {
      const source = raw.trim();
      if (!source) continue;
      if (!source.startsWith('@')) { closeRun(); continue; }
      for (const entry of source.split(/\n(?=\s*@)/)) {
        const line = /^@([^\s[\]:()]+)(?:\(([^)]*)\))?(?:\[([^\]]*)\])?:\s*([\s\S]*)$/.exec(entry.trim());
        if (!line) { problems.push(`${where}: 대사 줄을 읽을 수 없다 — "${entry.trim().slice(0, 20)}"`); continue; }
        const [, speaker, toward, bracket, said] = line;
        if (!hasPerson(speaker)) problems.push(`${where}: 없는 인물이 말한다 — @${speaker}`);
        if (toward !== undefined && !hasPerson(toward.trim())) problems.push(`${where}: @${speaker}의 말이 향하는 인물이 없다 — ${toward}`);
        if (!said.trim()) problems.push(`${where}: @${speaker}의 대사가 비었다`);
        if (bracket !== undefined) list(bracket.replace(/,/g, ';')).forEach((speech) => speeches.includes(speech) || problems.push(`${where}: 모르는 말투 — @${speaker}[${speech}]`));
        if (!run || run.speaker !== speaker || run.toward !== (toward ?? null)) { closeRun(); run = { speaker, toward: toward ?? null, bracketed: 0, plain: 0 }; }
        if (bracket !== undefined) run.bracketed += 1; else run.plain += 1;
      }
    }
    closeRun();
  };
  const checkBeats = (beats, where) => {
    for (const beat of beats) {
      checkLines(beat.text, where);
      // 효과는 슬롯 갈래의 꼬리에만 붙는다. 본문에 적으면 글자로 그대로 나온다.
      for (const match of beat.text.matchAll(/\{\s*(bond|flag|grant|shown|alignment|equipment|partyRemove|party|romance|tie|absorb)\s*:[^}]*\}/g)) {
        problems.push(`${where}: 효과가 슬롯 밖에 있다(글자로 나온다) — ${match[0].slice(0, 40)}`);
      }
      for (const match of beat.text.matchAll(/\[\[([^\]]+)\]\]/g)) {
        const inner = match[1];
        if (inner.startsWith('talk:')) {
          const [head, fallback] = inner.slice('talk:'.length).split('|');
          const [situation, partner] = head.split(':').map((part) => part?.trim());
          if (!talkSituations.has(situation) && fallback === undefined) problems.push(`${where}: 대화 장면에 상황 "${situation}"이 없고 대체 문장도 없다`);
          if (partner && !hasPerson(partner)) problems.push(`${where}: 대화 장면의 상대가 없다 — ${partner}`);
        } else if (inner.startsWith('say:')) {
          const [, speaker, rest = ''] = inner.split(':');
          const [situation, fallback] = rest.split('|');
          if (!hasPerson(speaker)) problems.push(`${where}: 없는 인물이 말한다 — ${speaker}`);
          if (!situations.has(situation.trim()) && fallback === undefined) problems.push(`${where}: 대화 표에 상황 "${situation.trim()}"의 줄이 없고 대체 대사도 없다`);
        } else if (!beat.slots[inner.trim()]) {
          problems.push(`${where}: 본문이 가리키는 슬롯이 없다 — ${inner}`);
        }
      }
      for (const slot of Object.values(beat.slots)) {
        if (!beat.text.includes(`[[${slot.id}]]`)) problems.push(`${where}: 슬롯 ${slot.id}를 본문이 쓰지 않는다`);
        slot.variants.forEach((variant) => {
          checkCondition(variant.when, `${where} 슬롯 ${slot.id}`);
          checkEffects(variant.effects, `${where} 슬롯 ${slot.id}`);
        });
      }
    }
  };

  for (const origin of pack.origins) origin.traits.forEach((id) => hasTrait(id) || problems.push(`pack.json: 갈래 ${origin.id}의 시작 속성이 없다 — ${id}`));
  pack.startTraits.forEach((id) => hasTrait(id) || problems.push(`pack.json: 시작 속성이 없다 — ${id}`));
  Object.keys(pack.startGrudges).forEach((id) => hasPerson(id) || problems.push(`pack.json: 시작 원한의 인물이 없다 — ${id}`));
  for (const trait of Object.values(pack.traits)) {
    if (trait.requires && !hasTrait(trait.requires)) problems.push(`traits.csv: ${trait.id}가 요구하는 속성이 없다 — ${trait.requires}`);
    if (trait.bane && !hasPerson(trait.bane.opponentId)) problems.push(`traits.csv: ${trait.id}가 듣는 상대가 없다 — ${trait.bane.opponentId}`);
    Object.keys(trait.bonds ?? {}).forEach((id) => hasPerson(id) || problems.push(`traits.csv: ${trait.id}의 유대 상대가 없다 — ${id}`));
    if (trait.kind !== 'personality' && !trait.name) problems.push(`traits.csv: ${trait.id}에 이름이 없다`);
  }
  for (const combo of pack.combinations) combo.requires.forEach((id) => hasTrait(id) || problems.push(`combinations.json: ${combo.id}가 요구하는 속성이 없다 — ${id}`));
  pack.speech.forEach((line) => {
    const speaker = line.speaker;
    if (speaker !== 'any' && !speaker.startsWith('role:') && !hasPerson(speaker)) problems.push(`speech.csv: 없는 인물 — ${speaker}`);
    checkCondition(line.when, `speech.csv(${line.id})`);
  });
  for (const id of pack.episodeOrder) if (!pack.episodes[id]) problems.push(`pack.json: 화 파일이 없다 — ${id}`);
  const zoneIds = new Set(pack.zones.map((zone) => zone.id));
  for (const [kind, episodes] of [['화', pack.episodes], ['막간', pack.interludes]]) {
    for (const episode of Object.values(episodes)) {
      const where = `${kind} ${episode.id}`;
      episode.cast.forEach((id) => hasPerson(id) || problems.push(`${where}: 없는 인물 — ${id}`));
      for (const companion of (episode.companions ?? [])) {
        if (companion === 'protagonist' || !pack.cast[companion]) {
          problems.push(`${where}: 없는 동료 — ${companion}`);
        }
        if (episode.cast.includes(companion)) {
          problems.push(`${where}: cast와 companions에 함께 있다 — ${companion}`);
        }
      }
      if (episode.zone && !zoneIds.has(episode.zone)) problems.push(`${where}: 없는 구역 — ${episode.zone}`);
      if (episode.contest && !hasPerson(episode.contest.opponent)) problems.push(`${where}: 겨루는 상대가 없다 — ${episode.contest.opponent}`);
      for (const id of [episode.reward, episode.windfall, ...episode.draw.include, ...episode.draw.exclude]) if (id && !hasTrait(id)) problems.push(`${where}: 없는 속성 — ${id}`);
      if (episode.windfall && pack.traits[episode.windfall] && !pack.traits[episode.windfall].bane) problems.push(`${where}: 기연 ${episode.windfall}에 듣는 상대(baneOpponent)가 없다`);
      if (episode.onDefeat && !pack.interludes[episode.onDefeat]) problems.push(`${where}: 막간 파일이 없다 — ${episode.onDefeat}`);
      if (kind === '화' && episode.contest && !episode.beats.some((beat) => beat.kind === 'clash')) problems.push(`${where}: 겨루기가 있는데 clash 장면이 없다`);
      if (episode.beats.length === 0) problems.push(`${where}: 장면이 없다`);
      if (episode.effects) checkEffects(episode.effects, `${where}`);
      checkBeats(episode.beats, where);
    }
  }
  for (const [traitId, beat] of Object.entries(pack.gainScenes)) {
    if (!hasTrait(traitId)) problems.push(`origins/${traitId}.md: 그런 속성이 없다`);
    checkBeats([beat], `얻는 장면 ${traitId}`);
  }
  // ── W9: 대화 장면, 구슬, 구결, 전리품, 장면, 경지, 사건 줄기 ──
  const talkIds = new Set();
  for (const talk of pack.talks) {
    const where = `대화 장면 ${talk.id}`;
    if (talkIds.has(talk.id)) problems.push(`${where}: id가 겹친다`);
    talkIds.add(talk.id);
    talk.with.forEach((id) => (pack.cast[id] || problems.push(`${where}: 없는 상대 — ${id}`)));
    checkCondition(talk.when, where);
    checkEffects(talk.effects, where);
    if (!talk.beat.text) problems.push(`${where}: 본문이 없다`);
    checkBeats([talk.beat], where);
  }
  for (const trait of Object.values(pack.traits)) {
    if (trait.next && !isBead(trait.next)) problems.push(`traits.csv: ${trait.id}의 next가 구슬이 아니다 — ${trait.next}`);
    if (trait.next === trait.id) problems.push(`traits.csv: ${trait.id}의 next가 자기 자신이다`);
  }
  const verseIds = new Set();
  for (const verse of pack.verses) {
    const where = `verses.json: ${verse.id}`;
    if (verseIds.has(verse.id)) problems.push(`${where} id가 겹친다`);
    verseIds.add(verse.id);
    if (verse.beads.length === 0) problems.push(`${where} 구슬이 없다`);
    verse.beads.forEach((id) => isBead(id) || problems.push(`${where} 없는 구슬 — ${id}`));
    verse.equip.forEach((kind) => EQUIP_KINDS.includes(kind) || problems.push(`${where} 모르는 입는 자리 — ${kind}`));
    verse.grant.forEach((id) => hasTrait(id) || problems.push(`${where} 없는 속성을 준다 — ${id}`));
  }
  const lootIds = new Set();
  for (const table of pack.loot) {
    const where = `loot.json: ${table.id}`;
    if (lootIds.has(table.id)) problems.push(`${where} id가 겹친다`);
    lootIds.add(table.id);
    for (const entry of table.entries) {
      if (!hasTrait(entry.id)) problems.push(`${where} 없는 속성 — ${entry.id}`);
      if (!(entry.weight > 0)) problems.push(`${where} ${entry.id}의 무게는 0보다 커야 한다`);
      checkCondition(entry.when, where);
    }
  }
  pack.realms.forEach((realm, index) => {
    if (index === 0 && realm.absorbed !== 0) problems.push(`pack.json: 첫 경지 ${realm.id}의 absorbed는 0이어야 한다`);
    if (index > 0 && realm.absorbed <= pack.realms[index - 1].absorbed) problems.push(`pack.json: 경지 ${realm.id}의 absorbed가 앞 경지보다 커야 한다`);
  });
  for (const [key, beat] of Object.entries(pack.scenes)) {
    const [kind, ...rest] = key.split('.');
    const id = rest.join('.');
    const ok = (kind === 'absorb' && isBead(id)) || (kind === 'realm' && hasRealm(id)) || (kind === 'verse' && hasVerse(id));
    if (!ok) problems.push(`scenes/${key}.md: 열쇠는 absorb.<구슬>, realm.<경지>, verse.<구결> 중 하나여야 한다`);
    checkBeats([beat], `장면 ${key}`);
  }
  const arcIds = new Set(pack.arcs.map((arc) => arc.id));
  for (const [kind, episodes] of [['화', pack.episodes], ['막간', pack.interludes]]) {
    for (const episode of Object.values(episodes)) {
      if (episode.loot && !lootIds.has(episode.loot.table)) problems.push(`${kind} ${episode.id}: 없는 전리품 표 — ${episode.loot.table}`);
      if (episode.loot && !(episode.loot.count >= 1 && episode.loot.count <= 5)) problems.push(`${kind} ${episode.id}: 전리품 수는 1~5다 — ${episode.loot.count}`);
      if (episode.arc && !arcIds.has(episode.arc)) problems.push(`${kind} ${episode.id}: 없는 사건 줄기 — ${episode.arc}`);
    }
  }
  for (const shop of (pack.shops ?? [])) {
    for (const itemId of (shop.items ?? [])) if (pack.traits[itemId] && pack.traits[itemId].kind !== 'item' && !isBead(itemId)) problems.push(`shops.json: 상점 ${shop.id}는 아이템과 구슬만 판다 — ${itemId}`);
  }
  const shopIds = new Set();
  for (const shop of (pack.shops ?? [])) {
    if (shopIds.has(shop.id)) problems.push(`shops.json: 상점 id가 겹친다 — ${shop.id}`);
    shopIds.add(shop.id);
    if (!zoneIds.has(shop.zone)) problems.push(`shops.json: 상점 ${shop.id}의 구역이 map.json에 없다 — ${shop.zone}`);
    for (const itemId of (shop.items ?? [])) {
      const trait = pack.traits[itemId];
      if (!trait) {
        problems.push(`shops.json: 상점 ${shop.id}에 없는 속성 — ${itemId}`);
      } else if (trait.price === undefined) {
        problems.push(`shops.json: 상점 ${shop.id}의 물건에 값이 없다 — ${itemId}`);
      }
    }
  }
  const text = JSON.stringify(pack);
  for (const word of FORBIDDEN_WORDS) if (text.includes(word)) problems.push(`금지 낱말이 있다 — ${word}`);
}

// ── 묶기 ──────────────────────────────────────────────────────────────

function readText(path) { return readFileSync(path, 'utf8'); }
function listMarkdown(dir) { return existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')).sort() : []; }

/** 팩 폴더를 읽어 묶음과 문제 목록을 낸다. 문제가 있어도 묶음은 만든다. */
export function compilePack(packDir) {
  const problems = [];
  const notices = [];
  const meta = JSON.parse(readText(join(packDir, 'pack.json')));
  const readJson = (name, fallback) => (existsSync(join(packDir, name)) ? JSON.parse(readText(join(packDir, name))) : fallback);
  const readRows = (name) => (existsSync(join(packDir, name)) ? parseCsvInternal(readText(join(packDir, name)), name, problems).rows : []);

  const episodes = {};
  const draftEpisodes = [];
  for (const name of listMarkdown(join(packDir, 'episodes'))) {
    const id = name.replace(/\.md$/, '');
    const episode = parseEpisodeFile(readText(join(packDir, 'episodes', name)), problems, `화 ${id}`);
    if (!episode.id) episode.id = id;
    if (episode.draft) draftEpisodes.push(episode);
    delete episode.draft;
    episodes[episode.id] = episode;
  }
  const interludes = {};
  const draftInterludes = [];
  for (const name of listMarkdown(join(packDir, 'interludes'))) {
    const id = name.replace(/\.md$/, '');
    const interlude = parseEpisodeFile(readText(join(packDir, 'interludes', name)), problems, `막간 ${id}`);
    interlude.id = id;
    if (interlude.draft) draftInterludes.push(interlude);
    delete interlude.draft;
    interludes[interlude.id] = interlude;
  }
  draftEpisodes.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  draftInterludes.sort((a, b) => a.id.localeCompare(b.id));
  const draftList = [
    ...draftEpisodes.map((e) => e.id),
    ...draftInterludes.map((i) => i.id),
  ];
  if (draftList.length > 0) {
    notices.push(`임시 화 ${draftList.length}개: ${draftList.join(', ')}`);
  }

  const gainScenes = {};
  for (const name of listMarkdown(join(packDir, 'origins'))) {
    const { body } = splitFrontMatter(readText(join(packDir, 'origins', name)));
    const [beat] = parseBeats(body, problems, `origins/${name}`, 'insight');
    if (beat?.text) gainScenes[name.replace(/\.md$/, '')] = beat;
  }

  const scenes = {};
  const draftScenes = [];
  for (const name of listMarkdown(join(packDir, 'scenes'))) {
    const { meta, body } = splitFrontMatter(readText(join(packDir, 'scenes', name)));
    const key = name.replace(/\.md$/, '');
    const [beat] = parseBeats(body, problems, `scenes/${name}`, 'insight');
    if (beat?.text) scenes[key] = beat;
    else problems.push(`scenes/${name}: 본문이 없다`);
    if (meta.draft === true) draftScenes.push(key);
  }

  const talks = [];
  const draftTalks = [];
  for (const name of listMarkdown(join(packDir, 'talks'))) {
    const id = `talk.${name.replace(/\.md$/, '')}`;
    const { talk, draft } = parseTalkFile(readText(join(packDir, 'talks', name)), problems, id);
    talks.push(talk);
    if (draft) draftTalks.push(id);
  }
  if (draftTalks.length > 0) notices.push(`임시 대화 장면 ${draftTalks.length}개`);
  if (draftScenes.length > 0) notices.push(`임시 장면 ${draftScenes.length}개`);

  // 말투·감정 표: 팩에 없으면 기본 표. 말투 id의 목록은 기본 아홉 + 표의 말투
  const tableRows = (name) => {
    const own = join(packDir, name);
    const path = existsSync(own) ? own : join(DEFAULTS_DIR, name);
    return parseCsvInternal(readText(path), name, problems).rows;
  };
  const voice = readVoice(tableRows('voice.csv'), problems, 'voice.csv');
  const moods = readMoods(tableRows('moods.csv'), problems, 'moods.csv');
  const speeches = [...new Set([...SPEECHES, ...voice.map((rule) => rule.speech)])];

  const lootTables = readJson('loot.json', []).map((table) => ({
    id: String(table.id ?? ''),
    entries: (table.entries ?? []).map((entry) => ({
      id: String(entry.id ?? ''),
      weight: Number(entry.weight ?? 1),
      when: typeof entry.when === 'string' && entry.when ? parseCondition(entry.when, problems, `loot.json: ${table.id}`) : null,
    })),
  }));

  const pack = {
    id: meta.id,
    title: meta.title ?? meta.id,
    genre: meta.genre ?? '',
    version: Number(meta.version ?? 1),
    protagonist: { defaultName: meta.protagonist?.defaultName ?? '' },
    origins: (meta.origins ?? []).map((origin) => ({
      id: origin.id, name: origin.name ?? origin.id, summary: origin.summary ?? '',
      stats: origin.stats ?? {}, traits: origin.traits ?? [], phrases: origin.phrases ?? {},
    })),
    startTraits: meta.startTraits ?? [],
    startGrudges: meta.startGrudges ?? {},
    glossary: readJson('glossary.json', {}),
    traits: readTraits(readRows('traits.csv'), problems),
    cast: readCast(readRows('cast.csv'), problems),
    combinations: readJson('combinations.json', []).map((combo) => ({
      id: combo.id, name: combo.name ?? combo.id, requires: combo.requires ?? [], ordered: combo.ordered === true,
      multiplier: combo.grants?.multiplier ?? {}, flags: combo.grants?.flags ?? [],
    })),
    speech: readSpeech(readRows('speech.csv'), problems, speeches),
    episodeOrder: meta.episodes ?? Object.keys(episodes),
    episodes,
    interludes,
    gainScenes,
    zones: readJson('map.json', { zones: [] }).zones ?? [],
    tuning: meta.tuning ?? {},
    shops: readJson('shops.json', []),
    voice,
    moods,
    talks,
    verses: readJson('verses.json', []).map((verse) => ({
      id: String(verse.id ?? ''), name: verse.name ?? verse.id, beads: verse.beads ?? [], equip: verse.equip ?? [], tags: verse.tags ?? [],
      stats: verse.stats ?? {}, grant: verse.grant ?? [], flags: verse.flags ?? [], ...(verse.description ? { description: verse.description } : {}),
    })),
    loot: lootTables,
    scenes,
    realms: (meta.realms ?? []).map((realm) => ({ id: realm.id, name: realm.name ?? realm.id, absorbed: Number(realm.absorbed ?? 0), stats: realm.stats ?? {} })),
    arcs: (meta.arcs ?? []).map((arc) => ({ id: arc.id, name: arc.name ?? arc.id, summary: arc.summary ?? '' })),
  };
  checkPack(pack, problems, speeches);
  // 사람이 승인하지 않은 문장(draft: true)의 목록. 출시 판(content.mjs build --release)이 막는다(W9 D6)
  const drafts = [...draftList, ...draftTalks, ...draftScenes.map((key) => `scene:${key}`)];
  return { pack, problems, notices, drafts };
}
