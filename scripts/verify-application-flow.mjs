// 公開ポータルの「新規入会申込」フロー（個人会員）を、テストデータで最後まで通す。
//
// 送信すると入会申請が 1 件積まれる。会員にはならず、管理者の承認で会員化する。
// 検証後は管理画面から却下すること。
//
// Run: node scripts/verify-application-flow.mjs [--submit]
//
// 画面の作りで引っかかった点（同じ罠を踏まないための記録）:
//   - input に type 属性が無いので 'input[type=text]' では 1 件も取れない。
//   - ラベルの部分一致で値を配ると「名」が「事業所名」に当たる。placeholder で狙う。
//   - 郵送先は input[type=radio] ではなく role="radio" の button。
//   - 郵便番号は 3 桁 + 4 桁の 2 欄に分かれている。
import { chromium } from 'playwright';

const URL = process.env.PORTAL_URL_PUBLIC
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

const STAMP = new Date().toISOString().slice(0, 10).replace(/-/g, '');

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

const fill = async (placeholder, value, nth = 0) =>
  f.getByPlaceholder(placeholder, { exact: true }).nth(nth).fill(value);
const next = async (waitMs = 4000) => {
  await f.getByRole('button', { name: /次へ|確認画面へ|進む/ }).last().click();
  await page.waitForTimeout(waitMs);
};
// 文言で拾うと「〜を入力してください」という案内文まで拾ってしまい、
// 進んでいるのに失敗と誤判定する。フォームはエラーだけに role="alert" を付けている。
const validationErrors = async () =>
  (await f.locator('[role="alert"]').allInnerTexts()).map((s) => s.trim()).filter(Boolean).slice(0, 8);

await step('① 入会申込カードを開く', async () => {
  await f.getByRole('button', { name: '入会申込へ進む' }).click();
  await f.waitForSelector('text=会員種別を選択', { timeout: 20000 });
});

await step('② 個人会員を選ぶ → 注意事項ステップが出る', async () => {
  await f.getByRole('button', { name: /個人会員/ }).first().click();
  await page.waitForTimeout(2500);
  const t = await f.locator('body').innerText();
  if (!t.includes('注意事項')) throw new Error('注意事項ステップが出ない');
});

await step('③ 同意チェックなしでは次へ進めない', async () => {
  await next(2500);
  const t = await f.locator('body').innerText();
  if (!t.includes('注意事項')) throw new Error('チェックなしで先へ進んでしまった');
});

await step('④ 同意して基本情報へ', async () => {
  await f.locator('input[type=checkbox]').first().click({ force: true });
  await page.waitForTimeout(400);
  await next();
  if (!(await f.getByPlaceholder('例: 山田', { exact: true }).count())) throw new Error('基本情報ステップに来ていない');
});

await step('⑤ 基本情報を入力', async () => {
  await fill('例: 山田', 'テスト');
  await fill('例: 太郎', `検証${STAMP}`);
  await fill('例: ヤマダ', 'テスト');
  await fill('例: タロウ', 'ケンショウ');
  await fill('例: 12345678', '90000001');
  await next();
  const errs = await validationErrors();
  if (errs.length) throw new Error('検証エラー: ' + errs.join(' / '));
});

await step('⑥ 住所・連絡情報を入力（郵送先＝勤務先）', async () => {
  await fill('例: ひらかた介護ステーション', 'テスト事業所（検証用）');
  // 郵便番号は 3 桁 + 4 桁。勤務先側が 0 番目、自宅側が 1 番目。
  await fill('123', '573', 0);
  await fill('4567', '0153', 0);
  await fill('例: 津田元町1-1-1', '藤阪東町1-3-10', 0);
  await f.getByRole('radio', { name: /勤務先/ }).click();
  await page.waitForTimeout(400);
  await fill('例: 072-000-0000', '072-859-9100');
  await fill('例: taro@example.com', 'k.noguchi@uguisunosato.or.jp');
  await next(6000);
  const errs = await validationErrors();
  if (errs.length) throw new Error('検証エラー: ' + errs.join(' / '));
});

console.log('\n--- 入力確認ステップ ---');
console.log((await f.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 1600));
console.log('\nconsole errors:', errors.length ? errors : 'なし');

if (process.argv.includes('--submit')) {
  await step('⑦ 送信', async () => {
    await f.getByRole('button', { name: /入会申込を送信|この内容で申し込む|送信/ }).last().click();
    await page.waitForTimeout(45000);
  });
  console.log('\n--- 送信後 ---');
  console.log((await f.locator('body').innerText()).replace(/\n{2,}/g, '\n').slice(0, 1200));
  console.log('\nconsole errors:', errors.length ? errors : 'なし');
} else {
  console.log('\n※ 送信は --submit を付けたときだけ行う。');
}

await browser.close();
