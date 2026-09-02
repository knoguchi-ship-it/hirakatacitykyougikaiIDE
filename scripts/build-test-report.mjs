#!/usr/bin/env node
// Builds docs/portal/test-report.html — the single human-readable verification
// record for the production GAS system. It replaces the per-release report pages
// (mail-settings only, one file per release) so there is one page to look at.
//
// Sources:
//   .test-out/a11y-report.json        public accessibility scan
//   .test-out/result.json             public responsive scan
//   .test-out/result-member.json      member portal responsive scan
//   .test-out/result-admin.json       admin portal responsive scan
//   output/playwright/mail-settings-e2e.json   mail settings UI checks
//   docs/test-evidence.json           dry-runs and manual/live evidence
//
// Output discipline (AGENTS §0): statuses, counts and timestamps only. No message
// bodies, addresses, credentials, cookies or form values.
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('docs/portal/test-report.html');
const P = {
  a11y: path.resolve('.test-out/a11y-report.json'),
  publicResp: path.resolve('.test-out/result.json'),
  memberResp: path.resolve('.test-out/result-member.json'),
  adminResp: path.resolve('.test-out/result-admin.json'),
  mailE2e: path.resolve('output/playwright/mail-settings-e2e.json'),
  evidence: path.resolve('docs/test-evidence.json'),
};

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonOrNull = async (f) => { try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch { return null; } };
const fmt = (iso) => (iso ? String(iso).replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '—');

function responsiveSummary(report, label) {
  if (!report) return { status: 'NOT RUN', detail: '結果ファイルがありません', when: null };
  const results = Array.isArray(report.results) ? report.results : [];
  if (!results.length) return { status: 'NOT RUN', detail: '結果が空です', when: report.generated };
  let views = 0; let bad = 0; let overflow = 0; let taps = 0;
  const fatals = [];
  for (const vp of results) {
    if (vp.fatal) { fatals.push(vp.vp); bad += 1; continue; }
    for (const view of Object.values(vp.views || {})) {
      views += 1;
      if (view.error || view.skipped) bad += 1;
      if (view.hasHorizontalScroll) overflow += 1;
      if ((view.below44 || view.tapTargetsBelow44 || []).length) taps += 1;
    }
  }
  const errors = (report.consoleErrors || []).length;
  const ok = !bad && !overflow && !taps && !errors;
  return {
    status: ok ? 'PASS' : 'FAIL',
    when: report.generated,
    detail: `${results.length} ビューポート / ${views} 画面を計測。横スクロール ${overflow} 件・タップターゲット違反 ${taps} 件・console error ${errors} 件`
      + (fatals.length ? ` / 到達不可: ${fatals.join(', ')}` : '')
      + (bad && !fatals.length ? ` / 未計測または失敗 ${bad} 件` : ''),
    label,
  };
}

function a11ySummary(report) {
  if (!report || !Array.isArray(report.results)) return { status: 'NOT RUN', detail: '結果ファイルがありません', when: null };
  const totals = report.totals || {};
  const sum = Object.values(totals).reduce((a, b) => a + Number(b || 0), 0);
  const parts = Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(' / ');
  return {
    status: sum === 0 ? 'PASS' : 'FAIL',
    when: report.generated || report.generatedAt,
    detail: `axe-core (WCAG 2.2 AA) 違反 ${sum} 件${parts ? `（${parts}）` : ''}・${report.results.length} 画面`,
  };
}

const [a11y, pub, member, admin, mailE2e, evidence] = await Promise.all(
  [P.a11y, P.publicResp, P.memberResp, P.adminResp, P.mailE2e, P.evidence].map(jsonOrNull),
);

const automated = [
  { group: '公開ポータル（認証不要）', name: 'アクセシビリティ', how: 'npm run test:a11y', ...a11ySummary(a11y) },
  { group: '公開ポータル（認証不要）', name: 'レスポンシブ', how: 'npm run test:responsive', ...responsiveSummary(pub) },
  { group: '会員ポータル', name: 'レスポンシブ（ログイン込み）', how: 'npm run test:responsive:member', ...responsiveSummary(member) },
  { group: '管理ポータル', name: 'レスポンシブ（8 コンソール）', how: 'npm run test:responsive:admin', ...responsiveSummary(admin) },
];

const mailCases = (mailE2e?.cases || []).map((c) => ({
  group: '管理ポータル', name: `メール通知設定 ${c.id}: ${c.name}`, how: 'npm run test:mail-settings:e2e',
  status: c.pass ? 'PASS' : 'FAIL', when: mailE2e.generatedAt, detail: '非破壊（保存も送信もしない）',
}));

const manual = (evidence?.manualRuns || []).map((m) => ({
  group: m.group, name: m.name, how: m.how, status: m.status, when: m.when, detail: m.detail,
}));

const rows = [...automated, ...mailCases, ...manual];
const counts = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
const groups = [...new Set(rows.map((r) => r.group))];
const rel = evidence?.release || {};

const cls = (s) => ({ PASS: 'ok', FAIL: 'ng', PARTIAL: 'warn', BLOCKED: 'warn', 'NOT RUN': 'idle' }[s] || 'idle');

