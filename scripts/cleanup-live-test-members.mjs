/**
 * このライブテストで作成した test-member-*.invalid だけを正規の会員削除で片付ける。
 * live テーブルからは cascade archive で除去され、ログイン履歴だけは物理削除される。
 * 値・ID・メールアドレスを標準出力に出さない。
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* process.env を使う */ }

const ADMIN_URL = process.env.PORTAL_URL_ADMIN;
if (!ADMIN_URL) throw new Error('PORTAL_URL_ADMIN をローカル設定に指定してください。');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: '.test-out/auth-admin.json',
});
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  const text = message.text();
  if (/report-only Content Security Policy/i.test(text) && /frame-ancestors/i.test(text)) return;
  consoleErrors.push(text);
});

async function callAdmin(frame, action, payload) {
  const raw = await frame.evaluate(([name, data]) => new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((response) => resolve(response))
      .withFailureHandler((error) => reject(new Error(String(error?.message || error))))
      .processApiRequest(name, JSON.stringify(data ?? {}));
  }), [action, payload]);
  const parsed = JSON.parse(String(raw));
  if (!parsed?.success) throw new Error(`${action} failed: ${String(parsed?.error || 'unknown')}`);
  return parsed.data;
}

function isCurrentLiveTestRequest(request) {
  return /^test-member-[^@\s]+@example\.invalid$/i.test(String(request?.contactEmail || ''));
}

try {
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
  await page.waitForTimeout(2500);

  const requests = await callAdmin(frame, 'getAdminChangeRequests', {});
  if (!Array.isArray(requests)) throw new Error('変更申請一覧を取得できません。');
  const liveTestRequests = requests.filter(isCurrentLiveTestRequest);
  const pendingApplications = liveTestRequests.filter((request) => request.requestType === 'MEMBER_APPLICATION' && request.status === 'PENDING');
  const nonPending = liveTestRequests.filter((request) => request.requestType === 'MEMBER_APPLICATION' && request.status !== 'PENDING');

  // 想定外に多数の未処理テスト入会を巻き込まない。今回の手順で作る未処理申請は最大1件。
  if (pendingApplications.length > 1) throw new Error('未処理のテスト入会申請が複数あるため、安全のため中止しました。');

  const memberIds = new Set(liveTestRequests.map((request) => String(request.memberId || '')).filter(Boolean));
  for (const request of pendingApplications) {
    const approved = await callAdmin(frame, 'approveAdminChangeRequest', {
      requestId: String(request.requestId),
      note: 'ライブテストデータの削除前処理',
    });
    const memberId = String(approved?.result?.memberId || approved?.memberId || '');
    if (!memberId) throw new Error('テスト入会申請の承認後に会員IDを確認できません。');
    memberIds.add(memberId);
  }

  if (memberIds.size === 0 && nonPending.length === 0) {
    console.log('PASS: 削除対象のライブテスト会員はありません。');
  } else {
    let archivedMembers = 0;
    let movedRows = 0;
    for (const memberId of memberIds) {
      const targetKey = `member:${memberId}`;
      const preview = await callAdmin(frame, 'previewDeleteMember', { targetKeys: [targetKey] });
      const target = Array.isArray(preview?.targets) ? preview.targets[0] : null;
      if (!target || target.targetKind !== 'MEMBER' || target.memberType !== 'SUPPORT' || !/^テスト\s*会員/.test(String(target.displayName || ''))) {
        throw new Error('削除対象の安全確認に失敗しました。');
      }
      const result = await callAdmin(frame, 'executeDeleteMember', {
        targetKeys: [targetKey],
        confirmText: '論理削除',
      });
      if (!Array.isArray(result?.archivedTargetKeys) || result.archivedTargetKeys.length !== 1) {
        throw new Error('会員削除の完了結果を確認できません。');
      }
      archivedMembers += 1;
      movedRows += Number(result?.cascade?.moved?.['T_会員'] || 0);
    }

    const remaining = await callAdmin(frame, 'getAdminChangeRequests', {});
    const remainingLiveTestRequests = Array.isArray(remaining) ? remaining.filter(isCurrentLiveTestRequest) : ['unverified'];
    if (remainingLiveTestRequests.length !== 0) throw new Error('ライブ変更申請にテストデータが残っています。');
    console.log(`PASS: ライブテスト会員をアーカイブ削除しました（会員: ${archivedMembers}、live申請残件: 0、console errors: ${consoleErrors.length}）。`);
  }
} finally {
  await context.close();
  await browser.close();
}
