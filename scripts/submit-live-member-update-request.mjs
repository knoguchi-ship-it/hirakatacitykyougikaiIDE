/**
 * 実運用同等の公開ポータルから、直近の明示テスト会員の情報変更／退会「申請だけ」を投入する。
 *
 * 対象者は、氏名が「テスト会員」で始まり、初期テスト用携帯番号を保有する
 * 承認済み会員に限定する。連絡先メールアドレスは会員レコードから内部的にだけ使い、
 * 個人情報・URL・受付番号は標準出力に出さない。
 * 承認 API は一切呼ばないため、DB 上の会員情報は変化せず PENDING 申請だけが作成される。
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

const VERIFY_ONLY = process.argv.includes('--verify-only');
const WITHDRAWAL = process.argv.includes('--withdrawal');
const REQUEST_TYPE = WITHDRAWAL ? 'WITHDRAWAL' : 'MEMBER_UPDATE';
const EXPECTED_MOBILE_PHONE = WITHDRAWAL ? '090-0000-0001' : '090-0000-0000';

try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* process.env の設定を使う */ }

const PUBLIC_URL = process.env.PORTAL_URL_PUBLIC;
const ADMIN_URL = process.env.PORTAL_URL_ADMIN;
const ADMIN_STATE = '.test-out/auth-admin.json';
if (!PUBLIC_URL || !ADMIN_URL) throw new Error('PORTAL_URL_PUBLIC / PORTAL_URL_ADMIN をローカル設定に指定してください。');

function assertTarget(identity) {
  const name = `${identity.lastName || ''}${identity.firstName || ''}`;
  if (
    !name.startsWith('テスト会員')
    || identity.mobilePhone !== EXPECTED_MOBILE_PHONE
    || !identity.memberId
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)
    || identity.email.endsWith('.invalid')
  ) {
    throw new Error('今回承認したテスト会員を一意に本人確認できないため中止しました。');
  }
}

