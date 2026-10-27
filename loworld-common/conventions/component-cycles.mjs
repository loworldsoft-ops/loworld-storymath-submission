// 컴포넌트가 템플릿에서 쓰려고 가져온 파일이 돌아서 그 컴포넌트를 다시 가져오는지 본다.
// 그런 순환은 어느 쪽을 먼저 읽느냐에 따라 실행 때 NG0919로 깨진다. 빌드는 통과한다.
//   node conventions/component-cycles.mjs [src 폴더]
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? 'src');
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, o) : o.push(p); } return o; };
const files = walk(ROOT).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.d.ts'));
const resolve = (from, spec) => {
  if (!spec.startsWith('.')) return null;
  const p = path.resolve(path.dirname(from), spec);
  return [p + '.ts', path.join(p, 'index.ts')].find((c) => fs.existsSync(c)) ?? null;
};
// 실행 때 남는 가져오기만 센다. 타입만 가져오는 것은 뺀다.
const graph = new Map();
const named = new Map(); // file -> Map(localName -> targetFile)
for (const f of files) {
  const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true);
  const out = new Set(); const names = new Map();
  for (const st of sf.statements) {
    if ((ts.isImportDeclaration(st) || ts.isExportDeclaration(st)) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const t = resolve(f, st.moduleSpecifier.text);
      if (!t) continue;
      if (ts.isImportDeclaration(st)) {
        const c = st.importClause;
        if (c?.isTypeOnly) continue;
        const els = c?.namedBindings && ts.isNamedImports(c.namedBindings) ? c.namedBindings.elements : null;
        if (els && els.every((e) => e.isTypeOnly)) continue;
        for (const e of els ?? []) if (!e.isTypeOnly) names.set(e.name.text, t);
      } else if (st.isTypeOnly) continue;
      out.add(t);
    }
  }
  graph.set(f, out); named.set(f, { names, text: sf.text });
}
const reach = (from, to) => { const seen = new Set(); const st = [from]; while (st.length) { const x = st.pop(); if (x === to) return true; if (seen.has(x)) continue; seen.add(x); for (const n of graph.get(x) ?? []) st.push(n); } return false; };
const bad = [];
for (const f of files) {
  const { names, text } = named.get(f);
  const m = /@Component\(\{[\s\S]*?\bimports:\s*\[([\s\S]*?)\]/.exec(text);
  if (!m) continue;
  for (const id of m[1].split(/[\s,]+/).filter(Boolean)) {
    const t = names.get(id.replace(/^\.\.\./, ''));
    if (t && t !== f && reach(t, f)) bad.push(`${path.relative(ROOT, f)} 가 ${id} 를 쓰는데 ${path.relative(ROOT, t)} 가 돌아서 이 파일을 가져온다`);
  }
}
console.log(bad.join('\n') || '순환 없음');
console.log(`컴포넌트 순환 ${bad.length}건`);
process.exit(bad.length ? 1 : 0);
