// conventions/content/content-cli.mjs
// 콘텐츠 저장소(loworld-content-*)의 검사, 빌드, 압축, 가져오기 도구.
// Node.js 내장 모듈만 사용. 압축은 시스템 zip/unzip 사용 (macOS / Linux 전용).
import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePack } from './pack-compiler.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_CONTENT_MJS = path.join(HERE, 'template/scripts/content.mjs');

function sha256File(filePath) {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function walkFiles(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, base, out);
    } else {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

/** `release`면 승인 안 된 문장(draft: true)이 하나라도 있는 팩을 막는다. 출시 판에는 사람이 승인한 문장만 들어간다(W9 D6) */
export function checkContentRepo(root, { release = false } = {}) {
  const errors = [];
  const warnings = [];
  const notices = [];

  // 1. content.json 검사
  const contentJsonPath = path.join(root, 'content.json');
  if (!fs.existsSync(contentJsonPath)) {
    errors.push('content.json 파일이 없다');
    return { ok: false, errors, warnings, notices };
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));
  } catch (e) {
    errors.push(`content.json 파싱 실패: ${e.message}`);
    return { ok: false, errors, warnings, notices };
  }

  if (typeof manifest.schema !== 'number') errors.push('content.json: schema 필드가 숫자형이 아니다');
  if (!manifest.id || typeof manifest.id !== 'string') errors.push('content.json: id 필드가 없다');
  if (!manifest.version || !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
    errors.push(`content.json: version '${manifest.version}'이 유효한 semver가 아니다`);
  }
  if (!manifest.title || typeof manifest.title !== 'string') errors.push('content.json: title 필드가 없다');
  if (!Array.isArray(manifest.packs)) errors.push('content.json: packs 필드가 배열이 아니다');
  if (!manifest.codex || typeof manifest.codex !== 'object') errors.push('content.json: codex 필드가 없다');
  if (manifest.codex && !Array.isArray(manifest.codex.files)) errors.push('content.json: codex.files가 배열이 아니다');
  if (!manifest.assets || typeof manifest.assets !== 'object') errors.push('content.json: assets 필드가 없다');

  // 2. 팩 검사
  if (Array.isArray(manifest.packs)) {
    for (const packId of manifest.packs) {
      const packDir = path.join(root, 'packs', packId);
      if (!fs.existsSync(packDir)) {
        errors.push(`팩 폴더가 없다: packs/${packId}`);
        continue;
      }
      try {
        const { problems, notices: packNotices, drafts } = compilePack(packDir);
        if (packNotices && packNotices.length > 0) {
          notices.push(...packNotices);
        }
        if (release && drafts && drafts.length > 0) {
          errors.push(`팩 ${packId}: 출시 판에 승인 안 된 문장(draft: true)이 ${drafts.length}곳 있다 — ${drafts.slice(0, 10).join(', ')}${drafts.length > 10 ? ' …' : ''}`);
        }
        if (problems && problems.length > 0) {
          for (const p of problems) {
            const msg = typeof p === 'string' ? p : `${p.file ? p.file + ': ' : ''}${p.message}`;
            errors.push(`팩 ${packId} 오류: ${msg}`);
          }
        }
      } catch (e) {
        errors.push(`팩 ${packId} 컴파일 예외: ${e.message}`);
      }
    }
  }

  // 3. codex 파일 검사
  const codexDir = path.join(root, 'codex');
  if (manifest.codex && Array.isArray(manifest.codex.files)) {
    for (const file of manifest.codex.files) {
      const fullPath = path.join(codexDir, file);
      if (!fs.existsSync(fullPath)) {
        errors.push(`codex.files에 나열된 파일이 없다: codex/${file}`);
        continue;
      }
      if (file.endsWith('.csv')) {
        const header = fs.readFileSync(fullPath, 'utf8').split('\n')[0].trim();
        if (!header.startsWith('group,legacyId,legacyEn,legacyKo,name,meaning,draft')) {
          errors.push(`codex/${file} CSV 머리줄 불일치: 기대 group,legacyId,legacyEn,legacyKo,name,meaning,draft`);
        }
      } else {
        try {
          JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        } catch (e) {
          errors.push(`codex/${file} JSON 파싱 실패: ${e.message}`);
        }
      }
    }

    if (fs.existsSync(codexDir)) {
      const actualFiles = walkFiles(codexDir);
      const expectedSet = new Set(manifest.codex.files.map((f) => f.split(path.sep).join('/')));
      for (const f of actualFiles) {
        if (!expectedSet.has(f)) {
          errors.push(`codex/에 목록에 없는 파일이 있다: codex/${f}`);
        }
      }
    }

    checkLegacyNames(root, manifest, errors);
  }

  // 4. 저장소 내 비허용 코드 파일 검사
  const allFiles = walkFiles(root);
  const templateScriptContent = fs.existsSync(TEMPLATE_CONTENT_MJS) ? fs.readFileSync(TEMPLATE_CONTENT_MJS, 'utf8') : '';

  for (const rel of allFiles) {
    if (rel.startsWith('.git/') || rel.startsWith('node_modules/') || rel.startsWith('dist/')) continue;
    if (/\.(ts|js|mjs|cjs)$/.test(rel)) {
      if (rel === 'scripts/content.mjs') {
        const actual = fs.readFileSync(path.join(root, rel), 'utf8');
        if (templateScriptContent && actual !== templateScriptContent) {
          errors.push('scripts/content.mjs가 공통 템플릿과 글자까지 같아야 한다');
        }
      } else {
        errors.push(`허용되지 않은 스크립트/코드 파일이 있다: ${rel}`);
      }
    }
  }

  // 5. git ls-files 이미지 파일 검사
  try {
    const gitFiles = execSync('git ls-files', { cwd: root, stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' }).split('\n').filter(Boolean);
    const imgExts = /\.(png|jpg|jpeg|webp|gif|svg|avif)$/i;
    for (const gf of gitFiles) {
      if (imgExts.test(gf)) {
        errors.push(`git에 그림 파일이 올라가 있다: ${gf}`);
      }
    }
  } catch {
    // git repo가 아닐 수 있음
  }

  // 6. assets 검사
  const assetsDir = path.join(root, 'assets');
  const lockPath = path.join(root, 'assets.lock.json');
  if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(lockPath)) {
      errors.push('assets/ 폴더가 있지만 assets.lock.json 파일이 없다');
    } else {
      let lockData;
      try {
        lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      } catch (e) {
        errors.push(`assets.lock.json 파싱 실패: ${e.message}`);
      }
      if (lockData && Array.isArray(lockData.files)) {
        for (const item of lockData.files) {
          const itemPath = path.join(assetsDir, item.path);
          if (!fs.existsSync(itemPath)) {
            errors.push(`assets.lock.json에 있는 그림 파일이 없다: assets/${item.path}`);
            continue;
          }
          const stat = fs.statSync(itemPath);
          if (stat.size !== item.bytes) {
            errors.push(`assets/${item.path} 크기 불일치: 기대 ${item.bytes}, 실제 ${stat.size}`);
          }
          const actualSha = sha256File(itemPath);
          if (actualSha !== item.sha256) {
            errors.push(`assets/${item.path} sha256 불일치: 기대 ${item.sha256}, 실제 ${actualSha}`);
          }
        }
      }
    }

    // 7. 그림 연결 및 placeholder 검사
    if (manifest.assets) {
      const placeholderRel = manifest.assets.placeholder || '_placeholder.svg';
      if (!fs.existsSync(path.join(assetsDir, placeholderRel))) {
        errors.push(`자리 표시 그림이 없다: assets/${placeholderRel}`);
      }

      // codex JSON 내 그림 참조 수집
      if (manifest.codex && Array.isArray(manifest.codex.files)) {
        const missingRefs = new Set();
        for (const cfile of manifest.codex.files) {
          const contentStr = fs.readFileSync(path.join(codexDir, cfile), 'utf8');
          // Match /assets/ or assets/ paths
          for (const match of contentStr.matchAll(/["'](?:\/assets\/|assets\/)([^"']+\.(?:png|jpg|jpeg|webp|svg|gif))["']/gi)) {
            const assetPath = match[1];
            if (!fs.existsSync(path.join(assetsDir, assetPath))) {
              missingRefs.add(assetPath);
            }
          }
        }
        if (missingRefs.size > 0) {
          const first10 = [...missingRefs].slice(0, 10);
          warnings.push(`도감이 가리키는 그림 중 ${missingRefs.size}개가 assets/에 없다 (자리 표시로 대체): ${first10.join(', ')}...`);
        }
      }
    }
  } else {
    warnings.push('그림이 없다. npm run assets:pull');
  }

  return { ok: errors.length === 0, errors, warnings, notices };
}

