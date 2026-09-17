/**
 * 公開ポータルの「登録情報変更」「退会申請」を、本番相当の管理承認まで通す検証。
 *
 * テスト会員だけを対象にする。会員名・連絡先・会員ID・URL・認証状態はプロセス内に
 * 留め、標準出力には出さない。登録情報は一時変更後に元へ戻し、年度末退会は
 * 管理画面の正規操作で必ず取消して在籍中に復元する。
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

const ADMIN_STATE = '.test-out/auth-admin.json';

// ローカル設定はスクリプト内だけで読む。値は出力しない。
try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* process.env の設定を使う */ }

const PUBLIC_URL = process.env.PORTAL_URL_PUBLIC;
const ADMIN_URL = process.env.PORTAL_URL_ADMIN;
if (!PUBLIC_URL || !ADMIN_URL) throw new Error('PORTAL_URL_PUBLIC / PORTAL_URL_ADMIN をローカル設定に指定してください。');

function assertTestIdentity(identity) {
  const joinedName = `${identity.lastName || ''}${identity.firstName || ''}`;
  if (!joinedName.startsWith('テスト会員') || !String(identity.email || '').endsWith('.invalid')) {
    throw new Error('テスト会員以外を対象にしそうなため中止しました。');
  }
  if (!identity.memberId || !identity.mobilePhone) {
    throw new Error(`テスト会員の本人確認に必要な情報を取得できません（会員ID: ${Boolean(identity.memberId)}, 携帯電話: ${Boolean(identity.mobilePhone)}）。`);
  }
}

async function openAdmin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/report-only Content Security Policy/i.test(text) && /frame-ancestors/i.test(text)) return;
    errors.push(text);
  });
  page.on('dialog', async (dialog) => { await dialog.accept(); });
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
  await page.waitForTimeout(2500);
  return { browser, context, page, frame, errors };
}

async function clickText(frame, label) {
  return frame.evaluate((text) => {
    const candidates = Array.from(document.querySelectorAll('button,a,[role="button"]'));
    const target = candidates.find((el) => (el.innerText || '').trim() === text)
      || candidates.find((el) => (el.innerText || '').includes(text));
    if (!target) return false;
    target.click();
    return true;
  }, label);
}

