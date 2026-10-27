// conventions/content/content-cli.selftest.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { checkContentRepo, buildContentRepo } from './content-cli.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_CONTENT_MJS = path.join(HERE, 'template/scripts/content.mjs');

function setupTestRepo(dir) {
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'packs/test-pack'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'codex'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });

  const manifest = {
    schema: 1,
    id: 'test',
    version: '0.1.0',
    title: '테스트 작품',
    packs: ['test-pack'],
    codex: {
      schema: 'legacy-novel-1',
      files: ['sample.json'],
    },
    assets: {
      placeholder: '_placeholder.svg',
      portraits: 'portraits',
    },
  };
  fs.writeFileSync(path.join(dir, 'content.json'), JSON.stringify(manifest, null, 2));

  // scripts/content.mjs
  fs.copyFileSync(TEMPLATE_CONTENT_MJS, path.join(dir, 'scripts/content.mjs'));

  // packs/test-pack/pack.json
  const packMeta = {
    id: 'test-pack',
    title: '테스트 팩',
    version: 1,
    episodes: [],
  };
  fs.writeFileSync(path.join(dir, 'packs/test-pack/pack.json'), JSON.stringify(packMeta));

  // codex/sample.json
  fs.writeFileSync(path.join(dir, 'codex/sample.json'), JSON.stringify({ item: 'test', icon: '/assets/icon.png' }));

  // assets/_placeholder.svg
  const placeholderPath = path.join(dir, 'assets/_placeholder.svg');
  fs.writeFileSync(placeholderPath, '<svg></svg>');

  // assets.lock.json
  const lockData = {
    version: '0.1.0',
    files: [
      {
        path: '_placeholder.svg',
        bytes: fs.statSync(placeholderPath).size,
        sha256: createHash('sha256').update(fs.readFileSync(placeholderPath)).digest('hex'),
      },
    ],
    archives: {},
  };
  fs.writeFileSync(path.join(dir, 'assets.lock.json'), JSON.stringify(lockData, null, 2));
}

