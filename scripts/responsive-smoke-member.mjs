// Quick 1-viewport member login smoke
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const URL = 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
const LOGIN_ID = process.env.MEMBER_LOGIN_ID;
const PASSWORD = process.env.MEMBER_PASSWORD;
if (!LOGIN_ID || !PASSWORD) { console.error('Set MEMBER_LOGIN_ID / MEMBER_PASSWORD in .env.test'); process.exit(2); }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('[console-err]', m.text().slice(0, 200)); });

console.log('navigating...');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
const frame = await getAppFrame(page, /ログイン/);
console.log('frame ready. body snippet:', (await frame.evaluate(() => document.body.innerText.slice(0, 100))));

// Fill login
console.log('typing credentials...');
const idLoc = frame.locator('input[placeholder="ログインID"]');
const pwLoc = frame.locator('input[placeholder="パスワード"]');
console.log('id count:', await idLoc.count(), 'pw count:', await pwLoc.count());
await idLoc.fill(LOGIN_ID);
await pwLoc.fill(PASSWORD);
console.log('clicking submit...');
await frame.locator('button:has-text("ログイン")').first().click();

for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(500);
  const t = await frame.evaluate(() => (document.body && document.body.innerText || '').slice(0, 300));
  if (i % 4 === 0) console.log(`t=${(i+1)*0.5}s body:`, t.replace(/\n+/g,' ').slice(0, 200));
  if (/マイページ|プロフィール|年会費|ログアウト|登録情報/.test(t) && !/^[\s\S]{0,150}会員はログインID/.test(t)) {
    console.log('LOGGED IN at t=', (i+1)*0.5);
    break;
  }
  if (/失敗|エラー|正しくありません|無効/.test(t)) {
    console.log('ERROR:', t.slice(0,200)); break;
  }
}
await page.screenshot({ path: '.test-out/member-smoke.png', fullPage: true });
await browser.close();
console.log('done');
