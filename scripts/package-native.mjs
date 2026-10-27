#!/usr/bin/env node
// 앱 또는 쇼케이스를 빌드하여 네이티브 셸(LoworldUI-AOS, LoworldUI-IOS)에 넣을 묶음을 만든다.
//   node scripts/package-native.mjs <앱 id> [--name <앱 이름>] [--assets <폴더,폴더>]
//   선언서(manifest.ts)의 native가 있으면 그 설정(이름, 자원, 방향, 버전)을 먼저 쓴다.
//   --name, --assets를 주면 선언서보다 이긴다.
//   --assets는 묶음의 assets/ 아래에서 그 폴더들만 남긴다(APK 용량을 줄이려고).
// 산출물: dist/package/<앱 id>/www.zip
//        dist/package/<앱 id>/app.native.json
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipDirectory } from './zip.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appId = process.argv[2];
const nameAt = process.argv.indexOf('--name');
const nameArg = nameAt > 0 ? process.argv[nameAt + 1] : undefined;
const assetsAt = process.argv.indexOf('--assets');
const assetsArg = assetsAt > 0 ? process.argv[assetsAt + 1] : undefined;

if (!appId) {
  console.error('사용법: node scripts/package-native.mjs <앱 id 또는 overview>');
  console.error('예: node scripts/package-native.mjs story-math');
  console.error('예: node scripts/package-native.mjs overview');
  process.exit(1);
}

const isHost = appId === 'overview' || appId === 'host';
const targetDir = isHost ? join(root, 'loworld-overview') : join(root, `loworld-app-${appId}`);

if (!existsSync(targetDir)) {
  console.error(`대상 저장소를 찾을 수 없습니다: ${targetDir}`);
  process.exit(1);
}

// 선언서(manifest.ts)에서 native 설정을 읽는다.
let nativeSettings = null;
if (!isHost) {
  try {
    const manifestPath = join(targetDir, 'src', 'manifest.ts');
    if (existsSync(manifestPath)) {
      const mod = await import(manifestPath);
      nativeSettings = mod.manifest?.native ?? null;
    }
  } catch (err) {
    console.warn(`[package-native] manifest.ts 읽기 건너뜀: ${err?.message ?? err}`);
  }
}

const keepAssetList = assetsArg
  ? assetsArg.split(',').map((s) => s.trim()).filter(Boolean)
  : nativeSettings?.assets ? [...nativeSettings.assets] : null;

console.log(`[package-native] ${appId} 빌드 준비 중... (${targetDir})`);

// 1. 빌드 실행 (offline 설정 시 LW_ENV=offline 적용)
const buildEnv = nativeSettings?.offline
  ? { ...process.env, LW_ENV: 'offline' }
  : process.env;
execFileSync('npm', ['run', 'build'], { cwd: targetDir, stdio: 'inherit', env: buildEnv });

// 2. 브라우저 빌드 결과물 경로 탐색
const browserDir = isHost
  ? join(targetDir, 'dist', 'overview', 'browser')
  : join(targetDir, 'dist', 'app', 'browser');

if (!existsSync(browserDir)) {
  console.error(`빌드 산출물이 존재하지 않습니다: ${browserDir}`);
  process.exit(1);
}

// 2-1. 쓰지 않는 정적 자원을 뺀다(--assets 또는 manifest.native.assets, 서브경로 지원).
if (keepAssetList && keepAssetList.length > 0) {
  const assetsDir = join(browserDir, 'assets');
  if (existsSync(assetsDir)) {
    const targets = keepAssetList.map((p) => p.replace(/^\/+|\/+$/g, ''));
    function shouldKeep(rel) {
      for (const target of targets) {
        if (rel === target || rel.startsWith(target + '/') || target.startsWith(rel + '/')) {
          return true;
        }
      }
      return false;
    }

    function clean(dir, rel = '') {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
        const full = join(dir, entry.name);
        if (!shouldKeep(entryRel)) {
          rmSync(full, { recursive: true, force: true });
        } else if (entry.isDirectory()) {
          clean(full, entryRel);
          if (existsSync(full) && readdirSync(full).length === 0) {
            rmSync(full, { recursive: true, force: true });
          }
        }
      }
    }

    clean(assetsDir);
    console.log(`[package-native] assets/에서 남긴 자원: ${targets.join(', ')}`);
  }
}

// 3. 패키지 디렉토리 생성
const packageDir = join(root, 'dist', 'package', appId);
rmSync(packageDir, { recursive: true, force: true });
mkdirSync(packageDir, { recursive: true });

// 4. www.zip 압축
const zipPath = join(packageDir, 'www.zip');
const fileCount = zipDirectory(browserDir, zipPath);
console.log(`[package-native] ${fileCount}개 파일을 ${zipPath}로 압축 완료.`);

// 5. app.native.json 생성
const appName = nameArg ?? nativeSettings?.name ?? (isHost ? 'Loworld Overview' : `Loworld ${appId[0].toUpperCase() + appId.slice(1)}`);
// 패키지 id에는 '-'를 쓸 수 없다(안드로이드). story-math → storymath
const idPart = appId.replace(/[^A-Za-z0-9_]/g, '');
const androidPackageId = isHost ? 'com.loworld.overview' : `com.loworld.app.${idPart}`;
const iosBundleId = isHost ? 'com.loworld.overview' : `com.loworld.app.${idPart}`;

const manifest = {
  v: 1,
  appId,
  appName,
  androidPackageId,
  iosBundleId,
  version: nativeSettings?.version ?? '0.1.0',
  ...(nativeSettings?.versionCode != null ? { versionCode: nativeSettings.versionCode } : {}),
  ...(nativeSettings?.orientation ? { orientation: nativeSettings.orientation } : {}),
  packagedAt: new Date().toISOString(),
};

writeFileSync(join(packageDir, 'app.native.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`[package-native] app.native.json 생성 완료: ${JSON.stringify(manifest)}`);

// 6. 패키지 검사 실행 (check-package.mjs)
console.log(`[package-native] 묶음 검사 수행 중...`);
execFileSync('node', [join(root, 'scripts', 'check-package.mjs'), browserDir, appId], { stdio: 'inherit' });

console.log('\n✅ 네이티브 셸 적용 준비 완료:');
console.log(`Android 적용: (cd LoworldUI-AOS && ./scripts/apply-package.sh ../dist/package/${appId})`);
console.log(`iOS 적용:     (cd ../LoworldUI-IOS && ./scripts/apply-package.sh ../loworld-workspace/dist/package/${appId})`);
