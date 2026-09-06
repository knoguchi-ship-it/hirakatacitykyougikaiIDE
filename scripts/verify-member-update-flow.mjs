// 公開ポータルの「登録情報変更」フローを、事業所会員のテストアカウントで最後まで通す。
//
// 送信すると T_変更申請 に PENDING の申請が 1 件積まれる（T_会員 は変わらない）。
// 管理画面の「変更申請管理」で却下すれば元に戻せる。
//
// Run: node scripts/verify-member-update-flow.mjs <事業所番号> <返信用メール> [電話番号] [--submit]
import { chromium } from 'playwright';

const URL = process.env.PORTAL_URL_PUBLIC
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

const officeNumber = process.argv[2];
const email = process.argv[3];
const newTel = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : '072-859-9101';
if (!officeNumber || !email) {
  console.error('usage: node scripts/verify-member-update-flow.mjs <事業所番号> <返信用メール> [--submit]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
// ダイアログは全部記録したうえで accept する。dismiss にすると confirm を打ち消して
// 「押したのに何も起きない」状態になり、成功と誤認する。
page.on('dialog', async (d) => { errors.push(`DIALOG(${d.type()}): ${d.message().slice(0, 300)}`); await d.accept(); });

const step = async (label, fn) => {
  try { await fn(); console.log(`OK  ${label}`); }
  catch (e) { console.error(`NG  ${label}: ${e.message.split('\n')[0]}`); throw e; }
};

await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
const f = page.frames().find((fr) => fr.url().endsWith('/blank')) || page.mainFrame();
await f.waitForSelector('text=お申込みポータル', { timeout: 60000 });

await step('① 登録情報変更カードを開く', async () => {
  await f.getByRole('button', { name: '変更手続きへ進む' }).click();
  await f.waitForSelector('text=会員の種別を選択', { timeout: 20000 });
});

await step('② 事業所会員を選ぶ', async () => {
  await f.getByRole('button', { name: /事業所会員/ }).click();
  await f.waitForSelector('text=事業所番号', { timeout: 20000 });
});

await step('③ 本人確認', async () => {
  await f.getByPlaceholder('例: 2700123456').fill(officeNumber);
  await f.getByPlaceholder('例: example@email.com').fill(email);
  await f.getByRole('button', { name: '確認して次へ' }).click();
  await f.waitForSelector('text=変更する項目を選択', { timeout: 90000 });
});

console.log('\n--- 選べる変更項目 ---');
console.log((await f.locator('fieldset').innerText()).replace(/\n{2,}/g, '\n').slice(0, 900));

// 電話番号だけを変える。住所や名称に比べて戻しやすく、他項目への波及も無い。
await step('④ 「連絡先」を選んで次へ', async () => {
  await f.locator('label').filter({ hasText: /電話|連絡先/ }).first().click();
  await page.waitForTimeout(500);
  await f.getByRole('button', { name: /次へ進む/ }).click();
  await f.waitForSelector('text=新しい情報を入力', { timeout: 90000 });
});

console.log('\n--- 入力ステップ ---');
console.log((await f.locator('form').innerText()).replace(/\n{2,}/g, '\n').slice(0, 1200));
console.log('\nconsole errors:', errors.length ? errors : 'なし');

console.log('\n※ 送信は --submit を付けたときだけ行う。');
if (process.argv.includes('--submit')) {
  await step('⑤ 電話番号を入力して送信', async () => {
    // 「最初の空欄」に入れる書き方をしたら、全欄が空（＝変更なしモデル）なので
    // 事業所名に電話番号が入った。必ずラベルで狙うこと。
    const field = f.locator('label').filter({ hasText: '電話番号' }).first();
    const box = (await field.locator('input').count())
      ? field.locator('input').first()
      : f.locator('input').nth(await f.locator('label').filter({ hasText: '電話番号' }).first().evaluate((el) => {
          const inputs = Array.from(document.querySelectorAll('form input'));
          const own = el.parentElement.querySelector('input');
          return inputs.indexOf(own);
        }));
    await box.fill(newTel);
    const filled = await box.inputValue();
    if (filled !== newTel) throw new Error(`電話番号欄に入っていない: ${filled}`);
    await page.waitForTimeout(500);
    await f.getByRole('button', { name: /申請|送信|変更を申し込む/ }).last().click();
    await page.waitForTimeout(35000);
  });
  console.log('\n--- 送信後 ---');
  console.log((await f.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 1200));
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
}

await browser.close();
