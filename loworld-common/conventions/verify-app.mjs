// 앱 저장소(와 쇼케이스)가 규칙을 지키는지 본다. 어기면 실패한다.
//   node verify-app.mjs <저장소 폴더> [--host]     --host는 쇼케이스: 앱을 가져올 수 있고 틀 비교(A8)를 하지 않는다
//   node verify-app.mjs --self-test                일부러 어긴 예에서 규칙이 모두 잡히는지 본다
//
// A1 스타일 파일과 컴포넌트의 styles가 없다
// A2 화면 파일에는 lw-* 컴포넌트와 ng-container·ng-template만 있다 (HTML 요소가 없다)
// A3 화면 파일에 class, style, [class.*], [style.*], [ngClass], [ngStyle]이 없다
// A4 인라인 템플릿이 없다
// A5 컴포넌트는 src/screens의 화면뿐이다. 지시자와 파이프를 만들지 않는다. (화면이 다른 화면을 담는 것은 된다. 화면도 공통 부품의 조합일 뿐이다)
// A6 @loworld 의존은 @loworld/common뿐이다. 저장소 밖의 파일을 상대 경로로 가져오지 않는다
// A7 firebase와 브라우저 전역(window, document, localStorage, sessionStorage, navigator)을 쓰지 않는다
// A8 폴더 구조가 정해진 대로이고, 틀에서 온 파일이 틀과 글자까지 같다. package.json의 명령과 의존도 틀과 같다
// A9 선언서(src/manifest.ts)의 frame 설정은 LW_FRAME_SETTING_ITEMS에 선언된 키와 값만 쓴다
// A10 선언서(src/manifest.ts)의 appearance 키는 scheme, skin뿐이고 값은 LwScheme, LwSkin에 있는 것뿐이다
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_FILES, TEMPLATE_SCRIPTS, templateDependencies } from './sync-template.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(HERE, 'app-template');
const SKIP = new Set(['node_modules', 'dist', '.angular', '.git', 'public', '.common', '.content']);
const TOP_ALLOWED = new Set(['src', 'standalone', 'scripts', 'environments', 'package.json', 'tsconfig.json', 'angular.json', 'README.md', 'CLAUDE.md', '.gitignore', '.github', '.npmrc', 'package-lock.json', ...SKIP]);
const SRC_ALLOWED = new Set(['manifest.ts', 'index.ts', 'screens', 'logic', 'data']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.isFile()) out.push(p);
  }
  return out;
}
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function loadFrameSettingItems() {
  const file = path.resolve(HERE, '../src/services/settings/lw-frame-settings.ts');
  if (!fs.existsSync(file)) return new Map();
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/export\s+const\s+LW_FRAME_SETTING_ITEMS[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (!match) return new Map();
  const items = new Map();
  for (const itemMatch of match[1].matchAll(/\{\s*key:\s*['"]([^'"]+)['"][\s\S]*?choices:\s*\[([\s\S]*?)\]\s*\}/g)) {
    const key = itemMatch[1];
    const choices = new Set([...itemMatch[2].matchAll(/value:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
    items.set(key, choices);
  }
  return items;
}

const APPEARANCE_ITEMS = new Map([
  ['scheme', new Set(['system', 'light', 'dark'])],
  ['skin', new Set(['plain', 'newspaper', 'parchment', 'cyberpunk', 'glass', 'night'])],
]);

export function verify(root, { host = false } = {}) {
  const found = [];
  const add = (rule, file, msg) => found.push({ rule, file: path.relative(root, file), msg });
  const frameItems = loadFrameSettingItems();
  const files = walk(root);
  for (const f of files) {
    const rel = path.relative(root, f).split(path.sep).join('/');
    if (/\.(scss|sass|css|less)$/.test(f)) add('A1', f, '스타일 파일이 있다');
    if (f.endsWith('.html') && !rel.startsWith('standalone/') && rel !== 'src/index.html') {
      const html = fs.readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      for (const m of html.matchAll(/<([A-Za-z][\w-]*)/g)) {
        const tag = m[1];
        if (!tag.startsWith('lw-') && tag !== 'ng-container' && tag !== 'ng-template') add('A2', f, `<${tag}>는 공통 컴포넌트가 아니다`);
      }
      for (const m of html.matchAll(/[\s](\[?(?:class|style|ngClass|ngStyle)(?:\.[\w.%-]+)?\]?)\s*=/g)) add('A3', f, `${m[1]} 속성으로 모양을 정한다`);
      if (!/\.screen\.html$/.test(rel) || !rel.startsWith('src/screens/')) add('A5', f, '템플릿은 src/screens의 화면에만 둔다');
    }
    if (f.endsWith('.ts')) {
      const src = stripComments(fs.readFileSync(f, 'utf8'));
      if (/\bstyles\s*:|\bstyleUrls?\s*:/.test(src)) add('A1', f, '컴포넌트에 styles가 있다');
      if (/@Component\s*\(/.test(src)) {
        if (/\btemplate\s*:/.test(src)) add('A4', f, '인라인 템플릿이 있다');
        if (!/^src\/screens\/[\w-]+\/[\w-]+\.screen\.ts$/.test(rel)) add('A5', f, '컴포넌트는 src/screens/<화면>/<화면>.screen.ts에만 둔다');
      }
      if (/@(Directive|Pipe)\s*\(/.test(src)) add('A5', f, '지시자와 파이프는 공통에 만든다');
      for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
        const spec = m[1];
        if (spec.startsWith('@loworld/') && !spec.startsWith('@loworld/common/') && !(host && spec.startsWith('@loworld/app-'))) add('A6', f, `${spec} 를 가져온다`);
        if (spec.startsWith('.') && path.relative(root, path.resolve(path.dirname(f), spec)).startsWith('..')) add('A6', f, `저장소 밖의 파일을 가져온다: ${spec}`);
        if (spec === 'firebase' || spec.startsWith('firebase/') || spec.startsWith('@firebase/')) add('A7', f, `${spec} 를 직접 쓴다`);
      }
      const code = src.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, "''");
      for (const m of code.matchAll(/(?<![\w.$])(window|document|localStorage|sessionStorage|navigator)\s*[.[]/g)) add('A7', f, `브라우저 전역 ${m[1]} 을 직접 쓴다`);
      if (rel === 'src/manifest.ts') {
        const frameMatch = src.match(/\bframe\s*:\s*\{([^}]*)\}/);
        if (frameMatch) {
          const entries = frameMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
          for (const entry of entries) {
            const colonIdx = entry.indexOf(':');
            if (colonIdx === -1) continue;
            const key = entry.slice(0, colonIdx).trim().replace(/^['"]|['"]$/g, '');
            const val = entry.slice(colonIdx + 1).trim().replace(/^['"]|['";]+$/g, '');
            if (!frameItems.has(key)) {
              add('A9', f, `frame 설정에 알 수 없는 키 '${key}'가 있다`);
            } else if (!frameItems.get(key).has(val)) {
              add('A9', f, `frame 설정 '${key}'의 값 '${val}'은 허용되지 않는다 (허용: ${[...frameItems.get(key)].join(', ')})`);
            }
          }
        }
        const appearanceMatch = src.match(/\bappearance\s*:\s*\{([^}]*)\}/);
        if (appearanceMatch) {
          const entries = appearanceMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
          for (const entry of entries) {
            const colonIdx = entry.indexOf(':');
            if (colonIdx === -1) continue;
            const key = entry.slice(0, colonIdx).trim().replace(/^['"]|['"]$/g, '');
            const val = entry.slice(colonIdx + 1).trim().replace(/^['"]|['";]+$/g, '');
            if (!APPEARANCE_ITEMS.has(key)) {
              add('A10', f, `appearance 설정에 알 수 없는 키 '${key}'가 있다`);
            } else if (!APPEARANCE_ITEMS.get(key).has(val)) {
              add('A10', f, `appearance 설정 '${key}'의 값 '${val}'은 허용되지 않는다 (허용: ${[...APPEARANCE_ITEMS.get(key)].join(', ')})`);
            }
          }
        }
      }
    }
  }
  if (!host) {
    for (const e of fs.readdirSync(root)) if (!TOP_ALLOWED.has(e)) add('A8', path.join(root, e), '정해지지 않은 파일이나 폴더다');
    const src = path.join(root, 'src');
    for (const need of ['src/manifest.ts', 'src/index.ts', 'src/screens', 'package.json']) if (!fs.existsSync(path.join(root, need))) add('A8', path.join(root, need), '있어야 하는데 없다');
    if (fs.existsSync(src)) for (const e of fs.readdirSync(src)) if (!SRC_ALLOWED.has(e)) add('A8', path.join(src, e), 'src에는 manifest.ts, index.ts, screens, logic, data만 둔다');
    for (const [name, tpl = name] of TEMPLATE_FILES) {
      const a = path.join(root, name), b = path.join(TEMPLATE, tpl);
      if (!fs.existsSync(a)) add('A8', a, '틀의 파일이 없다');
      else if (fs.readFileSync(a, 'utf8') !== fs.readFileSync(b, 'utf8')) add('A8', a, '틀과 다르다. 고치려면 loworld-common/conventions/app-template을 고친다');
    }
    const pkgFile = path.join(root, 'package.json');
    if (fs.existsSync(pkgFile)) {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      if (JSON.stringify(pkg.scripts) !== JSON.stringify(TEMPLATE_SCRIPTS)) add('A8', pkgFile, '명령(scripts)이 틀과 다르다. sync-template.mjs로 맞춘다');
      if (JSON.stringify(pkg.devDependencies) !== JSON.stringify(templateDependencies())) add('A8', pkgFile, '의존(devDependencies)이 틀과 다르다. 앱은 자기만의 의존을 갖지 않는다');
      if (pkg.dependencies) add('A8', pkgFile, 'dependencies를 두지 않는다. 필요한 것은 공통이 갖는다');
    }
  }
  return found;
}

function selfTest() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-verify-'));
  const make = (name, extra) => {
    const root = path.join(base, name);
    const w = (f, t) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), t); };
    for (const [n, tpl = n] of TEMPLATE_FILES) w(n, fs.readFileSync(path.join(TEMPLATE, tpl), 'utf8'));
    w('package.json', JSON.stringify({ name: 'x', scripts: TEMPLATE_SCRIPTS, devDependencies: templateDependencies() }));
    w('src/index.ts', "export { manifest } from './manifest';\n");
    w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest = {} as LwAppManifest;\n");
    w('src/screens/home/home.screen.ts', "import { Component } from '@angular/core';\n@Component({ selector: 'scr-home', templateUrl: './home.screen.html' })\nexport class HomeScreen {}\n");
    w('src/screens/home/home.screen.html', '@if (true) {\n  <lw-card [title]="t()" (action)="go()">\n    <ng-container />\n  </lw-card>\n}\n');
    extra?.(w, root);
    return root;
  };
  const cases = [
    ['깨끗한 앱', null, []],
    ['A1 스타일 파일', (w) => w('src/screens/home/home.screen.scss', ':host{}'), ['A1']],
    ['A1 styles', (w) => w('src/screens/home/home.screen.ts', "import { Component } from '@angular/core';\n@Component({ selector: 'scr-home', templateUrl: './home.screen.html', styles: [''] })\nexport class HomeScreen {}\n"), ['A1']],
    ['A2 HTML 요소', (w) => w('src/screens/home/home.screen.html', '<div><lw-card /></div>'), ['A2']],
    ['A3 class', (w) => w('src/screens/home/home.screen.html', '<lw-card class="wide" [style.width.px]="3" />'), ['A3']],
    ['A4 인라인 템플릿', (w) => w('src/screens/home/home.screen.ts', "import { Component } from '@angular/core';\n@Component({ selector: 'scr-home', template: '<lw-card />' })\nexport class HomeScreen {}\n"), ['A4']],
    ['A5 화면 밖의 컴포넌트', (w) => w('src/logic/panel.ts', "import { Component } from '@angular/core';\n@Component({ selector: 'x', templateUrl: './x.html' })\nexport class X {}\n"), ['A5']],
    ['A5 지시자', (w) => w('src/logic/d.ts', "import { Directive } from '@angular/core';\n@Directive({ selector: '[x]' })\nexport class X {}\n"), ['A5']],
    ['A6 다른 앱', (w) => w('src/logic/a.ts', "import { manifest } from '@loworld/app-note';\nexport const x = manifest;\n"), ['A6']],
    ['A6 저장소 밖', (w) => w('src/logic/a.ts', "import { x } from '../../../loworld-common/src/ui/index';\nexport const y = x;\n"), ['A6']],
    ['A7 firebase', (w) => w('src/logic/a.ts', "import { getAuth } from 'firebase/auth';\nexport const a = getAuth;\n"), ['A7']],
    ['A7 전역', (w) => w('src/logic/a.ts', "export const w = window.innerWidth + localStorage.length;\n"), ['A7']],
    ['A8 틀을 고침', (w) => w('standalone/main.ts', '// 고쳤다\n'), ['A8']],
    ['A8 모르는 폴더', (w) => w('src/components/x.ts', 'export const x = 1;\n'), ['A8']],
    ['A8 자기만의 의존', (w) => w('package.json', JSON.stringify({ name: 'x', scripts: TEMPLATE_SCRIPTS, devDependencies: templateDependencies(), dependencies: { lodash: '*' } })), ['A8']],
    ['A9 없는 키', (w) => w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest: LwAppManifest = { frame: { unknownKey: 'val' } } as LwAppManifest;\n"), ['A9']],
    ['A9 잘못된 값', (w) => w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest: LwAppManifest = { frame: { nav: 'invalid' } } as LwAppManifest;\n"), ['A9']],
    ['A9 올바른 설정', (w) => w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest: LwAppManifest = { frame: { nav: 'hidden', density: 'compact' } } as LwAppManifest;\n"), []],
    ['A10 없는 키', (w) => w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest: LwAppManifest = { appearance: { unknownKey: 'val' } } as LwAppManifest;\n"), ['A10']],
    ['A10 잘못된 값', (w) => w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest: LwAppManifest = { appearance: { scheme: 'invalid' } } as LwAppManifest;\n"), ['A10']],
    ['A10 올바른 설정', (w) => w('src/manifest.ts', "import type { LwAppManifest } from '@loworld/common/os';\nexport const manifest: LwAppManifest = { appearance: { scheme: 'dark', skin: 'night' } } as LwAppManifest;\n"), []],
    ['.content 폴더 허용', (w) => w('.content/dummy.txt', 'ok'), []],
  ];
  let ok = true;
  for (const [name, extra, expect] of cases) {
    const rules = [...new Set(verify(make(name.replace(/\s/g, '-'), extra)).map((v) => v.rule))].sort();
    const good = JSON.stringify(rules) === JSON.stringify([...expect].sort());
    ok &&= good;
    if (!good) console.log(`자체 시험 실패: ${name} — 기대 ${expect.join(',') || '없음'}, 실제 ${rules.join(',') || '없음'}`);
  }
  fs.rmSync(base, { recursive: true, force: true });
  console.log(ok ? `자체 시험 통과 (경우 ${cases.length}개)` : '자체 시험 실패');
  return ok;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);
  const root = path.resolve(process.argv[2] ?? '.');
  const found = verify(root, { host: process.argv.includes('--host') });
  for (const v of found) console.log(`${v.rule} ${v.file}: ${v.msg}`);
  console.log(found.length ? `${path.basename(root)}: 위반 ${found.length}건` : `${path.basename(root)}: 통과`);
  process.exit(found.length ? 1 : 0);
}
