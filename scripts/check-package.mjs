#!/usr/bin/env node
// 네이티브 패키지(www 묶음 또는 www.zip)의 오프라인 및 자원 분리 적합성을 검사한다.
//   node scripts/check-package.mjs <묶음 폴더 또는 www.zip> <앱 id>
//   node scripts/check-package.mjs --self-test
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 워크스페이스에서 다른 앱의 식별자 및 공통 자원 폴더 목록을 동적으로 수집한다 */
export function getOtherAppIdentifiers(currentAppId) {
  const otherIds = new Set();
  const normalizedCurrent = currentAppId ? currentAppId.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  // 1. 워크스페이스의 loworld-app-* 탐색
  for (const name of readdirSync(root)) {
    const match = /^loworld-app-(.+)$/.exec(name);
    if (!match) continue;
    const folderSuffix = match[1];
    let manifestId = folderSuffix;
    const manifestPath = join(root, name, 'src', 'manifest.ts');
    if (existsSync(manifestPath)) {
      try {
        const content = readFileSync(manifestPath, 'utf8');
        const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
        if (idMatch) manifestId = idMatch[1];
      } catch {
        // manifest 읽기 실패 시 folderSuffix 사용
      }
    }
    const norm = manifestId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm !== normalizedCurrent) {
      otherIds.add(manifestId.toLowerCase());
      otherIds.add(norm);
      otherIds.add(folderSuffix.toLowerCase());
    }
  }

  // 2. loworld-common/public/assets의 앱별 폴더 탐색
  const commonAssetsDir = join(root, 'loworld-common', 'public', 'assets');
  if (existsSync(commonAssetsDir)) {
    for (const entry of readdirSync(commonAssetsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dName = entry.name.toLowerCase();
      // 공통 범용 폴더(fonts, icons 등)는 제외하고 앱 특화 폴더 수집
      if (['fonts', 'icons', 'media'].includes(dName)) continue;
      const norm = dName.replace(/[^a-z0-9]/g, '');
      if (norm !== normalizedCurrent) {
        otherIds.add(dName);
        otherIds.add(norm);
      }
    }
  }

  // eznote, ezcalendar 등 잘 알려진 레거시 식별자도 추가
  if (normalizedCurrent !== 'note' && normalizedCurrent !== 'eznote') {
    otherIds.add('eznote');
  }
  if (normalizedCurrent !== 'calendar' && normalizedCurrent !== 'ezcalendar') {
    otherIds.add('ezcalendar');
  }

  return otherIds;
}

