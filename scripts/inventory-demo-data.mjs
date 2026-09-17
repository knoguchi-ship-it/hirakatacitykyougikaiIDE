/**
 * 本番データを変更せず、ダミー／検証データ候補を件数だけ棚卸しする。
 * 個人情報、会員ID、メールアドレス、申請IDは標準出力へ出さない。
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { getAppFrame } from './responsive-core.mjs';

try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
} catch { /* process.env を使う */ }

const ADMIN_URL = process.env.PORTAL_URL_ADMIN;
if (!ADMIN_URL) throw new Error('PORTAL_URL_ADMIN をローカル設定に指定してください。');

function initialSummary() {
  return { total: 0, active: 0, archived: 0, kinds: {}, memberTypes: {}, statuses: {} };
}

function add(summary, row) {
  summary.total += 1;
  summary[row.isDeleted ? 'archived' : 'active'] += 1;
  for (const [key, value] of [
    ['kinds', row.targetKind],
    ['memberTypes', row.memberType],
    ['statuses', row.memberStatus],
  ]) {
    const normalized = String(value || '未設定');
    summary[key][normalized] = (summary[key][normalized] || 0) + 1;
  }
}

function aggregate(rows) {
  const unique = new Map();
  for (const row of rows) {
    const key = String(row?.targetKey || '');
    if (key) unique.set(key, row);
  }
  const summary = initialSummary();
  for (const row of unique.values()) add(summary, row);
  return summary;
}

function aggregateRequests(requests, predicate) {
  const selected = requests.filter(predicate);
  const summary = { total: selected.length, byType: {}, byStatus: {} };
  for (const request of selected) {
    const type = String(request.requestType || '未設定');
    const status = String(request.status || '未設定');
    summary.byType[type] = (summary.byType[type] || 0) + 1;
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
  }
  return summary;
}

function isE2eEmail(value) {
  return /^test-member-[^@\s]+@example\.invalid$/i.test(String(value || ''));
}

function isDryRunEmail(value) {
  return /^dryrun[^@\s]*@example\.invalid$/i.test(String(value || ''));
}

function readOperatorPreviewCounts(functionName, countKeys) {
  // clasp の戻り値には対象ID等が含まれ得るため、子プロセス内で受け取り件数だけ抽出する。
  const runner = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(runner, ['clasp', 'run', functionName], {
    cwd: 'gas/admin',
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    return { available: false, reason: 'Apps Script の読み取りプレビューを実行できませんでした。' };
  }
  const raw = String(result.stdout || '');
  const counts = {};
  for (const key of countKeys) {
    const match = raw.match(new RegExp(`(?:[\\\"']?${key}[\\\"']?)\\s*:\\s*(\\d+)`, 'i'));
    counts[key] = match ? Number(match[1]) : null;
  }
  return { available: true, counts };
}

async function main() {
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

  try {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    const frame = await getAppFrame(page, /会員|管理|ダッシュボード/);
    await page.waitForTimeout(1500);

    const requests = await callAdmin(frame, 'getAdminChangeRequests', {});
    if (!Array.isArray(requests)) throw new Error('変更申請一覧を取得できません。');

    const queryGroups = {
      legacyDemo: ['demo-', 'DEMO-'],
      dryRun: ['DRYRUN_'],
      liveE2e: ['test-member-'],
      reviewTestLabel: ['テスト会員', '検証用', 'セイゴウカクニン', 'ガイブ'],
    };
    const memberInventory = {};
    const deniedGroups = [];
    for (const [group, queries] of Object.entries(queryGroups)) {
      const matches = [];
      let denied = false;
      for (const query of queries) {
        try {
          const rows = await callAdmin(frame, 'searchMembersForDelete', { query });
          if (!Array.isArray(rows)) throw new Error('検索結果の形式が不正です。');
          matches.push(...rows);
        } catch (error) {
          if (/権限|permission|unauthorized/i.test(String(error?.message || error))) {
            denied = true;
            break;
          }
          throw error;
        }
      }
      if (denied) {
        deniedGroups.push(group);
      } else {
        memberInventory[group] = aggregate(matches);
      }
    }

    const requestInventory = {
      liveE2e: aggregateRequests(requests, (request) => isE2eEmail(request.contactEmail)),
      dryRun: aggregateRequests(requests, (request) => isDryRunEmail(request.contactEmail)),
    };
    const legacyTestPreview = readOperatorPreviewCounts('deleteTestDataPreview_LOG', ['auth', 'members', 'staff', 'external']);
    const dryRunManifestPreview = readOperatorPreviewCounts('previewDryRunApplicationCleanup', ['runs', 'members', 'staff', 'auth', 'changeRequests']);

    console.log(JSON.stringify({
      readOnly: true,
      memberInventory,
      requestInventory,
      legacyTestPreview,
      dryRunManifestPreview,
      deniedGroups,
      resultLimitNotice: '会員検索は各検索語につき最大20件。20件に達した場合は追加の分割検索が必要。',
      consoleErrorCount: consoleErrors.length,
    }));
  } finally {
    await context.close();
    await browser.close();
  }
}

await main();
