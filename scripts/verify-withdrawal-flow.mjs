// 公開ポータルの退会申込フローを、事業所会員のテストアカウントで最後まで通す。
//
// 送信すると T_変更申請 に PENDING の申請が 1 件積まれる（T_会員 は変わらない）。
// 管理画面の「変更申請管理」で却下すれば元に戻せる。
//
// Run: node scripts/verify-withdrawal-flow.mjs <事業所番号> <返信用メール>
import { chromium } from 'playwright';

const URL = process.env.PORTAL_URL_PUBLIC
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

const officeNumber = process.argv[2];
const email = process.argv[3];
if (!officeNumber || !email) {
  console.error('usage: node scripts/verify-withdrawal-flow.mjs <事業所番号> <返信用メール>');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
// ダイアログは承認しない。握りつぶすと失敗を見逃す。
page.on('dialog', async (d) => { errors.push(`DIALOG(${d.type()}): ${d.message().slice(0, 300)}`); await d.dismiss(); });

const step = async (label, fn) => {
  try { await fn(); console.log(`OK  ${label}`); }
  catch (e) { console.error(`NG  ${label}: ${e.message.split('\n')[0]}`); throw e; }
};

await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
const f = page.frames().find((fr) => fr.url().endsWith('/blank')) || page.mainFrame();
await f.waitForSelector('text=お申込みポータル', { timeout: 60000 });

await step('① 退会カードを開く', async () => {
  await f.getByRole('button', { name: '退会手続きへ進む' }).click();
  await f.waitForSelector('text=会員の種別を選択', { timeout: 20000 });
});

await step('② 事業所会員を選ぶ', async () => {
  await f.getByRole('button', { name: /事業所会員/ }).click();
  await f.waitForSelector('text=事業所番号', { timeout: 20000 });
});

await step('③ 本人確認を入力して照合', async () => {
  await f.getByPlaceholder('事業所番号を入力').fill(officeNumber);
  await f.getByPlaceholder('example@email.com').fill(email);
  await f.getByRole('button', { name: /確認|次へ|進む/ }).last().click();
  // 照合は GAS 往復。確認ステップの見出しが出るまで待つ。
  await f.waitForSelector('text=/退会|確認/', { timeout: 60000 });
  await page.waitForTimeout(6000);
});

console.log('\n--- 退会確認ステップの表示 ---');
console.log((await f.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 1400));
console.log('\nconsole errors:', errors.length ? errors : 'なし');

console.log('\n※ ここまでが照合。送信は --submit を付けたときだけ行う。');
if (process.argv.includes('--submit')) {
  await step('④ 同意チェックして送信', async () => {
    const cb = f.locator('input[type=checkbox]').first();
    if (await cb.count()) await cb.click({ force: true });
    await page.waitForTimeout(500);
    await f.getByRole('button', { name: /退会を申し込む|申請|送信/ }).last().click();
    await page.waitForSelector('body', { timeout: 5000 });
    await page.waitForTimeout(30000);
  });
  console.log('\n--- 送信後 ---');
  console.log((await f.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 1200));
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
}

await browser.close();
