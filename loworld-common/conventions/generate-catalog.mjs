// 도감에 손으로 올리지 않은 공통 컴포넌트를 찾아 src/catalog/generated-catalog.ts에 올린다.
// All Components가 공통의 기준이므로 공통의 컴포넌트는 빠짐없이 도감에 있어야 한다.
//   node conventions/generate-catalog.mjs           다시 쓴다
//   node conventions/generate-catalog.mjs --check   지금의 파일이 최신인지만 본다 (다르면 실패)
// 여기서 올린 항목은 설명이 코드의 주석에서 온 것이거나 비어 있다. 손으로 쓴 도감 파일에 같은 선택자를 올리면 여기서는 빠진다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { measure } from './verify-common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(HERE, '../src');
const OUT = path.join(SRC, 'catalog/generated-catalog.ts');
const EMPTY = "import type { ComponentMeta } from '../services/models/os.types';\n\nexport const GENERATED_CATALOG: ComponentMeta[] = [];\n";

const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
fs.writeFileSync(OUT, EMPTY);
let missing;
try { missing = measure(SRC).C3; } finally { fs.writeFileSync(OUT, before || EMPTY); }

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ').trim()}'`;
const categoryOf = (rel, selector) => {
  const s = `${rel} ${selector}`;
  if (/button|fab|chip/.test(s)) return 'buttons';
  if (/form|input|picker|editor|field|select/.test(s)) return 'forms';
  if (/nav|menu|tab|titlebar|header|sidebar|rail|dock|bar\b/.test(s)) return 'navigation';
  if (/shell|layout|frame|workspace|stage|grid/.test(s)) return 'layout';
  if (/modal|dialog|sheet|drawer|overlay|popover|tooltip|snackbar/.test(s)) return 'popups';
  if (/card|tile|item|row/.test(s)) return 'cards';
  if (/list|table|log|chart|stat|viewer/.test(s)) return 'data';
  return 'view';
};
const entries = [];
for (const hit of missing) {
  const m = hit.match(/^(\S+) \(([^)]+)\)/);
  if (!m) continue;
  const [, rel, selectors] = m;
  const file = path.join(SRC, rel);
  const text = fs.readFileSync(file, 'utf8');
  const selector = selectors.split(',')[0].trim();
  const at = text.search(new RegExp(`selector:\\s*['"\`][^'"\`]*${selector.replace(/[-[\]]/g, '\\$&')}`));
  const head = text.slice(0, at < 0 ? text.length : at);
  const decl = text.slice(at < 0 ? 0 : at);
  const className = decl.match(/export\s+class\s+(\w+)/)?.[1] ?? selector;
  // 컴포넌트 바로 위의 주석이 설명이다.
  const doc = [...head.matchAll(/\/\*\*([\s\S]*?)\*\/\s*(?=@Component|@Directive)/g)].pop()?.[1] ?? '';
  const description = doc.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).filter((l) => l && !l.startsWith('@')).join(' ').slice(0, 240);
  const body = decl.slice(0, (() => { const next = decl.slice(1).search(/\n@(Component|Directive)\(/); return next < 0 ? decl.length : next + 1; })());
  const inputs = [], outputs = [];
  for (const x of body.matchAll(/^\s*(?:public\s+|protected\s+)?(?:readonly\s+)?(\w+)\s*=\s*(input|model)(?:\.required)?(?:<([^>(]+(?:<[^>]*>)?[^>(]*)>)?\(/gm)) inputs.push([x[1], x[3] ?? 'unknown']);
  for (const x of body.matchAll(/@Input\([^)]*\)\s*(?:set\s+)?(\w+)\s*[?!]?\s*(?::\s*([^;=]+))?/g)) inputs.push([x[1], (x[2] ?? 'unknown').trim()]);
  for (const x of body.matchAll(/^\s*(?:public\s+|protected\s+)?(?:readonly\s+)?(\w+)\s*=\s*output(?:<([^>(]+(?:<[^>]*>)?[^>(]*)>)?\(/gm)) outputs.push([x[1], x[2] ?? 'void']);
  for (const x of body.matchAll(/@Output\([^)]*\)\s*(\w+)\s*=\s*new\s+EventEmitter(?:<([^>]+)>)?/g)) outputs.push([x[1], x[2] ?? 'void']);
  const html = file.replace(/\.ts$/, '.html');
  const deps = fs.existsSync(html) ? [...new Set([...fs.readFileSync(html, 'utf8').matchAll(/<(lw-[a-z0-9-]+)/g)].map((x) => x[1]))].filter((d) => d !== selector).sort() : [];
  const bundle = rel.split('/')[0];
  entries.push({
    id: selector.replace(/[^a-z0-9-]/gi, ''), name: className.replace(/^Lw/, '').replace(/Component$/, ''), englishName: className, selector: selectors,
    domain: bundle === 'game' ? 'novel' : bundle === 'os' ? 'showcase' : 'common', category: categoryOf(rel, selector),
    description: description || `(설명이 없다) ${rel}`, inputs, outputs,
    layer: bundle === 'ui' ? 'primitive' : /shell/.test(rel) ? 'shell' : deps.length > 3 ? 'container' : 'composite', dependencies: deps,
  });
}
const seen = new Set();
const unique = entries.sort((a, b) => a.id.localeCompare(b.id)).filter((e) => !seen.has(e.id) && seen.add(e.id));
const io = (list) => `[${list.map(([n, t]) => `{ name: ${q(n)}, type: ${q(t)} }`).join(', ')}]`;
const out = `// conventions/generate-catalog.mjs가 쓴다. 손으로 고치지 않는다.
// 손으로 쓴 도감에 아직 없는 공통 컴포넌트다. 설명은 코드의 주석에서 왔다. 제대로 된 설명과 쓰임은 손으로 쓴 도감 파일에 올린다.
import type { ComponentMeta } from '../services/models/os.types';

export const GENERATED_CATALOG: ComponentMeta[] = [
${unique.map((e) => `  { id: ${q(e.id)}, name: ${q(e.name)}, englishName: ${q(e.englishName)}, selector: ${q(e.selector)}, domain: ${q(e.domain)}, category: ${q(e.category)}, layer: ${q(e.layer)},
    description: ${q(e.description)},
    inputs: ${io(e.inputs)}, outputs: ${io(e.outputs)}, dependencies: [${e.dependencies.map(q).join(', ')}] },`).join('\n')}
];
`;
if (process.argv.includes('--check')) {
  if (out !== before) { console.log('도감의 자동 등록 파일이 낡았다. node conventions/generate-catalog.mjs를 돌린다.'); process.exit(1); }
  console.log(`도감의 자동 등록 ${unique.length}개, 최신이다`);
} else {
  fs.writeFileSync(OUT, out);
  console.log(`도감에 자동으로 올린 컴포넌트 ${unique.length}개 (설명이 없는 것 ${unique.filter((e) => e.description.startsWith('(설명이 없다)')).length}개)`);
}