export function runSelfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-cli-test-'));
  let passed = true;

  try {
    setupTestRepo(tmp);

    // 1. 정상 저장소는 통과
    const res1 = checkContentRepo(tmp);
    if (!res1.ok) {
      console.error('자체시험 1 실패: 정상 저장소가 실패함', res1.errors);
      passed = false;
    }

    // 2. content.json의 version 빠짐 -> 실패
    const contentPath = path.join(tmp, 'content.json');
    const origContent = fs.readFileSync(contentPath, 'utf8');
    const m2 = JSON.parse(origContent);
    delete m2.version;
    fs.writeFileSync(contentPath, JSON.stringify(m2));
    const res2 = checkContentRepo(tmp);
    if (res2.ok) {
      console.error('자체시험 2 실패: version 누락이 통과됨');
      passed = false;
    }
    fs.writeFileSync(contentPath, origContent);

    // 3. codex에 목록 밖 파일 -> 실패
    fs.writeFileSync(path.join(tmp, 'codex/unlisted.json'), '{}');
    const res3 = checkContentRepo(tmp);
    if (res3.ok) {
      console.error('자체시험 3 실패: codex 미등록 파일이 통과됨');
      passed = false;
    }
    fs.rmSync(path.join(tmp, 'codex/unlisted.json'));

    // 4. .ts 파일 -> 실패
    fs.writeFileSync(path.join(tmp, 'test.ts'), 'export const x = 1;');
    const res4 = checkContentRepo(tmp);
    if (res4.ok) {
      console.error('자체시험 4 실패: .ts 파일이 통과됨');
      passed = false;
    }
    fs.rmSync(path.join(tmp, 'test.ts'));

    // 5. 템플릿과 다른 scripts/content.mjs -> 실패
    const scriptPath = path.join(tmp, 'scripts/content.mjs');
    fs.writeFileSync(scriptPath, '// modified');
    const res5 = checkContentRepo(tmp);
    if (res5.ok) {
      console.error('자체시험 5 실패: 변조된 scripts/content.mjs가 통과됨');
      passed = false;
    }
    fs.copyFileSync(TEMPLATE_CONTENT_MJS, scriptPath);

    // 6. 자리 표시 그림 없음 -> 실패
    const placeholder = path.join(tmp, 'assets/_placeholder.svg');
    fs.rmSync(placeholder);
    const res6 = checkContentRepo(tmp);
    if (res6.ok) {
      console.error('자체시험 6 실패: placeholder 없음이 통과됨');
      passed = false;
    }
    fs.writeFileSync(placeholder, '<svg></svg>');

    // 7. 지문이 다른 그림 -> 실패
    fs.writeFileSync(placeholder, '<svg modified></svg>');
    const res7 = checkContentRepo(tmp);
    if (res7.ok) {
      console.error('자체시험 7 실패: 지문 불일치가 통과됨');
      passed = false;
    }
    fs.writeFileSync(placeholder, '<svg></svg>');

    // 8. build 실행 및 dist 구조 확인
    buildContentRepo(tmp);
    const distVer = path.join(tmp, 'dist/0.1.0');
    if (!fs.existsSync(path.join(tmp, 'dist/_headers')) ||
        !fs.existsSync(path.join(tmp, 'dist/index.json')) ||
        !fs.existsSync(path.join(distVer, 'content.json')) ||
        !fs.existsSync(path.join(distVer, 'packs/test-pack/pack.compiled.json')) ||
        !fs.existsSync(path.join(distVer, 'codex/sample.json'))) {
      console.error('자체시험 8 실패: build 출력물이 올바르지 않음');
      passed = false;
    }

    // 9. naming.csv와 옛 이름이 있는 팩 -> 실패
    const namingCsvContent = `group,legacyId,legacyEn,legacyKo,name,meaning,draft\nrune,r13,Shael,샤엘,속인,신법의 인,true\nrune,r19,Fal,팔,역인,내력의 인,true\nrarity,magic,magic,매직,양품,마법 속성,true\n`;
    fs.writeFileSync(path.join(tmp, 'codex/naming.csv'), namingCsvContent);
    const m9 = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    m9.codex.files.push('naming.csv');
    fs.writeFileSync(contentPath, JSON.stringify(m9, null, 2));

    fs.mkdirSync(path.join(tmp, 'packs/test-pack/episodes'), { recursive: true });
    const epPath = path.join(tmp, 'packs/test-pack/episodes/ep001.md');
    fs.writeFileSync(epPath, `---\nid: ep001\nnumber: 1\ntitle: 테스트\n---\n\n## 起 · setting\n\n그는 샤엘을 발견했다.\n`);

    const res9 = checkContentRepo(tmp);
    if (res9.ok || !res9.errors.some((e) => e.includes('옛 이름 "샤엘"이 있다'))) {
      console.error('자체시험 9 실패: 옛 이름 검출 실패', res9.errors);
      passed = false;
    }

    // 10. 옛 이름을 무협 이름으로 바꿈 -> 통과
    fs.writeFileSync(epPath, `---\nid: ep001\nnumber: 1\ntitle: 테스트\n---\n\n## 起 · setting\n\n그는 속인을 발견했다.\n`);
    const res10 = checkContentRepo(tmp);
    if (!res10.ok) {
      console.error('자체시험 10 실패: 무협 이름으로 교체 후 통과해야 함', res10.errors);
      passed = false;
    }

    // 11. 한글 낱말 안에 든 한 글자(팔) -> 통과
    fs.writeFileSync(epPath, `---\nid: ep001\nnumber: 1\ntitle: 테스트\n---\n\n## 起 · setting\n\n그는 두 팔을 벌려 반겼다.\n`);
    const res11 = checkContentRepo(tmp);
    if (!res11.ok) {
      console.error('자체시험 11 실패: 낱말 안의 한 글자는 통과해야 함', res11.errors);
      passed = false;
    }

    // 12. 출시 판(--release): 승인 안 된 화가 있으면 막고, 그냥 검사는 통과한다 (W9 D6)
    fs.writeFileSync(epPath, `---\nid: ep001\nnumber: 1\ntitle: 테스트\ndraft: true\n---\n\n## 起 · setting\n\n임시 문장.\n`);
    const res12 = checkContentRepo(tmp);
    const res12r = checkContentRepo(tmp, { release: true });
    if (!res12.ok || res12r.ok || !res12r.errors.some((e) => e.includes('출시 판에 승인 안 된 문장'))) {
      console.error('자체시험 12 실패: 출시 판은 draft를 막아야 함', res12.errors, res12r.errors);
      passed = false;
    }

    // 13. 승인되면(draft 없음) 출시 판도 통과
    fs.writeFileSync(epPath, `---\nid: ep001\nnumber: 1\ntitle: 테스트\n---\n\n## 起 · setting\n\n승인된 문장.\n`);
    if (!checkContentRepo(tmp, { release: true }).ok) {
      console.error('자체시험 13 실패: draft가 없으면 출시 판이 통과해야 함');
      passed = false;
    }

  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (passed) {
    console.log('content-cli 자체 시험 통과');
  }
  return passed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runSelfTest() ? 0 : 1);
}
