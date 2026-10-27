#!/usr/bin/env node
// 앱을 빌드하고 LoworldUI-AOS에서 APK를 만든다.
//   npm run apk -- <앱 id> [--flavor standard|pleos] [--release]
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

const appId = args.find((a) => !a.startsWith('--'));
const flavorAt = args.indexOf('--flavor');
const flavorVal = flavorAt >= 0 ? args[flavorAt + 1] : undefined;
const flavor = (flavorVal ?? 'standard').toLowerCase();
const isRelease = args.includes('--release');
const buildType = isRelease ? 'release' : 'debug';

if (!appId) {
  console.error('사용법: npm run apk -- <앱 id> [--flavor standard|pleos] [--release]');
  console.error('예: npm run apk -- story-math');
  console.error('예: npm run apk -- story-math --flavor pleos');
  process.exit(1);
}

if (flavor !== 'standard' && flavor !== 'pleos') {
  console.error(`알 수 없는 flavor: ${flavor} (standard 또는 pleos)`);
  process.exit(1);
}

const capFlavor = flavor === 'standard' ? 'Standard' : 'Pleos';
const capBuildType = isRelease ? 'Release' : 'Debug';
const gradleTask = `assemble${capFlavor}${capBuildType}`;

console.log(`[apk] 앱: ${appId}, flavor: ${flavor}, buildType: ${buildType} (${gradleTask})`);

// 1. node scripts/package-native.mjs <앱 id>
console.log(`\n[apk] 1단계: 묶기 (package-native.mjs ${appId})`);
try {
  execFileSync('node', [join(root, 'scripts', 'package-native.mjs'), appId], {
    cwd: root,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('[apk] 1단계 실패: package-native');
  process.exit(1);
}

// 2. LoworldUI-AOS/scripts/apply-package.sh ../dist/package/<앱 id>
console.log(`\n[apk] 2단계: 묶음 적용 (apply-package.sh)`);
const aosDir = join(root, 'LoworldUI-AOS');
const packageDir = join(root, 'dist', 'package', appId);
try {
  execFileSync('sh', [join(aosDir, 'scripts', 'apply-package.sh'), packageDir], {
    cwd: aosDir,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('[apk] 2단계 실패: apply-package');
  process.exit(1);
}

// 3. JAVA_HOME 검사 및 설정
console.log(`\n[apk] 3단계: Java 환경 확인`);
let javaHome = process.env.JAVA_HOME;
const defaultStudioJava = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
if (!javaHome && existsSync(defaultStudioJava)) {
  javaHome = defaultStudioJava;
}
if (!javaHome) {
  console.error('Java를 찾지 못했다. Android Studio를 깔거나 JAVA_HOME을 넣는다');
  process.exit(1);
}
console.log(`[apk] JAVA_HOME = ${javaHome}`);

// 4. LoworldUI-AOS에서 ./gradlew clean assemble<Flavor><Debug|Release>
console.log(`\n[apk] 4단계: Gradle 빌드 (clean ${gradleTask})`);
try {
  execFileSync('./gradlew', ['clean', gradleTask], {
    cwd: aosDir,
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: javaHome },
  });
} catch (err) {
  console.error(`[apk] 4단계 실패: Gradle 빌드 (${gradleTask})`);
  process.exit(1);
}

// 5. 나온 APK를 dist/apk/<앱 id>-<flavor>-<debug|release>.apk로 복사
console.log(`\n[apk] 5단계: APK 복사`);
const apkOutputDir = join(aosDir, 'app', 'build', 'outputs', 'apk', flavor, buildType);
if (!existsSync(apkOutputDir)) {
  console.error(`[apk] 5단계 실패: APK 출력 디렉토리를 찾을 수 없습니다: ${apkOutputDir}`);
  process.exit(1);
}

const apkFiles = readdirSync(apkOutputDir).filter((f) => f.endsWith('.apk'));
if (apkFiles.length === 0) {
  console.error(`[apk] 5단계 실패: APK 파일이 생성되지 않았습니다: ${apkOutputDir}`);
  process.exit(1);
}

const allowUnsigned = args.includes('--allow-unsigned');
const signedApk = apkFiles.find((f) => !f.includes('unsigned'));

if (isRelease && !allowUnsigned && !signedApk) {
  console.error(`\n❌ [apk] release 빌드이지만 서명된 APK가 없습니다.`);
  console.error(`   원인: LoworldUI-AOS/keystore.properties 파일이 없거나 서명 키가 올바르지 않습니다.`);
  console.error(`   대책: U6 단계에 따라 서명 키를 생성하고 LoworldUI-AOS/keystore.properties를 작성하세요.`);
  console.error(`   (임시 테스트용 비서명 릴리스 허용: --allow-unsigned 옵션 사용)\n`);
  process.exit(1);
}

const sourceApk = join(apkOutputDir, signedApk ?? apkFiles[0]);
const distApkDir = join(root, 'dist', 'apk');
mkdirSync(distApkDir, { recursive: true });

const targetApkName = `${appId}-${flavor}-${buildType}.apk`;
const targetApkPath = join(distApkDir, targetApkName);
copyFileSync(sourceApk, targetApkPath);

// 6. 마지막 출력: APK 자리, 크기, 패키지 id, 그리고 adb install -r <APK>
const stat = statSync(targetApkPath);
const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

// app.native.json에서 패키지 id 읽기
let packageId = '알 수 없음';
try {
  const nativeJson = JSON.parse(readFileSync(join(packageDir, 'app.native.json'), 'utf-8'));
  packageId = nativeJson.androidPackageId ?? packageId;
} catch {
  // 무시
}

const adbDefault = join(homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
const adbCmd = existsSync(adbDefault) ? adbDefault : 'adb';

console.log(`\n✨ APK 생성 완료!`);
console.log(`  APK 자리:   ${targetApkPath}`);
console.log(`  크기:       ${sizeMB} MB (${stat.size.toLocaleString()} bytes)`);
console.log(`  패키지 ID:  ${packageId}`);
console.log(`  설치 명령:  ${adbCmd} install -r ${targetApkPath}\n`);
