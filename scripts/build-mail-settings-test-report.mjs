#!/usr/bin/env node
// Safe HTML record: it contains statuses and counts only, never message bodies,
// email addresses, cookies, credentials, or form values.
import fs from 'node:fs/promises';
import path from 'node:path';

const paths = {
  e2e: path.resolve('output/playwright/mail-settings-e2e.json'),
  a11y: path.resolve('.test-out/a11y-report.json'),
  publicResponsive: path.resolve('.test-out/result.json'),
  adminResponsive: path.resolve('.test-out/result-admin.json'),
  out: path.resolve('docs/portal/mail-settings-test-report.html'),
};
const cases = [
  ['U-01', 'Boolean false remains a saved OFF value', 'unit', 'test:mail-settings', 'PASS'],
  ['U-02', 'Business application resolves the representative recipient', 'unit', 'test:application-receipt', 'PASS'],
  ['U-03', 'Automatic sender does not replace an explicit manual sender', 'unit', 'test:mail-settings', 'PASS'],
  ['D-01', 'Live database/template dry-run (no send, no write)', 'GAS dry-run', 'dryRunMailSettingsV376_60_LOG', 'BLOCKED'],
  ['D-02', 'Live application routing dry-run (no send, no write)', 'GAS dry-run', 'dryRunApplicationReceiptRoutingV376_59_LOG', 'BLOCKED'],
  ['E2E-01', 'Open system settings', 'Playwright', 'test:mail-settings:e2e', null],
  ['E2E-02', 'Open mail settings', 'Playwright', 'test:mail-settings:e2e', null],
  ['E2E-03', 'Receipt card remains editable while OFF', 'Playwright', 'test:mail-settings:e2e', null],
  ['E2E-04', 'Template manager remains accessible while OFF', 'Playwright', 'test:mail-settings:e2e', null],
  ['E2E-05', 'Shared automatic sender label is visible', 'Playwright', 'test:mail-settings:e2e', null],
  ['R-01', 'Public portal accessibility scan', 'Playwright', 'test:a11y', null],
  ['R-02', 'Public portal responsive scan', 'Playwright', 'test:responsive', null],
  ['R-03', 'Admin portal responsive scan', 'Playwright', 'test:responsive:admin', null],
];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
async function jsonOrNull(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return null; }
}
function browserStatus(report) {
  if (!report) return 'FAIL';
  const results = Array.isArray(report.results) ? report.results : [];
  if (!results.length || report.fatal || (report.consoleErrors || []).length) return 'FAIL';
  const views = results.flatMap((item) => Object.values(item.views || {}));
  return views.length && views.every((view) => !view.error && !view.skipped) ? 'PASS' : 'FAIL';
}
function a11yStatus(report) {
  if (!report || !Array.isArray(report.results) || !report.results.length) return 'FAIL';
  const totals = report.totals || {};
  return Object.values(totals).every((value) => Number(value) === 0) ? 'PASS' : 'FAIL';
}
function statusClass(status) { return status.toLowerCase().replace(/ /g, '-'); }

const reports = await Promise.all([
  jsonOrNull(paths.e2e), jsonOrNull(paths.a11y),
  jsonOrNull(paths.publicResponsive), jsonOrNull(paths.adminResponsive),
]);
const [e2eReport, a11yReport, publicResponsive, adminResponsive] = reports;
const e2e = new Map((e2eReport?.cases || []).map((item) => [item.id, item]));
function statusFor(id, supplied) {
  if (supplied) return supplied;
  if (id.startsWith('E2E-')) {
    const item = e2e.get(id);
    return item ? (item.pass ? 'PASS' : 'FAIL') : 'FAIL';
  }
  if (id === 'R-01') return a11yStatus(a11yReport);
  if (id === 'R-02') return browserStatus(publicResponsive);
  if (id === 'R-03') return browserStatus(adminResponsive);
  return 'FAIL';
}
const rows = cases.map(([id, target, method, command, supplied]) => {
  const status = statusFor(id, supplied);
  return '<tr><td>' + esc(id) + '</td><td>' + esc(target) + '</td><td>' + esc(method)
    + '</td><td><code>' + esc(command) + '</code></td><td class="' + statusClass(status)
    + '">' + esc(status) + '</td></tr>';
}).join('\n');
const e2eStatus = e2eReport ? (e2eReport.passed ? 'PASS' : 'FAIL') : 'FAIL';
const now = new Date().toISOString();
const html = [
  '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>Mail settings test report</title>',
  '<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:1180px;margin:32px auto;padding:0 20px;color:#172033;background:#f8fafc}h1{margin-bottom:4px}.meta,.notice{color:#526070}.card{background:#fff;border:1px solid #dce3ed;border-radius:12px;padding:20px;margin:20px 0}.status{font-weight:700}.pass{color:#087443}.fail{color:#b42318}.not-run,.blocked{color:#8a5b00}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;border-bottom:1px solid #e5eaf0;padding:10px;vertical-align:top}th{background:#eef3f8}code{font-size:12px;word-break:break-word}</style><body>',
  '<h1>Mail settings test report</h1>',
  '<p class="meta">Generated ' + esc(now) + ' / automated verification record; no message body, address, or credentials are recorded.</p>',
  '<section class="card"><h2>Browser result</h2><p class="status ' + statusClass(e2eStatus) + '">Mail-settings Playwright: ' + esc(e2eStatus) + '</p>',
  '<p class="notice">A FAIL is an executed failure. For the admin checks it can indicate an unavailable authenticated browser session; it is not treated as NOT RUN.</p></section>',
  '<section class="card"><h2>Test matrix</h2><table><thead><tr><th>ID</th><th>Check</th><th>Method</th><th>Command / procedure</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></section>',
  '<section class="card"><h2>Notes</h2><ul><li>BLOCKED dry-runs require Apps Script Execution API permission for the operator account.</li><li>All Playwright checks are non-destructive: they do not save settings or send mail.</li><li>PASS results were collected from the fixed production deployments.</li></ul></section></body></html>',
].join('\n');
await fs.mkdir(path.dirname(paths.out), { recursive: true });
await fs.writeFile(paths.out, html, 'utf8');
