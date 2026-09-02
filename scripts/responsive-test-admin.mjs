// Admin portal responsive test using saved storageState.
// Prereq: run `node scripts/auth-bootstrap-admin.mjs` once and log in.
//
// Run: node scripts/responsive-test-admin.mjs

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { VIEWPORTS, getAppFrame, collectMetrics, passCriteria } from './responsive-core.mjs';

const ADMIN_URL = process.env.PORTAL_URL_ADMIN
  || 'https://script.google.com/macros/s/AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os/exec';
const STATE = '.test-out/auth-admin.json';
const OUT_DIR = '.test-out';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots-admin');

// Each console is reached by clicking its sidebar label. The sidebar in
// v317+ is grouped + collapsible — if the group is collapsed we first
// expand it by clicking the group header.
const CONSOLES = [
  { id: 'dashboard',       label: 'ダッシュボード',       group: null,             expectInPage: /ダッシュボード|管理トップ|admin/i },
  { id: 'member-list',     label: '会員一覧',             group: '会員管理',       expectInPage: /会員一覧|検索|事業所/ },
  { id: 'change-requests', label: '変更申請管理',         group: '会員管理',       expectInPage: /変更申請|承認|却下/ },
  { id: 'training-manage', label: '研修管理',             group: '研修・通知',     expectInPage: /研修管理|研修一覧/ },
  { id: 'annual-fee',      label: '年会費管理',           group: '財務・帳票',     expectInPage: /年会費|納入/ },
  { id: 'roster-export',   label: '名簿出力',             group: '財務・帳票',     expectInPage: /名簿|テンプレート|出力/ },
  { id: 'mailing-list',    label: '宛名リスト出力',       group: '財務・帳票',     expectInPage: /宛名|出力/ },
  { id: 'admin-settings',  label: 'システム設定',         group: 'システム',       expectInPage: /システム設定|設定/ },
];

async function expandGroupIfNeeded(frame, leafLabel, groupLabel) {
  if (!groupLabel) return;
  // If the leaf nav item is already visible, no need to expand.
  const visible = await frame.evaluate((l) => {
    return Array.from(document.querySelectorAll('button, a, [role="button"]')).some((b) => {
      const t = (b.innerText || '').trim();
      const r = b.getBoundingClientRect();
      return t === l && r.width > 0 && r.height > 0;
    });
  }, leafLabel);
  if (visible) return;
  // Otherwise, click the group header to expand. aria-expanded isn't set on
  // this app's group buttons, so we just click if the leaf isn't visible.
  await frame.evaluate((g) => {
    const cands = Array.from(document.querySelectorAll('button'));
    const header = cands.find((b) => (b.innerText || '').trim() === g);
    if (header) header.click();
  }, groupLabel);
  await frame.evaluate(() => new Promise((r) => setTimeout(r, 200)));
}

async function clickConsole(frame, label) {
  return await frame.evaluate((l) => {
    const cands = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    // Prefer exact innerText match
    let target = cands.find((b) => (b.innerText || '').trim() === l);
    if (!target) target = cands.find((b) => (b.innerText || '').includes(l));
    if (target) { target.click(); return true; }
    return false;
  }, label);
}

async function runViewport(browser, vp, consoleErrors) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, storageState: STATE });
  const page = await context.newPage();
  // v376.65: Google 側が出す report-only CSP 通知（GAS の二重 iframe 構造に由来）は
  // アプリの不具合ではないため除外する。数えると admin だけ恒常的に偽 FAIL になる。
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/report-only Content Security Policy/i.test(text) && /frame-ancestors/i.test(text)) return;
    consoleErrors.push({ vp: vp.name, text });
  });
  const result = { vp: vp.name, width: vp.width, height: vp.height, views: {} };
  try {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const frame = await getAppFrame(page, /会員|管理|ダッシュボード|admin|サイドバー|研修|年会費/);
    await page.waitForTimeout(1500);

    // VIEW: dashboard (default after login)
    {
      const metrics = await collectMetrics(frame, vp.width);
      const shotPath = path.join(SHOTS_DIR, `${vp.name}__00_dashboard.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      result.views.dashboard = { ...metrics, screenshot: shotPath };
    }

    for (const c of CONSOLES) {
      if (c.id === 'dashboard') continue;
      try {
        await expandGroupIfNeeded(frame, c.label, c.group);
        const clicked = await clickConsole(frame, c.label);
        if (!clicked) { result.views[c.id] = { skipped: 'nav not found' }; continue; }
        await page.waitForTimeout(2000);
        const metrics = await collectMetrics(frame, vp.width);
        const shotPath = path.join(SHOTS_DIR, `${vp.name}__${c.id}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        result.views[c.id] = { ...metrics, screenshot: shotPath };
      } catch (e) {
        result.views[c.id] = { error: String(e).slice(0, 120) };
      }
    }
  } catch (e) {
    result.fatal = String(e).slice(0, 200);
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  try { await fs.access(STATE); } catch {
    console.error(`storageState not found at ${STATE}. Run scripts/auth-bootstrap-admin.mjs first.`);
    process.exit(2);
  }
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  const consoleErrors = [];
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of VIEWPORTS) {
    process.stderr.write(`[admin] ${vp.name} ...\n`);
    results.push(await runViewport(browser, vp, consoleErrors));
  }
  await browser.close();
  await fs.writeFile(path.join(OUT_DIR, 'result-admin.json'), JSON.stringify({ portal: 'admin', generated: new Date().toISOString(), results, consoleErrors }, null, 2));
  process.stderr.write('[admin] done.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
