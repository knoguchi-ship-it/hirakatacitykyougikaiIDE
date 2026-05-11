// Member portal responsive test (auth-required).
// Reads MEMBER_LOGIN_ID / MEMBER_PASSWORD from .env.test (gitignored).
// Falls back to demo creds from CLAUDE.md if .env.test missing.
//
// Run: node scripts/responsive-test-member.mjs

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { VIEWPORTS, getAppFrame, collectMetrics, passCriteria } from './responsive-core.mjs';

// Load .env.test if present (no logging of values)
try {
  const raw = await fs.readFile('.env.test', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env.test → use process.env / defaults */ }

const MEMBER_URL = process.env.PORTAL_URL_MEMBER
  || 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
const LOGIN_ID = process.env.MEMBER_LOGIN_ID;
const PASSWORD = process.env.MEMBER_PASSWORD;
if (!LOGIN_ID || !PASSWORD) {
  console.error('MEMBER_LOGIN_ID / MEMBER_PASSWORD must be set (see .env.test.example).');
  process.exit(2);
}

const OUT_DIR = '.test-out';
const SHOTS_DIR = path.join(OUT_DIR, 'screenshots-member');

const VIEWS = [
  { id: 'login',    label: 'ログイン画面', preLogin: true },
  { id: 'profile',  label: 'マイページ（プロフィール）', clickText: null },  // default after login
  { id: 'training', label: '研修申込',     clickText: '研修申込' },
];

async function loginIfNeeded(page, frame) {
  // Use Playwright's locator API which handles React-controlled inputs correctly.
  const idLoc = frame.locator('input[placeholder="ログインID"]');
  const pwLoc = frame.locator('input[placeholder="パスワード"]');
  if (await idLoc.count() === 0) return { ok: false, reason: 'login form not found' };
  await idLoc.fill(LOGIN_ID);
  await pwLoc.fill(PASSWORD);
  await frame.locator('button:has-text("ログイン")').first().click();
  // wait for mypage or error
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 500));
    const state = await frame.evaluate(() => {
      const t = (document.body && document.body.innerText || '');
      return {
        hasLoggedIn: /マイページ|プロフィール|年会費|ログアウト|登録情報|住所/.test(t) && !/^[\s\S]{0,200}ログイン[\s\S]{0,80}会員はログインID/.test(t),
        hasError: /失敗|エラー|正しくありません|無効/.test(t),
        snippet: t.slice(0, 200),
      };
    });
    if (state.hasLoggedIn) return { ok: true };
    if (state.hasError) return { ok: false, reason: `login error message: ${state.snippet}` };
  }
  const final = await frame.evaluate(() => (document.body && document.body.innerText || '').slice(0, 200));
  return { ok: false, reason: `timeout. body: ${final}` };
}

async function runViewport(browser, vp, consoleErrors) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push({ vp: vp.name, text: msg.text() }); });
  const result = { vp: vp.name, width: vp.width, height: vp.height, views: {} };
  try {
    await page.goto(MEMBER_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const frame = await getAppFrame(page, /ログインID|マイページ|会員|プロフィール/);

    // VIEW: login (before submit)
    {
      const metrics = await collectMetrics(frame, vp.width);
      const shotPath = path.join(SHOTS_DIR, `${vp.name}__01_login.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      result.views.login = { ...metrics, screenshot: shotPath };
    }

    // Log in
    const loginResult = await loginIfNeeded(page, frame);
    if (!loginResult.ok) {
      // Capture post-attempt screenshot for diagnostics
      const failShot = path.join(SHOTS_DIR, `${vp.name}__01b_loginFail.png`);
      await page.screenshot({ path: failShot, fullPage: true });
      result.fatal = `login failed: ${loginResult.reason}`;
      await context.close();
      return result;
    }
    await page.waitForTimeout(1000);

    // VIEW: profile (post-login default)
    {
      const metrics = await collectMetrics(frame, vp.width);
      const shotPath = path.join(SHOTS_DIR, `${vp.name}__02_profile.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      result.views.profile = { ...metrics, screenshot: shotPath };
    }

    // VIEW: training-apply tab (best effort)
    try {
      const clicked = await frame.evaluate(() => {
        const cands = Array.from(document.querySelectorAll('button, a'));
        const target = cands.find((b) => {
          const t = (b.innerText || '').trim();
          return t === '研修の申込み' || t === '研修申込' || t.startsWith('研修の申込');
        });
        if (target) { target.click(); return true; }
        return false;
      });
      if (clicked) {
        await page.waitForTimeout(1200);
        const metrics = await collectMetrics(frame, vp.width);
        const shotPath = path.join(SHOTS_DIR, `${vp.name}__03_training.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        result.views.training = { ...metrics, screenshot: shotPath };
      } else {
        result.views.training = { skipped: 'no nav target' };
      }
    } catch (e) {
      result.views.training = { error: String(e).slice(0, 120) };
    }
  } catch (e) {
    result.fatal = String(e).slice(0, 200);
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
  const consoleErrors = [];
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of VIEWPORTS) {
    process.stderr.write(`[member] ${vp.name} ...\n`);
    results.push(await runViewport(browser, vp, consoleErrors));
  }
  await browser.close();
  await fs.writeFile(path.join(OUT_DIR, 'result-member.json'), JSON.stringify({ portal: 'member', generated: new Date().toISOString(), results, consoleErrors }, null, 2));
  process.stderr.write('[member] done.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
