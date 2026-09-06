// 公開ポータルの「登録情報変更」から、事業所会員の職員を 追加 / 情報変更 / 除籍 する
// 3 フローを個別に通す。いずれも requestType は MEMBER_UPDATE で、管理者の承認で反映される。
//
// Run: node scripts/verify-staff-flow.mjs <add|update|remove> <事業所番号> <返信用メール> [--submit]
//
// 画面の作り（実測）:
//   職員追加カードは枠数ぶん並ぶ（1 枚 6 欄: 姓/名/セイ/メイ/CM番号/メール）。
//   職員除籍カードは 3 欄（姓/名/CM番号）。
//   職員情報変更は在籍職員ごとに「この職員の情報を変更する」チェックが出る。
import { chromium } from 'playwright';

const MODE = process.argv[2];
const officeNumber = process.argv[3];
const email = process.argv[4];
if (!['add', 'update', 'remove'].includes(MODE) || !officeNumber || !email) {
  console.error('usage: node scripts/verify-staff-flow.mjs <add|update|remove> <事業所番号> <返信用メール> [--submit]');
  process.exit(1);
}

const URL = process.env.PORTAL_URL_PUBLIC
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

// 検証用の職員。氏名に「テスト」を入れて後片付けで拾えるようにする。
const STAFF = {
  lastName: 'テスト', firstName: '職員',
  lastKana: 'テスト', firstKana: 'ショクイン',
  cmNumber: '90000002',
  email: 'k.noguchi@uguisunosato.or.jp',
};
const UPDATED_KANA = 'ショクインカイ';

const GROUP = { add: '職員を追加する', update: '職員情報を変更する', remove: '職員を除籍する' }[MODE];

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('dialog', async (d) => { errors.push(`DIALOG(${d.type()}): ${d.message().slice(0, 300)}`); await d.accept(); });

const step = async (label, fn) => {
  try { await fn(); console.log(`OK  ${label}`); }
  catch (e) { console.error(`NG  ${label}: ${e.message.split('\n')[0]}`); throw e; }
};

await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
const f = page.frames().find((fr) => fr.url().endsWith('/blank')) || page.mainFrame();
await f.waitForSelector('text=お申込みポータル', { timeout: 60000 });

await step('① 登録情報変更 → 事業所会員 → 本人確認', async () => {
  await f.getByRole('button', { name: '変更手続きへ進む' }).click();
  await f.waitForSelector('text=会員の種別を選択', { timeout: 20000 });
  await f.getByRole('button', { name: /事業所会員/ }).click();
  await f.waitForSelector('text=事業所番号', { timeout: 20000 });
  await f.getByPlaceholder('例: 2700123456').fill(officeNumber);
  await f.getByPlaceholder('例: example@email.com').fill(email);
  await f.getByRole('button', { name: '確認して次へ' }).click();
  await f.waitForSelector('text=変更する項目を選択', { timeout: 90000 });
});

await step(`② 「${GROUP}」を選んで次へ`, async () => {
  await f.locator('label').filter({ hasText: GROUP }).first().click();
  await page.waitForTimeout(500);
  await f.getByRole('button', { name: /次へ進む/ }).click();
  await f.waitForSelector('text=新しい情報を入力', { timeout: 90000 });
  await page.waitForTimeout(2000);
});

// ラベルは繰り返し現れるので、n 番目のカードとして相対指定する。
const nth = (label, i) => f.locator('label').filter({ hasText: label }).nth(i)
  .locator('xpath=following::input[1]');

if (MODE === 'add') {
  await step('③ 追加職員 1 枚目を埋める', async () => {
    await nth('氏（姓）', 0).fill(STAFF.lastName);
    await nth('名 ', 0).fill(STAFF.firstName);
    await nth('フリガナ（氏）', 0).fill(STAFF.lastKana);
    await nth('フリガナ（名）', 0).fill(STAFF.firstKana);
    await nth('介護支援専門員番号', 0).fill(STAFF.cmNumber);
    await nth('メールアドレス', 0).fill(STAFF.email);
  });
} else if (MODE === 'remove') {
  await step('③ 除籍カードを埋める', async () => {
    await nth('氏（姓）', 0).fill(STAFF.lastName);
    await nth('名 ', 0).fill(STAFF.firstName);
    await nth('介護支援専門員番号', 0).fill(STAFF.cmNumber);
  });
} else {
  await step('③ 対象職員にチェックしてカナを変える', async () => {
    const rows = f.locator('label').filter({ hasText: 'この職員の情報を変更する' });
    const count = await rows.count();
    console.log(`      在籍職員 ${count} 名`);
    const body = await f.locator('form').innerText();
    const idx = body.split('この職員の情報を変更する').findIndex(() => false); // 位置は下で目視確認
    // テスト職員の行を選ぶ。見つからなければ最後の行（＝直前に追加した職員）。
    let target = -1;
    for (let i = 0; i < count; i += 1) {
      const t = await rows.nth(i).locator('xpath=ancestor::*[self::div][1]').innerText().catch(() => '');
      if (t.includes(STAFF.cmNumber) || t.includes(STAFF.firstName)) { target = i; break; }
    }
    if (target === -1) target = count - 1;
    console.log(`      対象は ${target + 1} 番目`);
    await rows.nth(target).click();
    await page.waitForTimeout(800);
    const kana = f.locator('input').filter({ hasNot: f.locator('[type=checkbox]') });
    // チェック後に現れる入力欄のうち、フリガナ（名）を狙う
    await nth('フリガナ（名）', 0).fill(UPDATED_KANA);
  });
}

// innerText には input の value が出ない。狙った欄に入ったかを必ず読み返す。
// 一度これを怠って、電話番号を事業所名の欄に入れた申請を出してしまった。
const filledNow = await f.evaluate(() => Array.from(document.querySelectorAll('input'))
  .filter((el) => el.value && el.type !== 'checkbox')
  .map((el) => `${(el.closest('div')?.querySelector('label')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24)} = ${el.value}`));
console.log('\n--- 実際に入った値 ---\n  ' + (filledNow.length ? filledNow.join('\n  ') : '(なし)'));
if (!filledNow.length) { console.error('入力が 1 件も入っていない。送信せず中止。'); await browser.close(); process.exit(1); }

if (process.argv.includes('--submit')) {
  await step('④ 送信', async () => {
    await f.getByRole('button', { name: /変更を申請する|申請|送信/ }).last().click();
    await page.waitForTimeout(35000);
  });
  console.log('\n--- 送信後 ---');
  console.log((await f.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 900));
} else {
  console.log('\n※ 送信は --submit を付けたときだけ行う。');
}
console.log('\nconsole errors:', errors.length ? errors : 'なし');
await browser.close();
