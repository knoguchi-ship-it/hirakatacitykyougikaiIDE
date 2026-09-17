/**
 * admin split の E2E 専用cleanup operator関数を、管理ポータルと同じ認証経路で実行する。
 * 値・ID・メールアドレスは出力しない。既定はプレビューのみ。
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

const APPLY = process.argv.includes('--apply');

try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
} catch { /* process.env を使う */ }

const ADMIN_URL = process.env.PORTAL_URL_ADMIN;
if (!ADMIN_URL) throw new Error('PORTAL_URL_ADMIN をローカル設定に指定してください。');

async function callOperator(frame, functionName) {
  return frame.evaluate((name) => new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((value) => resolve(value))
      .withFailureHandler((error) => reject(new Error(String(error?.message || error))))[name]();
  }), functionName);
}

function counts(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    auth: Number(source.auth || 0),
    members: Number(source.members || 0),
    staff: Number(source.staff || 0),
    changeRequests: Number(source.changeRequests || 0),
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: '.test-out/auth-admin.json',
});
const page = await context.newPage();

try {
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
  await page.waitForTimeout(1500);
  const preview = counts((await callOperator(frame, 'previewStrictE2ETestMemberCleanup_LOG'))?.counts);
  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'preview', targets: preview }));
  } else {
    if (preview.changeRequests === 0) throw new Error('承認済みE2E入会申請が見つからないため、中止しました。');
    const deleted = counts((await callOperator(frame, 'executeStrictE2ETestMemberCleanup_APPLY'))?.deleted);
    const remaining = counts((await callOperator(frame, 'previewStrictE2ETestMemberCleanup_LOG'))?.counts);
    if (Object.values(remaining).some((value) => value !== 0)) throw new Error('E2Eテストデータが残っているため、中止しました。');
    console.log(JSON.stringify({ mode: 'apply', preview, deleted, remaining }));
  }
} finally {
  await context.close();
  await browser.close();
}
