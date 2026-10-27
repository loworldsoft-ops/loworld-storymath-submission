// 빌드와 실행 앞에 돈다. 모든 앱 저장소에서 같다. 고치지 않는다.
//  1) 공통 저장소를 찾아 .common으로 잇는다. 이 저장소는 공통을 .common을 통해서만 본다.
//     찾는 순서: 옆 폴더(../loworld-common) → node_modules/@loworld/common.
//     그래서 작업 폴더 안에서도, 이 저장소와 공통만 나란히 받아도 빌드된다.
//  2) LW_ENV로 고른 환경 파일을 standalone/environment.ts로 쓴다.
//     환경 파일 가운데 실제 프로젝트의 것(dev.json 등)은 저장소에 넣지 않는다.
//  3) 공통의 정적 자원(그림, 아이콘)을 public으로 잇는다. 자원은 앱이 아니라 공통에 있다.
//  4) 옆의 콘텐츠 저장소(../loworld-content-<id>)의 dist를 .content/<id>로 잇는다. 개발할 때만 쓴다.
//     출시 빌드는 콘텐츠를 앱에 넣지 않고 CDN에서 받는다(angular.json의 development 설정에만 .content가 있다).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const link = (name, target) => {
  const at = path.join(root, name);
  fs.rmSync(at, { recursive: true, force: true });
  fs.symlinkSync(path.relative(root, target), at, 'dir');
};

const common = [path.resolve(root, '../loworld-common'), path.join(root, 'node_modules/@loworld/common')].find((p) => fs.existsSync(path.join(p, 'src')));
if (!common) {
  console.error('공통 저장소가 없다. loworld-common을 이 폴더 옆에 받는다: git clone git@github.com:loworldsoft-ops/loworld-common.git ../loworld-common');
  process.exit(1);
}
link('.common', common);
link('public', path.join(common, 'public'));

fs.rmSync(path.join(root, '.content'), { recursive: true, force: true });
fs.mkdirSync(path.join(root, '.content'));
for (const dir of fs.readdirSync(path.resolve(root, '..'))) {
  const m = /^loworld-content-(.+)$/.exec(dir);
  const dist = path.resolve(root, '..', dir, 'dist');
  if (m && fs.existsSync(dist)) fs.symlinkSync(path.relative(path.join(root, '.content'), dist), path.join(root, '.content', m[1]), 'dir');
}

const id = process.env.LW_ENV ?? 'emulator';
const file = path.join(root, 'environments', `${id}.json`);
if (!fs.existsSync(file)) {
  console.error(`환경 파일이 없다: environments/${id}.json (dev.example.json을 복사해 만든다)`);
  process.exit(1);
}
const env = JSON.parse(fs.readFileSync(file, 'utf8'));
const out = `// scripts/prepare.mjs가 만든다. 고치지 않는다.\nimport type { LwEnvironment } from '@loworld/common/os';\n\nexport const environment: LwEnvironment = ${JSON.stringify(env, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'standalone/environment.ts'), out);
console.log(`environment: ${id}, common: ${path.relative(root, common)}`);