async function clickText(frame, label) {
  const clicked = await frame.evaluate((text) => {
    const targets = Array.from(document.querySelectorAll('button,a,[role="button"]'));
    const target = targets.find((el) => (el.innerText || '').trim() === text)
      || targets.find((el) => (el.innerText || '').includes(text));
    if (!target) return false;
    target.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`管理画面の「${label}」を開けませんでした。`);
}

async function findApprovedTestMember() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE });
  const page = await context.newPage();
  try {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
    await page.waitForTimeout(2500);
    await clickText(frame, '会員管理');
    await page.waitForTimeout(400);
    await clickText(frame, '会員一覧');
    await page.waitForTimeout(5000);
    const search = frame.getByPlaceholder(/キーワード|会員番号/).first();
    await search.fill('テスト 会員');
    await page.waitForTimeout(3500);
    const rows = frame.locator('tr').filter({ hasText: 'テスト 会員' });
    const count = Math.min(await rows.count(), 10);
    for (let index = 0; index < count; index += 1) {
      await rows.nth(index).click();
      await frame.getByText('会員詳細編集', { exact: true }).waitFor({ timeout: 90000 });
      await page.waitForTimeout(1200);
      const identity = await frame.evaluate(() => {
        const valueByLabel = (labelText) => {
          for (const label of Array.from(document.querySelectorAll('label'))) {
            if (!(label.textContent || '').trim().startsWith(labelText)) continue;
            const input = label.parentElement?.querySelector('input');
            if (input) return input.value || '';
          }
          return '';
        };
        return {
          memberId: (document.body.innerText || '').match(/会員ID:\s*([^\s]+)/)?.[1] || '',
          lastName: valueByLabel('姓'),
          firstName: valueByLabel('名'),
          mobilePhone: valueByLabel('携帯電話番号'),
          email: document.querySelector('input[type="email"]')?.value || '',
        };
      });
      try {
        assertTarget(identity);
        return identity;
      } catch (error) {
        if (index + 1 >= count) throw error;
        await clickText(frame, '会員管理');
        await page.waitForTimeout(400);
        await clickText(frame, '会員一覧');
        await page.waitForTimeout(2500);
        await search.fill('テスト 会員');
        await page.waitForTimeout(2500);
      }
    }
    throw new Error('今回承認したテスト会員が会員一覧に見つかりません。');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function countPendingRequests(memberId) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE });
  const page = await context.newPage();
  try {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
    await page.waitForTimeout(1500);
    const raw = await frame.evaluate(() => new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((response) => resolve(response))
        .withFailureHandler((error) => reject(new Error(String(error?.message || error))))
        .processApiRequest('getAdminChangeRequests', JSON.stringify({}));
    }));
    const parsed = JSON.parse(String(raw));
    if (!parsed?.success || !Array.isArray(parsed?.data)) throw new Error('変更申請一覧を取得できません。');
    return parsed.data.filter((request) => request?.requestType === REQUEST_TYPE
      && request?.status === 'PENDING'
      && String(request?.memberId || '') === memberId).length;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function submitUpdate(identity) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    await page.goto(PUBLIC_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const frame = await getAppFrame(page, /お申込みポータル|会員情報|登録情報/);
    await frame.getByRole('button', { name: /変更手続きへ進む|登録情報を変更/ }).first().click();
    await frame.getByRole('button', { name: /賛助会員/ }).first().click();
    await frame.locator('#iv-last-name').fill(identity.lastName);
    await frame.locator('#iv-first-name').fill(identity.firstName);
    await frame.getByRole('radio', { name: '携帯電話番号' }).click();
    await frame.locator('#iv-credential').fill(identity.mobilePhone);
    await frame.locator('#iv-email').fill(identity.email);
    await frame.getByRole('button', { name: '確認して次へ', exact: true }).click();
    await frame.getByText('変更する項目を選択', { exact: false }).waitFor({ timeout: 90000 });
    await frame.locator('label').filter({ hasText: '連絡先メール・携帯電話番号' }).first().click();
    await frame.getByRole('button', { name: /次へ進む/ }).click();
    await frame.locator('input[type="tel"]').first().fill('090-0000-0001');
    await frame.getByRole('button', { name: '変更を申請する', exact: true }).click();
    await frame.getByText('変更申請を受け付けました', { exact: true }).waitFor({ timeout: 90000 });
    return { consoleErrorCount: errors.length };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function submitWithdrawal(identity) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    await page.goto(PUBLIC_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const frame = await getAppFrame(page, /お申込みポータル|退会/);
    await frame.getByRole('button', { name: /退会手続きへ進む|退会を申し込む/ }).first().click();
    await frame.getByRole('button', { name: /賛助会員/ }).first().click();
    await frame.locator('#iv-last-name').fill(identity.lastName);
    await frame.locator('#iv-first-name').fill(identity.firstName);
    await frame.getByRole('radio', { name: '携帯電話番号' }).click();
    await frame.locator('#iv-credential').fill(identity.mobilePhone);
    await frame.locator('#iv-email').fill(identity.email);
    await frame.getByRole('button', { name: '確認して次へ', exact: true }).click();
    await frame.getByText('退会内容の確認', { exact: true }).waitFor({ timeout: 90000 });
    await frame.getByRole('radio', { name: /年度末退会/ }).check();
    await frame.locator('input[type="checkbox"]').check();
    await frame.getByRole('button', { name: '退会を申し込む', exact: true }).click();
    await frame.getByText('退会申請を受け付けました', { exact: true }).waitFor({ timeout: 90000 });
    return { consoleErrorCount: errors.length };
  } finally {
    await context.close();
    await browser.close();
  }
}

const identity = await findApprovedTestMember();
if (VERIFY_ONLY) {
  const pendingCount = await countPendingRequests(identity.memberId);
  if (pendingCount < 1) throw new Error('対象会員の未処理申請を確認できません。');
  console.log(JSON.stringify({ ok: true, request: REQUEST_TYPE, status: 'PENDING', pendingCount }));
} else {
  const result = WITHDRAWAL ? await submitWithdrawal(identity) : await submitUpdate(identity);
  const pendingCount = await countPendingRequests(identity.memberId);
  if (pendingCount < 1) throw new Error('送信後に未処理申請を確認できません。');
  console.log(JSON.stringify({ ok: true, request: REQUEST_TYPE, status: 'PENDING', pendingCount, consoleErrorCount: result.consoleErrorCount }));
}