/** 디렉토리 내의 모든 파일 경로를 재귀 탐색 */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 묶음 디렉토리를 검사한다.
 * @param {string} targetDir www 디렉토리 경로
 * @param {string} appId 앱 id
 * @param {string[]|null} declaredAssets manifest.native.assets 목록 (옵션)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function checkPackageDir(targetDir, appId, declaredAssets = null) {
  const errors = [];
  const otherAppIds = getOtherAppIdentifiers(appId);

  // 선언서에서 declaredAssets를 전달받지 않은 경우 직접 탐색
  if (declaredAssets === null && appId && appId !== 'overview') {
    const manifestPath = join(root, `loworld-app-${appId}`, 'src', 'manifest.ts');
    if (existsSync(manifestPath)) {
      try {
        const content = readFileSync(manifestPath, 'utf8');
        const assetsMatch = content.match(/assets:\s*\[([\s\S]*?)\]/);
        if (assetsMatch) {
          declaredAssets = [...assetsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
        }
      } catch {
        // 읽기 실패 시 무시
      }
    }
  }

  const allFiles = walk(targetDir);

  // (가) index.html과 *.css에 http://, https://로 외부 자원을 요청하는 구문이 있는지 확인
  const allowedNamespaces = ['http://www.w3.org/'];
  for (const file of allFiles) {
    const isHtml = file.endsWith('index.html');
    const isCss = file.endsWith('.css');
    if (!isHtml && !isCss) continue;

    const content = readFileSync(file, 'utf8');
    const relFile = relative(targetDir, file);

    // CSS @import / url()
    const urlMatches = content.matchAll(/(?:@import\s+(?:url\()?|url\(\s*)['"]?(https?:\/\/[^'")\s]+)['"]?\)?/gi);
    for (const match of urlMatches) {
      const url = match[1];
      if (allowedNamespaces.some((ns) => url.startsWith(ns))) continue;
      errors.push(`[규칙 가] 외부 URL 참조 발견 (${relFile}): ${url}`);
    }

    // HTML <link href="http..."> / <script src="http...">
    if (isHtml) {
      const tagMatches = content.matchAll(/<(?:link|script)\b[^>]+(?:href|src)\s*=\s*['"](https?:\/\/[^'"]+)['"]/gi);
      for (const match of tagMatches) {
        const url = match[1];
        if (allowedNamespaces.some((ns) => url.startsWith(ns))) continue;
        errors.push(`[규칙 가] 외부 리소스 링크 발견 (${relFile}): ${url}`);
      }
    }
  }

  // (나) assets/ 아래 경로에 다른 앱 id가 포함되어 있는지 확인
  const assetsDir = join(targetDir, 'assets');
  if (existsSync(assetsDir)) {
    const assetFiles = walk(assetsDir);
    for (const file of assetFiles) {
      const relAsset = relative(assetsDir, file);
      const segments = relAsset.toLowerCase().split(/[/\\]/);
      for (const segment of segments) {
        if (otherAppIds.has(segment)) {
          errors.push(`[규칙 나] 다른 앱의 자원 발견 (assets/${relAsset}): '${segment}' 포함`);
          break;
        }
      }
    }
  }

  // (다) 선언서 native.assets가 고르지 않은 경로가 assets/ 아래에 있는지 확인
  if (declaredAssets && Array.isArray(declaredAssets) && existsSync(assetsDir)) {
    const normalizedDeclared = declaredAssets.map((p) => p.replace(/^\/+|\/+$/g, '').toLowerCase());
    const assetFiles = walk(assetsDir);
    for (const file of assetFiles) {
      const relAsset = relative(assetsDir, file).replace(/\\/g, '/').toLowerCase();
      const isAllowed = normalizedDeclared.some(
        (decl) => relAsset === decl || relAsset.startsWith(decl + '/')
      );
      if (!isAllowed) {
        errors.push(`[규칙 다] 선언서에 없는 자원 파일 발견 (assets/${relAsset})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** 자체 시험 (--self-test) */
export function runSelfTest() {
  console.log('[check-package] 자체 시험 시작...');
  const tmpBase = mkdtempSync(join(os.tmpdir(), 'check-package-test-'));

  try {
    // 1. 정상 패키지 시험
    const validDir = join(tmpBase, 'valid');
    mkdirSync(join(validDir, 'assets', 'fonts', 'pretendard'), { recursive: true });
    writeFileSync(join(validDir, 'index.html'), '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>');
    writeFileSync(join(validDir, 'styles.css'), 'body { font-family: Pretendard; }');
    writeFileSync(join(validDir, 'assets', 'fonts', 'pretendard', 'Pretendard-Regular.woff2'), 'FONT_DATA');

    const resValid = checkPackageDir(validDir, 'story-math', ['fonts/pretendard']);
    if (!resValid.valid) {
      throw new Error(`정상 패키지에서 실패: ${resValid.errors.join(', ')}`);
    }

    // 2. 규칙 (가) 위반: 외부 url 및 link href
    const invalidGaDir = join(tmpBase, 'invalid-ga');
    mkdirSync(invalidGaDir, { recursive: true });
    writeFileSync(
      join(invalidGaDir, 'index.html'),
      '<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Montserrat"></head><body></body></html>'
    );
    writeFileSync(join(invalidGaDir, 'styles.css'), '@import url("https://cdn.jsdelivr.net/pretendard.css");');

    const resGa = checkPackageDir(invalidGaDir, 'story-math', []);
    if (resGa.valid || resGa.errors.length !== 2) {
      throw new Error(`규칙 (가) 검출 실패: 에러 수 ${resGa.errors.length} (기대값: 2)`);
    }

    // 3. 규칙 (나) 위반: 다른 앱 id (wallpapers, eznote)
    const invalidNaDir = join(tmpBase, 'invalid-na');
    mkdirSync(join(invalidNaDir, 'assets', 'wallpapers'), { recursive: true });
    mkdirSync(join(invalidNaDir, 'assets', 'eznote'), { recursive: true });
    writeFileSync(join(invalidNaDir, 'index.html'), '<html></html>');
    writeFileSync(join(invalidNaDir, 'assets', 'wallpapers', 'bg.png'), 'IMG');
    writeFileSync(join(invalidNaDir, 'assets', 'eznote', 'icon.png'), 'ICON');

    const resNa = checkPackageDir(invalidNaDir, 'story-math', ['wallpapers', 'eznote']);
    if (resNa.valid || resNa.errors.length !== 2) {
      throw new Error(`규칙 (나) 검출 실패: 에러 수 ${resNa.errors.length} (기대값: 2)`);
    }

    // 4. 규칙 (다) 위반: 선언서에 없는 경로 포함
    const invalidDaDir = join(tmpBase, 'invalid-da');
    mkdirSync(join(invalidDaDir, 'assets', 'fonts', 'pretendard'), { recursive: true });
    mkdirSync(join(invalidDaDir, 'assets', 'extra'), { recursive: true });
    writeFileSync(join(invalidDaDir, 'index.html'), '<html></html>');
    writeFileSync(join(invalidDaDir, 'assets', 'fonts', 'pretendard', 'font.woff2'), 'FONT');
    writeFileSync(join(invalidDaDir, 'assets', 'extra', 'unused.txt'), 'EXTRA');

    const resDa = checkPackageDir(invalidDaDir, 'story-math', ['fonts/pretendard']);
    if (resDa.valid || resDa.errors.length !== 1) {
      throw new Error(`규칙 (다) 검출 실패: 에러 수 ${resDa.errors.length} (기대값: 1)`);
    }

    console.log('✅ [check-package] 자체 시험 통과 (가, 나, 다 검증 완료)');
    return true;
  } finally {
    rmSync(tmpBase, { recursive: true, force: true });
  }
}

// CLI 실행 처리
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) {
    try {
      runSelfTest();
      process.exit(0);
    } catch (err) {
      console.error(`❌ 자체 시험 실패: ${err.message}`);
      process.exit(1);
    }
  }

  const targetArg = process.argv[2];
  const appId = process.argv[3];

  if (!targetArg) {
    console.error('사용법: node scripts/check-package.mjs <묶음 폴더 또는 www.zip> [앱 id]');
    console.error('예:     node scripts/check-package.mjs dist/package/story-math/www.zip story-math');
    console.error('        node scripts/check-package.mjs --self-test');
    process.exit(1);
  }

  let inspectDir = resolve(targetArg);
  let cleanupTmp = null;

  if (!existsSync(inspectDir)) {
    console.error(`대상을 찾을 수 없습니다: ${inspectDir}`);
    process.exit(1);
  }

  if (statSync(inspectDir).isFile() && inspectDir.endsWith('.zip')) {
    cleanupTmp = mkdtempSync(join(os.tmpdir(), 'lw-check-zip-'));
    try {
      execFileSync('unzip', ['-q', inspectDir, '-d', cleanupTmp]);
      inspectDir = cleanupTmp;
    } catch (err) {
      console.error(`ZIP 압축 해제 실패: ${err.message}`);
      if (cleanupTmp) rmSync(cleanupTmp, { recursive: true, force: true });
      process.exit(1);
    }
  }

  try {
    console.log(`[check-package] 검사 대상: ${targetArg} (앱: ${appId ?? '미지정'})`);
    const { valid, errors } = checkPackageDir(inspectDir, appId);
    if (!valid) {
      console.error(`\n❌ [check-package] 검사 실패 (${errors.length}건):`);
      for (const err of errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }
    console.log('✅ [check-package] 모든 규칙 통과 (가: 오프라인 완전, 나: 타 앱 자원 배제, 다: 선언 자원 일치)');
  } finally {
    if (cleanupTmp) {
      rmSync(cleanupTmp, { recursive: true, force: true });
    }
  }
}
