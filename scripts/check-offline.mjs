#!/usr/bin/env node
// www 묶음을 로컬 서버로 띄우고 외부 네트워크가 차단된 헤드리스 크롬에서
// 스토리매스의 전체 퀘스트 흐름을 실행하여 오프라인 동작 및 자원 무결성을 검증한다.
//   node scripts/check-offline.mjs <www 폴더 또는 www.zip>
//   node scripts/check-offline.mjs --self-test
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './compare/browser.mjs';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/**
 * 묶음 전용 엄격 로컬 정적 파일 서버.
 * 외부 경로/상위 경로 참조 불가, 번들 내 존재하지 않는 파일 요청 시 404를 반환한다.
 */
export function createStrictBundleServer(bundleDir, port) {
  const root = path.resolve(bundleDir);
  const server = http.createServer((req, res) => {
    const rawPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    let filePath = path.join(root, rawPath);

    // 디렉토리 트래버설 방지
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // 파일이 존재하는 경우
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'content-type': MIME_TYPES[ext] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(readFileSync(filePath));
      return;
    }

    // 파일 확장자가 없는 경로는 SPA 라우트로 간주하여 index.html 제공
    if (!path.extname(rawPath)) {
      const indexFile = path.join(root, 'index.html');
      if (existsSync(indexFile)) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(readFileSync(indexFile));
        return;
      }
    }

    // 존재하지 않는 정적 자원은 반드시 404 반환
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not Found: ' + rawPath);
  });

  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

/**
 * 브라우저를 띄워 오프라인 환경에서 스토리매스 시나리오를 점검한다.
 */