const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>テスト結果レポート — 枚方市介護支援専門員連絡協議会 会員システム</title>
<style>
  :root { color-scheme: light dark; --bg:#f6f8fb; --card:#fff; --ink:#16202e; --muted:#5a6b80; --line:#dde4ec;
          --ok:#0a7d46; --ok-bg:#e6f6ed; --ng:#b42318; --ng-bg:#fdeceb; --warn:#8a5b00; --warn-bg:#fdf3e2; --idle:#5a6b80; --idle-bg:#eef1f5; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#11161d; --card:#1a212b; --ink:#e8eef6; --muted:#9fb0c4; --line:#2b3644;
            --ok:#4ade80; --ok-bg:#10301f; --ng:#fca5a5; --ng-bg:#331717; --warn:#fcd34d; --warn-bg:#332715; --idle:#9fb0c4; --idle-bg:#232c38; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:0 16px 64px; background:var(--bg); color:var(--ink);
         font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,system-ui,sans-serif; line-height:1.7; }
  .wrap { max-width:1080px; margin:0 auto; }
  header { padding:32px 0 8px; }
  h1 { font-size:1.6rem; margin:0 0 4px; }
  .sub { color:var(--muted); margin:0 0 24px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin:0 0 28px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; }
  .card .n { font-size:2rem; font-weight:700; line-height:1.2; }
  .card .l { color:var(--muted); font-size:.85rem; }
  .card.ok .n { color:var(--ok); } .card.ng .n { color:var(--ng); } .card.warn .n { color:var(--warn); }
  section { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; margin:0 0 20px; }
  h2 { font-size:1.1rem; margin:0 0 12px; }
  .scroll { overflow-x:auto; }
  table { border-collapse:collapse; width:100%; font-size:.92rem; min-width:640px; }
  th,td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:.82rem; letter-spacing:.02em; }
  tr:last-child td { border-bottom:none; }
  .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:.78rem; font-weight:700; white-space:nowrap; }
  .badge.ok { color:var(--ok); background:var(--ok-bg); } .badge.ng { color:var(--ng); background:var(--ng-bg); }
  .badge.warn { color:var(--warn); background:var(--warn-bg); } .badge.idle { color:var(--idle); background:var(--idle-bg); }
  .name { font-weight:600; }
  .how { color:var(--muted); font-size:.8rem; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; word-break:break-all; }
  .when { color:var(--muted); font-size:.8rem; white-space:nowrap; }
  dl.rel { display:grid; grid-template-columns:auto 1fr; gap:4px 16px; margin:0; }
  dl.rel dt { color:var(--muted); font-size:.85rem; } dl.rel dd { margin:0; font-weight:600; }
  .note { color:var(--muted); font-size:.86rem; }
  footer { color:var(--muted); font-size:.82rem; text-align:center; padding:24px 0; }
  a { color:inherit; }
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>テスト結果レポート</h1>
  <p class="sub">枚方市介護支援専門員連絡協議会 会員システム / 生成 ${esc(fmt(new Date().toISOString()))}</p>
</header>

<section>
  <h2>現在の本番</h2>
  <dl class="rel">
    <dt>リリース</dt><dd>${esc(rel.version || '—')}（${esc(rel.date || '—')}）</dd>
    <dt>公開ポータル</dt><dd>${esc(rel.deployments?.public || '—')}</dd>
    <dt>会員ポータル</dt><dd>${esc(rel.deployments?.member || '—')}</dd>
    <dt>管理ポータル</dt><dd>${esc(rel.deployments?.admin || '—')}</dd>
    <dt>ロールバック先</dt><dd>public ${esc(rel.rollback?.public || '—')} / member ${esc(rel.rollback?.member || '—')} / admin ${esc(rel.rollback?.admin || '—')}</dd>
  </dl>
</section>

<div class="cards">
  <div class="card ok"><div class="n">${counts.PASS || 0}</div><div class="l">PASS</div></div>
  <div class="card ng"><div class="n">${counts.FAIL || 0}</div><div class="l">FAIL</div></div>
  <div class="card warn"><div class="n">${(counts.PARTIAL || 0) + (counts.BLOCKED || 0)}</div><div class="l">要フォロー</div></div>
  <div class="card"><div class="n">${counts['NOT RUN'] || 0}</div><div class="l">未実行</div></div>
</div>

${groups.map((g) => `<section>
  <h2>${esc(g)}</h2>
  <div class="scroll">
  <table>
    <thead><tr><th style="width:38%">確認内容</th><th style="width:10%">判定</th><th style="width:14%">実施</th><th>内容・根拠</th></tr></thead>
    <tbody>
      ${rows.filter((r) => r.group === g).map((r) => `<tr>
        <td><div class="name">${esc(r.name)}</div><div class="how">${esc(r.how)}</div></td>
        <td><span class="badge ${cls(r.status)}">${esc(r.status)}</span></td>
        <td class="when">${esc(fmt(r.when))}</td>
        <td>${esc(r.detail || '')}</td>
      </tr>`).join('\n      ')}
    </tbody>
  </table>
  </div>
</section>`).join('\n')}

<section>
  <h2>このレポートの読み方</h2>
  <p class="note">
    自動テストの判定（アクセシビリティ / レスポンシブ / メール通知設定 E2E）は
    <code>.test-out/</code> と <code>output/playwright/</code> の実行結果ファイルから機械的に生成しています。
    Apps Script エディタで実行する dry-run や本番 API の実測など、ファイルに残らない検証は
    <code>docs/test-evidence.json</code> に記録し、ここに合流させています。
    再生成は <code>npm run report:tests</code>。
  </p>
  <p class="note">
    <strong>PARTIAL</strong> は「実行して結果は把握しているが、完全一致には追加作業が残っている」ことを示します。
    本文・メールアドレス・資格情報の類は一切記録していません（AGENTS §0）。
  </p>
</section>

<footer>枚方市介護支援専門員連絡協議会 会員システム / docs/portal/test-report.html</footer>
</div>
</body>
</html>
`;

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, html, 'utf8');
console.log(`[build-test-report] ${OUT}`);
console.log(`[build-test-report] rows=${rows.length} PASS=${counts.PASS || 0} FAIL=${counts.FAIL || 0} other=${rows.length - (counts.PASS || 0) - (counts.FAIL || 0)}`);
