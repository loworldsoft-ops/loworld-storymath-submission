// 공통 저장소의 빚을 센다. 수가 기준선(baseline.json)보다 늘면 실패한다. 줄면 --update로 기준선을 내린다.
// 원본에서 옮겨 온 코드는 아래 규칙을 많이 어긴다. 한 번에 0으로 만들 수 없으므로, 늘지 못하게 막고 줄여 간다.
//
//   node conventions/verify-common.mjs            세고 기준선과 비교한다
//   node conventions/verify-common.mjs --update   줄어든 수로 기준선을 다시 쓴다 (늘어난 것이 있으면 쓰지 않는다)
//   node conventions/verify-common.mjs --rebase   늘어난 수까지 기준선으로 쓴다. 세는 방법이 바뀌어 숨어 있던 빚이 드러났을 때만 쓴다
//   node conventions/verify-common.mjs --list C2  그 규칙에 걸린 것을 보여 준다
//   node conventions/verify-common.mjs --self-test
//
// C1 앱의 낱말이 파일 경로나 선택자에 있다 (공통은 앱을 모른다)
// C2 색 값을 직접 적는다 (토큰 정의 밖에서)
// C3 도감에 없는 컴포넌트다
// C4 묶음의 방향을 거스르는 가져오기다
// C5 화면 크기를 @media로 판단한다
// C6 컴포넌트나 지시자가 상속으로 기능을 받는다. 두 가지는 세지 않는다:
//    기본 부품(ui)이 입력의 계약을 받는 기반(services/base의 Lw…Element)과, 같은 폴더 안의 추상 기반을 잇는 변형들(전투 무대 여덟 가지 등)
// C7 앱 저장소 수로 계산했을 때 한 앱만 쓰거나(합칠 후보), 어느 앱도 쓰지 않고 도감 데모에서만 쓰이는 컴포넌트다 (catalog 묶음 자체는 제외)
// C8 선택자가 lw-로 시작하지 않는다
// C9 템플릿이나 스타일을 인라인으로 적는다
// C10 OS 화면(os 묶음)이 앱의 낱말을 글자로 적는다 (앱의 것은 선언서에서 받는다)
// C11 도감에 설명 없이 올라 있는 컴포넌트다 (generate-catalog가 자동으로 올린 것)
// C12 Firebase를 firebase 묶음 밖에서 가져온다
// C13 도감 항목이 실제 컴포넌트를 가리키지 않는다
// C14 식별자나 CSS 토큰에 앱 낱말을 쓴다 (공통은 앱을 모른다)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_WORDS = ['note', 'eznote', 'calendar', 'ezcalendar', 'novel', 'homework', 'study', 'plan', 'develop', 'llmops', 'foundry', 'guide', 'wuxia', 'd2r', 'd2', 'db', 'group', 'math'];

// note, plan, group, guide, study, develop, db, calendar는 일반 영어 낱말이라
// 식별자 검사에서 뺀다(파일 경로 검사 C1에는 남긴다).
const IDENT_WORDS = new Set([
  'novel', 'homework', 'llmops', 'foundry', 'wuxia',
  'd2r', 'd2', 'deckard', 'horadric', 'diablo',
  'eznote', 'ezcalendar', 'ezstudy',
]);

