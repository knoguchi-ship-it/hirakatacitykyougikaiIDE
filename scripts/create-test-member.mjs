/**
 * テスト用会員アカウントの作成（公開ポータルからの入会申込を自動投入する）。
 *
 * 経緯: 管理ポータルには「会員を直接作成する」機能が無い（ADMIN_ACTION_PERMISSIONS に
 * 会員作成の action が存在しない）。会員レコードを作れるのは
 *   ① 入会申込の承認（createMemberApplicationDirect_）
 *   ② seedDemoData（本番 DB を破壊するため禁止・AGENTS.md §4.3）
 *   ③ provisionDemoAccountsJson（パスワードがソース固定値のため非推奨）
 * の 3 つだけで、①だけが安全な正規経路である。本スクリプトは①の申込投入を自動化する。
 *
 * ■ 会員種別に「賛助会員」を使う理由
 *   賛助会員は介護支援専門員番号が任意で、フォームにも入力欄が出ない（INDIVIDUAL のみ表示）。
 *   実在の専門員番号を使わずに済み、ログイン ID は generateCmBasedLoginId_ が
 *   「9 + 8 桁」で自動採番する（BR-01）。
 *
 * ■ 実行前に operator が必ず行うこと
 *   1. 管理 → システム設定 → メール通知 → メール配信 で
 *      配信状態を「停止」にする。
 *      申込の受付確認メールと、承認時のログイン情報メールが実際に飛ぶため。
 *   2. 本スクリプトは **本番 DB に変更申請（PENDING）を 1 件作る**。承認するまで会員にはならない。
 *
 * ■ 実行後の手順（operator）
 *   3. 管理 → 変更申請管理 で当該申請を承認する（会員＋認証アカウントが作られる）
 *   4. 会員詳細 → パスワードのリセット で新しいパスワードを発行する
 *   5. ログイン ID と パスワードを .env.test の MEMBER_LOGIN_ID / MEMBER_PASSWORD に記入する
 *      （AGENTS.md §0: AI は値を見ない・出力しない・要求しない）
 *   6. メール配信状態を元の設定へ戻す
 *
 * ■ 後片付け
 *   管理 → データ管理 → 会員削除（アーカイブ移動。削除バッチ単位で復元できる）。
 *   ※ deleteTestData_APPLY は test-member-*.invalid を厳格一致で対象に含める。
 *
 * 使い方:
 *   node scripts/create-test-member.mjs             # dry-run（確認画面まで進めて送信しない）
 *   node scripts/create-test-member.mjs --submit    # 実際に申込を送信する
 *   node scripts/create-test-member.mjs --headed    # ブラウザを表示する
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const SUBMIT = process.argv.includes('--submit');
const HEADED = process.argv.includes('--headed');
const CONTACT_EMAIL_INDEX = process.argv.indexOf('--contact-email');
const CONTACT_EMAIL = CONTACT_EMAIL_INDEX >= 0 ? String(process.argv[CONTACT_EMAIL_INDEX + 1] || '').trim() : '';
if (CONTACT_EMAIL_INDEX >= 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONTACT_EMAIL)) {
  throw new Error('--contact-email には送信先メールアドレスを指定してください。');
}

// .env.test があれば読む（値はログに出さない）
try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env.test が無ければ既定値を使う */ }

const PORTAL_URL = process.env.PORTAL_URL_PUBLIC
  || 'https://script.google.com/macros/s/AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp/exec';

/**
 * テストデータであることが一目で分かる値にする。
 * メールは RFC 6761 の予約 TLD `.invalid`（実在せず、誤送信しても外部へ届かない）。
 */
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const DATA = {
  lastName: 'テスト',
  firstName: `会員${stamp}`,
  lastKana: 'テスト',
  firstKana: 'カイイン',
  officeName: `[テスト]検証用事業所${stamp}`,
  postCode3: '573',
  postCode4: '0027',
  prefecture: '大阪府',
  city: '枚方市',
  addressLine: 'テスト町1-1-1',
  mobilePhone: '090-0000-0000',
  // 指定時だけ実在の宛先へ受付メールを送る。未指定時は予約ドメインを維持する。
  email: CONTACT_EMAIL || `test-member-${stamp}@example.invalid`,
};

const log = (...a) => console.log('[create-test-member]', ...a);


/** SPA が描画されている frame を内容で特定する（responsive-test.mjs と同じ方式） */
async function getAppFrame(page) {
  await page.waitForLoadState('domcontentloaded');
  for (let i = 0; i < 90; i += 1) {
    await page.waitForTimeout(500);
    for (const f of page.frames()) {
      try {
        const info = await f.evaluate(() => {
          const t = (document.body && document.body.innerText) || '';
          return { len: t.length, hasApp: /新規入会|お申込みポータル|研修申込/.test(t) };
        });
        if (info.len > 100 && info.hasApp) return f;
      } catch { /* まだ読み込み中 */ }
    }
  }
  throw new Error('公開ポータルの frame が 45s 以内に現れませんでした');
}

