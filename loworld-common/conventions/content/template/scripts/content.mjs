// 콘텐츠 저장소의 유일한 실행 파일이다. 모든 콘텐츠 저장소에서 글자까지 같다. 고치지 않는다.
// 공통 저장소를 찾아 conventions/content/content-cli.mjs에 넘긴다. 도구는 공통 한 곳에서 고친다.
// 찾는 순서: 옆 폴더(../loworld-common) → node_modules/@loworld/common. 앱의 scripts/prepare.mjs와 같다.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const common = [path.resolve(root, '../loworld-common'), path.join(root, 'node_modules/@loworld/common')].find((p) => fs.existsSync(path.join(p, 'conventions/content/content-cli.mjs')));
if (!common) {
  console.error('공통 저장소가 없다. loworld-common을 이 폴더 옆에 받는다: git clone git@github.com:loworldsoft-ops/loworld-common.git ../loworld-common');
  process.exit(1);
}
const r = spawnSync(process.execPath, [path.join(common, 'conventions/content/content-cli.mjs'), ...process.argv.slice(2), root], { stdio: 'inherit' });
process.exit(r.status ?? 1);
