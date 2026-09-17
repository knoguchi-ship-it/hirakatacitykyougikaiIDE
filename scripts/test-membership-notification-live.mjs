// 会員マイページの実フローで Google Chat 会員手続き通知を確認する。
// .env.test の検証用資格情報だけをプロセス内で使い、値・会員情報は出力しない。
// 会員情報変更は値を変えず保存し、退会は年度末申請後に同一セッションで必ず取消す。
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* CI/実行環境の process.env をそのまま使う */ }

const memberUrl = process.env.PORTAL_URL_MEMBER
  || 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
const loginId = process.env.MEMBER_LOGIN_ID;
const password = process.env.MEMBER_PASSWORD;
const withdrawalOnly = process.argv.includes('--withdrawal-only');
if (!loginId || !password) throw new Error('MEMBER_LOGIN_ID / MEMBER_PASSWORD が未設定です。');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
const dialogs = [];
let withdrawalScheduled = false;

page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
});
page.on('dialog', async (dialog) => {
  dialogs.push(dialog.message());
  await dialog.accept();
});

async function waitUntil(check, label, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await check()) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`${label} を確認できませんでした。`);
}

try {
  await page.goto(memberUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const frame = await getAppFrame(page, /ログインID|マイページ|会員情報/);
  await frame.locator('input[placeholder="ログインID"]').fill(loginId);
  await frame.locator('input[placeholder="パスワード"]').fill(password);
  await frame.getByRole('button', { name: 'ログイン', exact: true }).click();
  await waitUntil(() => frame.getByText('会員情報', { exact: true }).count().then(Boolean), '会員マイページの表示');

  if (!withdrawalOnly) {
    // 実際の保存経路を通す。値は変えず、検証用会員の登録内容を不必要に変更しない。
    await frame.getByRole('button', { name: /会員情報を確認・変更/ }).click();
    await frame.getByRole('button', { name: '変更を保存する', exact: true }).click();
    await waitUntil(() => dialogs.some((message) => message === '登録情報を更新しました。'), '会員情報変更の受付');
    // MemberForm は保存開始後に完了ダイアログを出す。非同期保存の失敗は別ダイアログになるため、
    // 応答待ちの余裕を置いて明示的に失敗を検査する。
    await page.waitForTimeout(15000);
    if (dialogs.some((message) => message === '保存に失敗しました。')) {
      throw new Error('会員情報変更の保存に失敗しました。');
    }
    console.log('PASS: 会員情報変更（本番マイページ経路・値は不変）');
  }

  // 年度末退会を申請した直後に取消す。取消しを finally にも置き、検証会員を退会予定のまま残さない。
  await frame.getByRole('button', { name: '退会を申請する', exact: true }).first().click();
  const withdrawalPassword = frame.locator('input[placeholder="現在のパスワード"]').first();
  await withdrawalPassword.fill(password);
  await frame.getByRole('button', { name: '退会を申請する', exact: true }).last().click();
  await waitUntil(() => frame.getByText('退会予定', { exact: true }).count().then(Boolean), '退会申請の完了');
  withdrawalScheduled = true;
  console.log('PASS: 年度末退会申請（本番マイページ経路）');

  await frame.locator('input[placeholder="現在のパスワード"]').fill(password);
  await frame.getByRole('button', { name: '退会を取り消す', exact: true }).click();
  await waitUntil(() => frame.getByText('退会予定', { exact: true }).count().then((count) => count === 0), '退会申請の取消');
  withdrawalScheduled = false;
  console.log('PASS: 退会申請を取消し、検証会員を復元');

  if (consoleErrors.length) throw new Error(`console error: ${consoleErrors.join(' | ')}`);
  console.log('PASS: 会員情報変更・退会の実フローに console error はありません。');
} finally {
  // 途中失敗時も、可能な限り退会予定を戻す。
  if (withdrawalScheduled) {
    try {
      const frame = await getAppFrame(page, /退会予定|会員情報/);
      await frame.locator('input[placeholder="現在のパスワード"]').fill(password);
      await frame.getByRole('button', { name: '退会を取り消す', exact: true }).click();
      await page.waitForTimeout(5000);
      console.log('RECOVERY: 退会申請を取消しました。');
    } catch {
      console.error('RECOVERY_REQUIRED: 退会申請の取消を確認できません。管理画面で検証会員の状態を確認してください。');
    }
  }
  await context.close();
  await browser.close();
}