export function buildContentRepo(root, { release = false } = {}) {
  const check = checkContentRepo(root, { release });
  if (!check.ok) {
    console.error('검사 실패로 빌드를 중단합니다:\n' + check.errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }
  if (check.notices && check.notices.length > 0) {
    console.log('알림:\n' + check.notices.map((n) => `  - ${n}`).join('\n'));
  }
  if (check.warnings.length > 0) {
    console.warn('경고:\n' + check.warnings.map((w) => `  - ${w}`).join('\n'));
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
  const dist = path.join(root, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  // 1. _headers
  const headers = `/*\n  Access-Control-Allow-Origin: *\n/0.*\n  Cache-Control: public, max-age=31536000, immutable\n/index.json\n  Cache-Control: public, max-age=60\n`;
  fs.writeFileSync(path.join(dist, '_headers'), headers);

  // 2. index.json
  const indexJson = {
    id: manifest.id,
    current: manifest.version,
    versions: [manifest.version],
  };
  fs.writeFileSync(path.join(dist, 'index.json'), JSON.stringify(indexJson, null, 2) + '\n');

  // 3. <version>/
  const verDir = path.join(dist, manifest.version);
  fs.mkdirSync(verDir, { recursive: true });

  // content.json
  fs.copyFileSync(path.join(root, 'content.json'), path.join(verDir, 'content.json'));

  // packs
  for (const packId of manifest.packs) {
    const packOut = path.join(verDir, 'packs', packId);
    fs.mkdirSync(packOut, { recursive: true });
    const { pack } = compilePack(path.join(root, 'packs', packId));
    fs.writeFileSync(path.join(packOut, 'pack.compiled.json'), JSON.stringify(pack));
  }

  // codex
  for (const cfile of manifest.codex.files) {
    const src = path.join(root, 'codex', cfile);
    const dest = path.join(verDir, 'codex', cfile);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }

  // assets
  const assetsDir = path.join(root, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = walkFiles(assetsDir);
    for (const f of files) {
      const src = path.join(assetsDir, f);
      const dest = path.join(verDir, 'assets', f);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  console.log(`빌드 완료: dist/${manifest.version} (${manifest.packs.length}개 팩, ${manifest.codex.files.length}개 도감)`);
}

export function packAssets(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
  const assetsDir = path.join(root, 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.error('assets/ 폴더가 없다');
    process.exit(1);
  }

  const filesRel = walkFiles(assetsDir).sort();
  const fileEntries = [];
  for (const rel of filesRel) {
    const full = path.join(assetsDir, rel);
    const stat = fs.statSync(full);
    fileEntries.push({
      path: rel,
      bytes: stat.size,
      sha256: sha256File(full),
    });
  }

  const zipName = `${manifest.id}-assets-${manifest.version}.zip`;
  const zipPath = path.join(root, zipName);
  fs.rmSync(zipPath, { force: true });

  const r = spawnSync('zip', ['-r', '-X', '-q', zipPath, 'assets'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('zip 명령 실패');
    process.exit(r.status ?? 1);
  }

  const zipStat = fs.statSync(zipPath);
  const zipSha = sha256File(zipPath);

  const lockPath = path.join(root, 'assets.lock.json');
  let oldLock = {};
  if (fs.existsSync(lockPath)) {
    try {
      oldLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    } catch {}
  }
  const driveUrl = oldLock.archives?.assets?.driveUrl || '';

  const lockData = {
    version: manifest.version,
    files: fileEntries,
    archives: {
      assets: {
        file: zipName,
        bytes: zipStat.size,
        sha256: zipSha,
        driveUrl,
      },
    },
  };
  fs.writeFileSync(lockPath, JSON.stringify(lockData, null, 2) + '\n');
  console.log(`압축 및 assets.lock.json 작성 완료: ${zipName} (${fileEntries.length}개 파일, ${(zipStat.size / (1024 * 1024)).toFixed(1)}MB)`);
}

export async function pullAssets(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
  const lockPath = path.join(root, 'assets.lock.json');
  if (!fs.existsSync(lockPath)) {
    console.error('assets.lock.json이 없다');
    process.exit(1);
  }
  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const assetsDir = path.join(root, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const defaultBase = `https://loworld-content-${manifest.id}.pages.dev`;
  const base = (process.env.LW_CONTENT_BASE_URL || defaultBase).replace('{id}', manifest.id);

  console.log(`그림 다운로드 시작: ${base}/${manifest.version}/assets/...`);
  let downloaded = 0;
  let skipped = 0;

  for (const item of lockData.files) {
    const dest = path.join(assetsDir, item.path);
    if (fs.existsSync(dest)) {
      if (fs.statSync(dest).size === item.bytes && sha256File(dest) === item.sha256) {
        skipped += 1;
        continue;
      }
    }
    const url = `${base}/${manifest.version}/assets/${item.path}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      if (sha256File(dest) !== item.sha256) {
        fs.rmSync(dest, { force: true });
        throw new Error(`지문 불일치`);
      }
      downloaded += 1;
    } catch (e) {
      console.error(`다운로드 실패 (${item.path}): ${e.message}`);
      const drive = lockData.archives?.assets?.driveUrl;
      if (drive) {
        console.error(`드라이브 보관본에서 수동으로 받으십시오: ${drive}`);
      }
      process.exit(1);
    }
  }
  console.log(`그림 가져오기 완료: 다운로드 ${downloaded}개, 건너뜀 ${skipped}개`);
}

export function checkLegacyNames(root, manifest, errors) {
  const codexDir = path.join(root, 'codex');
  if (!manifest.codex || !Array.isArray(manifest.codex.files)) return;
  const namingFile = manifest.codex.files.find((f) => f.endsWith('naming.csv') || f === 'naming.csv');
  if (!namingFile) return;
  const namingPath = path.join(codexDir, namingFile);
  if (!fs.existsSync(namingPath)) return;

  const lines = fs.readFileSync(namingPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return;

  const rules = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;
    const [group, , legacyEn, legacyKo, name] = cols;
    if (group === 'rune') {
      if (legacyEn) {
        rules.push({ legacy: legacyEn, name, regex: new RegExp(`\\b${legacyEn}\\b`, 'i') });
      }
      if (legacyKo) {
        const particleSuffix = '(?:[을를이가은는의에과와도만]|으로|로)?(?=[^가-힣]|$)';
        if (legacyKo.length === 1) {
          rules.push({
            legacy: `${legacyKo} 룬`,
            name,
            regex: new RegExp(`(?<=[^가-힣]|^)${legacyKo}\\s*룬${particleSuffix}`, 'g'),
          });
        } else {
          rules.push({
            legacy: legacyKo,
            name,
            regex: new RegExp(`(?<=[^가-힣]|^)${legacyKo}${particleSuffix}`, 'g'),
          });
        }
      }
    } else if (group === 'rarity') {
      const particleSuffix = '(?:[을를이가은는의에과와도만]|으로|로)?(?=[^가-힣]|$)';
      if (legacyKo && !['일반', '고유', '세트'].includes(legacyKo)) {
        rules.push({
          legacy: legacyKo,
          name,
          regex: new RegExp(`(?<=[^가-힣]|^)${legacyKo}${particleSuffix}`, 'g'),
        });
      }
      if (legacyEn && !['normal', 'unique', 'set'].includes(legacyEn)) {
        rules.push({
          legacy: legacyEn,
          name,
          regex: new RegExp(`\\b${legacyEn}\\b`, 'i'),
        });
      }
    }
  }

  if (rules.length === 0 || !Array.isArray(manifest.packs)) return;

  for (const packId of manifest.packs) {
    const packDir = path.join(root, 'packs', packId);
    if (!fs.existsSync(packDir)) continue;

    function checkText(text, relPath, lineNum) {
      for (const r of rules) {
        r.regex.lastIndex = 0;
        if (r.regex.test(text)) {
          errors.push(`팩 ${packId}: ${relPath}:${lineNum} 옛 이름 "${r.legacy}"이 있다. naming.csv의 무협 이름(${r.name})을 쓴다`);
        }
      }
    }

    // 1. episodes, interludes, origins
    for (const dirName of ['episodes', 'interludes', 'origins']) {
      const d = path.join(packDir, dirName);
      if (!fs.existsSync(d)) continue;
      for (const f of fs.readdirSync(d)) {
        if (!f.endsWith('.md')) continue;
        const full = path.join(d, f);
        const content = fs.readFileSync(full, 'utf8');
        const mLines = content.split('\n');
        let inFrontmatter = false;
        for (let i = 0; i < mLines.length; i++) {
          const line = mLines[i];
          if (i === 0 && line.trim() === '---') {
            inFrontmatter = true;
            continue;
          }
          if (inFrontmatter) {
            if (line.trim() === '---') inFrontmatter = false;
            continue;
          }
          const lineClean = line.replace(/\{\{[^}]*\}\}/g, ' ').replace(/\{[^}]*\}\s*$/, '');
          checkText(lineClean, `${dirName}/${f}`, i + 1);
        }
      }
    }

    // 2. traits.csv
    const traitsPath = path.join(packDir, 'traits.csv');
    if (fs.existsSync(traitsPath)) {
      const tLines = fs.readFileSync(traitsPath, 'utf8').split('\n');
      const header = tLines[0].split(',');
      const nameIdx = header.indexOf('name');
      const descIdx = header.indexOf('description');
      const phrasesIdx = header.indexOf('phrases');
      for (let i = 1; i < tLines.length; i++) {
        const line = tLines[i];
        if (!line.trim()) continue;
        const cols = line.split(',');
        if (nameIdx !== -1 && cols[nameIdx]) checkText(cols[nameIdx], 'traits.csv', i + 1);
        if (descIdx !== -1 && cols[descIdx]) checkText(cols[descIdx], 'traits.csv', i + 1);
        if (phrasesIdx !== -1 && cols[phrasesIdx]) {
          const pairs = cols[phrasesIdx].split(';');
          for (const pair of pairs) {
            const eqIdx = pair.indexOf('=');
            const val = eqIdx !== -1 ? pair.slice(eqIdx + 1) : pair;
            checkText(val, 'traits.csv', i + 1);
          }
        }
      }
    }

    // 3. cast.csv
    const castPath = path.join(packDir, 'cast.csv');
    if (fs.existsSync(castPath)) {
      const cLines = fs.readFileSync(castPath, 'utf8').split('\n');
      const header = cLines[0].split(',');
      const nameIdx = header.indexOf('name');
      for (let i = 1; i < cLines.length; i++) {
        const line = cLines[i];
        if (!line.trim()) continue;
        const cols = line.split(',');
        if (nameIdx !== -1 && cols[nameIdx]) checkText(cols[nameIdx], 'cast.csv', i + 1);
      }
    }

    // 4. combinations.json
    const combPath = path.join(packDir, 'combinations.json');
    if (fs.existsSync(combPath)) {
      const cLines = fs.readFileSync(combPath, 'utf8').split('\n');
      for (let i = 0; i < cLines.length; i++) {
        const m = cLines[i].match(/"name"\s*:\s*"([^"]+)"/);
        if (m) checkText(m[1], 'combinations.json', i + 1);
      }
    }

    // 5. shops.json
    const shopPath = path.join(packDir, 'shops.json');
    if (fs.existsSync(shopPath)) {
      const sLines = fs.readFileSync(shopPath, 'utf8').split('\n');
      for (let i = 0; i < sLines.length; i++) {
        const m = sLines[i].match(/"name"\s*:\s*"([^"]+)"/);
        if (m) checkText(m[1], 'shops.json', i + 1);
      }
    }
  }
}

// ── CLI Main ────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) {
    const selftestPath = path.join(HERE, 'content-cli.selftest.mjs');
    const r = spawnSync(process.execPath, [selftestPath], { stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }

  // 템플릿(scripts/content.mjs)은 저장소 폴더를 맨 뒤에 붙인다. `build --release`처럼 깃발이 사이에 올 수 있다.
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const [cmd, dirArg] = args.filter((arg) => !arg.startsWith('--'));
  const root = dirArg ? path.resolve(dirArg) : process.cwd();
  const release = flags.has('--release');

  switch (cmd) {
    case 'check': {
      const res = checkContentRepo(root, { release });
      if (res.notices && res.notices.length > 0) {
        console.log('알림:\n' + res.notices.map((n) => `  - ${n}`).join('\n'));
      }
      if (res.warnings.length > 0) {
        console.warn('경고:\n' + res.warnings.map((w) => `  - ${w}`).join('\n'));
      }
      if (!res.ok) {
        console.error('검사 실패:\n' + res.errors.map((e) => `  - ${e}`).join('\n'));
        process.exit(1);
      }
      console.log('콘텐츠 검사 통과');
      break;
    }
    case 'build': {
      buildContentRepo(root, { release });
      break;
    }
    case 'watch': {
      console.log('팩 변경 감시 시작...');
      buildContentRepo(root);
      const packsDir = path.join(root, 'packs');
      let timer = null;
      fs.watch(packsDir, { recursive: true }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          console.log('팩 변경 감지, 다시 빌드합니다.');
          try { buildContentRepo(root); } catch (e) { console.error(e.message); }
        }, 150);
      });
      break;
    }
    case 'assets:pack': {
      packAssets(root);
      break;
    }
    case 'assets:pull': {
      await pullAssets(root);
      break;
    }
    default: {
      console.error(`알 수 없는 명령: ${cmd}\n사용법: content-cli.mjs <check|build|watch|assets:pack|assets:pull|--self-test> [--release] [폴더]`);
      process.exit(1);
    }
  }
}