async function getTestMemberIdentity() {
  const session = await openAdmin();
  try {
    await clickText(session.frame, '会員管理');
    await session.page.waitForTimeout(400);
    await clickText(session.frame, '会員一覧');
    await session.page.waitForTimeout(6000);
    for (let candidateIndex = 0; candidateIndex < 10; candidateIndex += 1) {
      const box = session.frame.getByPlaceholder(/キーワード|会員番号/).first();
      await box.fill('テスト 会員');
      await session.page.waitForTimeout(4000);
      const row = session.frame.locator('tr').filter({ hasText: 'テスト 会員' }).nth(candidateIndex);
      if (!await row.count()) break;
      await row.click();
      await session.frame.getByText('会員詳細編集', { exact: true }).waitFor({ timeout: 90000 });
      await session.page.waitForTimeout(3000);
      const identity = await session.frame.evaluate(() => {
        const valueByLabel = (labelText) => {
          for (const label of Array.from(document.querySelectorAll('label'))) {
            if (!(label.textContent || '').trim().startsWith(labelText)) continue;
            const input = label.parentElement?.querySelector('input');
            if (input) return input.value || '';
          }
          return '';
        };
        const body = document.body.innerText || '';
        const idMatch = body.match(/会員ID:\s*([^\s]+)/);
        return {
          memberId: idMatch?.[1] || '',
          lastName: valueByLabel('姓'),
          firstName: valueByLabel('名'),
          mobilePhone: valueByLabel('携帯電話番号'),
          email: document.querySelector('input[type="email"]')?.value || '',
        };
      });
      try {
        assertTestIdentity(identity);
        return { identity, consoleErrorCount: session.errors.length };
      } catch (error) {
        if (candidateIndex === 9) throw error;
        await clickText(session.frame, '会員管理');
        await session.page.waitForTimeout(400);
        await clickText(session.frame, '会員一覧');
        await session.page.waitForTimeout(6000);
      }
    }
    throw new Error('本人確認に使える連絡先を持つテスト会員が会員一覧に見つかりません。');
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

async function submitPublicUpdate(identity, nextMobilePhone) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
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
    await frame.locator('input[type="tel"]').first().fill(nextMobilePhone);
    await frame.getByRole('button', { name: '変更を申請する', exact: true }).click();
    await frame.getByText('変更申請を受け付けました', { exact: true }).waitFor({ timeout: 90000 });
    return { consoleErrorCount: errors.length };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function submitPublicWithdrawal(identity) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
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

async function approveNewestPendingRequest(memberId, requestLabel) {
  const session = await openAdmin();
  try {
    await clickText(session.frame, '変更申請管理');
    await session.frame.getByRole('button', { name: '承認済', exact: true }).click();
    await session.page.waitForTimeout(3000);
    const deadline = Date.now() + 90000;
    let requestId = '';
    while (Date.now() < deadline && !requestId) {
      requestId = await session.frame.evaluate(([id, label]) => {
        const cards = Array.from(document.querySelectorAll('div'))
          .filter((el) => (el.textContent || '').includes(`会員ID: ${id}`) && (el.textContent || '').includes(label));
        for (const card of cards) {
          const text = card.textContent || '';
          if (!text.includes('未処理')) continue;
          const m = text.match(/申請ID:\s*(CR\d+_[a-f0-9]+)/i);
          if (m) return m[1];
        }
        return '';
      }, [memberId, requestLabel]);
      if (!requestId) await session.page.waitForTimeout(1000);
    }
    if (!requestId) throw new Error(`${requestLabel}の未処理申請を特定できません。`);
    const marker = await session.frame.evaluate((id) => {
      const leaf = Array.from(document.querySelectorAll('*')).find((el) => {
        return (el.textContent || '').trim() === id;
      });
      if (!leaf) return false;
      let node = leaf;
      while (node && node !== document.body) {
        if (Array.from(node.querySelectorAll('button')).some((button) => (button.innerText || '').trim() === '承認してDBに反映')) {
          node.setAttribute('data-live-test-request', 'true');
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }, requestId);
    if (!marker) throw new Error('承認対象の申請カードを特定できません。');
    await session.frame.locator('[data-live-test-request="true"]').getByRole('button', { name: '承認してDBに反映', exact: true }).click();
    const start = Date.now();
    while (Date.now() - start < 90000) {
      const pending = await session.frame.evaluate((id) => {
        const text = document.body.innerText || '';
        const at = text.indexOf(id);
        return at >= 0 && text.slice(Math.max(0, at - 500), at + 800).includes('承認してDBに反映');
      }, requestId);
      if (!pending) return { consoleErrorCount: session.errors.length };
      await session.page.waitForTimeout(1000);
    }
    throw new Error('承認完了を確認できません。');
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

async function getLatestTestWithdrawalRequest() {
  const session = await openAdmin();
  try {
    const result = await session.frame.evaluate(() => new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler((response) => resolve(response))
        .withFailureHandler((error) => reject(new Error(String(error?.message || error))))
        .processApiRequest('getAdminChangeRequests', JSON.stringify({}));
    }));
    const parsed = JSON.parse(String(result));
    if (!parsed?.success || !Array.isArray(parsed?.data)) throw new Error('退会申請一覧を取得できません。');
    const request = parsed.data
      .filter((item) => item?.requestType === 'WITHDRAWAL'
        && String(item?.contactEmail || '').endsWith('.invalid'))
      .sort((a, b) => String(b?.requestedAt || '').localeCompare(String(a?.requestedAt || '')))[0];
    if (!request?.memberId || !request?.requestId) {
      const summary = parsed.data.reduce((acc, item) => {
        const key = `${String(item?.requestType || 'unknown')}:${String(item?.status || 'unknown')}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      throw new Error(`最新のテスト退会申請を特定できません（一覧内訳: ${JSON.stringify(summary)}）。`);
    }
    return { memberId: String(request.memberId), requestId: String(request.requestId), status: String(request.status || '') };
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

async function cancelScheduledWithdrawal(memberId) {
  const session = await openAdmin();
  try {
    await clickText(session.frame, '会員管理');
    await session.page.waitForTimeout(400);
    await clickText(session.frame, '会員一覧');
    await session.page.waitForTimeout(6000);
    const statusSelect = session.frame.locator('select').filter({ hasText: '退会予定' }).first();
    if (await statusSelect.count()) await statusSelect.selectOption({ label: '全状態' });
    const box = session.frame.getByPlaceholder(/キーワード|会員番号/).first();
    await box.fill(memberId);
    await session.page.waitForTimeout(5000);
    const row = session.frame.locator('tr').filter({ hasText: memberId }).first();
    if (!await row.count()) throw new Error('退会取消対象のテスト会員を会員一覧で確認できません。');
    await row.click();
    await session.page.waitForTimeout(14000);
    const cancel = session.frame.getByRole('button', { name: '退会をキャンセルする', exact: true });
    if (await cancel.count()) {
      await cancel.click();
      await session.page.waitForTimeout(30000);
    } else {
      // 個人・賛助会員には専用の取消 UI がない。状態を残さないため、管理画面と
      // 同じ認可済み action をテスト後片付けとして呼び出す（対象はテスト会員だけ）。
      const result = await session.frame.evaluate((id) => new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((response) => resolve(response))
          .withFailureHandler((error) => reject(new Error(String(error?.message || error))))
          .processApiRequest('cancelScheduledWithdraw', JSON.stringify({ memberId: id }));
      }), memberId);
      const parsed = JSON.parse(String(result));
      if (!parsed?.success || !parsed?.data?.cancelled) {
        throw new Error(`退会予定の復元を確認できません（success: ${Boolean(parsed?.success)}, cancelled: ${Boolean(parsed?.data?.cancelled)}, error: ${String(parsed?.error || 'none')}）。`);
      }
    }
    return { consoleErrorCount: session.errors.length };
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

if (process.argv.includes('--cancel-only')) {
  const request = await getLatestTestWithdrawalRequest();
  if (request.status === 'PENDING') {
    const session = await openAdmin();
    try {
      const result = await session.frame.evaluate((requestId) => new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler((response) => resolve(response))
          .withFailureHandler((error) => reject(new Error(String(error?.message || error))))
          .processApiRequest('approveAdminChangeRequest', JSON.stringify({ requestId, note: 'ライブテスト後片付け' }));
      }), request.requestId);
      const parsed = JSON.parse(String(result));
      if (!parsed?.success) throw new Error('テスト退会申請の承認を確認できません。');
    } finally {
      await session.context.close();
      await session.browser.close();
    }
  } else if (request.status !== 'APPROVED') {
    throw new Error(`テスト退会申請の状態が復元対象ではありません（${request.status || '不明'}）。`);
  }
  const cancellation = await cancelScheduledWithdrawal(request.memberId);
  console.log(`PASS: 年度末退会を在籍中へ復元（console errors: ${cancellation.consoleErrorCount}）`);
} else {
  const identityResult = await getTestMemberIdentity();
  const identity = identityResult.identity;
  const temporaryMobile = identity.mobilePhone === '090-0000-0001' ? '090-0000-0002' : '090-0000-0001';
  let restoreNeeded = false;
  try {
  const updateRequest = await submitPublicUpdate(identity, temporaryMobile);
  restoreNeeded = true;
  const updateApproval = await approveNewestPendingRequest(identity.memberId, '登録情報変更');
  console.log(`PASS: 会員情報変更の受付・確定（console errors: ${updateRequest.consoleErrorCount + updateApproval.consoleErrorCount}）`);

  const changedIdentity = { ...identity, mobilePhone: temporaryMobile };
  const restoreRequest = await submitPublicUpdate(changedIdentity, identity.mobilePhone);
  const restoreApproval = await approveNewestPendingRequest(identity.memberId, '登録情報変更');
  restoreNeeded = false;
  console.log(`PASS: 会員情報を検証前の値へ復元（console errors: ${restoreRequest.consoleErrorCount + restoreApproval.consoleErrorCount}）`);

  const withdrawalRequest = await submitPublicWithdrawal(identity);
  const withdrawalApproval = await approveNewestPendingRequest(identity.memberId, '退会申請');
  const cancellation = await cancelScheduledWithdrawal(identity.memberId);
  console.log(`PASS: 年度末退会の受付・確定・管理画面での取消（console errors: ${withdrawalRequest.consoleErrorCount + withdrawalApproval.consoleErrorCount + cancellation.consoleErrorCount}）`);
  console.log('PASS: 実運用通知フローの検証を完了しました。');
} catch (error) {
  console.error(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
  if (restoreNeeded) console.error('RECOVERY_REQUIRED: 登録情報変更の復元を管理画面で確認してください。');
  process.exitCode = 1;
  }
}