const run = async () => {
  log(SUBMIT ? '★ 実送信モード（本番 DB に変更申請を作ります）' : 'dry-run（確認画面まで進めて送信しません）');
  log('portal:', PORTAL_URL);

  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    await page.goto(PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // GAS は SPA を二重ネストの iframe（URL は /blank）に描画する。
    // URL では判別できないため、既存テスト（scripts/responsive-test.mjs）と同じく内容で探す。
    const root = await getAppFrame(page);
    log('公開ポータルを表示');

    // ホームの主要 CTA が出るまで待つ（GAS の 1 呼び出しは 1.8〜5s かかる）
    for (let i = 0; i < 60; i += 1) {
      const ready = await root.evaluate(() => Array.from(document.querySelectorAll('button'))
        .some(b => (b.innerText || '').includes('新規入会を申し込む'))).catch(() => false);
      if (ready) break;
      await page.waitForTimeout(500);
    }

    // ホーム → 入会申込
    await root.getByRole('button', { name: /新規入会/ }).first().click();

    // Step 0: v376.74 以降、会員種別を先に選び、次の注意事項ステップで確認する。
    // 種別カードは最初から選択できる（旧「重要事項を確認する」ダイアログは廃止）。
    await root.locator('button:not([disabled])', { hasText: '賛助会員' }).first()
      .waitFor({ state: 'visible', timeout: 30000 });
    await root.locator('button', { hasText: '賛助会員' }).first().click();
    log('会員種別: 賛助会員');

    // Step 1: 全体・種別ごとの注意事項を確認して同意する。
    await root.getByText('事務局からのお願い', { exact: false }).waitFor({ timeout: 30000 });
    const checkbox = root.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await root.getByRole('button', { name: '次へ' }).click();
    log('注意事項を確認済みにした');

    // Step 2: 基本情報（placeholder で一意に特定する。label は input と兄弟でないため使わない）
    await root.getByPlaceholder('例: 山田').fill(DATA.lastName);
    await root.getByPlaceholder('例: 太郎').fill(DATA.firstName);
    await root.getByPlaceholder('例: ヤマダ').fill(DATA.lastKana);
    await root.getByPlaceholder('例: タロウ').fill(DATA.firstKana);
    log('基本情報を入力');
    await root.getByRole('button', { name: '次へ' }).click();

    // Step 2: 住所・連絡先
    // 郵送先の既定は「勤務先」。既定のまま勤務先を必須項目として埋める。
    // 郵便番号は 3 桁 + 4 桁の 2 入力（UI/UX §10.4）で、勤務先ブロックが先に来る。
    await root.getByPlaceholder('例: ひらかた介護ステーション').fill(DATA.officeName);
    await root.getByPlaceholder('123').first().fill(DATA.postCode3);
    await root.getByPlaceholder('4567').first().fill(DATA.postCode4);
    await root.locator('select').first().selectOption({ label: DATA.prefecture });
    await root.getByPlaceholder('例: 枚方市').first().fill(DATA.city);
    await root.getByPlaceholder('例: 津田元町1-1-1').first().fill(DATA.addressLine);
    await root.getByPlaceholder('例: 090-0000-0000').fill(DATA.mobilePhone);
    await root.getByPlaceholder('例: taro@example.com').fill(DATA.email);
    log('住所・連絡先を入力');
    await root.getByRole('button', { name: '次へ' }).click();

    // Step 3: 確認
    await root.getByText('確認', { exact: false }).first().waitFor({ timeout: 30000 });
    await page.screenshot({ path: '.test-out/create-test-member-confirm.png', fullPage: true });
    log('確認画面のスクリーンショット: .test-out/create-test-member-confirm.png');

    if (!SUBMIT) {
      log('dry-run のため送信しません。問題なければ --submit を付けて再実行してください。');
      return;
    }

    await root.getByRole('button', { name: /申し込む|送信/ }).first().click();
    await root.getByText('受付番号', { exact: false }).waitFor({ timeout: 120000 });
    // 受付番号は「CR<数字>_<hex>」形式で、font-mono の <p> に入る（大文字英数だけではない）
    const receipt = await root.locator('p.font-mono').first().textContent().catch(() => null);
    log('申込を送信しました。受付番号:', (receipt || '').trim() || '（画面を確認してください）');
    await page.screenshot({ path: '.test-out/create-test-member-done.png', fullPage: true });
    log('');
    log('次は operator の作業です:');
    log('  1. 管理 → 変更申請管理 で「' + DATA.lastName + DATA.firstName + '」の申請を承認する');
    log('  2. 会員詳細 → パスワードのリセット で新しいパスワードを発行する');
    log('  3. ログインID と パスワードを .env.test に記入する（値は AI へ渡さない）');
    log('  4. メール配信状態を元の設定へ戻す');
  } finally {
    if (consoleErrors.length) log('console errors:', consoleErrors.length, consoleErrors.slice(0, 3));
    await browser.close();
  }
};

run().catch(err => { console.error('[create-test-member] 失敗:', err.message); process.exit(1); });
