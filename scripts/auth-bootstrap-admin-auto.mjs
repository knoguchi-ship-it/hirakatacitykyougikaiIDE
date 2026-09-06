// 管理ポータルの手動ログイン（ENTER 不要版）。
// Run: node scripts/auth-bootstrap-admin-auto.mjs
// Output: .test-out/auth-admin.json (gitignored)
//
// auth-bootstrap-admin.mjs は保存の合図に ENTER を要求するため、バックグラウンド実行に
// 回ると入力を渡せず固まる。こちらはブラウザでログインするだけでよい。
//
// 管理 UI を「文言で検知してから保存」にすると、サイドバーの畳み方や文言変更で
// 検知に漏れて何も保存されない（実際に漏れた）。そこで Google のログイン画面を
// 抜けている限り 5 秒ごとに上書き保存し、最後の状態を残す方式にした。
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';
const OUT = '.test-out/auth-admin.json';
const DEADLINE_MS = 10 * 60 * 1000;

await fs.mkdir('.test-out', { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

console.log('---');
console.log('管理ポータル 認証ブートストラップ（ENTER 不要）');
console.log('ブラウザで k.noguchi@hcm-n.org にログインしてください。');
console.log('ログイン後の状態を 5 秒ごとに保存します。管理画面が出たらブラウザを閉じて構いません。');
console.log('---');

await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });

const started = Date.now();
let saves = 0;
while (Date.now() - started < DEADLINE_MS) {
  if (page.isClosed() || !browser.isConnected()) break;
  let url = '';
  try { url = page.url(); } catch { break; }
  // accounts.google.com にいる間は未ログイン。抜けたら保存対象。
  if (!/accounts\.google\.com/.test(url)) {
    try {
      await context.storageState({ path: OUT });
      saves += 1;
      if (saves === 1 || saves % 6 === 0) console.log(`保存 ${saves} 回目 → ${OUT}  (${url.slice(0, 60)})`);
    } catch { /* ページ遷移中は握って次周へ */ }
  }
  try { await page.waitForTimeout(5000); } catch { break; }
}

console.log(saves > 0 ? `完了: ${saves} 回保存しました → ${OUT}` : '保存できませんでした（ログイン画面から進んでいません）');
try { await browser.close(); } catch { /* すでに閉じられている */ }
process.exit(saves > 0 ? 0 : 1);