const stripStrings = (s) =>
  s.replace(/'(?:[^'\\]|\\.)*'/gs, ' ')
   .replace(/"(?:[^"\\]|\\.)*"/gs, ' ')
   .replace(/`(?:[^`\\]|\\.)*`/gs, ' ');

function splitWords(ident) {
  return ident
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .split(/[^a-zA-Z0-9]+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

// 위가 아래를 가져오지 못한다. 같은 줄은 서로 가져오지 못한다.
const LAYER = { tokens: 0, services: 1, firebase: 2, ui: 2, patterns: 3, game: 4, catalog: 5, host: 6, os: 7 };

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

export function measure(src) {
  const hits = { C1: [], C2: [], C3: [], C4: [], C5: [], C6: [], C7: [], C8: [], C9: [], C10: [], C11: [], C12: [], C13: [], C14: [] };
  const files = walk(src).filter((f) => !f.endsWith('.spec.ts') && !f.includes(`${path.sep}__fixtures__${path.sep}`));
  const rel = (f) => path.relative(src, f).split(path.sep).join('/');
  const hasAppWord = (s) => s.split(/[^a-z0-9]+/i).some((w) => APP_WORDS.includes(w.toLowerCase()));
  const components = [];
  const templates = [];
  const realSelectors = new Set();
  const catalogSelectors = new Set();
  let catalogText = '';
  for (const f of files) {
    const r = rel(f);
    const bundle = r.split('/')[0];
    if (hasAppWord(r.replace(/\.[a-z.]+$/, ''))) hits.C1.push(r);
    if (f.endsWith('.scss')) {
      const raw = fs.readFileSync(f, 'utf8');
      const text = stripComments(raw);
      if (bundle !== 'tokens') text.split('\n').forEach((l, i) => { if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(l) && !/^\s*--/.test(l)) hits.C2.push(`${r}:${i + 1}`); });
      text.split('\n').forEach((l, i) => { if (/@media\b[^{]*\b(width|height)\b/.test(l)) hits.C5.push(`${r}:${i + 1}`); });
      const tokens = new Set([...raw.matchAll(/--lw-[a-z0-9-]+/g)].map((m) => m[0]));
      for (const tok of tokens) {
        const parts = tok.slice(5).split('-');
        if (parts.some((p) => IDENT_WORDS.has(p.toLowerCase()))) hits.C14.push(`${r}: ${tok}`);
      }
    }
    if (f.endsWith('.html')) templates.push([r, fs.readFileSync(f, 'utf8')]);
    if (bundle === 'os' && /\.(ts|html)$/.test(f)) {
      const text = f.endsWith('.ts') ? stripComments(fs.readFileSync(f, 'utf8')) : fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      text.split('\n').forEach((l, i) => {
        if (/^\s*import\b/.test(l)) return;
        if ([...l.matchAll(/'([^']*)'|"([^"]*)"/g)].some((m) => hasAppWord(m[1] ?? m[2] ?? ''))) hits.C10.push(`${r}:${i + 1}`);
      });
    }
    if (f.endsWith('.ts')) {
      const raw = fs.readFileSync(f, 'utf8');
      const text = stripComments(raw);
      const tokens = new Set([...raw.matchAll(/--lw-[a-z0-9-]+/g)].map((m) => m[0]));
      for (const tok of tokens) {
        const parts = tok.slice(5).split('-');
        if (parts.some((p) => IDENT_WORDS.has(p.toLowerCase()))) hits.C14.push(`${r}: ${tok}`);
      }
      const code = stripStrings(text);
      const idents = new Set([...code.matchAll(/\b[A-Za-z_$][\w$]*\b/g)].map((m) => m[0]));
      for (const id of idents) {
        const words = splitWords(id);
        if (words.some((w) => IDENT_WORDS.has(w))) hits.C14.push(`${r}: ${id}`);
      }
      if (bundle === 'catalog' || /catalog\.ts$/.test(r)) {
        catalogText += raw;
        for (const m of raw.matchAll(/selector:\s*['"](lw-[a-z0-9-]+)['"]/g)) catalogSelectors.add(m[1]);
      }
      if (r === 'catalog/generated-catalog.ts') for (const m of raw.matchAll(/id: '([^']+)'[^\n]*\n\s*description: '\(설명이 없다\)/g)) hits.C11.push(m[1]);
      if (bundle !== 'firebase' && /(?:from\s+|import\s*\(\s*)['"](?:@?firebase\/|@angular\/fire)/.test(text)) hits.C12.push(r);
      for (const m of text.matchAll(/(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g)) {
        const target = rel(path.resolve(path.dirname(f), m[1]));
        const tb = target.split('/')[0];
        if (tb !== bundle && tb in LAYER && bundle in LAYER && LAYER[tb] >= LAYER[bundle]) hits.C4.push(`${r} -> ${target}`);
      }
      const isView = /@(Component|Directive)\s*\(/.test(text);
      if (isView) {
        const base = text.match(/class\s+\w+(?:<[^>]*>)?\s+extends\s+(\w+)/)?.[1];
        if (base) {
          const from = text.match(new RegExp(`import\\s+(?:type\\s+)?\\{[^}]*\\b${base}\\b[^}]*\\}\\s+from\\s+['"]([^'"]+)['"]`))?.[1] ?? '';
          const contract = bundle === 'ui' && /services\/base\/lw-[a-z-]+-element$/.test(from);
          // 변형 가족: 기반이 같은 폴더나 그 위아래 한 칸 안에 있다.
          const family = /^\.\.?\/(\.\.\/)?[^/]*\/?[^/]+$/.test(from) && !from.includes('services/');
          if (!contract && !family) hits.C6.push(r);
        }
      }
      for (const m of text.matchAll(/@(?:Component|Directive)\s*\(\s*\{[\s\S]*?selector:\s*['"`]([^'"`]+)['"`]/g)) {
        m[1].split(',').forEach((x) => realSelectors.add(x.trim()));
      }
      for (const m of text.matchAll(/@Component\s*\(\s*\{([\s\S]*?)\n\}\s*\)/g)) {
        const meta = m[1];
        const sel = /selector:\s*['"`]([^'"`]+)['"`]/.exec(meta)?.[1];
        if (/\btemplate\s*:/.test(meta) || /\bstyles\s*:/.test(meta)) hits.C9.push(r);
        if (/\btemplate\s*:\s*`([\s\S]*?)`/.test(meta)) templates.push([r, /\btemplate\s*:\s*`([\s\S]*?)`/.exec(meta)[1]]);
        if (!sel) continue;
        for (const one of sel.split(',').map((s) => s.trim())) {
          const tag = one.replace(/^[a-z]*\[|\]$/g, '').replace(/^.*\[/, '');
          if (!/^(lw-|[a-z]*\[lw)/.test(one)) hits.C8.push(`${r} (${one})`);
          if (hasAppWord(tag)) hits.C1.push(`${r} (${one})`);
        }
        components.push({ file: r, selector: sel.split(',')[0].trim() });
      }
    }
  }
  // 쓰는 곳은 앱 저장소의 화면까지 센다. 공통의 컴포넌트는 앱이 쓰라고 있는 것이다.
  // 1. 앱 저장소(loworld-app-*, loworld-overview) 수로 센다.
  // 2. 앱 저장소가 한 곳만 쓰면 C7.
  // 3. 어느 앱도 쓰지 않고 공통 안의 다른 부품만 쓰면 C7이 아니다 (조각 부품).
  // 4. 어느 앱도 쓰지 않고 도감 데모에서만 쓰이면 C7 (catalog-only).
  // 5. catalog 묶음의 컴포넌트(도감 화면 자체)는 대상에서 뺀다.
  // 6. 형제 앱 저장소가 없을 때(공통 단독 또는 selfTest): 도감 밖 템플릿 사용처 수로 판단하되,
  //    도감 데모 템플릿은 공유 사용처로 세지 않는다.
  const siblings = path.resolve(src, '../..');
  const appTexts = [];
  if (path.basename(path.resolve(src, '..')) === 'loworld-common') {
    for (const d of fs.readdirSync(siblings).filter((n) => /^loworld-(app-[\w-]+|overview)$/.test(n))) {
      const appSrc = path.join(siblings, d, 'src');
      if (fs.existsSync(appSrc)) {
        const text = walk(appSrc).filter((x) => /\.(html|ts)$/.test(x)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
        appTexts.push([d, text]);
      }
    }
  }

  const commonNonCatalog = templates.filter(([f]) => !f.startsWith('catalog/'));
  for (const c of components) {
    if (!/^[a-z][\w-]*$/.test(c.selector)) continue;
    if (!catalogText.includes(c.selector)) hits.C3.push(`${c.file} (${c.selector})`);
    if (c.file.startsWith('catalog/') || c.file.startsWith('host/')) continue;

    const re = new RegExp(`<${c.selector}[\\s>/]`);
    const own = c.file.replace(/\.ts$/, '');

    if (appTexts.length > 0) {
      const usedApps = appTexts.filter(([, t]) => re.test(t)).map(([r]) => r);
      if (usedApps.length === 1) {
        hits.C7.push(`${c.file} (${c.selector}) <- ${usedApps[0]}`);
      } else if (usedApps.length === 0) {
        const inCommon = commonNonCatalog.some(([f, t]) => !f.startsWith(own) && re.test(t));
        if (!inCommon) {
          hits.C7.push(`${c.file} (${c.selector}) <- catalog-only`);
        }
      }
    } else {
      const nonCatalogUsers = commonNonCatalog
        .filter(([f, t]) => f.replace(/\.(html|ts)$/, '') !== own && re.test(t))
        .map(([f]) => f);
      if (nonCatalogUsers.length === 1) {
        hits.C7.push(`${c.file} (${c.selector}) <- ${nonCatalogUsers[0]}`);
      } else if (nonCatalogUsers.length === 0) {
        const inCatalog = templates.some(([f, t]) => f.startsWith('catalog/') && !f.startsWith(own) && re.test(t));
        if (inCatalog) {
          hits.C7.push(`${c.file} (${c.selector}) <- catalog-only`);
        }
      }
    }
  }
  for (const s of catalogSelectors) {
    if (!realSelectors.has(s)) hits.C13.push(s);
  }
  for (const k of Object.keys(hits)) hits[k] = [...new Set(hits[k])];
  return hits;
}

function selfTest() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-common-'));
  const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(base, f)), { recursive: true }); fs.writeFileSync(path.join(base, f), t); };
  w('tokens/_color.scss', ':root { --lw-color: #fff; }\n.x { color: #000; }\n');
  w('ui/card/card.component.ts', "import { Component } from '@angular/core';\n@Component({\n  selector: 'lw-card',\n  templateUrl: './card.component.html',\n})\nexport class LwCard {}\n");
  w('ui/card/card.component.html', '<lw-inner />');
  w('ui/card/card.component.scss', '.a { color: #ff0000; }\n.accent { color: var(--lw-novel-accent); }\n@media (max-width: 600px) { .a { display: none; } }\n');
  w('ui/inner/inner.component.ts', "import { Component } from '@angular/core';\nimport { X } from '../../os/x';\nclass Base {}\n@Component({\n  selector: 'app-inner',\n  template: '<b></b>',\n})\nexport class Inner extends Base { x = X; }\n");
  w('ui/episode/episode.ts', "export class NovelEpisodeVm {}\n");
  w('os/x.ts', "export const X = 1;\n// 'novel-demo' 주석은 세지 않는다\nexport const TAB = 'novel-demo';\n");
  w('patterns/note-list/note-list.component.ts', "import { Component } from '@angular/core';\n@Component({\n  selector: 'lw-note-list',\n  templateUrl: './note-list.component.html',\n})\nexport class NoteList {}\n");
  w('patterns/note-list/note-list.component.html', '<lw-card />');
  // 도감 데모 템플릿에서도 쓰인다. 이전에는 이것이 두 번째 사용처로 계산되어 C7을 벗어났으나,
  // 강화 후에는 도감 데모가 공유 사용처로 인정되지 않으므로 여전히 C7로 잡힌다.
  w('catalog/preview/card-preview.html', '<lw-card />');
  // 도감 데모에서만 쓰이는 컴포넌트 (catalog-only)
  w('ui/solo/solo.component.ts', "import { Component } from '@angular/core';\n@Component({\n  selector: 'lw-solo',\n  templateUrl: './solo.component.html',\n})\nexport class Solo {}\n");
  w('ui/solo/solo.component.html', '<span />');
  w('catalog/preview/solo-preview.html', '<lw-solo />');
  w('catalog/all.ts', "export const ALL = ['lw-card', 'lw-solo'];\n");
  w('catalog/generated-catalog.ts', "export const G = [\n  { id: 'lw-x', name: 'X',\n    description: '(설명이 없다) ui/x.ts',\n  },\n];\n");
  // firebase 묶음 밖에서 Firebase를 가져오는 파일 (C12)
  w('ui/leak/leak.ts', "import { getFirestore } from 'firebase/firestore';\nexport const DB = getFirestore();\n");
  // firebase 묶음 안에서는 가져와도 C12에 걸리지 않는다
  w('firebase/client.ts', "import { initializeApp } from 'firebase/app';\nexport const APP = initializeApp({});\n");
  // 도감 항목이 실제 컴포넌트를 가리키지 않는 예 (C13)
  w('catalog/broken-catalog.ts', "export const BROKEN = [{ id: 'b', selector: 'lw-phantom' }];\n");
  const h = measure(base);
  fs.rmSync(base, { recursive: true, force: true });
  const expect = { C1: 3, C2: 1, C3: 2, C4: 1, C5: 1, C6: 1, C7: 2, C8: 1, C9: 1, C10: 1, C11: 1, C12: 1, C13: 1, C14: 2 };
  let ok = true;
  for (const [k, n] of Object.entries(expect)) if (h[k].length !== n) { ok = false; console.log(`자체 시험 실패: ${k} 기대 ${n}, 실제 ${h[k].length} — ${h[k].join(' | ')}`); }
  console.log(ok ? '자체 시험 통과 (규칙 14개)' : '자체 시험 실패');
  return ok;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);
  const hits = measure(path.resolve(HERE, '../src'));
  const li = process.argv.indexOf('--list');
  if (li > 0) { console.log(hits[process.argv[li + 1]].join('\n')); process.exit(0); }
  const file = path.join(HERE, 'baseline.json');
  const base = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const now = Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, v.length]));
  let worse = false;
  for (const [k, n] of Object.entries(now)) {
    const b = base?.[k];
    const mark = b === undefined ? '' : n > b ? `  ▲ 기준선 ${b}보다 늘었다` : n < b ? `  ▼ 기준선 ${b}에서 줄었다` : '';
    if (b !== undefined && n > b) worse = true;
    console.log(`${k} ${String(n).padStart(6)}${mark}`);
  }
  if (worse && !process.argv.includes('--rebase')) { console.log('빚이 늘었다. 새로 어긴 것을 고친다.'); process.exit(1); }
  if (!base || process.argv.includes('--update') || process.argv.includes('--rebase')) { fs.writeFileSync(file, JSON.stringify(now, null, 2) + '\n'); console.log('기준선을 썼다'); }
  else if (Object.entries(now).some(([k, n]) => n < base[k])) console.log('빚이 줄었다. --update로 기준선을 내린다.');
}