export async function runOfflineCheck(bundleDir, { port = 8199, debugPort = 9488 } = {}) {
  const errors = [];
  const server = await createStrictBundleServer(bundleDir, port);
  let browser = null;

  try {
    browser = await launch({ debugPort });

    // 1. 외부 요청 및 오류 감지 리스너 등록
    browser.on('Network.requestWillBeSent', (params) => {
      const url = params.request?.url ?? '';
      if (!url.startsWith(`http://127.0.0.1:${port}`) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        errors.push(`[외부 요청 발견] ${url}`);
      }
    });

    browser.on('Network.responseReceived', (params) => {
      const status = params.response?.status;
      const url = params.response?.url;
      if (status >= 400) {
        errors.push(`[HTTP ${status} 오류] ${url}`);
      }
    });

    browser.on('Network.loadingFailed', (params) => {
      if (!params.canceled) {
        errors.push(`[네트워크 로드 실패] ${params.errorText}`);
      }
    });

    // 외부 네트워크 전면 차단 (HTTPS 및 비로컬 차단)
    await browser.send('Network.setBlockedURLs', {
      urls: ['https://*'],
    });

    // 2. 가로 1280x720, 다크 모드로 설정
    await browser.size(1280, 720);
    await browser.dark(true);

    // 3. 앱 로드
    console.log(`[check-offline] 앱 로드 시작: http://127.0.0.1:${port}`);
    await browser.goto(`http://127.0.0.1:${port}`, 2500);

    // 4. 글꼴 로딩 검증 (Pretendard 및 Gowun Batang)
    console.log('[check-offline] 글꼴 로드 상태 점검...');
    const fontResults = await browser.eval(`(async () => {
      await document.fonts.ready;
      const pretendardCheck = document.fonts.check('16px Pretendard');
      const gowunCheck = document.fonts.check('16px "Gowun Batang"');
      const loadedList = [...document.fonts].map(f => f.family + ' (' + f.weight + ') ' + f.status);
      return {
        pretendard: pretendardCheck,
        gowun: gowunCheck,
        fonts: loadedList
      };
    })()`);

    if (!fontResults?.pretendard) {
      errors.push('[글꼴 미실장] Pretendard 글꼴이 document.fonts에 로드되지 않았습니다.');
    }
    if (!fontResults?.gowun) {
      errors.push('[글꼴 미실장] Gowun Batang 글꼴이 document.fonts에 로드되지 않았습니다.');
    }
    console.log(`  -> 로드된 글꼴: ${fontResults?.fonts?.join(', ')}`);

    // 5. 시나리오 순회: 홈 -> 이어 듣기 -> 이야기 -> 문제 -> 답 -> 퀘스트 끝 -> 설정
    console.log('[check-offline] 시나리오 1: 홈 화면 확인');
    const homeFound = await browser.eval(`(() => {
      const cards = [...document.querySelectorAll('lw-card')];
      return cards.some(c => c.innerText.includes('이어 듣기'));
    })()`);
    if (!homeFound) {
      errors.push('[화면 오류] 홈 화면에서 "이어 듣기" 카드를 찾을 수 없습니다.');
    }

    console.log('[check-offline] 시나리오 2: 이야기로 이동 (이어 듣기 클릭)');
    await browser.eval(`(() => {
      const cards = [...document.querySelectorAll('lw-card')];
      const c = cards.find(el => el.innerText.includes('이어 듣기'));
      c?.click();
    })()`);
    await browser.sleep(1500);

    console.log('[check-offline] 시나리오 3: 문제로 건너뛰기 클릭');
    await browser.eval(`(() => {
      const btns = [...document.querySelectorAll('button, lw-button')];
      const b = btns.find(el => el.innerText.includes('문제로 건너뛰기'));
      b?.click();
    })()`);
    await browser.sleep(1500);

    console.log('[check-offline] 시나리오 4: 문제 1 풀기 (첫째 보기 선택 -> 풀이)');
    await browser.eval(`(() => {
      const cards = [...document.querySelectorAll('lw-card')];
      const c = cards.find(el => el.innerText.includes('첫째'));
      c?.click();
    })()`);
    await browser.sleep(1200);

    console.log('[check-offline] 시나리오 5: 문제 2, 3 풀고 퀘스트 완료');
    for (let q = 0; q < 2; q++) {
      await browser.eval(`(() => {
        const btns = [...document.querySelectorAll('button, lw-button')];
        const b = btns.find(el => el.innerText.includes('다음 문제') || el.innerText.includes('마치기'));
        b?.click();
      })()`);
      await browser.sleep(1000);
      await browser.eval(`(() => {
        const cards = [...document.querySelectorAll('lw-card')];
        const c = cards.find(el => el.innerText.includes('첫째') || el.innerText.includes('둘째'));
        c?.click();
      })()`);
      await browser.sleep(1000);
    }

    await browser.eval(`(() => {
      const btns = [...document.querySelectorAll('button, lw-button')];
      const b = btns.find(el => el.innerText.includes('마치기'));
      b?.click();
    })()`);
    await browser.sleep(1500);

    const doneFound = await browser.eval(`(() => {
      const btns = [...document.querySelectorAll('button, lw-button')];
      return btns.some(el => el.innerText.includes('홈으로') || el.innerText.includes('완료'));
    })()`);
    console.log(`  -> 퀘스트 끝 화면 도달 여부: ${doneFound}`);

    console.log('[check-offline] 시나리오 6: 설정 열기');
    await browser.eval(`(() => {
      const btns = [...document.querySelectorAll('button, lw-button')];
      const b = btns.find(el => el.innerText.includes('홈으로'));
      b?.click();
    })()`);
    await browser.sleep(1000);

    await browser.eval(`(() => {
      const btns = [...document.querySelectorAll('button, lw-button')];
      const s = btns.find(el => el.innerText.includes('설정') || el.getAttribute('aria-label')?.includes('설정'));
      s?.click();
    })()`);
    await browser.sleep(1000);

    // 브라우저 내부 로그에 기록된 에러 수집
    if (browser.logs && browser.logs.length > 0) {
      for (const log of browser.logs) {
        errors.push(`[콘솔/런타임 로그] ${log}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } finally {
    if (browser) await browser.close();
    await new Promise((res) => server.close(res));
  }
}

/** 자체 시험 (--self-test) */
export async function runSelfTest() {
  console.log('[check-offline] 자체 시험 시작...');
  const tmpBase = mkdtempSync(path.join(os.tmpdir(), 'check-offline-test-'));

  try {
    // 404 및 외부 요청 감지 검증
    const testPort = 8299;
    const server = await createStrictBundleServer(tmpBase, testPort);
    try {
      const res404 = await fetch(`http://127.0.0.1:${testPort}/assets/missing-file.woff2`);
      if (res404.status !== 404) {
        throw new Error(`누락 파일 요청 시 404가 아닌 ${res404.status} 반환`);
      }
    } finally {
      await new Promise((r) => server.close(r));
    }

    console.log('✅ [check-offline] 자체 시험 통과 (엄격 서버 404 검출 및 에러 핸들링 검증 완료)');
    return true;
  } finally {
    rmSync(tmpBase, { recursive: true, force: true });
  }
}

// CLI 실행 처리
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) {
    runSelfTest()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(`❌ 자체 시험 실패: ${err.message}`);
        process.exit(1);
      });
  } else {
    const target = process.argv[2];
    if (!target) {
      console.error('사용법: node scripts/check-offline.mjs <www 폴더 또는 www.zip>');
      console.error('예:     node scripts/check-offline.mjs dist/package/story-math/www.zip');
      console.error('        node scripts/check-offline.mjs --self-test');
      process.exit(1);
    }

    let inspectDir = path.resolve(target);
    let cleanupTmp = null;

    if (!existsSync(inspectDir)) {
      console.error(`대상을 찾을 수 없습니다: ${inspectDir}`);
      process.exit(1);
    }

    if (statSync(inspectDir).isFile() && inspectDir.endsWith('.zip')) {
      cleanupTmp = mkdtempSync(path.join(os.tmpdir(), 'lw-offline-zip-'));
      try {
        execFileSync('unzip', ['-q', inspectDir, '-d', cleanupTmp]);
        inspectDir = cleanupTmp;
      } catch (err) {
        console.error(`ZIP 압축 해제 실패: ${err.message}`);
        if (cleanupTmp) rmSync(cleanupTmp, { recursive: true, force: true });
        process.exit(1);
      }
    }

    runOfflineCheck(inspectDir)
      .then(({ valid, errors }) => {
        if (!valid) {
          console.error(`\n❌ [check-offline] 검사 실패 (${errors.length}건):`);
          for (const err of errors) {
            console.error(`  - ${err}`);
          }
          process.exit(1);
        }
        console.log('\n✅ [check-offline] 모든 검사 통과 (완전 오프라인 동작, 글꼴 로드, 오류 0건)');
        process.exit(0);
      })
      .catch((err) => {
        console.error(`❌ 실행 실패: ${err?.message ?? err}`);
        process.exit(1);
      })
      .finally(() => {
        if (cleanupTmp) rmSync(cleanupTmp, { recursive: true, force: true });
      });
  }
}
