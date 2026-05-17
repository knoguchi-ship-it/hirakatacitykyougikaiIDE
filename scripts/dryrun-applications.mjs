#!/usr/bin/env node
// 2026-05-17: Dry-run synthetic transaction test runner
//
// 7 シナリオ (新規個人/賛助/事業所申込 + 4 種の転籍) を本番 DB に DRYRUN_
// プレフィックス付きで投入 → 承認 → DB 副作用検証。
// 副作用は ScriptProperties manifest に追跡、preview → 承認 → soft delete。
//
// 使い方:
//   node scripts/dryrun-applications.mjs run        # 7 シナリオ実行
//   node scripts/dryrun-applications.mjs preview    # cleanup 対象件数を表示
//   node scripts/dryrun-applications.mjs cleanup    # soft delete を実行（要 --yes）
//
// 前提:
//   - admin split に push 済み (npm run build:gas:admin && cd gas/admin && npx clasp push --force)
//   - 実行者は MASTER または ADMIN 権限のホワイトリスト登録あり
//   - clasp は project-scoped OAuth で login 済み

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const adminDir = join(root, 'gas', 'admin');

const COMMAND = process.argv[2] || 'help';
const ARGS = process.argv.slice(3);
const FORCE_YES = ARGS.includes('--yes');

function runClasp(functionName) {
  console.log(`\n▶ clasp run ${functionName} (admin split)`);
  try {
    const out = execSync(`npx clasp run "${functionName}"`, {
      cwd: adminDir,
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    return parseClaspOutput(out);
  } catch (e) {
    const stdout = e.stdout?.toString() ?? '';
    const stderr = e.stderr?.toString() ?? '';
    console.error('clasp run failed.');
    if (stdout) console.error('stdout:\n' + stdout);
    if (stderr) console.error('stderr:\n' + stderr);
    throw new Error(`clasp run ${functionName} failed`);
  }
}

function parseClaspOutput(output) {
  // GAS returns a string prefixed with __DRYRUN_JSON__ so clasp prints it
  // verbatim (util.inspect would abbreviate nested objects as [Object]/[Array]).
  // Output looks like:  'value' or "value" wrapping the entire string.
  const markerIdx = output.indexOf('__DRYRUN_JSON__');
  if (markerIdx === -1) return { raw: output };
  let json = output.slice(markerIdx + '__DRYRUN_JSON__'.length).trim();
  // Strip trailing quote if util.inspect wrapped the string
  if (json.endsWith("'") || json.endsWith('"')) json = json.slice(0, -1);
  // Unescape util.inspect single-quoted string escapes
  json = json.replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\"/g, '"');
  try {
    return JSON.parse(json);
  } catch (e) {
    return { raw: output, parseError: e.message, attemptedJson: json.slice(0, 500) };
  }
}

function formatScenarioReport(report) {
  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`  DryRun Synthetic Transaction Report`);
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`  runId       : ${report.runId}`);
  lines.push(`  operator    : ${report.operator}`);
  lines.push(`  permission  : ${report.permissionCode}`);
  lines.push(`  startedAt   : ${report.startedAt}`);
  lines.push(`  finishedAt  : ${report.finishedAt}`);
  lines.push(`  passed      : ${report.passedCount} / ${(report.passedCount || 0) + (report.failedCount || 0)}`);
  lines.push(`  failed      : ${report.failedCount}`);
  lines.push('');
  lines.push('── Side effects (tracked for cleanup) ──');
  if (report.manifestCounts) {
    lines.push(`  T_会員             : ${report.manifestCounts.members}`);
    lines.push(`  T_事業所職員       : ${report.manifestCounts.staff}`);
    lines.push(`  T_認証アカウント   : ${report.manifestCounts.auth}`);
    lines.push(`  T_変更申請         : ${report.manifestCounts.changeRequests}`);
  }
  lines.push('');
  lines.push('── Scenarios ──');
  for (const s of report.scenarios || []) {
    const icon = s.passed ? '✓' : '✗';
    lines.push(`  ${icon} ${s.name}`);
    if (!s.passed && s.error) lines.push(`      error: ${s.error}`);
    if (s.assertions && s.assertions.length) {
      const total = s.assertions.length;
      const okCount = s.assertions.filter((a) => a.ok).length;
      lines.push(`      assertions: ${okCount}/${total}`);
      for (const a of s.assertions) {
        if (!a.ok) lines.push(`        ✗ ${a.message}`);
      }
    }
    if (s.result && Object.keys(s.result).length) {
      lines.push(`      result: ${JSON.stringify(s.result)}`);
    }
  }
  lines.push('═══════════════════════════════════════════════════════════');
  return lines.join('\n');
}

function cmdRun() {
  const report = runClasp('dryRunApplicationScenarios');
  if (report.raw) {
    console.log('Failed to parse Apps Script response. Raw output:');
    console.log(report.raw);
    process.exit(2);
  }
  console.log(formatScenarioReport(report));
  if ((report.failedCount || 0) > 0) {
    console.log('\n⚠ 一部シナリオが失敗しました。cleanup 前にログを確認してください。');
    process.exit(1);
  }
  console.log('\n✓ 全シナリオ pass. 次のコマンドで cleanup を確認できます:');
  console.log('    node scripts/dryrun-applications.mjs preview');
}

function cmdPreview() {
  const preview = runClasp('previewDryRunApplicationCleanup');
  console.log('\n── Cleanup preview ──');
  console.log(JSON.stringify(preview, null, 2));
  if (preview.counts) {
    const total = (preview.counts.members || 0) + (preview.counts.staff || 0) + (preview.counts.auth || 0) + (preview.counts.changeRequests || 0);
    console.log(`\n合計 soft-delete 予定: ${total} 行`);
    console.log('\n実行するには:');
    console.log('    node scripts/dryrun-applications.mjs cleanup --yes');
  }
}

function cmdCleanup() {
  if (!FORCE_YES) {
    console.error('cleanup は破壊的操作です。確認のため --yes を付けて再実行してください。');
    console.error('    node scripts/dryrun-applications.mjs cleanup --yes');
    process.exit(2);
  }
  const result = runClasp('executeDryRunApplicationCleanup');
  console.log('\n── Cleanup result ──');
  console.log(JSON.stringify(result, null, 2));
}

function help() {
  console.log(`
DryRun Application Scenarios runner

Commands:
  run       7 シナリオを本番 DB に投入 → 承認 → 検証
  preview   cleanup 対象件数を表示（破壊なし）
  cleanup   soft delete を実行（--yes 必須）

Workflow:
  1) admin split に最新コードを push:
       npm run build:gas:admin
       cd gas/admin && npx clasp push --force
  2) node scripts/dryrun-applications.mjs run
  3) node scripts/dryrun-applications.mjs preview
  4) node scripts/dryrun-applications.mjs cleanup --yes
`);
}

const handlers = { run: cmdRun, preview: cmdPreview, cleanup: cmdCleanup, help };
const handler = handlers[COMMAND] || help;
handler();
