// 틀의 파일을 앱 저장소에 다시 복사한다. 틀을 고친 뒤에 돌린다.
//   node conventions/sync-template.mjs <앱 저장소 폴더>…
// package.json은 통째로 덮지 않는다. 이름과 설명은 앱의 것이고, 명령과 의존만 틀의 것으로 맞춘다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'app-template');
export const TEMPLATE_FILES = [
  ['standalone/main.ts'], ['standalone/index.html'], ['scripts/prepare.mjs'], ['tsconfig.json'], ['angular.json'],
  ['environments/emulator.json'], ['environments/dev.example.json'], ['environments/offline.json'], ['.gitignore', 'gitignore'], ['.npmrc', 'npmrc'],
  ['.github/workflows/check.yml', 'github/workflows/check.yml'], ['CLAUDE.md'],
];
export const TEMPLATE_SCRIPTS = {
  prepare: 'node scripts/prepare.mjs',
  build: 'node scripts/prepare.mjs && ng build app',
  serve: 'node scripts/prepare.mjs && ng serve app',
  typecheck: 'node scripts/prepare.mjs && ngc -p tsconfig.json --noEmit',
  verify: 'node scripts/prepare.mjs && node .common/conventions/verify-app.mjs .',
};
export const templateDependencies = () => JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'dependencies.json'), 'utf8'));

export function sync(root) {
  for (const [name, tpl = name] of TEMPLATE_FILES) {
    const to = path.join(root, name);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(TEMPLATE, tpl), to);
  }
  const file = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  pkg.scripts = { ...TEMPLATE_SCRIPTS };
  // 공통은 npm으로 받지 않는다. scripts/prepare.mjs가 .common으로 잇는다.
  delete pkg.dependencies;
  pkg.devDependencies = templateDependencies();
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const root of process.argv.slice(2)) { sync(root); console.log('synced', root); }
}
